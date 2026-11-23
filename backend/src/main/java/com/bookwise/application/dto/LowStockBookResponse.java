package com.bookwise.application.dto;

/**
 * Livro fisico com estoque critico.
 *
 * @param bookId             identificador do livro
 * @param title              titulo
 * @param author             autor
 * @param stock              estoque disponivel
 * @param unitsOnLoan        unidades atualmente emprestadas
 * @param activeReservations reservas ativas do livro
 */
public record LowStockBookResponse(
        Long bookId,
        String title,
        String author,
        long stock,
        long unitsOnLoan,
        long activeReservations) {
}
