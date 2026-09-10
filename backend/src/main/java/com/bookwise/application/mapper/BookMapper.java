package com.bookwise.application.mapper;

import com.bookwise.application.dto.BookRequest;
import com.bookwise.application.dto.BookResponse;
import com.bookwise.application.dto.CategoryRefResponse;
import com.bookwise.application.dto.PageMeta;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.domain.model.Book;
import com.bookwise.domain.model.CategoryRef;
import com.bookwise.domain.page.PageResult;
import java.util.List;

/**
 * Conversoes entre o dominio (Book) e os DTOs da camada de aplicacao.
 */
public final class BookMapper {

    private BookMapper() {
    }

    /** Converte ids de categoria em referencias de dominio (nome resolvido na leitura). */
    public static List<CategoryRef> toRefs(List<Long> categoryIds) {
        if (categoryIds == null) {
            return List.of();
        }
        return categoryIds.stream().filter(java.util.Objects::nonNull).distinct()
                .map(id -> new CategoryRef(id, null))
                .toList();
    }

    /** Converte uma requisicao em um novo Book (sem id/createdAt). */
    public static Book toNewDomain(BookRequest request) {
        return new Book(
                null,
                request.title(),
                request.author(),
                request.isbn(),
                request.genre(),
                request.publishedYear(),
                request.format(),
                request.price(),
                request.stock(),
                toRefs(request.categoryIds()),
                null);
    }

    public static BookResponse toResponse(Book book) {
        List<CategoryRefResponse> categories = book.categories().stream()
                .map(c -> new CategoryRefResponse(c.id(), c.name()))
                .toList();
        return new BookResponse(
                book.id(),
                book.title(),
                book.author(),
                book.isbn(),
                book.genre(),
                book.publishedYear(),
                book.format(),
                book.price(),
                book.stock(),
                categories,
                book.createdAt());
    }

    public static PageResponse<BookResponse> toPageResponse(PageResult<Book> page) {
        List<BookResponse> content = page.content().stream()
                .map(BookMapper::toResponse)
                .toList();
        PageMeta meta = new PageMeta(page.page(), page.size(), page.totalElements(), page.totalPages());
        return new PageResponse<>(content, meta);
    }
}
