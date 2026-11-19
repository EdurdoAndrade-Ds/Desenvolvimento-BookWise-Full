package com.bookwise.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

/**
 * Item de entrada de uma venda. Se {@code unitPrice} for nulo, usa o preco do livro.
 */
public record SaleItemRequest(
        @NotNull(message = "O id do livro e obrigatorio")
        Long bookId,

        @Positive(message = "A quantidade deve ser maior que zero")
        Integer quantity,

        @PositiveOrZero(message = "O preco unitario nao pode ser negativo")
        BigDecimal unitPrice) {

    public int quantityOrDefault() {
        return quantity == null ? 1 : quantity;
    }
}
