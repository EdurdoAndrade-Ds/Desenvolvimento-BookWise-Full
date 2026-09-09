package com.bookwise.infrastructure.persistence.repository;

import com.bookwise.infrastructure.persistence.entity.BookEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repositorio Spring Data JPA para {@link BookEntity}.
 * As categorias (N:N) sao carregadas via {@code @EntityGraph} para permitir o
 * mapeamento ao dominio mesmo apos a entidade ser destacada da sessao.
 */
public interface BookJpaRepository extends JpaRepository<BookEntity, Long> {

    @Query("""
            select b.id from BookEntity b
            where :q is null
               or lower(b.title) like lower(concat('%', :q, '%'))
               or lower(b.author) like lower(concat('%', :q, '%'))
               or lower(b.isbn) like lower(concat('%', :q, '%'))
               or lower(b.genre) like lower(concat('%', :q, '%'))
            """)
    Page<Long> searchPageIds(@Param("q") String q, Pageable pageable);

    @EntityGraph(attributePaths = "categories")
    @Query("select distinct b from BookEntity b where b.id in :ids")
    List<BookEntity> findAllWithCategoriesByIdIn(@Param("ids") List<Long> ids);

    @Override
    @EntityGraph(attributePaths = "categories")
    Optional<BookEntity> findById(Long id);
}
