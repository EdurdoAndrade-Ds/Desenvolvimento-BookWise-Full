package com.bookwise.domain.exception;

/**
 * Lancada quando uma categoria nao e encontrada pelo identificador informado.
 */
public class CategoryNotFoundException extends RuntimeException {

    public CategoryNotFoundException(Long id) {
        super("Categoria nao encontrada: " + id);
    }
}
