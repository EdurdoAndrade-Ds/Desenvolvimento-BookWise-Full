package com.bookwise.application.service;

import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.dto.ReservationRequest;
import com.bookwise.application.dto.ReservationResponse;
import com.bookwise.application.mapper.ReservationMapper;
import com.bookwise.domain.exception.BookNotFoundException;
import com.bookwise.domain.exception.BusinessException;
import com.bookwise.domain.exception.ReservationNotFoundException;
import com.bookwise.domain.exception.UserNotFoundException;
import com.bookwise.domain.model.Book;
import com.bookwise.domain.model.Reservation;
import com.bookwise.domain.model.ReservationStatus;
import com.bookwise.domain.model.User;
import com.bookwise.domain.port.BookRepository;
import com.bookwise.domain.port.ReservationRepository;
import com.bookwise.domain.port.UserRepository;
import java.time.LocalDate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso de reservas.
 */
@Service
@Transactional
public class ReservationService {

    private static final int DEFAULT_EXPIRATION_DAYS = 7;

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    public ReservationService(
            ReservationRepository reservationRepository,
            UserRepository userRepository,
            BookRepository bookRepository) {
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<ReservationResponse> list(int page, int size, Long userId) {
        var result = userId == null
                ? reservationRepository.findAll(page, size)
                : reservationRepository.findAllByUserId(userId, page, size);
        return ReservationMapper.toPageResponse(result, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public ReservationResponse getById(Long id) {
        return reservationRepository.findById(id)
                .map(r -> ReservationMapper.toResponse(r, LocalDate.now()))
                .orElseThrow(() -> new ReservationNotFoundException(id));
    }

    public ReservationResponse create(ReservationRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new UserNotFoundException(request.userId()));
        Book book = bookRepository.findById(request.bookId())
                .orElseThrow(() -> new BookNotFoundException(request.bookId()));

        LocalDate today = LocalDate.now();
        LocalDate expiration = request.expirationDate() != null
                ? request.expirationDate()
                : today.plusDays(DEFAULT_EXPIRATION_DAYS);

        Reservation reservation = new Reservation(
                null, user.id(), user.name(), book.id(), book.title(),
                today, expiration, ReservationStatus.ACTIVE, null);
        return ReservationMapper.toResponse(reservationRepository.save(reservation), today);
    }

    public ReservationResponse cancel(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ReservationNotFoundException(id));
        if (reservation.status() == ReservationStatus.CANCELLED) {
            throw new BusinessException("Reserva ja cancelada");
        }
        Reservation cancelled = reservation.withStatus(ReservationStatus.CANCELLED);
        return ReservationMapper.toResponse(reservationRepository.save(cancelled), LocalDate.now());
    }
}
