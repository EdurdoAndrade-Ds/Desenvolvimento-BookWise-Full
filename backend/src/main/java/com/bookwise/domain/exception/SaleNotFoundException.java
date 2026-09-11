package com.bookwise.domain.exception;

/**
 * Lancada quando uma venda nao e encontrada pelo identificador informado.
 */
public class SaleNotFoundException extends NotFoundException {

    public SaleNotFoundException(Long id) {
        super("Venda nao encontrada: " + id);
    }
}
