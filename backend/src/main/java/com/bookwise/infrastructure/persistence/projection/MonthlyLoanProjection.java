package com.bookwise.infrastructure.persistence.projection;

/**
 * Projecao da serie de emprestimos por mes.
 */
public interface MonthlyLoanProjection {

    int getRefYear();

    int getRefMonth();

    long getTotal();

    long getReturned();

    long getOverdue();
}
