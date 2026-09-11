package com.bookwise.application.service;

import com.bookwise.application.dto.BookRequest;
import com.bookwise.application.dto.BookResponse;
import com.bookwise.application.dto.DiscountRequest;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.dto.PriceAdjustmentResponse;
import com.bookwise.application.mapper.BookMapper;
import com.bookwise.domain.exception.BookNotFoundException;
import com.bookwise.domain.exception.CategoryNotFoundException;
import com.bookwise.domain.model.Book;
import com.bookwise.domain.model.PriceAdjustment;
import com.bookwise.domain.model.PriceAdjustmentType;
import com.bookwise.domain.port.BookRepository;
import com.bookwise.domain.port.CategoryRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso relacionados a livros.
 */
@Service
@Transactional
public class BookService {

    private final BookRepository repository;
    private final CategoryRepository categoryRepository;

    public BookService(BookRepository repository, CategoryRepository categoryRepository) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
    }

    /**
     * Lista uma pagina de livros, opcionalmente filtrando por um termo de busca.
     *
     * @param query termo de busca (titulo/autor/isbn), ou {@code null} para todos
     * @param page  indice da pagina (base zero)
     * @param size  tamanho da pagina
     * @return pagina de livros
     */
    @Transactional(readOnly = true)
    public PageResponse<BookResponse> list(String query, int page, int size) {
        return BookMapper.toPageResponse(repository.search(query, page, size));
    }

    /**
     * Busca um livro pelo identificador.
     *
     * @param id identificador do livro
     * @return o livro encontrado
     * @throws BookNotFoundException se nao existir livro com o id informado
     */
    @Transactional(readOnly = true)
    public BookResponse getById(Long id) {
        return repository.findById(id)
                .map(BookMapper::toResponse)
                .orElseThrow(() -> new BookNotFoundException(id));
    }

    /**
     * Cria um novo livro, validando as categorias associadas.
     *
     * @param request dados do livro
     * @return o livro criado
     * @throws CategoryNotFoundException se alguma categoria informada nao existir
     */
    public BookResponse create(BookRequest request) {
        validateCategories(request.categoryIds());
        Book saved = repository.save(BookMapper.toNewDomain(request));
        return BookMapper.toResponse(saved);
    }

    /**
     * Atualiza um livro existente, validando as categorias associadas e
     * preservando id e data de criacao.
     *
     * @param id      identificador do livro
     * @param request novos dados do livro
     * @return o livro atualizado
     * @throws BookNotFoundException     se o livro nao existir
     * @throws CategoryNotFoundException se alguma categoria informada nao existir
     */
    public BookResponse update(Long id, BookRequest request) {
        Book existing = repository.findById(id)
                .orElseThrow(() -> new BookNotFoundException(id));
        validateCategories(request.categoryIds());
        Book updated = existing.withUpdatedData(
                request.title(),
                request.author(),
                request.isbn(),
                request.genre(),
                request.publishedYear(),
                request.format(),
                request.price(),
                request.stock(),
                request.coverUrl(),
                BookMapper.toRefs(request.categoryIds()));
        return BookMapper.toResponse(repository.save(updated));
    }

    /**
     * Remove um livro pelo identificador.
     *
     * @param id identificador do livro
     * @throws BookNotFoundException se o livro nao existir
     */
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new BookNotFoundException(id);
        }
        repository.deleteById(id);
    }

    /**
     * Aplica um desconto (ou aumento) percentual sobre os precos, em uma unica
     * instrucao SQL nativa, sem carregar os livros na aplicacao.
     *
     * @param request percentual, sentido do ajuste e filtro dos livros
     * @return fator aplicado e quantidade de livros atualizados
     * @throws BookNotFoundException     se o livro informado nao existir
     * @throws CategoryNotFoundException se a categoria informada nao existir
     */
    public PriceAdjustmentResponse applyPriceAdjustment(DiscountRequest request) {
        if (request.bookId() != null && !repository.existsById(request.bookId())) {
            throw new BookNotFoundException(request.bookId());
        }
        if (request.categoryId() != null && !categoryRepository.existsById(request.categoryId())) {
            throw new CategoryNotFoundException(request.categoryId());
        }
        PriceAdjustmentType type = request.resolvedType();
        BigDecimal factor = type.factorFor(request.percentage());
        int updated = repository.adjustPrices(
                factor,
                new PriceAdjustment(
                        request.bookId(), request.categoryId(), request.titleContains()));
        return new PriceAdjustmentResponse(type, request.percentage(), factor, updated);
    }

    private void validateCategories(List<Long> categoryIds) {
        if (categoryIds == null) {
            return;
        }
        for (Long categoryId : categoryIds) {
            if (categoryId != null && !categoryRepository.existsById(categoryId)) {
                throw new CategoryNotFoundException(categoryId);
            }
        }
    }
}
