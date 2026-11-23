package com.bookwise.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Dados de entrada para criacao/atualizacao de uma categoria.
 */
public record CategoryRequest(
        @NotBlank(message = "O nome e obrigatorio")
        @Size(max = 80, message = "O nome deve ter no maximo 80 caracteres")
        String name,

        @Size(max = 200, message = "A descricao deve ter no maximo 200 caracteres")
        String description,

        Long parentId) {
}
