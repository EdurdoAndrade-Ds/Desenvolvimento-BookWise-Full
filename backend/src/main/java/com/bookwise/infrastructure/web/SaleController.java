package com.bookwise.infrastructure.web;

import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.dto.SaleRequest;
import com.bookwise.application.dto.SaleResponse;
import com.bookwise.application.service.SaleService;
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
 * Endpoints REST para gestao de vendas. Alinhado ao contrato
 * {@code contracts/openapi.yaml}.
 */
@RestController
@RequestMapping("/api/v1/sales")
@Tag(name = "Sales", description = "Controle de vendas de livros")
public class SaleController {

    private final SaleService service;

    public SaleController(SaleService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Lista vendas", description = "Retorna uma pagina de vendas, da mais recente a mais antiga.")
    public PageResponse<SaleResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Filtra vendas pelo id do usuario.")
            @RequestParam(required = false) Long userId) {
        return service.list(page, size, userId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca venda por id")
    public SaleResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @Operation(summary = "Registra uma venda")
    public ResponseEntity<SaleResponse> create(@Valid @RequestBody SaleRequest request) {
        SaleResponse created = service.create(request);
        return ResponseEntity
                .created(URI.create("/api/v1/sales/" + created.id()))
                .body(created);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancela uma venda", description = "Cancela a venda e restaura o estoque dos livros fisicos.")
    public SaleResponse cancel(@PathVariable Long id) {
        return service.cancel(id);
    }
}
