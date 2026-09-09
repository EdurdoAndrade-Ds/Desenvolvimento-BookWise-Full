package com.bookwise.application.dto;

import com.bookwise.domain.model.BookFormat;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Representacao de saida de um livro.
 */
public record BookResponse(
        Long id,
        String title,
        String author,
        String isbn,
        String genre,
        Integer publishedYear,
        BookFormat format,
        BigDecimal price,
        Integer stock,
        List<CategoryRefResponse> categories,
        OffsetDateTime createdAt) {
}
