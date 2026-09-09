package com.bookwise.infrastructure.persistence;

import com.bookwise.domain.model.Reservation;
import com.bookwise.infrastructure.persistence.entity.ReservationEntity;

/**
 * Conversoes entre a entidade JPA de reserva e o modelo de dominio.
 */
final class ReservationEntityMapper {

    private ReservationEntityMapper() {
    }

    static Reservation toDomain(ReservationEntity entity) {
        return new Reservation(
                entity.getId(),
                entity.getUserId(),
                entity.getUserName(),
                entity.getBookId(),
                entity.getBookTitle(),
                entity.getReserveDate(),
                entity.getExpirationDate(),
                entity.getStatus(),
                entity.getCreatedAt());
    }

    static ReservationEntity toEntity(Reservation reservation, ReservationEntity target) {
        ReservationEntity entity = target != null ? target : new ReservationEntity();
        entity.setUserId(reservation.userId());
        entity.setUserName(reservation.userName());
        entity.setBookId(reservation.bookId());
        entity.setBookTitle(reservation.bookTitle());
        entity.setReserveDate(reservation.reserveDate());
        entity.setExpirationDate(reservation.expirationDate());
        entity.setStatus(reservation.status());
        if (reservation.createdAt() != null) {
            entity.setCreatedAt(reservation.createdAt());
        }
        return entity;
    }
}
