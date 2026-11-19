package com.bookwise.domain.model.report;

import java.math.BigDecimal;

/**
 * Usuario no ranking de emprestimos, com o total de multas pendentes.
 */
public record BorrowerRanking(
        Long userId,
        String name,
        String email,
        long loanCount,
        long openLoans,
        BigDecimal pendingFineTotal) {
}
