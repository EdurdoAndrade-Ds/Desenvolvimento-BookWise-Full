package com.bookwise.domain.port;

import com.bookwise.domain.model.Category;
import com.bookwise.domain.page.PageResult;
import java.util.List;
import java.util.Optional;

/**
 * Porta de saida para persistencia de categorias.
 */
public interface CategoryRepository {

    Category save(Category category);

    Optional<Category> findById(Long id);

    /** Busca paginada por nome (query nula = todas). */
    PageResult<Category> search(String query, int page, int size);

    /** Todas as categorias (para montar seletor de categoria pai). */
    List<Category> findAll();

    boolean existsById(Long id);

    void deleteById(Long id);

    long count();
}
