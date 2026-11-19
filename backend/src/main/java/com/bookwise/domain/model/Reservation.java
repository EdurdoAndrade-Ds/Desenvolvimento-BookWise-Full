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

    /**
     * Calcula o status da reserva em relacao a uma data de referencia: uma
     * reserva ativa cuja data de expiracao ja passou e considerada EXPIRED.
     *
     * @param reference data de referencia (tipicamente hoje)
     * @return o status efetivo na data informada
     */
    public ReservationStatus statusAt(LocalDate reference) {
        if (status == ReservationStatus.ACTIVE
                && expirationDate != null
                && expirationDate.isBefore(reference)) {
            return ReservationStatus.EXPIRED;
        }
        return status;
    }

    /**
     * Cria uma copia desta reserva com um novo status, preservando os demais campos.
     *
     * @param newStatus novo status a aplicar
     * @return nova instancia com o status atualizado
     */
    public Reservation withStatus(ReservationStatus newStatus) {
        return new Reservation(
                id, userId, userName, bookId, bookTitle, reserveDate, expirationDate, newStatus, createdAt);
    }
}
