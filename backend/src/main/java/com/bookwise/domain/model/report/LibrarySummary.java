package com.bookwise.domain.model.report;

import java.math.BigDecimal;

/**
 * Indicadores consolidados do acervo, calculados no banco (agregacoes SQL).
 */
public record LibrarySummary(
        long totalBooks,
        long physicalStock,
        long lowStockBooks,
        long totalUsers,
        long activeLoans,
        long overdueLoans,
        BigDecimal monthSalesTotal,
        long pendingFines,
        BigDecimal pendingFinesTotal,
        long activeReservations) {
}
