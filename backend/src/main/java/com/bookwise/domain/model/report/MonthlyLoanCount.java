package com.bookwise.domain.model.report;

import java.time.YearMonth;

/**
 * Total de emprestimos agrupados por mes de {@code loan_date}.
 */
public record MonthlyLoanCount(
        YearMonth month,
        long total,
        long returned,
        long overdue) {
}
