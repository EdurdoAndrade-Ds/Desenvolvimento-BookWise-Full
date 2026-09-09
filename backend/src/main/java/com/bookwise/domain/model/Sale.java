package com.bookwise.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Venda de um ou mais livros a um usuario.
 */
public record Sale(
        Long id,
        Long userId,
        String userName,
        List<SaleItem> items,
        String paymentMethod,
        LocalDate saleDate,
        BigDecimal totalPrice,
        SaleStatus status,
        OffsetDateTime createdAt) {

    /** Copia desta venda com um novo status (usado no cancelamento). */
    public Sale withStatus(SaleStatus newStatus) {
        return new Sale(
                id, userId, userName, items, paymentMethod, saleDate, totalPrice, newStatus, createdAt);
    }
}
