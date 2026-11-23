package com.bookwise.domain.exception;

/**
 * Violacao de regra de negocio (ex.: estoque insuficiente, emprestimo ja
 * devolvido). Mapeada para HTTP 409 (Conflict).
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
