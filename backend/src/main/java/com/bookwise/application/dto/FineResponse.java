package com.bookwise.application.dto;

import com.bookwise.domain.model.FinePaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Representacao de saida de uma multa.
 */
public record FineResponse(
        Long id,
        Long loanId,
        String userName,
        BigDecimal value,
        int daysLate,
        FinePaymentStatus paymentStatus,
        LocalDate paymentDate) {
}
