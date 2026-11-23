package com.bookwise.domain.page;

import java.util.List;

/**
 * Resultado paginado generico, independente de framework.
 */
public record PageResult<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages) {
}
