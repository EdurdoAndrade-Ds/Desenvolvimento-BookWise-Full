package com.bookwise.domain.model;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Emprestimo de um ou mais livros a um usuario. O {@code status} e derivado
 * das datas (nao e persistido).
 */
public record Loan(
        Long id,
        Long userId,
        String userName,
        List<LoanItem> items,
        LocalDate loanDate,
        LocalDate dueDate,
        LocalDate returnDate,
        OffsetDateTime createdAt) {

    /**
     * Calcula o status do emprestimo em relacao a uma data de referencia:
     * devolvido, atrasado (nao devolvido e vencido) ou ativo.
     */
    public LoanStatus statusAt(LocalDate reference) {
        if (returnDate != null) {
            return LoanStatus.RETURNED;
        }
        if (dueDate != null && dueDate.isBefore(reference)) {
            return LoanStatus.LATE;
        }
        return LoanStatus.ACTIVE;
    }
}
