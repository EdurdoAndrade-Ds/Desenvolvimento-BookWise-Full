package com.bookwise.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Multa gerada por atraso de emprestimo (relacao 1:1 com Emprestimo).
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

    /** Copia desta multa com o valor e os dias de atraso reapurados. */
    public Fine withCharge(BigDecimal newValue, int newDaysLate) {
        return new Fine(id, loanId, userName, newValue, newDaysLate, paymentStatus, paymentDate, createdAt);
    }
}
