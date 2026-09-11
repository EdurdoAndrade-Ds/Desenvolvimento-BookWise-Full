package com.bookwise.domain.exception;

/**
 * Lancada quando um usuario nao e encontrado pelo identificador informado.
 */
public class UserNotFoundException extends NotFoundException {

    public UserNotFoundException(Long id) {
        super("Usuario nao encontrado: " + id);
    }
}
