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
class SaleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private long createUser() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "name", "Comprador Teste",
                "email", "comprador" + System.nanoTime() + "@bookwise.com",
                "role", "READER"));
        String json = mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(json).get("id").asLong();
    }

    private long createBook(int stock, double price) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "title", "Livro Vendavel",
                "author", "Autor",
                "isbn", "S" + System.nanoTime(),
                "format", "PHYSICAL",
                "price", price,
                "stock", stock));
        String json = mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(json).get("id").asLong();
    }

    private String saleBody(long userId, long bookId, int quantity) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "userId", userId,
                "paymentMethod", "PIX",
                "items", List.of(Map.of("bookId", bookId, "quantity", quantity))));
    }

    @Test
    void createSaleComputesTotalAndDecrementsStock() throws Exception {
        long userId = createUser();
        long bookId = createBook(10, 50.0);

        mockMvc.perform(post("/api/v1/sales")
                        .contentType(MediaType.APPLICATION_JSON).content(saleBody(userId, bookId, 2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PAID"))
                .andExpect(jsonPath("$.totalPrice").value(100.0))
                .andExpect(jsonPath("$.items[0].unitPrice").value(50.0));

        mockMvc.perform(get("/api/v1/books/" + bookId))
                .andExpect(jsonPath("$.stock").value(8));
    }

    @Test
    void saleWithInsufficientStockReturns409() throws Exception {
        long userId = createUser();
        long bookId = createBook(1, 20.0);

        mockMvc.perform(post("/api/v1/sales")
                        .contentType(MediaType.APPLICATION_JSON).content(saleBody(userId, bookId, 3)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void cancelSaleRestoresStockAndSetsCancelled() throws Exception {
        long userId = createUser();
        long bookId = createBook(10, 30.0);

        String created = mockMvc.perform(post("/api/v1/sales")
                        .contentType(MediaType.APPLICATION_JSON).content(saleBody(userId, bookId, 4)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long saleId = objectMapper.readTree(created).get("id").asLong();

        mockMvc.perform(post("/api/v1/sales/" + saleId + "/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        // Estoque restaurado (10 - 4 + 4 = 10).
        mockMvc.perform(get("/api/v1/books/" + bookId))
                .andExpect(jsonPath("$.stock").value(10));
    }

    @Test
    void getMissingSaleReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/sales/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void listSalesFiltersByUserId() throws Exception {
        long firstUserId = createUser();
        long secondUserId = createUser();
        long firstBookId = createBook(10, 50.0);
        long secondBookId = createBook(10, 50.0);

        mockMvc.perform(post("/api/v1/sales")
                        .contentType(MediaType.APPLICATION_JSON).content(saleBody(firstUserId, firstBookId, 1)))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/sales")
                        .contentType(MediaType.APPLICATION_JSON).content(saleBody(secondUserId, secondBookId, 1)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/sales").param("userId", String.valueOf(firstUserId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].userId").value((int) firstUserId));
    }
}
