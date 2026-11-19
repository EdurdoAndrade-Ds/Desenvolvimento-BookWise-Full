package com.bookwise.domain.model;

/**
 * Situacao de uma reserva. {@code EXPIRED} e derivado da data de expiracao.
 */
public enum ReservationStatus {
    ACTIVE,
    FULFILLED,
    CANCELLED,
    EXPIRED
}
