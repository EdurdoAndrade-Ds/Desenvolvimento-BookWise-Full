package com.bookwise.application.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bookwise.application.dto.SaleItemRequest;
import com.bookwise.application.dto.SaleRequest;
import com.bookwise.application.policy.StockPolicy;
import com.bookwise.domain.exception.BusinessException;
import com.bookwise.domain.model.Book;
import com.bookwise.domain.model.BookFormat;
import com.bookwise.domain.model.Sale;
import com.bookwise.domain.model.SaleItem;
import com.bookwise.domain.model.SaleStatus;
import com.bookwise.domain.model.User;
import com.bookwise.domain.model.UserRole;
import com.bookwise.domain.port.BookRepository;
import com.bookwise.domain.port.SaleRepository;
import com.bookwise.domain.port.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookRepository bookRepository;

    private SaleService service;

    @BeforeEach
    void setUp() {
        service = new SaleService(
                saleRepository, userRepository, bookRepository, new StockPolicy(bookRepository));
    }

    @Test
    void createShouldDecreasePhysicalBookStock() {
        Book book = book(3);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user()));
        when(bookRepository.findById(book.id())).thenReturn(Optional.of(book));
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.create(request(book.id(), 2));

        verify(bookRepository).save(book.withStock(1));
    }

    @Test
    void cancelShouldRestorePhysicalBookStock() {
        Book book = book(1);
        Sale sale = sale(book.id(), 2);
        when(saleRepository.findById(sale.id())).thenReturn(Optional.of(sale));
        when(bookRepository.findById(book.id())).thenReturn(Optional.of(book));
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.cancel(sale.id());

        verify(bookRepository).save(book.withStock(3));
    }

    @Test
    void createShouldRejectInsufficientStock() {
        Book book = book(1);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user()));
        when(bookRepository.findById(book.id())).thenReturn(Optional.of(book));

        assertThrows(BusinessException.class, () -> service.create(request(book.id(), 2)));
        verify(saleRepository, never()).save(any(Sale.class));
    }

    private SaleRequest request(Long bookId, int quantity) {
        return new SaleRequest(1L, "CARD", List.of(new SaleItemRequest(bookId, quantity, null)));
    }

    private User user() {
        return new User(1L, "Reader", "reader@example.com", UserRole.READER, null);
    }

    private Book book(Integer stock) {
        return new Book(10L, "Book", "Author", "isbn", "Genre", 2024,
                BookFormat.PHYSICAL, new BigDecimal("10.00"), stock, null, List.of(), null);
    }

    private Sale sale(Long bookId, int quantity) {
        return new Sale(30L, 1L, "Reader",
                List.of(new SaleItem(bookId, "Book", quantity, new BigDecimal("10.00"))),
                "CARD", null, new BigDecimal("20.00"), SaleStatus.PAID, null);
    }
}
