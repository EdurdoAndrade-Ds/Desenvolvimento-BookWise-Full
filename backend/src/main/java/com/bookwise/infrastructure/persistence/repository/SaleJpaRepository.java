package com.bookwise.infrastructure.persistence.repository;

import com.bookwise.infrastructure.persistence.entity.SaleEntity;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repositorio Spring Data JPA para {@link SaleEntity}.
 */
public interface SaleJpaRepository extends JpaRepository<SaleEntity, Long> {

    @Query("select s.id from SaleEntity s")
    Page<Long> findPageIds(Pageable pageable);

    @Override
    @EntityGraph(attributePaths = "items")
    List<SaleEntity> findAll(Sort sort);

    @Query("select s.id from SaleEntity s where s.userId = :userId")
    Page<Long> findPageIdsByUserId(@Param("userId") Long userId, Pageable pageable);

    @EntityGraph(attributePaths = "items")
    @Query("select distinct s from SaleEntity s where s.id in :ids")
    List<SaleEntity> findAllWithItemsByIdIn(@Param("ids") List<Long> ids);
}
