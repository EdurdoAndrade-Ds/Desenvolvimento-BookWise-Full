package com.bookwise.domain.port;

import com.bookwise.domain.model.Reservation;
import com.bookwise.domain.page.PageResult;
import java.util.List;
import java.util.Optional;

/**
 * Porta de saida para persistencia de reservas.
 */
public interface ReservationRepository {

    Reservation save(Reservation reservation);

    Optional<Reservation> findById(Long id);

    PageResult<Reservation> findAll(int page, int size);

    PageResult<Reservation> findAllByUserId(Long userId, int page, int size);

    List<Reservation> findAll();

    long count();
}
