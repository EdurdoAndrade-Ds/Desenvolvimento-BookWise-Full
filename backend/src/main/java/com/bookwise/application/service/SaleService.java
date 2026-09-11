package com.bookwise.application.service;

import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.dto.SaleRequest;
import com.bookwise.application.dto.SaleResponse;
import com.bookwise.application.mapper.SaleMapper;
import com.bookwise.application.policy.StockPolicy;
import com.bookwise.domain.exception.BookNotFoundException;
import com.bookwise.domain.exception.BusinessException;
import com.bookwise.domain.exception.SaleNotFoundException;
import com.bookwise.domain.exception.UserNotFoundException;
import com.bookwise.domain.model.Book;
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
    private final StockPolicy stockPolicy;

    public SaleService(
            SaleRepository saleRepository,
            UserRepository userRepository,
            BookRepository bookRepository,
            StockPolicy stockPolicy) {
        this.saleRepository = saleRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.stockPolicy = stockPolicy;
    }

    /**
     * Lista uma pagina de vendas, opcionalmente filtrando por usuario.
     *
     * @param page   indice da pagina (base zero)
     * @param size   tamanho da pagina
     * @param userId id do usuario para filtrar, ou {@code null} para todas
     * @return pagina de vendas
     */
    @Transactional(readOnly = true)
    public PageResponse<SaleResponse> list(int page, int size, Long userId) {
        var result = userId == null
                ? saleRepository.findAll(page, size)
                : saleRepository.findAllByUserId(userId, page, size);
        return SaleMapper.toPageResponse(result);
    }

    /**
     * Busca uma venda pelo identificador.
     *
     * @param id identificador da venda
     * @return a venda encontrada
     * @throws SaleNotFoundException se nao existir venda com o id informado
     */
    @Transactional(readOnly = true)
    public SaleResponse getById(Long id) {
        return saleRepository.findById(id)
                .map(SaleMapper::toResponse)
                .orElseThrow(() -> new SaleNotFoundException(id));
    }

    /**
     * Registra uma nova venda: valida usuario e livros, baixa o estoque dos
     * livros fisicos e calcula o total (usa o preco do livro quando o item nao
     * informa o preco unitario).
     *
     * @param request dados da venda (usuario, itens e forma de pagamento)
     * @return a venda criada com status PAID
     * @throws UserNotFoundException se o usuario nao existir
     * @throws BookNotFoundException se algum livro nao existir
     * @throws BusinessException     se o estoque de um livro fisico for insuficiente
     */
    public SaleResponse create(SaleRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new UserNotFoundException(request.userId()));

        List<SaleItem> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (var itemReq : request.items()) {
            int quantity = itemReq.quantityOrDefault();
            Book book = bookRepository.findById(itemReq.bookId())
                    .orElseThrow(() -> new BookNotFoundException(itemReq.bookId()));

            stockPolicy.withdraw(book, quantity);

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

    /**
     * Cancela uma venda e restaura o estoque dos livros fisicos vendidos.
     *
     * @param id identificador da venda
     * @return a venda com status CANCELLED
     * @throws SaleNotFoundException se a venda nao existir
     * @throws BusinessException     se a venda ja estiver cancelada
     */
    public SaleResponse cancel(Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new SaleNotFoundException(id));

        if (sale.status() == SaleStatus.CANCELLED) {
            throw new BusinessException("Venda ja cancelada");
        }

        for (SaleItem item : sale.items()) {
            stockPolicy.restore(item.bookId(), item.quantity());
        }

        return SaleMapper.toResponse(saleRepository.save(sale.withStatus(SaleStatus.CANCELLED)));
    }
}
