package com.bookwise.application.dto;

import java.math.BigDecimal;

/**
 * Item de saida de uma venda.
 */
public record SaleItemResponse(
        Long bookId,
        String bookTitle,
        int quantity,
        BigDecimal unitPrice) {
}
