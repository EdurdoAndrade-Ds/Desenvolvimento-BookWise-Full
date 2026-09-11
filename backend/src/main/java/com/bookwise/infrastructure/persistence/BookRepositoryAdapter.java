package com.bookwise.infrastructure.persistence;

import com.bookwise.domain.model.Book;
import com.bookwise.domain.model.CategoryRef;
import com.bookwise.domain.model.PriceAdjustment;
import com.bookwise.domain.page.PageResult;
import com.bookwise.domain.port.BookRepository;
import com.bookwise.infrastructure.persistence.entity.BookEntity;
import com.bookwise.infrastructure.persistence.entity.CategoryEntity;
import com.bookwise.infrastructure.persistence.repository.BookJpaRepository;
import com.bookwise.infrastructure.persistence.repository.CategoryJpaRepository;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

/**
 * Adapter que implementa a porta de dominio {@link BookRepository} sobre o
 * Spring Data JPA, convertendo entre entidade e dominio e resolvendo as
 * categorias (N:N) a partir dos ids informados.
 */
@Component
public class BookRepositoryAdapter implements BookRepository {

    private final BookJpaRepository jpaRepository;
    private final CategoryJpaRepository categoryJpaRepository;

    public BookRepositoryAdapter(
            BookJpaRepository jpaRepository, CategoryJpaRepository categoryJpaRepository) {
        this.jpaRepository = jpaRepository;
        this.categoryJpaRepository = categoryJpaRepository;
    }

    @Override
    public Book save(Book book) {
        BookEntity target = book.id() != null
                ? jpaRepository.findById(book.id()).orElse(null)
                : null;
        BookEntity entity = BookEntityMapper.toEntity(book, target);

        List<Long> categoryIds = book.categories().stream().map(CategoryRef::id).toList();
        List<CategoryEntity> categories = categoryJpaRepository.findAllById(categoryIds);
        entity.getCategories().clear();
        entity.getCategories().addAll(categories);

        return BookEntityMapper.toDomain(jpaRepository.save(entity));
    }

    @Override
    public Optional<Book> findById(Long id) {
        return jpaRepository.findById(id).map(BookEntityMapper::toDomain);
    }

    @Override
    public PageResult<Book> search(String query, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        var idsPage = (query == null || query.isBlank())
                ? jpaRepository.findPageIds(pageRequest)
                : jpaRepository.searchPageIds(query.trim(), pageRequest);
        List<Long> ids = idsPage.getContent();
        Map<Long, BookEntity> entitiesById = new HashMap<>();
        if (!ids.isEmpty()) {
            jpaRepository.findAllWithCategoriesByIdIn(ids)
                    .forEach(entity -> entitiesById.put(entity.getId(), entity));
        }
        List<Book> content = ids.stream()
                .map(entitiesById::get)
                .map(BookEntityMapper::toDomain)
                .toList();
        return new PageResult<>(
                content,
                idsPage.getNumber(),
                idsPage.getSize(),
                idsPage.getTotalElements(),
                idsPage.getTotalPages());
    }

    @Override
    public boolean existsById(Long id) {
        return jpaRepository.existsById(id);
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public long count() {
        return jpaRepository.count();
    }

    @Override
    public int adjustPrices(BigDecimal factor, PriceAdjustment adjustment) {
        String title = adjustment.titleContains();
        String titlePattern = (title == null || title.isBlank()) ? null : "%" + title.trim() + "%";
        return jpaRepository.applyPriceFactor(
                factor, adjustment.bookId(), adjustment.categoryId(), titlePattern);
    }
}
