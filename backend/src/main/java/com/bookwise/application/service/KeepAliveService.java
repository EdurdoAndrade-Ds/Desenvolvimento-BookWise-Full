package com.bookwise.application.service;

import com.bookwise.application.dto.KeepAliveRequest;
import com.bookwise.application.dto.KeepAliveResponse;
import com.bookwise.domain.exception.BusinessException;
import com.bookwise.domain.model.KeepAliveConfig;
import com.bookwise.domain.port.HealthPingClient;
import com.bookwise.domain.port.KeepAliveRepository;
import com.bookwise.infrastructure.config.KeepAliveTarget;
import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class KeepAliveService {
    private final KeepAliveRepository repository;
    private final HealthPingClient client;
    private final KeepAliveTarget target;
    private final Clock clock;

    public KeepAliveService(KeepAliveRepository repository, HealthPingClient client, KeepAliveTarget target, Clock clock) {
        this.repository = repository;
        this.client = client;
        this.target = target;
        this.clock = clock;
    }

    public synchronized KeepAliveResponse get() {
        return KeepAliveResponse.from(expire(repository.load()), target.healthUri() != null);
    }

    public synchronized KeepAliveResponse update(KeepAliveRequest request) {
        if (request.enabled() == null || request.intervalMinutes() == null
                || !Set.of(5, 10, 14).contains(request.intervalMinutes())) {
            throw new BusinessException("Intervalo deve ser 5, 10 ou 14 minutos");
        }
        if (request.activeUntil() != null && !request.activeUntil().isAfter(clock.instant())) {
            throw new BusinessException("O horário de término deve estar no futuro");
        }
        var old = repository.load();
        var saved = repository.save(new KeepAliveConfig(request.enabled(), request.intervalMinutes(), request.activeUntil(),
                old.lastPingAt(), old.lastStatus(), old.lastLatencyMs(), old.failureCount()));
        return KeepAliveResponse.from(saved, target.healthUri() != null);
    }

    public synchronized void tick() {
        var config = expire(repository.load());
        Instant now = clock.instant();
        if (!config.enabled() || target.healthUri() == null
                || (config.lastPingAt() != null && now.isBefore(config.lastPingAt().plus(Duration.ofMinutes(config.intervalMinutes()))))) {
            return;
        }
        String status;
        boolean success = false;
        try {
            int code = client.get(target.healthUri());
            status = Integer.toString(code);
            success = code == 200;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            status = "ERROR: InterruptedException";
        } catch (IOException | RuntimeException exception) {
            status = "ERROR: " + exception.getClass().getSimpleName();
        }
        long latency = Math.max(0, Duration.between(now, clock.instant()).toMillis());
        repository.save(new KeepAliveConfig(config.enabled(), config.intervalMinutes(), config.activeUntil(), now,
                status, latency, success ? 0 : config.failureCount() == Integer.MAX_VALUE ? Integer.MAX_VALUE : config.failureCount() + 1));
    }

    private KeepAliveConfig expire(KeepAliveConfig config) {
        if (config.enabled() && config.activeUntil() != null && !clock.instant().isBefore(config.activeUntil())) {
            return repository.save(new KeepAliveConfig(false, config.intervalMinutes(), config.activeUntil(),
                    config.lastPingAt(), config.lastStatus(), config.lastLatencyMs(), config.failureCount()));
        }
        return config;
    }
}
