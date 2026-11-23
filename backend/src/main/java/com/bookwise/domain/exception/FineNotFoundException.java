package com.bookwise.domain.exception;

/**
 * Lancada quando uma multa nao e encontrada pelo identificador informado.
 */
public class FineNotFoundException extends NotFoundException {

    public FineNotFoundException(Long id) {
        super("Multa nao encontrada: " + id);
    }
}
