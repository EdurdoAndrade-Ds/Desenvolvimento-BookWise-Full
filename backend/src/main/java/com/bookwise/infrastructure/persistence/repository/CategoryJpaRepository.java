package com.bookwise.infrastructure.persistence.repository;

import com.bookwise.infrastructure.persistence.entity.CategoryEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repositorio Spring Data JPA para {@link CategoryEntity}.
 */
public interface CategoryJpaRepository extends JpaRepository<CategoryEntity, Long> {

    @Query("""
            select c from CategoryEntity c
            where :q is null
               or lower(c.name) like lower(concat('%', :q, '%'))
               or lower(c.description) like lower(concat('%', :q, '%'))
            """)
    Page<CategoryEntity> search(@Param("q") String q, Pageable pageable);
}
