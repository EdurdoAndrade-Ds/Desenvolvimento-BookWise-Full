package com.bookwise.infrastructure.scheduling;

import com.bookwise.application.service.KeepAliveService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "bookwise.jobs.enabled", havingValue = "true", matchIfMissing = true)
public class KeepAliveJob {
    private final KeepAliveService service;

    public KeepAliveJob(KeepAliveService service) {
        this.service = service;
    }

    @Scheduled(fixedDelay = 60000)
    public void ping() {
        service.tick();
    }
}
