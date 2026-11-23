package com.bookwise.infrastructure.persistence.repository;

import com.bookwise.infrastructure.persistence.entity.KeepAliveEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KeepAliveJpaRepository extends JpaRepository<KeepAliveEntity, Long> {
}
