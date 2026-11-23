package com.bookwise.application.dto;

import com.bookwise.domain.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Dados de entrada para criacao/atualizacao de um usuario.
 */
public record UserRequest(
        @NotBlank(message = "O nome e obrigatorio")
        String name,

        @NotBlank(message = "O email e obrigatorio")
        @Email(message = "Email invalido")
        String email,

        @NotNull(message = "O perfil e obrigatorio")
        UserRole role) {
}
