package com.bookwise.domain.model;

/**
 * Item de um emprestimo (um livro e a quantidade emprestada).
 * {@code bookTitle} e um snapshot para exibicao.
 */
public record LoanItem(
        Long bookId,
        String bookTitle,
        int quantity) {
}
