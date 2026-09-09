package com.bookwise.infrastructure.persistence.repository;

import com.bookwise.infrastructure.persistence.entity.LoanEntity;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repositorio Spring Data JPA para {@link LoanEntity}.
 */
public interface LoanJpaRepository extends JpaRepository<LoanEntity, Long> {

    @Query("select l.id from LoanEntity l")
    Page<Long> findPageIds(Pageable pageable);

    @Override
    @EntityGraph(attributePaths = "items")
    List<LoanEntity> findAll(Sort sort);

    @Query("select l.id from LoanEntity l where l.userId = :userId")
    Page<Long> findPageIdsByUserId(@Param("userId") Long userId, Pageable pageable);

    @EntityGraph(attributePaths = "items")
    @Query("select distinct l from LoanEntity l where l.id in :ids")
    List<LoanEntity> findAllWithItemsByIdIn(@Param("ids") List<Long> ids);

    long countByUserIdAndReturnDateIsNull(Long userId);

    @EntityGraph(attributePaths = "items")
    @Query("select distinct l from LoanEntity l where l.returnDate is null and l.dueDate < :reference")
    List<LoanEntity> findOpenOverdue(@Param("reference") LocalDate reference);
}
