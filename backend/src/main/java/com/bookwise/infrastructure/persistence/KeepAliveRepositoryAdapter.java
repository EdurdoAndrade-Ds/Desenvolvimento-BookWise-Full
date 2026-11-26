package com.bookwise.infrastructure.persistence;

import com.bookwise.domain.model.KeepAliveConfig;
import com.bookwise.domain.port.KeepAliveRepository;
import com.bookwise.infrastructure.persistence.entity.KeepAliveEntity;
import com.bookwise.infrastructure.persistence.repository.KeepAliveJpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public class KeepAliveRepositoryAdapter implements KeepAliveRepository {
    private final KeepAliveJpaRepository repository;

    public KeepAliveRepositoryAdapter(KeepAliveJpaRepository repository) {
        this.repository = repository;
    }

    public KeepAliveConfig load() {
        var entity = repository.findById(1L).orElseGet(() -> repository.saveAndFlush(new KeepAliveEntity()));
        return new KeepAliveConfig(entity.isEnabled(), entity.getIntervalMinutes(), entity.getActiveUntil(),
                entity.getLastPingAt(), entity.getLastStatus(), entity.getLastLatencyMs(), entity.getFailureCount());
    }

    public KeepAliveConfig save(KeepAliveConfig config) {
        var entity = repository.findById(1L).orElseGet(KeepAliveEntity::new);
        entity.setEnabled(config.enabled());
        entity.setIntervalMinutes(config.intervalMinutes());
        entity.setActiveUntil(config.activeUntil());
        entity.setLastPingAt(config.lastPingAt());
        entity.setLastStatus(config.lastStatus());
        entity.setLastLatencyMs(config.lastLatencyMs());
        entity.setFailureCount(config.failureCount());
        repository.saveAndFlush(entity);
        return config;
    }
}
