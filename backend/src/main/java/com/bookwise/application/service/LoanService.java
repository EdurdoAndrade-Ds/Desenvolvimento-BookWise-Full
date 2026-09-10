package com.bookwise.application.service;

import com.bookwise.application.dto.LoanRequest;
import com.bookwise.application.dto.LoanResponse;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.mapper.LoanMapper;
import com.bookwise.domain.exception.BookNotFoundException;
import com.bookwise.domain.exception.BusinessException;
import com.bookwise.domain.exception.LoanNotFoundException;
import com.bookwise.domain.exception.UserNotFoundException;
import com.bookwise.domain.model.Book;
import com.bookwise.domain.model.BookFormat;
import com.bookwise.domain.model.Fine;
import com.bookwise.domain.model.FinePaymentStatus;
import com.bookwise.domain.model.Loan;
import com.bookwise.domain.model.LoanItem;
import com.bookwise.domain.model.User;
import com.bookwise.domain.port.BookRepository;
import com.bookwise.domain.port.FineRepository;
import com.bookwise.domain.port.LoanRepository;
import com.bookwise.domain.port.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso de emprestimos. Aplica as regras: valida usuario/livros,
 * baixa o estoque ao emprestar e o restaura na devolucao.
 */
@Service
@Transactional
public class LoanService {

    private static final int DEFAULT_LOAN_DAYS = 14;
    private static final BigDecimal FINE_PER_DAY = new BigDecimal("2.00");

    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final FineRepository fineRepository;

    public LoanService(
            LoanRepository loanRepository,
            UserRepository userRepository,
            BookRepository bookRepository,
            FineRepository fineRepository) {
        this.loanRepository = loanRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.fineRepository = fineRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<LoanResponse> list(int page, int size, Long userId) {
        var result = userId == null
                ? loanRepository.findAll(page, size)
                : loanRepository.findAllByUserId(userId, page, size);
        return LoanMapper.toPageResponse(result, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public LoanResponse getById(Long id) {
        return loanRepository.findById(id)
                .map(loan -> LoanMapper.toResponse(loan, LocalDate.now()))
                .orElseThrow(() -> new LoanNotFoundException(id));
    }

    public LoanResponse create(LoanRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new UserNotFoundException(request.userId()));

        List<LoanItem> items = new ArrayList<>();
        for (var itemReq : request.items()) {
            int quantity = itemReq.quantityOrDefault();
            Book book = bookRepository.findById(itemReq.bookId())
                    .orElseThrow(() -> new BookNotFoundException(itemReq.bookId()));

            if (book.format() == BookFormat.PHYSICAL) {
                int available = book.stock() == null ? 0 : book.stock();
                if (available < quantity) {
                    throw new BusinessException(
                            "Estoque insuficiente para o livro '" + book.title() + "' (disponivel: " + available + ")");
                }
                bookRepository.save(book.withStock(available - quantity));
            }
            items.add(new LoanItem(book.id(), book.title(), quantity));
        }

        LocalDate today = LocalDate.now();
        LocalDate dueDate = request.dueDate() != null ? request.dueDate() : today.plusDays(DEFAULT_LOAN_DAYS);

        Loan loan = new Loan(null, user.id(), user.name(), items, today, dueDate, null, null);
        Loan saved = loanRepository.save(loan);
        return LoanMapper.toResponse(saved, today);
    }

    public LoanResponse returnLoan(Long id) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new LoanNotFoundException(id));

        if (loan.returnDate() != null) {
            throw new BusinessException("Emprestimo ja devolvido");
        }

        // Restaura o estoque dos livros fisicos.
        for (LoanItem item : loan.items()) {
            bookRepository.findById(item.bookId()).ifPresent(book -> {
                if (book.format() == BookFormat.PHYSICAL) {
                    int current = book.stock() == null ? 0 : book.stock();
                    bookRepository.save(book.withStock(current + item.quantity()));
                }
            });
        }

        LocalDate today = LocalDate.now();
        Loan returned = new Loan(
                loan.id(), loan.userId(), loan.userName(), loan.items(),
                loan.loanDate(), loan.dueDate(), today, loan.createdAt());
        Loan saved = loanRepository.save(returned);

        generateFineIfLate(saved, today);

        return LoanMapper.toResponse(saved, today);
    }

    /** Gera multa (1:1) quando a devolucao ocorre apos a data prevista. */
    private void generateFineIfLate(Loan loan, LocalDate returnDate) {
        if (loan.dueDate() == null || !returnDate.isAfter(loan.dueDate())) {
            return;
        }
        if (fineRepository.existsByLoanId(loan.id())) {
            return;
        }
        long daysLate = ChronoUnit.DAYS.between(loan.dueDate(), returnDate);
        BigDecimal value = FINE_PER_DAY.multiply(BigDecimal.valueOf(daysLate));
        fineRepository.save(new Fine(
                null, loan.id(), loan.userName(), value, (int) daysLate,
                FinePaymentStatus.PENDING, null, null));
    }
}
