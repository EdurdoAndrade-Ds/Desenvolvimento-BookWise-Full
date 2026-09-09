package com.bookwise.domain.exception;

/**
 * Lancada quando um livro nao e encontrado pelo identificador informado.
 */
public class BookNotFoundException extends RuntimeException {

    public BookNotFoundException(Long id) {
        super("Livro nao encontrado: " + id);
    }
}
