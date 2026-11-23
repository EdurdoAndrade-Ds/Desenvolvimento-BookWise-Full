package com.bookwise.infrastructure.web;

import com.bookwise.application.dto.BookRankingResponse;
import com.bookwise.application.dto.BorrowerRankingResponse;
import com.bookwise.application.dto.LibrarySummaryResponse;
import com.bookwise.application.dto.LowStockBookResponse;
import com.bookwise.application.dto.MonthlyLoanResponse;
import com.bookwise.application.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints REST dos relatorios analiticos, cujas agregacoes sao resolvidas em
 * SQL nativo (JOIN, GROUP BY, subquery) e nao na aplicacao.
 */
@RestController
@RequestMapping("/api/v1/reports")
@Tag(name = "Reports", description = "Relatorios analiticos agregados no banco (SQL nativo)")
public class ReportController {

    private final ReportService service;

    public ReportController(ReportService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    @Operation(summary = "Indicadores consolidados do acervo",
            description = "Contagens, estoque, emprestimos em aberto/atrasados, vendas do mes e multas pendentes.")
    public LibrarySummaryResponse summary() {
        return service.summary();
    }

    @GetMapping("/top-books")
    @Operation(summary = "Livros mais emprestados")
    public List<BookRankingResponse> topBooks(
            @Parameter(description = "Quantidade de linhas; usa o padrao configurado quando ausente.")
            @RequestParam(required = false) Integer limit) {
        return service.topBorrowedBooks(limit);
    }

    @GetMapping("/loans-by-month")
    @Operation(summary = "Serie historica de emprestimos por mes",
            description = "Inclui meses sem movimento para permitir a plotagem direta do grafico.")
    public List<MonthlyLoanResponse> loansByMonth(
            @Parameter(description = "Quantidade de meses; usa o padrao configurado quando ausente.")
            @RequestParam(required = false) Integer months) {
        return service.loansByMonth(months);
    }

    @GetMapping("/top-borrowers")
    @Operation(summary = "Usuarios com mais emprestimos e multas pendentes")
    public List<BorrowerRankingResponse> topBorrowers(
            @Parameter(description = "Quantidade de linhas; usa o padrao configurado quando ausente.")
            @RequestParam(required = false) Integer limit) {
        return service.topBorrowers(limit);
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Livros fisicos com estoque critico")
    public List<LowStockBookResponse> lowStock(
            @Parameter(description = "Limite de estoque; usa o padrao configurado quando ausente.")
            @RequestParam(required = false) Integer threshold) {
        return service.lowStockBooks(threshold);
    }
}
