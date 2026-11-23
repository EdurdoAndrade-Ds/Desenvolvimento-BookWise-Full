package com.bookwise.infrastructure.persistence.projection;

import java.math.BigDecimal;

/**
 * Projecao da consulta nativa de indicadores consolidados.
 */
public interface SummaryProjection {

    long getTotalBooks();

    long getPhysicalStock();

    long getLowStockBooks();

    long getTotalUsers();

    long getActiveLoans();

    long getOverdueLoans();

    BigDecimal getMonthSalesTotal();

    long getPendingFines();

    BigDecimal getPendingFinesTotal();

    long getActiveReservations();
}
