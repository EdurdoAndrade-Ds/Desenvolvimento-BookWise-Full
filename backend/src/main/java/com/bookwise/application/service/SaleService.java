package com.bookwise.application.service;

import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.dto.SaleRequest;
import com.bookwise.application.dto.SaleResponse;
import com.bookwise.application.mapper.SaleMapper;
import com.bookwise.domain.exception.BookNotFoundException;
import com.bookwise.domain.exception.BusinessException;
import com.bookwise.domain.exception.SaleNotFoundException;
import com.bookwise.domain.exception.UserNotFoundException;
import com.bookwise.domain.model.Book;
import com.bookwise.domain.model.BookFormat;
import com.bookwise.domain.model.Sale;
import com.bookwise.domain.model.SaleItem;
import com.bookwise.domain.model.SaleStatus;
import com.bookwise.domain.model.User;
import com.bookwise.domain.port.BookRepository;
import com.bookwise.domain.port.SaleRepository;
import com.bookwise.domain.port.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso de vendas. Valida usuario/livros, baixa o estoque na venda,
 * calcula o total e restaura o estoque no cancelamento.
 */
@Service
@Transactional
public class SaleService {

    private final SaleRepository saleRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    public SaleService(
            SaleRepository saleRepository, UserRepository userRepository, BookRepository bookRepository) {
        this.saleRepository = saleRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<SaleResponse> list(int page, int size, Long userId) {
        var result = userId == null
                ? saleRepository.findAll(page, size)
                : saleRepository.findAllByUserId(userId, page, size);
        return SaleMapper.toPageResponse(result);
    }

    @Transactional(readOnly = true)
    public SaleResponse getById(Long id) {
        return saleRepository.findById(id)
                .map(SaleMapper::toResponse)
                .orElseThrow(() -> new SaleNotFoundException(id));
    }

    public SaleResponse create(SaleRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new UserNotFoundException(request.userId()));

        List<SaleItem> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

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

            BigDecimal unitPrice = itemReq.unitPrice() != null
                    ? itemReq.unitPrice()
                    : (book.price() != null ? book.price() : BigDecimal.ZERO);
            SaleItem item = new SaleItem(book.id(), book.title(), quantity, unitPrice);
            items.add(item);
            total = total.add(item.subtotal());
        }

        Sale sale = new Sale(
                null, user.id(), user.name(), items, request.paymentMethod(),
                LocalDate.now(), total, SaleStatus.PAID, null);
        return SaleMapper.toResponse(saleRepository.save(sale));
    }

    public SaleResponse cancel(Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new SaleNotFoundException(id));

        if (sale.status() == SaleStatus.CANCELLED) {
            throw new BusinessException("Venda ja cancelada");
        }

        // Restaura o estoque dos livros fisicos.
        for (SaleItem item : sale.items()) {
            bookRepository.findById(item.bookId()).ifPresent(book -> {
                if (book.format() == BookFormat.PHYSICAL) {
                    int current = book.stock() == null ? 0 : book.stock();
                    bookRepository.save(book.withStock(current + item.quantity()));
                }
            });
        }

        return SaleMapper.toResponse(saleRepository.save(sale.withStatus(SaleStatus.CANCELLED)));
    }
}
