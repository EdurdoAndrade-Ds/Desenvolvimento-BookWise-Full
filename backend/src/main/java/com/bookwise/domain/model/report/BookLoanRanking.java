package com.bookwise.domain.model.report;

/**
 * Livro no ranking de emprestimos (JOIN entre {@code loan_items}, {@code loans} e {@code books}).
 */
public record BookLoanRanking(
        Long bookId,
        String title,
        String author,
        long loanCount,
        long unitsLoaned,
        long openLoans) {
}
