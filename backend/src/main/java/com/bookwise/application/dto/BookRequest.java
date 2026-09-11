package com.bookwise.application.dto;

import com.bookwise.domain.model.BookFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

/**
 * Dados de entrada para criacao/atualizacao de um livro.
 */
public record BookRequest(
        @NotBlank(message = "O titulo e obrigatorio")
        String title,

        @NotBlank(message = "O autor e obrigatorio")
        String author,

        @NotBlank(message = "O ISBN e obrigatorio")
        String isbn,

        @Size(max = 50, message = "O genero deve ter no maximo 50 caracteres")
        String genre,

        Integer publishedYear,

        @NotNull(message = "O formato e obrigatorio")
        BookFormat format,

        @PositiveOrZero(message = "O preco nao pode ser negativo")
        BigDecimal price,

        @PositiveOrZero(message = "O estoque nao pode ser negativo")
        Integer stock,

        @Size(max = 500, message = "A URL da capa deve ter no maximo 500 caracteres")
        String coverUrl,

        List<Long> categoryIds) {
}
