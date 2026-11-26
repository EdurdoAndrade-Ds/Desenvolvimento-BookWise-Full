package com.bookwise.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Emprestimo de um ou mais livros para um usuario. Entidade de dominio
 * imutavel: alteracoes produzem uma nova instancia.
 */
public record Loan(
        Long id,
        Long userId,
        String userName,
        List<LoanItem> items,
        LocalDate loanDate,
        LocalDate dueDate,
        LocalDate returnDate,
        int renewalCount,
        BigDecimal chargeAmount,
        LoanChargeStatus chargeStatus,
        LocalDate chargePaymentDate,
        OffsetDateTime createdAt) {

    /**
     * Status derivado na data de referencia: devolvido, atrasado ou ativo.
     *
     * @param reference data de referencia da apuracao
     * @return status do emprestimo naquela data
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

    /** Indica se o emprestimo ainda esta em aberto (sem devolucao). */
    public boolean isOpen() {
        return returnDate == null;
    }

    /** Copia deste emprestimo com a data de devolucao informada. */
    public Loan withReturnDate(LocalDate date) {
        return new Loan(id, userId, userName, items, loanDate, dueDate, date, renewalCount,
                chargeAmount, chargeStatus, chargePaymentDate, createdAt);
    }

    /** Copia deste emprestimo renovado: nova data prevista e contador incrementado. */
    public Loan renewedUntil(LocalDate newDueDate) {
        return new Loan(id, userId, userName, items, loanDate, newDueDate, returnDate, renewalCount + 1,
                chargeAmount, chargeStatus, chargePaymentDate, createdAt);
    }

    public Loan withChargePaid(LocalDate date) {
        return new Loan(id, userId, userName, items, loanDate, dueDate, returnDate, renewalCount,
                chargeAmount, LoanChargeStatus.PAID, date, createdAt);
    }

    /** Soma das quantidades de todos os itens do emprestimo. */
    public int totalItems() {
        return items.stream().mapToInt(LoanItem::quantity).sum();
    }
}
