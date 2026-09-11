package com.bookwise.infrastructure.persistence.repository;

import com.bookwise.infrastructure.persistence.entity.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repositorio Spring Data JPA para {@link UserEntity}.
 */
public interface UserJpaRepository extends JpaRepository<UserEntity, Long> {

    @Query("""
            select u from UserEntity u
            where lower(u.name) like lower(concat('%', :q, '%'))
               or lower(u.email) like lower(concat('%', :q, '%'))
            """)
    Page<UserEntity> search(@Param("q") String q, Pageable pageable);
}
