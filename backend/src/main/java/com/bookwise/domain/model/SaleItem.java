package com.bookwise.domain.model;

import java.math.BigDecimal;

/**
 * Item de uma venda (livro, quantidade e preco unitario praticado).
 * {@code bookTitle} e um snapshot para exibicao.
 */
public record SaleItem(
        Long bookId,
        String bookTitle,
        int quantity,
        BigDecimal unitPrice) {

    /** Subtotal do item (preco unitario x quantidade). */
    public BigDecimal subtotal() {
        BigDecimal price = unitPrice == null ? BigDecimal.ZERO : unitPrice;
        return price.multiply(BigDecimal.valueOf(quantity));
    }
}
