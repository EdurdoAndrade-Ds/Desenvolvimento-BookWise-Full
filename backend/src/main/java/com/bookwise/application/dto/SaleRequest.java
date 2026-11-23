package com.bookwise.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * Dados de entrada para registrar uma venda.
 */
public record SaleRequest(
        @NotNull(message = "O id do usuario e obrigatorio")
        Long userId,

        String paymentMethod,

        @NotEmpty(message = "Informe ao menos um livro")
        @Valid
        List<SaleItemRequest> items) {
}
