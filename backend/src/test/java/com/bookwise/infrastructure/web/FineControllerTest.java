package com.bookwise.infrastructure.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
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
class FineControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private long id(String json) throws Exception {
        return objectMapper.readTree(json).get("id").asLong();
    }

    private long createUser() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "name", "Multado", "email", "fine" + System.nanoTime() + "@bookwise.com", "role", "READER"));
        return id(mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    private long createBook() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "title", "Livro Multa", "author", "Autor", "isbn", "F" + System.nanoTime(),
                "format", "PHYSICAL", "price", 10.0, "stock", 3));
        return id(mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    /** Cria emprestimo ja vencido (dueDate no passado) e o devolve para gerar multa. */
    @Test
    void lateReturnGeneratesPayableFine() throws Exception {
        long userId = createUser();
        long bookId = createBook();

        String loanBody = objectMapper.writeValueAsString(Map.of(
                "userId", userId,
                "dueDate", LocalDate.now().minusDays(5).toString(),
                "items", List.of(Map.of("bookId", bookId, "quantity", 1))));
        long loanId = id(mockMvc.perform(post("/api/v1/loans")
                        .contentType(MediaType.APPLICATION_JSON).content(loanBody))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());

        // Devolucao (hoje) apos vencimento (-5 dias) => multa de 5 dias.
        mockMvc.perform(post("/api/v1/loans/" + loanId + "/return"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RETURNED"));

        // A multa correspondente deve existir na listagem.
        String finesJson = mockMvc.perform(get("/api/v1/fines").param("size", "100"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode fines = objectMapper.readTree(finesJson).get("content");
        JsonNode fine = null;
        for (JsonNode f : fines) {
            if (f.get("loanId").asLong() == loanId) {
                fine = f;
                break;
            }
        }
        org.junit.jupiter.api.Assertions.assertNotNull(fine, "multa deveria ter sido gerada");
        org.junit.jupiter.api.Assertions.assertEquals(5, fine.get("daysLate").asInt());
        org.junit.jupiter.api.Assertions.assertEquals("PENDING", fine.get("paymentStatus").asText());

        long fineId = fine.get("id").asLong();
        mockMvc.perform(post("/api/v1/fines/" + fineId + "/pay"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.paymentDate").isNotEmpty());
    }

    @Test
    void getMissingReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/fines/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void listFinesFiltersByLoanOwnerUserId() throws Exception {
        long userId = createUser();
        long bookId = createBook();
        String loanBody = objectMapper.writeValueAsString(Map.of(
                "userId", userId,
                "dueDate", LocalDate.now().minusDays(5).toString(),
                "items", List.of(Map.of("bookId", bookId, "quantity", 1))));
        long loanId = id(mockMvc.perform(post("/api/v1/loans")
                        .contentType(MediaType.APPLICATION_JSON).content(loanBody))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());

        mockMvc.perform(post("/api/v1/loans/" + loanId + "/return"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/fines").param("userId", String.valueOf(userId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].userName").value("Multado"));
    }
}
