package com.bookwise.domain.exception;

/**
 * Superclasse das excecoes de "recurso nao encontrado". Centraliza o
 * comportamento comum (mensagem) e permite que o {@code GlobalExceptionHandler}
 * mapeie qualquer subtipo para HTTP 404 com um unico {@code @ExceptionHandler},
 * seguindo o principio Aberto/Fechado (OCP): novas excecoes deste tipo passam a
 * ser tratadas automaticamente, sem alterar o handler.
 */
public class NotFoundException extends RuntimeException {

    /**
     * Cria a excecao com a mensagem descrevendo o recurso ausente.
     *
     * @param message mensagem legivel para o cliente (ex.: "Livro nao encontrado: 42")
     */
    public NotFoundException(String message) {
        super(message);
    }
}
