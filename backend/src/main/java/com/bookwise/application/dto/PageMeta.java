package com.bookwise.application.dto;

/**
 * Metadados de paginacao.
 */
public record PageMeta(
        int page,
        int size,
        long totalElements,
        int totalPages) {
}
