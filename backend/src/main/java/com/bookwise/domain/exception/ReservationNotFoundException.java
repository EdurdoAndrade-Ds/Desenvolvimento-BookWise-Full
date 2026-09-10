package com.bookwise.domain.exception;

/**
 * Lancada quando uma reserva nao e encontrada pelo identificador informado.
 */
public class ReservationNotFoundException extends RuntimeException {

    public ReservationNotFoundException(Long id) {
        super("Reserva nao encontrada: " + id);
    }
}
