package com.bookwise.application.service;

import com.bookwise.application.dto.LoanRequest;
import com.bookwise.application.dto.LoanResponse;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.mapper.LoanMapper;
import com.bookwise.application.policy.FinePolicy;
import com.bookwise.application.policy.StockPolicy;
import com.bookwise.config.BusinessProperties;
import com.bookwise.domain.exception.BookNotFoundException;
import com.bookwise.domain.exception.BusinessException;
import com.bookwise.domain.exception.LoanNotFoundException;
import com.bookwise.domain.exception.UserNotFoundException;
import com.bookwise.domain.model.Book;
import com.bookwise.domain.model.Loan;
import com.bookwise.domain.model.LoanItem;
import com.bookwise.domain.model.User;
import com.bookwise.domain.port.BookRepository;
import com.bookwise.domain.port.LoanRepository;
import com.bookwise.domain.port.UserRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso de emprestimos: criacao (com validacao de limites e multas
 * pendentes), renovacao, devolucao e cobranca de atrasos em aberto.
 *
 * <p>A movimentacao de estoque e o calculo de multa ficam em
 * {@link StockPolicy} e {@link FinePolicy}, mantendo este servico focado na
 * orquestracao das regras de emprestimo.
 */
@Service
@Transactional
public class LoanService {

    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final StockPolicy stockPolicy;
    private final FinePolicy finePolicy;
    private final BusinessProperties properties;

    public LoanService(
            LoanRepository loanRepository,
            UserRepository userRepository,
            BookRepository bookRepository,
            StockPolicy stockPolicy,
            FinePolicy finePolicy,
            BusinessProperties properties) {
        this.loanRepository = loanRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.stockPolicy = stockPolicy;
        this.finePolicy = finePolicy;
        this.properties = properties;
    }

    /**
     * Lista uma pagina de emprestimos, opcionalmente filtrando por usuario.
     *
     * @param page   indice da pagina (base zero)
     * @param size   tamanho da pagina
     * @param userId id do usuario para filtrar, ou {@code null} para todos
     * @return pagina de emprestimos com o status derivado na data atual
     */
    @Transactional(readOnly = true)
    public PageResponse<LoanResponse> list(int page, int size, Long userId) {
        var result = userId == null
                ? loanRepository.findAll(page, size)
                : loanRepository.findAllByUserId(userId, page, size);
        return LoanMapper.toPageResponse(result, LocalDate.now());
    }

    /**
     * Busca um emprestimo pelo identificador.
     *
     * @param id identificador do emprestimo
     * @return o emprestimo encontrado
     * @throws LoanNotFoundException se nao existir emprestimo com o id informado
     */
    @Transactional(readOnly = true)
    public LoanResponse getById(Long id) {
        return loanRepository.findById(id)
                .map(loan -> LoanMapper.toResponse(loan, LocalDate.now()))
                .orElseThrow(() -> new LoanNotFoundException(id));
    }

    /**
     * Registra um novo emprestimo: valida usuario, limites configurados
     * (itens por emprestimo, emprestimos em aberto e multa pendente), baixa o
     * estoque dos livros fisicos e calcula a data prevista de devolucao.
     *
     * @param request dados do emprestimo (usuario e itens)
     * @return o emprestimo criado
     * @throws UserNotFoundException se o usuario nao existir
     * @throws BookNotFoundException se algum livro nao existir
     * @throws BusinessException     se um limite for excedido, houver multa pendente
     *                               ou o estoque de um livro fisico for insuficiente
     */
    public LoanResponse create(LoanRequest request) {
        User user = findUser(request.userId());
        int totalQuantity = request.items().stream()
                .mapToInt(item -> item.quantityOrDefault())
                .sum();
        validateNewLoan(user, totalQuantity);

        List<LoanItem> items = new ArrayList<>();
        for (var itemReq : request.items()) {
            int quantity = itemReq.quantityOrDefault();
            Book book = findBook(itemReq.bookId());
            stockPolicy.withdraw(book, quantity);
            items.add(new LoanItem(book.id(), book.title(), quantity));
        }
        return persist(user, items, request.dueDate());
    }

    /**
     * Cria o emprestimo originado da conversao de uma reserva (um exemplar).
     *
     * @param userId          usuario da reserva
     * @param bookId          livro reservado
     * @param stockAlreadyHeld {@code true} quando a reserva ja bloqueou a unidade
     *                         em estoque, evitando baixa em duplicidade
     * @return o emprestimo criado
     */
    public LoanResponse createFromReservation(Long userId, Long bookId, boolean stockAlreadyHeld) {
        User user = findUser(userId);
        validateNewLoan(user, 1);
        Book book = findBook(bookId);
        if (!stockAlreadyHeld) {
            stockPolicy.withdraw(book, 1);
        }
        return persist(user, List.of(new LoanItem(book.id(), book.title(), 1)), null);
    }

    /**
     * Renova um emprestimo em aberto, estendendo a data prevista de devolucao
     * pelos dias configurados em {@code bookwise.loan.renewal-days}.
     *
     * @param id identificador do emprestimo
     * @return o emprestimo com a nova data prevista
     * @throws LoanNotFoundException se o emprestimo nao existir
     * @throws BusinessException     se a renovacao estiver desabilitada, o emprestimo
     *                               ja tiver sido devolvido, estiver em atraso, o limite
     *                               de renovacoes tiver sido atingido ou houver multa pendente
     */
    public LoanResponse renew(Long id) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new LoanNotFoundException(id));
        BusinessProperties.Loan config = properties.loan();

        if (config.maxRenewals() <= 0) {
            throw new BusinessException("Renovacao de emprestimo desabilitada");
        }
        if (!loan.isOpen()) {
            throw new BusinessException("Emprestimo ja devolvido");
        }
        if (loan.renewalCount() >= config.maxRenewals()) {
            throw new BusinessException(
                    "Limite de renovacoes atingido (maximo: " + config.maxRenewals() + ")");
        }

        LocalDate today = LocalDate.now();
        if (finePolicy.daysLate(loan, today) > 0) {
            throw new BusinessException("Emprestimo em atraso nao pode ser renovado");
        }
        if (config.blockWhenFinePending() && finePolicy.hasPendingFine(loan.userId())) {
            throw new BusinessException("Usuario possui multa pendente e nao pode renovar emprestimos");
        }

        Loan renewed = loan.renewedUntil(loan.dueDate().plusDays(config.renewalDays()));
        return LoanMapper.toResponse(loanRepository.save(renewed), today);
    }

    /**
     * Registra a devolucao de um emprestimo: restaura o estoque dos livros
     * fisicos e, se houver atraso, gera ou atualiza a multa correspondente.
     *
     * @param id identificador do emprestimo
     * @return o emprestimo atualizado com a data de devolucao
     * @throws LoanNotFoundException se o emprestimo nao existir
     * @throws BusinessException     se o emprestimo ja tiver sido devolvido
     */
    public LoanResponse returnLoan(Long id) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new LoanNotFoundException(id));

        if (!loan.isOpen()) {
            throw new BusinessException("Emprestimo ja devolvido");
        }

        for (LoanItem item : loan.items()) {
            stockPolicy.restore(item.bookId(), item.quantity());
        }

        LocalDate today = LocalDate.now();
        Loan saved = loanRepository.save(loan.withReturnDate(today));
        finePolicy.apply(saved, today);

        return LoanMapper.toResponse(saved, today);
    }

    /**
     * Apura as multas dos emprestimos vencidos que continuam em aberto, sem
     * esperar a devolucao. Idempotente: reexecucoes no mesmo dia nao duplicam
     * nem reduzem multas.
     *
     * @param reference data de apuracao
     * @return quantidade de emprestimos com multa gerada ou atualizada
     */
    public int chargeOverdueLoans(LocalDate reference) {
        int affected = 0;
        for (Loan loan : loanRepository.findOpenOverdue(reference)) {
            if (finePolicy.apply(loan, reference).isPresent()) {
                affected++;
            }
        }
        return affected;
    }

    private LoanResponse persist(User user, List<LoanItem> items, LocalDate requestedDueDate) {
        LocalDate today = LocalDate.now();
        LocalDate dueDate = requestedDueDate != null
                ? requestedDueDate
                : today.plusDays(properties.loan().defaultDays());
        Loan saved = loanRepository.save(
                new Loan(null, user.id(), user.name(), items, today, dueDate, null, 0, null));
        return LoanMapper.toResponse(saved, today);
    }

    /** Limites de emprestimo do usuario: itens por pedido, itens em aberto e multa pendente. */
    private void validateNewLoan(User user, int quantity) {
        BusinessProperties.Loan config = properties.loan();
        if (config.maxItemsPerLoan() > 0 && quantity > config.maxItemsPerLoan()) {
            throw new BusinessException(
                    "Limite de itens por emprestimo excedido (maximo: " + config.maxItemsPerLoan() + ")");
        }
        if (config.maxActivePerUser() > 0
                && loanRepository.countOpenByUserId(user.id()) >= config.maxActivePerUser()) {
            throw new BusinessException(
                    "Usuario ja possui o maximo de emprestimos em aberto (" + config.maxActivePerUser() + ")");
        }
        if (config.blockWhenFinePending() && finePolicy.hasPendingFine(user.id())) {
            throw new BusinessException("Usuario possui multa pendente e nao pode realizar novos emprestimos");
        }
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
    }

    private Book findBook(Long bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException(bookId));
    }
}
