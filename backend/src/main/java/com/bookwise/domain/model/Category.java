package com.bookwise.domain.model;

import java.time.OffsetDateTime;

/**
 * Categoria de livros. Suporta auto-relacionamento (subcategorias) via
 * {@code parentId}. {@code parentName} e um snapshot para exibicao.
 */
public record Category(
        Long id,
        String name,
        String description,
        Long parentId,
        String parentName,
        OffsetDateTime createdAt) {

    /** Copia desta categoria aplicando dados de atualizacao (preserva id/createdAt). */
    public Category withUpdatedData(String name, String description, Long parentId) {
        return new Category(this.id, name, description, parentId, this.parentName, this.createdAt);
    }
}
