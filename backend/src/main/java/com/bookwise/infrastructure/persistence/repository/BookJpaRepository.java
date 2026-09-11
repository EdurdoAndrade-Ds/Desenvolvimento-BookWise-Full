package com.bookwise.infrastructure.persistence.repository;

import com.bookwise.infrastructure.persistence.entity.BookEntity;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repositorio Spring Data JPA para {@link BookEntity}.
 * As categorias (N:N) sao carregadas via {@code @EntityGraph} para permitir o
 * mapeamento ao dominio mesmo apos a entidade ser destacada da sessao.
 */
public interface BookJpaRepository extends JpaRepository<BookEntity, Long> {

    @Query("select b.id from BookEntity b")
    Page<Long> findPageIds(Pageable pageable);

    @Query("""
            select b.id from BookEntity b
            where lower(b.title) like lower(concat('%', :q, '%'))
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

    /**
     * Multiplica o preco dos livros selecionados pelo fator informado
     * (0.92 aplica 8% de desconto), arredondando para duas casas. Os filtros
     * sao opcionais e combinaveis: id do livro, categoria e trecho do titulo.
     * Os parametros opcionais sao convertidos com {@code cast} porque o
     * PostgreSQL precisa do tipo declarado para comparar um parametro nulo.
     *
     * @return quantidade de livros atualizados
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            update books
               set price = round(price * :factor, 2)
             where price is not null
               and (cast(:bookId as bigint) is null or id = cast(:bookId as bigint))
               and (cast(:titlePattern as varchar) is null
                    or lower(title) like lower(cast(:titlePattern as varchar)))
               and (cast(:categoryId as bigint) is null or exists (
                     select 1 from book_categories bc
                      where bc.book_id = books.id
                        and bc.category_id = cast(:categoryId as bigint)))
            """, nativeQuery = true)
    int applyPriceFactor(
            @Param("factor") BigDecimal factor,
            @Param("bookId") Long bookId,
            @Param("categoryId") Long categoryId,
            @Param("titlePattern") String titlePattern);
}
