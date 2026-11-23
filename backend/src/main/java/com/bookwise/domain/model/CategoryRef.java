package com.bookwise.domain.model;

/**
 * Referencia leve a uma categoria (id + nome), usada ao associar categorias
 * a um livro (N:N). Na escrita, apenas o {@code id} e relevante.
 */
public record CategoryRef(Long id, String name) {
}
