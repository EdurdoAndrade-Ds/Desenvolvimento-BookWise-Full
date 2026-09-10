package com.bookwise.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Multa gerada por devolucao de emprestimo em atraso (relacao 1:1 com Emprestimo).
 */
public record Fine(
        Long id,
        Long loanId,
        String userName,
        BigDecimal value,
        int daysLate,
        FinePaymentStatus paymentStatus,
        LocalDate paymentDate,
        OffsetDateTime createdAt) {

    /** Copia desta multa marcada como paga na data informada. */
    public Fine asPaid(LocalDate date) {
        return new Fine(id, loanId, userName, value, daysLate, FinePaymentStatus.PAID, date, createdAt);
    }
}
