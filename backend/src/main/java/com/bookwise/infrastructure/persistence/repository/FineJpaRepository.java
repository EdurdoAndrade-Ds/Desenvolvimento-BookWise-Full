package com.bookwise.infrastructure.persistence.repository;

import com.bookwise.domain.model.FinePaymentStatus;
import com.bookwise.infrastructure.persistence.entity.FineEntity;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repositorio Spring Data JPA para {@link FineEntity}.
 */
public interface FineJpaRepository extends JpaRepository<FineEntity, Long> {

    boolean existsByLoanId(Long loanId);

    Optional<FineEntity> findByLoanId(Long loanId);

    @Query("""
            select count(f) > 0 from FineEntity f
            where f.paymentStatus = :status
              and f.loanId in (
                select l.id from LoanEntity l where l.userId = :userId
              )
            """)
    boolean existsByUserIdAndPaymentStatus(
            @Param("userId") Long userId, @Param("status") FinePaymentStatus status);

    @Query("""
            select f from FineEntity f
            where f.loanId in (
                select l.id from LoanEntity l where l.userId = :userId
            )
            """)
    Page<FineEntity> findByUserId(@Param("userId") Long userId, Pageable pageable);
}
