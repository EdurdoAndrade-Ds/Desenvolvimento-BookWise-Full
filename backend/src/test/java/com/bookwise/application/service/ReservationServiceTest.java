package com.bookwise.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bookwise.application.dto.ReservationRequest;
import com.bookwise.application.policy.StockPolicy;
import com.bookwise.config.BusinessProperties;
import com.bookwise.domain.exception.BusinessException;
import com.bookwise.domain.model.Book;
import com.bookwise.domain.model.BookFormat;
import com.bookwise.domain.model.Reservation;
import com.bookwise.domain.model.ReservationStatus;
import com.bookwise.domain.model.User;
import com.bookwise.domain.model.UserRole;
import com.bookwise.domain.port.BookRepository;
import com.bookwise.domain.port.ReservationRepository;
import com.bookwise.domain.port.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    private static final int EXPIRATION_DAYS = 7;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private LoanService loanService;

    @Test
    void createShouldHoldOneUnitOfStockWhenHoldStockEnabled() {
        ReservationService service = service(true);
        User user = user();
        Book book = book(3);
        when(userRepository.findById(user.id())).thenReturn(Optional.of(user));
        when(bookRepository.findById(book.id())).thenReturn(Optional.of(book));
        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.create(new ReservationRequest(user.id(), book.id(), null));

        verify(bookRepository).save(book.withStock(2));
    }

    @Test
    void createShouldNotTouchStockWhenHoldStockDisabled() {
        ReservationService service = service(false);
        User user = user();
        Book book = book(3);
        when(userRepository.findById(user.id())).thenReturn(Optional.of(user));
        when(bookRepository.findById(book.id())).thenReturn(Optional.of(book));
        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.create(new ReservationRequest(user.id(), book.id(), null));

        verify(bookRepository, never()).save(any(Book.class));
    }

    @Test
    void createShouldRejectWhenNoStockToHold() {
        ReservationService service = service(true);
        User user = user();
        Book book = book(0);
        when(userRepository.findById(user.id())).thenReturn(Optional.of(user));
        when(bookRepository.findById(book.id())).thenReturn(Optional.of(book));

        assertThrows(
                BusinessException.class,
                () -> service.create(new ReservationRequest(user.id(), book.id(), null)));

        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    void cancelShouldReleaseHeldStock() {
        ReservationService service = service(true);
        Reservation reservation = reservation(ReservationStatus.ACTIVE, LocalDate.now().plusDays(2));
        Book book = book(1);
        when(reservationRepository.findById(reservation.id())).thenReturn(Optional.of(reservation));
        when(bookRepository.findById(book.id())).thenReturn(Optional.of(book));
        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        assertEquals(ReservationStatus.CANCELLED, service.cancel(reservation.id()).status());

        verify(bookRepository).save(book.withStock(2));
    }

    @Test
    void convertToLoanShouldCreateLoanAndFulfillReservation() {
        ReservationService service = service(true);
        Reservation reservation = reservation(ReservationStatus.ACTIVE, LocalDate.now().plusDays(2));
        when(reservationRepository.findById(reservation.id())).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.convertToLoan(reservation.id());

        verify(loanService).createFromReservation(reservation.userId(), reservation.bookId(), true);
        ArgumentCaptor<Reservation> captor = ArgumentCaptor.forClass(Reservation.class);
        verify(reservationRepository).save(captor.capture());
        assertEquals(ReservationStatus.FULFILLED, captor.getValue().status());
    }

    @Test
    void convertToLoanShouldRejectExpiredReservation() {
        ReservationService service = service(true);
        Reservation reservation = reservation(ReservationStatus.ACTIVE, LocalDate.now().minusDays(1));
        when(reservationRepository.findById(reservation.id())).thenReturn(Optional.of(reservation));

        assertThrows(BusinessException.class, () -> service.convertToLoan(reservation.id()));

        verify(loanService, never()).createFromReservation(any(), any(), anyBoolean());
    }

    @Test
    void convertToLoanShouldRejectCancelledReservation() {
        ReservationService service = service(true);
        Reservation reservation = reservation(ReservationStatus.CANCELLED, LocalDate.now().plusDays(2));
        when(reservationRepository.findById(reservation.id())).thenReturn(Optional.of(reservation));

        assertThrows(BusinessException.class, () -> service.convertToLoan(reservation.id()));
    }

    @Test
    void expireOverdueShouldMarkExpiredAndReleaseStock() {
        ReservationService service = service(true);
        LocalDate reference = LocalDate.now();
        Reservation reservation = reservation(ReservationStatus.ACTIVE, reference.minusDays(1));
        Book book = book(0);
        when(reservationRepository.findActiveExpired(reference)).thenReturn(List.of(reservation));
        when(bookRepository.findById(book.id())).thenReturn(Optional.of(book));
        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        assertEquals(1, service.expireOverdue(reference));

        verify(bookRepository).save(book.withStock(1));
        ArgumentCaptor<Reservation> captor = ArgumentCaptor.forClass(Reservation.class);
        verify(reservationRepository).save(captor.capture());
        assertEquals(ReservationStatus.EXPIRED, captor.getValue().status());
    }

    @Test
    void createShouldUseConfiguredDefaultExpiration() {
        ReservationService service = service(false);
        User user = user();
        Book book = book(3);
        when(userRepository.findById(user.id())).thenReturn(Optional.of(user));
        when(bookRepository.findById(book.id())).thenReturn(Optional.of(book));
        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(new ReservationRequest(user.id(), book.id(), null));

        assertEquals(LocalDate.now().plusDays(EXPIRATION_DAYS), response.expirationDate());
    }

    @Test
    void convertToLoanShouldNotWithdrawStockTwiceWhenHoldDisabled() {
        ReservationService service = service(false);
        Reservation reservation = reservation(ReservationStatus.ACTIVE, LocalDate.now().plusDays(2));
        when(reservationRepository.findById(reservation.id())).thenReturn(Optional.of(reservation));
        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.convertToLoan(reservation.id());

        verify(loanService).createFromReservation(
                eq(reservation.userId()), eq(reservation.bookId()), eq(false));
    }

    private ReservationService service(boolean holdStock) {
        BusinessProperties properties = new BusinessProperties(
                new BusinessProperties.Loan(14, 5, 5, true, 2, 7),
                new BusinessProperties.Fine(new BigDecimal("2.00")),
                new BusinessProperties.Reservation(EXPIRATION_DAYS, holdStock));
        return new ReservationService(
                reservationRepository,
                userRepository,
                bookRepository,
                loanService,
                new StockPolicy(bookRepository),
                properties);
    }

    private User user() {
        return new User(1L, "Reader", "reader@example.com", UserRole.READER, null);
    }

    private Book book(Integer stock) {
        return new Book(10L, "Book", "Author", "isbn", "Genre", 2024,
                BookFormat.PHYSICAL, new BigDecimal("10.00"), stock, List.of(), null);
    }

    private Reservation reservation(ReservationStatus status, LocalDate expiration) {
        return new Reservation(40L, 1L, "Reader", 10L, "Book",
                expiration.minusDays(EXPIRATION_DAYS), expiration, status, null);
    }
}
