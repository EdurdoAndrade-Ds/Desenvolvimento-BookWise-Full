package com.bookwise.application.service;

import com.bookwise.application.dto.BookRequest;
import com.bookwise.application.dto.BookResponse;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.mapper.BookMapper;
import com.bookwise.domain.exception.BookNotFoundException;
import com.bookwise.domain.exception.CategoryNotFoundException;
import com.bookwise.domain.model.Book;
import com.bookwise.domain.port.BookRepository;
import com.bookwise.domain.port.CategoryRepository;
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

    @Transactional(readOnly = true)
    public PageResponse<BookResponse> list(String query, int page, int size) {
        return BookMapper.toPageResponse(repository.search(query, page, size));
    }

    @Transactional(readOnly = true)
    public BookResponse getById(Long id) {
        return repository.findById(id)
                .map(BookMapper::toResponse)
                .orElseThrow(() -> new BookNotFoundException(id));
    }

    public BookResponse create(BookRequest request) {
        validateCategories(request.categoryIds());
        Book saved = repository.save(BookMapper.toNewDomain(request));
        return BookMapper.toResponse(saved);
    }

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
                BookMapper.toRefs(request.categoryIds()));
        return BookMapper.toResponse(repository.save(updated));
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new BookNotFoundException(id);
        }
        repository.deleteById(id);
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
