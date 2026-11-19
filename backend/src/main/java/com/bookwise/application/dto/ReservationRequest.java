package com.bookwise.application.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Dados de entrada para registrar uma reserva.
 */
public record ReservationRequest(
        @NotNull(message = "O id do usuario e obrigatorio")
        Long userId,

        @NotNull(message = "O id do livro e obrigatorio")
        Long bookId,

        LocalDate expirationDate) {
}
