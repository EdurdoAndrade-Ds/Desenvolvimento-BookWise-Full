package com.bookwise.infrastructure.persistence;

import com.bookwise.domain.model.Fine;
import com.bookwise.infrastructure.persistence.entity.FineEntity;

/**
 * Conversoes entre a entidade JPA de multa e o modelo de dominio.
 */
final class FineEntityMapper {

    private FineEntityMapper() {
    }

    static Fine toDomain(FineEntity entity) {
        return new Fine(
                entity.getId(),
                entity.getLoanId(),
                entity.getUserName(),
                entity.getValue(),
                entity.getDaysLate(),
                entity.getPaymentStatus(),
                entity.getPaymentDate(),
                entity.getCreatedAt());
    }

    static FineEntity toEntity(Fine fine, FineEntity target) {
        FineEntity entity = target != null ? target : new FineEntity();
        entity.setLoanId(fine.loanId());
        entity.setUserName(fine.userName());
        entity.setValue(fine.value());
        entity.setDaysLate(fine.daysLate());
        entity.setPaymentStatus(fine.paymentStatus());
        entity.setPaymentDate(fine.paymentDate());
        if (fine.createdAt() != null) {
            entity.setCreatedAt(fine.createdAt());
        }
        return entity;
    }
}
