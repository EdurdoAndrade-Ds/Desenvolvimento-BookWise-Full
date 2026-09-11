package com.bookwise.infrastructure.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
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
class BookControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String bookJson(String title, String isbn) throws Exception {
        return objectMapper.writeValueAsString(java.util.Map.of(
                "title", title,
                "author", "Autor Teste",
                "isbn", isbn,
                "format", "PHYSICAL",
                "price", 49.90,
                "stock", 5));
    }

    @Test
    void createThenGetById() throws Exception {
        String location = mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookJson("Livro A", "1111111111111")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("Livro A"))
                .andReturn()
                .getResponse()
                .getHeader("Location");

        mockMvc.perform(get(location))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isbn").value("1111111111111"));
    }

    @Test
    void listReturnsPagedEnvelope() throws Exception {
        mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookJson("Livro B", "2222222222222")))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/books").param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.meta.size").value(5));
    }

    @Test
    void getMissingReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/books/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void createInvalidReturns400() throws Exception {
        mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookJson("", "3333333333333")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void updateChangesPriceAndStock() throws Exception {
        String location = mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookJson("Livro D", "5555555555555")))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location");

        String updated = objectMapper.writeValueAsString(java.util.Map.of(
                "title", "Livro D editado",
                "author", "Autor Teste",
                "isbn", "5555555555555",
                "format", "PHYSICAL",
                "price", 59.90,
                "stock", 12));

        mockMvc.perform(put(location)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updated))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Livro D editado"))
                .andExpect(jsonPath("$.price").value(59.90))
                .andExpect(jsonPath("$.stock").value(12));

        mockMvc.perform(get(location))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stock").value(12));
    }

    @Test
    void discountAppliesNativeUpdateToSingleBook() throws Exception {
        String location = mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookJson("Livro Desconto", "6666666666666")))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location");
        long bookId = Long.parseLong(location.substring(location.lastIndexOf('/') + 1));

        mockMvc.perform(post("/api/v1/books/price-adjustments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "percentage", 8,
                                "type", "DISCOUNT",
                                "bookId", bookId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updatedBooks").value(1));

        // 49.90 * 0.92 = 45.908 -> arredondado para 45.91
        mockMvc.perform(get(location))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.price").value(45.91));
    }

    @Test
    void discountWithInvalidPercentageReturns400() throws Exception {
        mockMvc.perform(post("/api/v1/books/price-adjustments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of("percentage", 0))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void discountForMissingBookReturns404() throws Exception {
        mockMvc.perform(post("/api/v1/books/price-adjustments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "percentage", 10,
                                "bookId", 999999))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void deleteThenGetReturns404() throws Exception {
        String location = mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookJson("Livro C", "4444444444444")))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location");

        mockMvc.perform(delete(location)).andExpect(status().isNoContent());
        mockMvc.perform(get(location)).andExpect(status().isNotFound());
    }
}
