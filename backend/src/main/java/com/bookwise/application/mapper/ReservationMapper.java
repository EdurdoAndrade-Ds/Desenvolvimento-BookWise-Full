package com.bookwise.application.mapper;

import com.bookwise.application.dto.PageMeta;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.dto.ReservationResponse;
import com.bookwise.domain.model.Reservation;
import com.bookwise.domain.page.PageResult;
import java.time.LocalDate;
import java.util.List;

/**
 * Conversoes entre o dominio (Reservation) e os DTOs (status derivado).
 */
public final class ReservationMapper {

    private ReservationMapper() {
    }

    public static ReservationResponse toResponse(Reservation reservation, LocalDate reference) {
        return new ReservationResponse(
                reservation.id(),
                reservation.userId(),
                reservation.userName(),
                reservation.bookId(),
                reservation.bookTitle(),
                reservation.reserveDate(),
                reservation.expirationDate(),
                reservation.statusAt(reference));
    }

    public static PageResponse<ReservationResponse> toPageResponse(
            PageResult<Reservation> page, LocalDate reference) {
        List<ReservationResponse> content = page.content().stream()
                .map(r -> toResponse(r, reference))
                .toList();
        PageMeta meta = new PageMeta(page.page(), page.size(), page.totalElements(), page.totalPages());
        return new PageResponse<>(content, meta);
    }
}
