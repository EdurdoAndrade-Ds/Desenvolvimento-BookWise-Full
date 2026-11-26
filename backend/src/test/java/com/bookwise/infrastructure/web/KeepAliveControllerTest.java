package com.bookwise.infrastructure.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.bookwise.domain.model.KeepAliveConfig;
import com.bookwise.domain.port.KeepAliveRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
        "spring.config.import=file:src/main/resources/application.yml",
        "bookwise.jobs.enabled=false",
        "spring.profiles.active=test",
        "bookwise.cors.allowed-origins=http://localhost:5173"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class KeepAliveControllerTest {
    @Autowired MockMvc mvc;
    @Autowired KeepAliveRepository repository;

    @BeforeEach
    void reset() {
        repository.save(KeepAliveConfig.disabled());
    }

    @Test
    void readsDisabledDefaultsAndPersistsUpdates() throws Exception {
        mvc.perform(get("/api/v1/admin/keep-alive")).andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false)).andExpect(jsonPath("$.intervalMinutes").value(10))
                .andExpect(jsonPath("$.targetConfigured").value(false)).andExpect(jsonPath("$.warning").isString());
        mvc.perform(put("/api/v1/admin/keep-alive").contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":true,\"intervalMinutes\":14,\"activeUntil\":null}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.enabled").value(true));
        mvc.perform(get("/api/v1/admin/keep-alive")).andExpect(jsonPath("$.intervalMinutes").value(14));
    }

    @Test
    void rejectsInvalidInput() throws Exception {
        mvc.perform(put("/api/v1/admin/keep-alive").contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":true,\"intervalMinutes\":6}")) .andExpect(status().isConflict());
        mvc.perform(put("/api/v1/admin/keep-alive").contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":true,\"intervalMinutes\":5,\"activeUntil\":\"2000-01-01T00:00:00Z\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/v1/admin/keep-alive").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void healthIsPublicCorsEnabledAndHasNoDetails() throws Exception {
        mvc.perform(get("/actuator/health").header("Origin", "http://localhost:5173"))
                .andExpect(status().isOk()).andExpect(content().json("{\"status\":\"UP\"}", true))
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
        mvc.perform(get("/actuator/info")).andExpect(status().isNotFound());
    }
}
