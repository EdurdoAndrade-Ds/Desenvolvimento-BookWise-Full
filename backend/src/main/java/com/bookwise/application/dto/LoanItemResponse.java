package com.bookwise.application.dto;

import java.math.BigDecimal;

/**
 * Item de saida de um emprestimo.
 */
public record LoanItemResponse(
        Long bookId,
        String bookTitle,
        int quantity,
        BigDecimal unitLoanPrice) {
}
