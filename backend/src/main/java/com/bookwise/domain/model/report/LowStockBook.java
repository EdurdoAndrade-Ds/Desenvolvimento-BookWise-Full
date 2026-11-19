package com.bookwise.domain.model.report;

/**
 * Livro fisico com estoque igual ou abaixo do limite consultado.
 */
public record LowStockBook(
        Long bookId,
        String title,
        String author,
        long stock,
        long unitsOnLoan,
        long activeReservations) {
}
