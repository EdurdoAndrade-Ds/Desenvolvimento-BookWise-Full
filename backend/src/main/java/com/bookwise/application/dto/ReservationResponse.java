package com.bookwise.application.dto;

import com.bookwise.domain.model.ReservationStatus;
import java.time.LocalDate;

/**
 * Representacao de saida de uma reserva (status derivado).
 */
public record ReservationResponse(
        Long id,
        Long userId,
        String userName,
        Long bookId,
        String bookTitle,
        LocalDate reserveDate,
        LocalDate expirationDate,
        ReservationStatus status) {
}
