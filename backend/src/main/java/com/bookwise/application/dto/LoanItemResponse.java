package com.bookwise.application.dto;

/**
 * Item de saida de um emprestimo.
 */
public record LoanItemResponse(
        Long bookId,
        String bookTitle,
        int quantity) {
}
