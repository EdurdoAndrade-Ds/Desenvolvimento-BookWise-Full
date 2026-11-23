package com.bookwise.application.dto;

import java.util.List;

/**
 * Envelope de resposta paginada, alinhado ao contrato OpenAPI
 * (campos {@code content} e {@code meta}).
 */
public record PageResponse<T>(
        List<T> content,
        PageMeta meta) {
}
