package com.bookwise.infrastructure.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
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
class ReservationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private long createUser() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "name", "Reservador", "email", "resv" + System.nanoTime() + "@bookwise.com", "role", "READER"));
        return objectMapper.readTree(mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString())
                .get("id").asLong();
    }

    private long createBook() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "title", "Livro Reservavel", "author", "Autor", "isbn", "R" + System.nanoTime(),
                "format", "PHYSICAL", "price", 10.0, "stock", 1));
        return objectMapper.readTree(mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString())
                .get("id").asLong();
    }

    @Test
    void createReservationReturnsActive() throws Exception {
        long userId = createUser();
        long bookId = createBook();
        String body = objectMapper.writeValueAsString(Map.of("userId", userId, "bookId", bookId));

        mockMvc.perform(post("/api/v1/reservations")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.bookTitle").isNotEmpty());
    }

    @Test
    void cancelReservationSetsCancelled() throws Exception {
        long userId = createUser();
        long bookId = createBook();
        String body = objectMapper.writeValueAsString(Map.of("userId", userId, "bookId", bookId));
        long id = objectMapper.readTree(mockMvc.perform(post("/api/v1/reservations")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString())
                .get("id").asLong();

        mockMvc.perform(post("/api/v1/reservations/" + id + "/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void getMissingReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/reservations/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void listReservationsFiltersByUserId() throws Exception {
        long firstUserId = createUser();
        long secondUserId = createUser();
        long firstBookId = createBook();
        long secondBookId = createBook();

        String firstBody = objectMapper.writeValueAsString(Map.of("userId", firstUserId, "bookId", firstBookId));
        String secondBody = objectMapper.writeValueAsString(Map.of("userId", secondUserId, "bookId", secondBookId));
        mockMvc.perform(post("/api/v1/reservations")
                        .contentType(MediaType.APPLICATION_JSON).content(firstBody))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/reservations")
                        .contentType(MediaType.APPLICATION_JSON).content(secondBody))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/reservations").param("userId", String.valueOf(firstUserId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].userId").value((int) firstUserId));
    }

    @Test
    void listReservationsWithUnknownUserReturnsEmptyPage() throws Exception {
        mockMvc.perform(get("/api/v1/reservations").param("userId", "999999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty())
                .andExpect(jsonPath("$.meta.totalElements").value(0));
    }
}
