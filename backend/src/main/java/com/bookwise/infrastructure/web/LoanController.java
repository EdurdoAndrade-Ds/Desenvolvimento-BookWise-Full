package com.bookwise.infrastructure.web;

import com.bookwise.application.dto.LoanRequest;
import com.bookwise.application.dto.LoanResponse;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.service.LoanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints REST para gestao de emprestimos. Alinhado ao contrato
 * {@code contracts/openapi.yaml}.
 */
@RestController
@RequestMapping("/api/v1/loans")
@Tag(name = "Loans", description = "Controle de emprestimos e devolucoes")
public class LoanController {

    private final LoanService service;

    public LoanController(LoanService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Lista emprestimos", description = "Retorna uma pagina de emprestimos, do mais recente ao mais antigo.")
    public PageResponse<LoanResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Filtra emprestimos pelo id do usuario.")
            @RequestParam(required = false) Long userId) {
        return service.list(page, size, userId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca emprestimo por id")
    public LoanResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @Operation(summary = "Registra um emprestimo")
    public ResponseEntity<LoanResponse> create(@Valid @RequestBody LoanRequest request) {
        LoanResponse created = service.create(request);
        return ResponseEntity
                .created(URI.create("/api/v1/loans/" + created.id()))
                .body(created);
    }

    @PostMapping("/{id}/renew")
    @Operation(summary = "Renova um emprestimo em aberto")
    public LoanResponse renew(@PathVariable Long id) {
        return service.renew(id);
    }

    @PostMapping("/{id}/return")
    @Operation(summary = "Registra a devolucao de um emprestimo")
    public LoanResponse returnLoan(@PathVariable Long id) {
        return service.returnLoan(id);
    }
}
