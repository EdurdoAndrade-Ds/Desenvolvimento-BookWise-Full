package com.bookwise.domain.exception;

/**
 * Lancada quando um emprestimo nao e encontrado pelo identificador informado.
 */
public class LoanNotFoundException extends NotFoundException {

    public LoanNotFoundException(Long id) {
        super("Emprestimo nao encontrado: " + id);
    }
}
