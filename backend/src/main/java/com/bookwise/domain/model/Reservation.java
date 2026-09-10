package com.bookwise.domain.model;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Reserva de um livro por um usuario. O status EXPIRED e derivado quando a
 * reserva esta ativa e ja passou da data de expiracao.
 */
public record Reservation(
        Long id,
        Long userId,
        String userName,
        Long bookId,
        String bookTitle,
        LocalDate reserveDate,
        LocalDate expirationDate,
        ReservationStatus status,
        OffsetDateTime createdAt) {

    public ReservationStatus statusAt(LocalDate reference) {
        if (status == ReservationStatus.ACTIVE
                && expirationDate != null
                && expirationDate.isBefore(reference)) {
            return ReservationStatus.EXPIRED;
        }
        return status;
    }

    public Reservation withStatus(ReservationStatus newStatus) {
        return new Reservation(
                id, userId, userName, bookId, bookTitle, reserveDate, expirationDate, newStatus, createdAt);
    }
}
