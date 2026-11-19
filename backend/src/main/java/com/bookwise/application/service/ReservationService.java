package com.bookwise.application.service;

import com.bookwise.application.dto.LoanResponse;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.dto.ReservationRequest;
import com.bookwise.application.dto.ReservationResponse;
import com.bookwise.application.mapper.ReservationMapper;
import com.bookwise.application.policy.StockPolicy;
import com.bookwise.config.BusinessProperties;
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
 * Casos de uso de reservas: criacao (com bloqueio opcional de estoque),
 * cancelamento, expiracao e conversao da reserva em emprestimo.
 */
@Service
@Transactional
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final LoanService loanService;
    private final StockPolicy stockPolicy;
    private final BusinessProperties properties;

    public ReservationService(
            ReservationRepository reservationRepository,
            UserRepository userRepository,
            BookRepository bookRepository,
            LoanService loanService,
            StockPolicy stockPolicy,
            BusinessProperties properties) {
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.loanService = loanService;
        this.stockPolicy = stockPolicy;
        this.properties = properties;
    }

    /**
     * Lista uma pagina de reservas, opcionalmente filtrando por usuario.
     *
     * @param page   indice da pagina (base zero)
     * @param size   tamanho da pagina
     * @param userId id do usuario para filtrar, ou {@code null} para todas
     * @return pagina de reservas com o status derivado na data atual
     */
    @Transactional(readOnly = true)
    public PageResponse<ReservationResponse> list(int page, int size, Long userId) {
        var result = userId == null
                ? reservationRepository.findAll(page, size)
                : reservationRepository.findAllByUserId(userId, page, size);
        return ReservationMapper.toPageResponse(result, LocalDate.now());
    }

    /**
     * Busca uma reserva pelo identificador.
     *
     * @param id identificador da reserva
     * @return a reserva encontrada
     * @throws ReservationNotFoundException se nao existir reserva com o id informado
     */
    @Transactional(readOnly = true)
    public ReservationResponse getById(Long id) {
        return reservationRepository.findById(id)
                .map(r -> ReservationMapper.toResponse(r, LocalDate.now()))
                .orElseThrow(() -> new ReservationNotFoundException(id));
    }

    /**
     * Cria uma nova reserva ativa. Quando
     * {@code bookwise.reservation.hold-stock} estiver habilitado, uma unidade do
     * livro fisico e bloqueada no estoque ate a conversao, o cancelamento ou a
     * expiracao da reserva.
     *
     * @param request dados da reserva (usuario e livro)
     * @return a reserva criada
     * @throws UserNotFoundException se o usuario nao existir
     * @throws BookNotFoundException se o livro nao existir
     * @throws BusinessException     se o bloqueio estiver habilitado e nao houver estoque
     */
    public ReservationResponse create(ReservationRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new UserNotFoundException(request.userId()));
        Book book = bookRepository.findById(request.bookId())
                .orElseThrow(() -> new BookNotFoundException(request.bookId()));

        if (properties.reservation().holdStock()) {
            stockPolicy.withdraw(book, 1);
        }

        LocalDate today = LocalDate.now();
        LocalDate expiration = request.expirationDate() != null
                ? request.expirationDate()
                : today.plusDays(properties.reservation().defaultExpirationDays());

        Reservation reservation = new Reservation(
                null, user.id(), user.name(), book.id(), book.title(),
                today, expiration, ReservationStatus.ACTIVE, null);
        return ReservationMapper.toResponse(reservationRepository.save(reservation), today);
    }

    /**
     * Cancela uma reserva existente, liberando o estoque bloqueado.
     *
     * @param id identificador da reserva
     * @return a reserva com status CANCELLED
     * @throws ReservationNotFoundException se a reserva nao existir
     * @throws BusinessException            se a reserva nao estiver ativa
     */
    public ReservationResponse cancel(Long id) {
        Reservation reservation = findActive(id, "Reserva ja cancelada");
        releaseHeldStock(reservation);
        Reservation cancelled = reservation.withStatus(ReservationStatus.CANCELLED);
        return ReservationMapper.toResponse(reservationRepository.save(cancelled), LocalDate.now());
    }

    /**
     * Converte uma reserva ativa em emprestimo: registra o emprestimo do livro
     * reservado (aproveitando a unidade bloqueada, quando houver) e marca a
     * reserva como FULFILLED.
     *
     * @param id identificador da reserva
     * @return o emprestimo gerado
     * @throws ReservationNotFoundException se a reserva nao existir
     * @throws BusinessException            se a reserva nao estiver ativa ou estiver expirada
     */
    public LoanResponse convertToLoan(Long id) {
        Reservation reservation = findActive(id, "Reserva nao esta ativa");
        LocalDate today = LocalDate.now();
        if (reservation.statusAt(today) == ReservationStatus.EXPIRED) {
            throw new BusinessException("Reserva expirada nao pode ser convertida em emprestimo");
        }

        LoanResponse loan = loanService.createFromReservation(
                reservation.userId(), reservation.bookId(), properties.reservation().holdStock());
        reservationRepository.save(reservation.withStatus(ReservationStatus.FULFILLED));
        return loan;
    }

    /**
     * Marca como EXPIRED as reservas ativas cujo prazo terminou e devolve ao
     * estoque as unidades bloqueadas. Executado pelo job de expiracao.
     *
     * @param reference data de apuracao
     * @return quantidade de reservas expiradas
     */
    public int expireOverdue(LocalDate reference) {
        int expired = 0;
        for (Reservation reservation : reservationRepository.findActiveExpired(reference)) {
            releaseHeldStock(reservation);
            reservationRepository.save(reservation.withStatus(ReservationStatus.EXPIRED));
            expired++;
        }
        return expired;
    }

    private Reservation findActive(Long id, String notActiveMessage) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ReservationNotFoundException(id));
        if (reservation.status() != ReservationStatus.ACTIVE) {
            throw new BusinessException(notActiveMessage);
        }
        return reservation;
    }

    private void releaseHeldStock(Reservation reservation) {
        if (properties.reservation().holdStock()) {
            stockPolicy.restore(reservation.bookId(), 1);
        }
    }
}
