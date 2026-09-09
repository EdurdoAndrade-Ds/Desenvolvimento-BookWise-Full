package com.bookwise.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

/**
 * Dados de entrada para registrar um emprestimo.
 */
public record LoanRequest(
        @NotNull(message = "O id do usuario e obrigatorio")
        Long userId,

        LocalDate dueDate,

        @NotEmpty(message = "Informe ao menos um livro")
        @Valid
        List<LoanItemRequest> items) {
}
