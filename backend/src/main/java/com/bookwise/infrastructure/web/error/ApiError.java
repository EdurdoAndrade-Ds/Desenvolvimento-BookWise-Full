package com.bookwise.infrastructure.web.error;

import java.time.OffsetDateTime;

/**
 * Corpo padrao de erro, alinhado ao schema {@code ErrorResponse} do contrato.
 */
public record ApiError(
        OffsetDateTime timestamp,
        int status,
        String error,
        String message,
        String path) {

    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(OffsetDateTime.now(), status, error, message, path);
    }
}
