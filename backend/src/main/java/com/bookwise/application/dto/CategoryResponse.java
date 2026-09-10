package com.bookwise.application.dto;

import java.time.OffsetDateTime;

/**
 * Representacao de saida de uma categoria.
 */
public record CategoryResponse(
        Long id,
        String name,
        String description,
        Long parentId,
        String parentName,
        OffsetDateTime createdAt) {
}
