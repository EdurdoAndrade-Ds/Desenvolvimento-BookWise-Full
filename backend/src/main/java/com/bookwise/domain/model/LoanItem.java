package com.bookwise.domain.model;

import java.math.BigDecimal;

/**
 * Item de um emprestimo (um livro e a quantidade emprestada).
 * {@code bookTitle} e um snapshot para exibicao.
 */
public record LoanItem(
        Long bookId,
        String bookTitle,
        int quantity,
        BigDecimal unitLoanPrice) {
}
