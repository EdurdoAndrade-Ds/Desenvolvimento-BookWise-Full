package com.bookwise.application.dto;

import com.bookwise.domain.model.LoanStatus;
import com.bookwise.domain.model.LoanChargeStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Representacao de saida de um emprestimo (status derivado).
 */
public record LoanResponse(
        Long id,
        Long userId,
        String userName,
        List<LoanItemResponse> items,
        LocalDate loanDate,
        LocalDate dueDate,
        LocalDate returnDate,
        int renewalCount,
        BigDecimal chargeAmount,
        LoanChargeStatus chargeStatus,
        LocalDate chargePaymentDate,
        LoanStatus status) {
}
