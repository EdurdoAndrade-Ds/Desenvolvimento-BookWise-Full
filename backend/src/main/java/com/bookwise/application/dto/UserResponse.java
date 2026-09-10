package com.bookwise.application.dto;

import com.bookwise.domain.model.UserRole;
import java.time.OffsetDateTime;

/**
 * Representacao de saida de um usuario.
 */
public record UserResponse(
        Long id,
        String name,
        String email,
        UserRole role,
        OffsetDateTime createdAt) {
}
