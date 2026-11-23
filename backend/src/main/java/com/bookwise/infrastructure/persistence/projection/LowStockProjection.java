package com.bookwise.infrastructure.persistence.projection;

/**
 * Projecao dos livros fisicos com estoque critico.
 */
public interface LowStockProjection {

    Long getBookId();

    String getTitle();

    String getAuthor();

    long getStock();

    long getUnitsOnLoan();

    long getActiveReservations();
}
