package com.bookwise.infrastructure.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

/**
 * Exercita os relatorios em SQL nativo de ponta a ponta (H2 em modo PostgreSQL),
 * validando as agregacoes e o mapeamento das projecoes.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private long id(String json) throws Exception {
        return objectMapper.readTree(json).get("id").asLong();
    }

    private JsonNode report(String path, String... params) throws Exception {
        MultiValueMap<String, String> query = new LinkedMultiValueMap<>();
        for (int i = 0; i + 1 < params.length; i += 2) {
            query.add(params[i], params[i + 1]);
        }
        String json = mockMvc.perform(get(path).params(query))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(json);
    }

    private Optional<JsonNode> findBy(JsonNode array, String field, long value) {
        for (JsonNode node : array) {
            if (node.get(field).asLong() == value) {
                return Optional.of(node);
            }
        }
        return Optional.empty();
    }

    private long createUser(String name) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "name", name, "email", "report" + System.nanoTime() + "@bookwise.com", "role", "READER"));
        return id(mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    private long createBook(String title, int stock) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "title", title, "author", "Autor Relatorio", "isbn", "R" + System.nanoTime(),
                "format", "PHYSICAL", "price", 25.0, "stock", stock));
        return id(mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    private void createLoan(long userId, long bookId, LocalDate dueDate) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "userId", userId,
                "dueDate", dueDate.toString(),
                "items", List.of(Map.of("bookId", bookId, "quantity", 1))));
        mockMvc.perform(post("/api/v1/loans")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
    }

    @Test
    void summaryCountsOpenAndOverdueLoans() throws Exception {
        JsonNode before = report("/api/v1/reports/summary");

        long userId = createUser("Resumo");
        createLoan(userId, createBook("Resumo em aberto", 5), LocalDate.now().plusDays(10));
        createLoan(userId, createBook("Resumo atrasado", 5), LocalDate.now().minusDays(3));

        JsonNode after = report("/api/v1/reports/summary");

        assertThat(after.get("totalBooks").asLong()).isEqualTo(before.get("totalBooks").asLong() + 2);
        assertThat(after.get("totalUsers").asLong()).isEqualTo(before.get("totalUsers").asLong() + 1);
        assertThat(after.get("activeLoans").asLong()).isEqualTo(before.get("activeLoans").asLong() + 2);
        assertThat(after.get("overdueLoans").asLong()).isEqualTo(before.get("overdueLoans").asLong() + 1);
        assertThat(after.get("physicalStock").asLong()).isEqualTo(before.get("physicalStock").asLong() + 8);
        assertThat(after.get("monthSalesTotal").isNumber()).isTrue();
        assertThat(after.get("pendingFinesTotal").isNumber()).isTrue();
    }

    @Test
    void topBooksRanksMostBorrowedBook() throws Exception {
        long userId = createUser("Ranking");
        long bookId = createBook("Livro do ranking", 9);
        createLoan(userId, bookId, LocalDate.now().plusDays(7));
        createLoan(userId, bookId, LocalDate.now().plusDays(7));

        JsonNode ranking = report("/api/v1/reports/top-books", "limit", "100");

        JsonNode row = findBy(ranking, "bookId", bookId).orElseThrow();
        assertThat(row.get("title").asText()).isEqualTo("Livro do ranking");
        assertThat(row.get("loanCount").asLong()).isEqualTo(2);
        assertThat(row.get("unitsLoaned").asLong()).isEqualTo(2);
        assertThat(row.get("openLoans").asLong()).isEqualTo(2);
    }

    @Test
    void loansByMonthFillsMonthsWithoutMovement() throws Exception {
        long userId = createUser("Serie");
        createLoan(userId, createBook("Livro da serie", 4), LocalDate.now().plusDays(5));

        JsonNode series = report("/api/v1/reports/loans-by-month", "months", "3");

        assertThat(series).hasSize(3);
        assertThat(series.get(0).get("month").asText())
                .isEqualTo(YearMonth.now().minusMonths(2).toString());
        assertThat(series.get(2).get("month").asText()).isEqualTo(YearMonth.now().toString());
        assertThat(series.get(2).get("total").asLong()).isPositive();
    }

    @Test
    void topBorrowersAggregatesLoansByUser() throws Exception {
        long userId = createUser("Leitor assiduo");
        createLoan(userId, createBook("Livro do leitor", 6), LocalDate.now().plusDays(6));

        JsonNode ranking = report("/api/v1/reports/top-borrowers", "limit", "100");

        JsonNode row = findBy(ranking, "userId", userId).orElseThrow();
        assertThat(row.get("name").asText()).isEqualTo("Leitor assiduo");
        assertThat(row.get("loanCount").asLong()).isEqualTo(1);
        assertThat(row.get("openLoans").asLong()).isEqualTo(1);
        assertThat(row.get("pendingFineTotal").decimalValue()).isEqualByComparingTo("0");
    }

    @Test
    void lowStockListsOnlyBooksUnderThreshold() throws Exception {
        long critical = createBook("Estoque critico", 1);
        long healthy = createBook("Estoque saudavel", 20);

        JsonNode books = report("/api/v1/reports/low-stock", "threshold", "2");

        assertThat(findBy(books, "bookId", critical).orElseThrow().get("stock").asLong()).isEqualTo(1);
        assertThat(findBy(books, "bookId", healthy)).isEmpty();
    }
}
