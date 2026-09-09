package com.bookwise.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Item de entrada de um emprestimo (livro + quantidade).
 */
public record LoanItemRequest(
        @NotNull(message = "O id do livro e obrigatorio")
        Long bookId,

        @Positive(message = "A quantidade deve ser maior que zero")
        Integer quantity) {

    public int quantityOrDefault() {
        return quantity == null ? 1 : quantity;
    }
}
