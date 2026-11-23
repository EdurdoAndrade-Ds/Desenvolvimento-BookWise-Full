package com.bookwise.application.dto;

import com.bookwise.domain.model.SaleStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Representacao de saida de uma venda.
 */
public record SaleResponse(
        Long id,
        Long userId,
        String userName,
        List<SaleItemResponse> items,
        String paymentMethod,
        LocalDate saleDate,
        BigDecimal totalPrice,
        SaleStatus status) {
}
