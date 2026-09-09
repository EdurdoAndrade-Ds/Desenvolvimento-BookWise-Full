package com.bookwise.infrastructure.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
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
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String categoryJson(String name, Long parentId) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("description", "desc");
        body.put("parentId", parentId);
        return objectMapper.writeValueAsString(body);
    }

    private long create(String name, Long parentId) throws Exception {
        String json = mockMvc.perform(post("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON).content(categoryJson(name, parentId)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(json).get("id").asLong();
    }

    @Test
    void createParentAndChildResolvesParentName() throws Exception {
        long parentId = create("Nao-Ficcao " + System.nanoTime(), null);

        String childJson = mockMvc.perform(post("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(categoryJson("Tecnologia " + System.nanoTime(), parentId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.parentId").value((int) parentId))
                .andExpect(jsonPath("$.parentName").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        long childId = objectMapper.readTree(childJson).get("id").asLong();
        mockMvc.perform(get("/api/v1/categories/" + childId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.parentId").value((int) parentId));
    }

    @Test
    void createInvalidReturns400() throws Exception {
        mockMvc.perform(post("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON).content(categoryJson("", null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void parentAsSelfReturns409() throws Exception {
        long id = create("Cat " + System.nanoTime(), null);
        mockMvc.perform(put("/api/v1/categories/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(categoryJson("Cat Atualizada", id)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void getMissingReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/categories/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void deleteThenGetReturns404() throws Exception {
        long id = create("Remover " + System.nanoTime(), null);
        mockMvc.perform(delete("/api/v1/categories/" + id)).andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/categories/" + id)).andExpect(status().isNotFound());
    }
}
