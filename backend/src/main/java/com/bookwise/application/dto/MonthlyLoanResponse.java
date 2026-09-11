package com.bookwise.application.dto;

/**
 * Ponto da serie historica de emprestimos.
 *
 * @param month    mes de referencia no formato {@code yyyy-MM}
 * @param total    emprestimos criados no mes
 * @param returned emprestimos do mes ja devolvidos
 * @param overdue  emprestimos do mes em aberto e atrasados
 */
public record MonthlyLoanResponse(
        String month,
        long total,
        long returned,
        long overdue) {
}
