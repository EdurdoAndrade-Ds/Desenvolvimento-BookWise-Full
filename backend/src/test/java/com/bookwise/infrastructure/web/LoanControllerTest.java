package com.bookwise.infrastructure.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LoanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    /** Cria um usuario e um livro fisico, retornando seus ids. */
    private long createUser() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "name", "Leitor Teste",
                "email", "leitor" + System.nanoTime() + "@bookwise.com",
                "role", "READER"));
        String json = mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(json).get("id").asLong();
    }

    private long createBook(int stock) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "title", "Livro Emprestavel",
                "author", "Autor",
                "isbn", "L" + System.nanoTime(),
                "format", "PHYSICAL",
                "price", 10.0,
                "stock", stock));
        String json = mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(json).get("id").asLong();
    }

    private String loanBody(long userId, long bookId, int quantity) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "userId", userId,
                "items", List.of(Map.of("bookId", bookId, "quantity", quantity))));
    }

    @Test
    void createLoanReturnsActiveWithItems() throws Exception {
        long userId = createUser();
        long bookId = createBook(5);

        mockMvc.perform(post("/api/v1/loans")
                        .contentType(MediaType.APPLICATION_JSON).content(loanBody(userId, bookId, 2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.items[0].bookId").value((int) bookId))
                .andExpect(jsonPath("$.items[0].quantity").value(2));
    }

    @Test
    void createLoanDecrementsStock() throws Exception {
        long userId = createUser();
        long bookId = createBook(5);

        mockMvc.perform(post("/api/v1/loans")
                        .contentType(MediaType.APPLICATION_JSON).content(loanBody(userId, bookId, 3)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/books/" + bookId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stock").value(2));
    }

    @Test
    void loanWithInsufficientStockReturns409() throws Exception {
        long userId = createUser();
        long bookId = createBook(1);

        mockMvc.perform(post("/api/v1/loans")
                        .contentType(MediaType.APPLICATION_JSON).content(loanBody(userId, bookId, 5)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void returnLoanRestoresStockAndSetsReturned() throws Exception {
        long userId = createUser();
        long bookId = createBook(5);

        String created = mockMvc.perform(post("/api/v1/loans")
                        .contentType(MediaType.APPLICATION_JSON).content(loanBody(userId, bookId, 2)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long loanId = objectMapper.readTree(created).get("id").asLong();

        mockMvc.perform(post("/api/v1/loans/" + loanId + "/return"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RETURNED"))
                .andExpect(jsonPath("$.returnDate").isNotEmpty());

        // Estoque restaurado (5 - 2 + 2 = 5).
        mockMvc.perform(get("/api/v1/books/" + bookId))
                .andExpect(jsonPath("$.stock").value(5));
    }

    @Test
    void getMissingLoanReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/loans/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void listLoansFiltersByUserId() throws Exception {
        long firstUserId = createUser();
        long secondUserId = createUser();
        long firstBookId = createBook(5);
        long secondBookId = createBook(5);

        mockMvc.perform(post("/api/v1/loans")
                        .contentType(MediaType.APPLICATION_JSON).content(loanBody(firstUserId, firstBookId, 1)))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/loans")
                        .contentType(MediaType.APPLICATION_JSON).content(loanBody(secondUserId, secondBookId, 1)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/loans").param("userId", String.valueOf(firstUserId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].userId").value((int) firstUserId));
    }
}
