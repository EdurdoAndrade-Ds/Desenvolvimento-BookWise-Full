package com.bookwise.infrastructure.web;

import com.bookwise.application.dto.FineResponse;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.service.FineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints REST para consulta e pagamento de multas.
 */
@RestController
@RequestMapping("/api/v1/fines")
@Tag(name = "Fines", description = "Multas de emprestimos em atraso")
public class FineController {

    private final FineService service;

    public FineController(FineService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Lista multas")
    public PageResponse<FineResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Filtra multas pelo id do usuario dono do emprestimo.")
            @RequestParam(required = false) Long userId) {
        return service.list(page, size, userId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca multa por id")
    public FineResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping("/{id}/pay")
    @Operation(summary = "Registra o pagamento de uma multa")
    public FineResponse pay(@PathVariable Long id) {
        return service.pay(id);
    }
}
