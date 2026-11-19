package com.bookwise.infrastructure.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.hasItems;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SchemaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsApplicationTablesAndForeignKeys() throws Exception {
        mockMvc.perform(get("/api/v1/schema"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.database.productName").isNotEmpty())
                .andExpect(jsonPath("$.tables[*].name", hasItems("books", "loans", "loan_items")))
                .andExpect(jsonPath("$.tables[?(@.name == 'loan_items')].foreignKeys[*].referencedTable")
                        .value(hasItems("loans")))
                .andExpect(jsonPath("$.tables[?(@.name == 'book_categories')].foreignKeys[*].referencedTable")
                        .value(hasItems("books", "categories")));
    }
}
