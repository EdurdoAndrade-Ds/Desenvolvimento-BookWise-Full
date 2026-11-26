package com.bookwise.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bookwise.application.dto.LoanItemRequest;
import com.bookwise.application.dto.LoanRequest;
import com.bookwise.application.dto.LoanResponse;
import com.bookwise.application.policy.FinePolicy;
import com.bookwise.application.policy.StockPolicy;
import com.bookwise.config.BusinessProperties;
import com.bookwise.domain.exception.BookNotFoundException;
import com.bookwise.domain.exception.BusinessException;
import com.bookwise.domain.exception.UserNotFoundException;
import com.bookwise.domain.model.Book;
import com.bookwise.domain.model.BookFormat;
import com.bookwise.domain.model.Fine;
import com.bookwise.domain.model.FinePaymentStatus;
import com.bookwise.domain.model.Loan;
import com.bookwise.domain.model.LoanItem;
import com.bookwise.domain.model.LoanChargeStatus;
import com.bookwise.domain.exception.LoanNotFoundException;
import com.bookwise.domain.model.User;
import com.bookwise.domain.model.UserRole;
import com.bookwise.domain.port.BookRepository;
import com.bookwise.domain.port.FineRepository;
import com.bookwise.domain.port.LoanRepository;
import com.bookwise.domain.port.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    private static final int DEFAULT_DAYS = 14;
    private static final int MAX_ACTIVE_PER_USER = 5;
    private static final int MAX_ITEMS_PER_LOAN = 5;
    private static final int MAX_RENEWALS = 2;
    private static final int RENEWAL_DAYS = 7;

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private FineRepository fineRepository;

    private LoanService service;

    @BeforeEach
    void setUp() {
        BusinessProperties properties = properties(MAX_RENEWALS);
        service = new LoanService(
                loanRepository,
                userRepository,
                bookRepository,
                new StockPolicy(bookRepository),
                new FinePolicy(fineRepository, properties),
                properties);
    }

    @Test
    void createShouldDecreasePhysicalBookStock() {
        User user = user();
        Book book = book(BookFormat.PHYSICAL, 3);
        when(userRepository.findById(user.id())).thenReturn(Optional.of(user));
        when(bookRepository.findById(book.id())).thenReturn(Optional.of(book));
        when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.create(request(null, book.id(), 2));

        verify(bookRepository).save(book.withStock(1));
    }

    @Test
    void createShouldNotDecreaseDigitalBookStock() {
        User user = user();
        Book book = book(BookFormat.DIGITAL, 3);
        when(userRepository.findById(user.id())).thenReturn(Optional.of(user));
        when(bookRepository.findById(book.id())).thenReturn(Optional.of(book));
        when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.create(request(null, book.id(), 2));

        verify(bookRepository, never()).save(any(Book.class));
    }

    @Test
    void createShouldRejectInsufficientStock() {
        User user = user();
        Book book = book(BookFormat.PHYSICAL, 1);
        when(userRepository.findById(user.id())).thenReturn(Optional.of(user));
        when(bookRepository.findById(book.id())).thenReturn(Optional.of(book));

        assertThrows(BusinessException.class, () -> service.create(request(null, book.id(), 2)));
    }

    @Test
    void createShouldRejectUnknownUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> service.create(request(null, 10L, 1)));

        verify(bookRepository, never()).findById(any());
    }

    @Test
    void createShouldRejectUnknownBook() {
        User user = user();
        when(userRepository.findById(user.id())).thenReturn(Optional.of(user));
        when(bookRepository.findById(10L)).thenReturn(Optional.empty());

        assertThrows(BookNotFoundException.class, () -> service.create(request(null, 10L, 1)));
    }

    @Test
    void createShouldUseDefaultDueDateWhenNotProvided() {
        User user = user();
        Book book = book(BookFormat.DIGITAL, 0);
        when(userRepository.findById(user.id())).thenReturn(Optional.of(user));
        when(bookRepository.findById(book.id())).thenReturn(Optional.of(book));
        when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LoanResponse response = service.create(request(null, book.id(), 1));

        assertEquals(LocalDate.now().plusDays(DEFAULT_DAYS), response.dueDate());
    }

    @Test
    void createShouldRejectMoreItemsThanAllowedPerLoan() {
        User user = user();
        when(userRepository.findById(user.id())).thenReturn(Optional.of(user));

        assertThrows(
                BusinessException.class,
                () -> service.create(request(null, 10L, MAX_ITEMS_PER_LOAN + 1)));

        verify(bookRepository, never()).findById(any());
    }

    @Test
    void createShouldRejectWhenUserReachedMaxActiveLoans() {
        User user = user();
        when(userRepository.findById(user.id())).thenReturn(Optional.of(user));
        when(loanRepository.countOpenByUserId(user.id())).thenReturn((long) MAX_ACTIVE_PER_USER);

        assertThrows(BusinessException.class, () -> service.create(request(null, 10L, 1)));

        verify(loanRepository, never()).save(any(Loan.class));
    }

    @Test
    void createShouldRejectWhenUserHasPendingFine() {
        User user = user();
        when(userRepository.findById(user.id())).thenReturn(Optional.of(user));
        when(fineRepository.existsPendingByUserId(user.id())).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.create(request(null, 10L, 1)));

        verify(loanRepository, never()).save(any(Loan.class));
    }

    @Test
    void renewShouldExtendDueDateAndIncrementCounter() {
        LocalDate dueDate = LocalDate.now().plusDays(3);
        Loan loan = loan(dueDate, null);
        when(loanRepository.findById(loan.id())).thenReturn(Optional.of(loan));
        when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LoanResponse response = service.renew(loan.id());

        assertEquals(dueDate.plusDays(RENEWAL_DAYS), response.dueDate());
        assertEquals(1, response.renewalCount());
    }

    @Test
    void renewShouldRejectWhenMaxRenewalsReached() {
        Loan loan = new Loan(20L, 1L, "Reader", List.of(new LoanItem(10L, "Book", 1, BigDecimal.ZERO)),
                LocalDate.now(), LocalDate.now().plusDays(3), null, MAX_RENEWALS, BigDecimal.ZERO, null, null, null);
        when(loanRepository.findById(loan.id())).thenReturn(Optional.of(loan));

        assertThrows(BusinessException.class, () -> service.renew(loan.id()));
    }

    @Test
    void renewShouldRejectOverdueLoan() {
        Loan loan = loan(LocalDate.now().minusDays(1), null);
        when(loanRepository.findById(loan.id())).thenReturn(Optional.of(loan));

        assertThrows(BusinessException.class, () -> service.renew(loan.id()));
    }

    @Test
    void renewShouldRejectWhenRenewalIsDisabled() {
        BusinessProperties disabled = properties(0);
        LoanService noRenewal = new LoanService(
                loanRepository,
                userRepository,
                bookRepository,
                new StockPolicy(bookRepository),
                new FinePolicy(fineRepository, disabled),
                disabled);
        Loan loan = loan(LocalDate.now().plusDays(3), null);
        when(loanRepository.findById(loan.id())).thenReturn(Optional.of(loan));

        assertThrows(BusinessException.class, () -> noRenewal.renew(loan.id()));
    }

    @Test
    void returnLoanShouldRestoreStockAndCreatePendingFineForLateReturn() {
        LocalDate dueDate = LocalDate.now().minusDays(2);
        Loan loan = loan(dueDate, null);
        Book book = book(BookFormat.PHYSICAL, 1);
        when(loanRepository.findById(loan.id())).thenReturn(Optional.of(loan));
        when(bookRepository.findById(book.id())).thenReturn(Optional.of(book));
        when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(fineRepository.save(any(Fine.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.returnLoan(loan.id());

        verify(bookRepository).save(book.withStock(3));
        ArgumentCaptor<Fine> fineCaptor = ArgumentCaptor.forClass(Fine.class);
        verify(fineRepository).save(fineCaptor.capture());
        Fine fine = fineCaptor.getValue();
        assertEquals(new BigDecimal("4.00"), fine.value());
        assertEquals(2, fine.daysLate());
        assertEquals(FinePaymentStatus.PENDING, fine.paymentStatus());
    }

    @Test
    void returnLoanShouldNotCreateFineWhenReturnedOnTime() {
        Loan loan = loan(LocalDate.now().plusDays(2), null);
        when(loanRepository.findById(loan.id())).thenReturn(Optional.of(loan));
        when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.returnLoan(loan.id());

        verify(fineRepository, never()).save(any(Fine.class));
    }

    @Test
    void returnLoanShouldNotDuplicateExistingFine() {
        Loan loan = loan(LocalDate.now().minusDays(1), null);
        when(loanRepository.findById(loan.id())).thenReturn(Optional.of(loan));
        when(fineRepository.findByLoanId(loan.id())).thenReturn(Optional.of(pendingFine(1)));
        when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.returnLoan(loan.id());

        verify(fineRepository, never()).save(any(Fine.class));
    }

    @Test
    void returnLoanShouldRejectAlreadyReturnedLoan() {
        Loan loan = loan(LocalDate.now().minusDays(1), LocalDate.now().minusDays(1));
        when(loanRepository.findById(loan.id())).thenReturn(Optional.of(loan));

        assertThrows(BusinessException.class, () -> service.returnLoan(loan.id()));
    }

    @Test
    void chargeOverdueLoansShouldCreateFineForOpenLoanStillNotReturned() {
        LocalDate reference = LocalDate.now();
        Loan loan = loan(reference.minusDays(3), null);
        when(loanRepository.findOpenOverdue(reference)).thenReturn(List.of(loan));
        when(fineRepository.save(any(Fine.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertEquals(1, service.chargeOverdueLoans(reference));

        ArgumentCaptor<Fine> fineCaptor = ArgumentCaptor.forClass(Fine.class);
        verify(fineRepository).save(fineCaptor.capture());
        assertEquals(new BigDecimal("6.00"), fineCaptor.getValue().value());
        assertEquals(3, fineCaptor.getValue().daysLate());
    }

    @Test
    void chargeOverdueLoansShouldUpdatePendingFineWhenDelayIncreases() {
        LocalDate reference = LocalDate.now();
        Loan loan = loan(reference.minusDays(4), null);
        when(loanRepository.findOpenOverdue(reference)).thenReturn(List.of(loan));
        when(fineRepository.findByLoanId(loan.id())).thenReturn(Optional.of(pendingFine(2)));
        when(fineRepository.save(any(Fine.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.chargeOverdueLoans(reference);

        ArgumentCaptor<Fine> fineCaptor = ArgumentCaptor.forClass(Fine.class);
        verify(fineRepository).save(fineCaptor.capture());
        assertEquals(new BigDecimal("8.00"), fineCaptor.getValue().value());
        assertEquals(4, fineCaptor.getValue().daysLate());
    }

    @Test
    void chargeOverdueLoansShouldKeepPaidFineUntouched() {
        LocalDate reference = LocalDate.now();
        Loan loan = loan(reference.minusDays(6), null);
        Fine paid = new Fine(30L, loan.id(), "Reader", new BigDecimal("4.00"), 2,
                FinePaymentStatus.PAID, reference, null);
        when(loanRepository.findOpenOverdue(reference)).thenReturn(List.of(loan));
        when(fineRepository.findByLoanId(loan.id())).thenReturn(Optional.of(paid));

        service.chargeOverdueLoans(reference);

        verify(fineRepository, never()).save(any(Fine.class));
    }

    private BusinessProperties properties(int maxRenewals) {
        return properties(maxRenewals, true);
    }

    private BusinessProperties properties(int maxRenewals, boolean blockOnPendingCharges) {
        return new BusinessProperties(
                new BusinessProperties.Loan(
                        DEFAULT_DAYS, MAX_ACTIVE_PER_USER, MAX_ITEMS_PER_LOAN, true, maxRenewals, RENEWAL_DAYS, blockOnPendingCharges),
                new BusinessProperties.Fine(new BigDecimal("2.00")),
                new BusinessProperties.Reservation(7, true),
                new BusinessProperties.Report(3, 7, 5));
    }

    private LoanRequest request(LocalDate dueDate, Long bookId, int quantity) {
        return new LoanRequest(1L, dueDate, List.of(new LoanItemRequest(bookId, quantity)));
    }

    private User user() {
        return new User(1L, "Reader", "reader@example.com", UserRole.READER, null);
    }

    private Book book(BookFormat format, Integer stock) {
        return new Book(10L, "Book", "Author", "isbn", "Genre", 2024,
                format, new BigDecimal("10.00"), null, stock, null, List.of(), null);
    }

    private Loan loan(LocalDate dueDate, LocalDate returnDate) {
        return new Loan(20L, 1L, "Reader",
                List.of(new LoanItem(10L, "Book", 2, BigDecimal.ZERO)),
                dueDate.minusDays(DEFAULT_DAYS), dueDate, returnDate, 0, BigDecimal.ZERO, null, null, null);
    }

    private Fine pendingFine(int daysLate) {
        return new Fine(30L, 20L, "Reader",
                new BigDecimal("2.00").multiply(BigDecimal.valueOf(daysLate)), daysLate,
                FinePaymentStatus.PENDING, null, null);
    }

    private Book pricedBook(BigDecimal loanPrice) {
        return new Book(10L, "Book", "Author", "isbn", "Genre", 2024,
                BookFormat.DIGITAL, new BigDecimal("10.00"), loanPrice, null, null, List.of(), null);
    }

    @Test
    void createSnapshotsLoanPriceAndTotalQuantity() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user()));
        when(bookRepository.findById(10L)).thenReturn(Optional.of(pricedBook(new BigDecimal("7.90"))));
        when(loanRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        LoanResponse response = service.create(request(null, 10L, 3));

        assertEquals(new BigDecimal("23.70"), response.chargeAmount());
        assertEquals(new BigDecimal("7.90"), response.items().get(0).unitLoanPrice());
        assertEquals(LoanChargeStatus.PENDING, response.chargeStatus());
        assertEquals(null, response.chargePaymentDate());
    }

    @Test
    void reservationConversionCreatesCharge() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user()));
        when(bookRepository.findById(10L)).thenReturn(Optional.of(pricedBook(new BigDecimal("4.90"))));
        when(loanRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        LoanResponse response = service.createFromReservation(1L, 10L, true);

        assertEquals(new BigDecimal("4.90"), response.chargeAmount());
        assertEquals(LoanChargeStatus.PENDING, response.chargeStatus());
        verify(bookRepository, never()).save(any());
    }

    @Test
    void nullAndZeroPricesDoNotCreateCharge() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user()));
        when(bookRepository.findById(10L)).thenReturn(Optional.of(pricedBook(null)), Optional.of(pricedBook(BigDecimal.ZERO)));
        when(loanRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        for (int i = 0; i < 2; i++) {
            LoanResponse response = service.create(request(null, 10L, 1));
            assertEquals(0, response.chargeAmount().signum());
            assertEquals(null, response.chargeStatus());
            assertEquals(null, response.chargePaymentDate());
        }
    }

    @Test
    void payMarksChargePaidAndRejectsSecondPayment() {
        Loan pending = new Loan(20L, 1L, "Reader", List.of(), LocalDate.now(), LocalDate.now().plusDays(14),
                null, 0, new BigDecimal("7.90"), LoanChargeStatus.PENDING, null, null);
        when(loanRepository.findById(20L)).thenReturn(Optional.of(pending), Optional.of(pending.withChargePaid(LocalDate.now())));
        when(loanRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        LoanResponse paid = service.pay(20L);

        assertEquals(LoanChargeStatus.PAID, paid.chargeStatus());
        assertEquals(LocalDate.now(), paid.chargePaymentDate());
        assertEquals(pending.chargeAmount(), paid.chargeAmount());
        assertThrows(BusinessException.class, () -> service.pay(20L));
    }

    @Test
    void payRejectsFreeAndMissingLoans() {
        when(loanRepository.findById(20L)).thenReturn(Optional.of(loan(LocalDate.now(), null)));
        assertThrows(BusinessException.class, () -> service.pay(20L));
        assertThrows(LoanNotFoundException.class, () -> service.pay(999L));
        verify(loanRepository, never()).save(any());
    }

    @Test
    void pendingChargeBlocksBothCreationPaths() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user()));
        when(loanRepository.existsPendingChargeByUserId(1L)).thenReturn(true);
        assertThrows(BusinessException.class, () -> service.create(request(null, 10L, 1)));
        assertThrows(BusinessException.class, () -> service.createFromReservation(1L, 10L, true));
        verify(loanRepository, never()).save(any());
        verify(bookRepository, never()).save(any());
    }

    @Test
    void disabledPendingChargeBlockingAllowsCreation() {
        BusinessProperties config = properties(MAX_RENEWALS, false);
        service = new LoanService(loanRepository, userRepository, bookRepository,
                new StockPolicy(bookRepository), new FinePolicy(fineRepository, config), config);
        org.mockito.Mockito.lenient().when(loanRepository.existsPendingChargeByUserId(1L)).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user()));
        when(bookRepository.findById(10L)).thenReturn(Optional.of(pricedBook(new BigDecimal("7.90"))));
        when(loanRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        assertEquals(LoanChargeStatus.PENDING, service.create(request(null, 10L, 1)).chargeStatus());
        verify(loanRepository, never()).existsPendingChargeByUserId(any());
    }

    @Test
    void mixedBooksAreSummedAndCopiesPreserveCharge() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user()));
        Book first = pricedBook(new BigDecimal("4.90"));
        Book second = new Book(11L, "Second", "Author", "second", null, null, BookFormat.DIGITAL,
                BigDecimal.TEN, new BigDecimal("12.90"), null, null, List.of(), null);
        when(bookRepository.findById(10L)).thenReturn(Optional.of(first));
        when(bookRepository.findById(11L)).thenReturn(Optional.of(second));
        when(loanRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        service.create(new LoanRequest(1L, null, List.of(
                new LoanItemRequest(10L, 2), new LoanItemRequest(11L, 1))));
        ArgumentCaptor<Loan> captor = ArgumentCaptor.forClass(Loan.class);
        verify(loanRepository).save(captor.capture());
        Loan saved = captor.getValue();
        assertEquals(new BigDecimal("22.70"), saved.chargeAmount());
        assertEquals(saved.chargeAmount(), saved.withReturnDate(LocalDate.now()).chargeAmount());
        assertEquals(saved.chargeStatus(), saved.renewedUntil(LocalDate.now().plusDays(21)).chargeStatus());
        assertEquals(first.loanPrice(), first.withStock(3).loanPrice());
        assertEquals(first.loanPrice(), first.withCategories(List.of()).loanPrice());
    }
}
