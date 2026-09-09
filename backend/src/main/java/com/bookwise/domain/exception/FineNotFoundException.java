package com.bookwise.domain.exception;

/**
 * Lancada quando uma multa nao e encontrada pelo identificador informado.
 */
public class FineNotFoundException extends RuntimeException {

    public FineNotFoundException(Long id) {
        super("Multa nao encontrada: " + id);
    }
}
