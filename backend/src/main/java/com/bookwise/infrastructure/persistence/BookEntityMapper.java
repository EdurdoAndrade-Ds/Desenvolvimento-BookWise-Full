package com.bookwise.infrastructure.persistence;

import com.bookwise.domain.model.Book;
import com.bookwise.domain.model.CategoryRef;
import com.bookwise.infrastructure.persistence.entity.BookEntity;
import java.util.List;

/**
 * Conversoes entre a entidade JPA e o modelo de dominio.
 */
final class BookEntityMapper {

    private BookEntityMapper() {
    }

    static Book toDomain(BookEntity entity) {
        List<CategoryRef> categories = entity.getCategories().stream()
                .map(c -> new CategoryRef(c.getId(), c.getName()))
                .toList();
        return new Book(
                entity.getId(),
                entity.getTitle(),
                entity.getAuthor(),
                entity.getIsbn(),
                entity.getGenre(),
                entity.getPublishedYear(),
                entity.getFormat(),
                entity.getPrice(),
                entity.getStock(),
                categories,
                entity.getCreatedAt());
    }

    /**
     * Aplica os dados do dominio na entidade. Quando {@code target} for nulo,
     * cria uma nova entidade (fluxo de insercao).
     */
    static BookEntity toEntity(Book book, BookEntity target) {
        BookEntity entity = target != null ? target : new BookEntity();
        entity.setTitle(book.title());
        entity.setAuthor(book.author());
        entity.setIsbn(book.isbn());
        entity.setGenre(book.genre());
        entity.setPublishedYear(book.publishedYear());
        entity.setFormat(book.format());
        entity.setPrice(book.price());
        entity.setStock(book.stock());
        if (book.createdAt() != null) {
            entity.setCreatedAt(book.createdAt());
        }
        return entity;
    }
}
