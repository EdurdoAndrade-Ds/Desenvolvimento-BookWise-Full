package com.bookwise.infrastructure.persistence.repository;

import com.bookwise.domain.model.ReservationStatus;
import com.bookwise.infrastructure.persistence.entity.ReservationEntity;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repositorio Spring Data JPA para {@link ReservationEntity}.
 */
public interface ReservationJpaRepository extends JpaRepository<ReservationEntity, Long> {

    Page<ReservationEntity> findByUserId(Long userId, Pageable pageable);

    List<ReservationEntity> findByStatusAndExpirationDateBefore(ReservationStatus status, LocalDate reference);
}
