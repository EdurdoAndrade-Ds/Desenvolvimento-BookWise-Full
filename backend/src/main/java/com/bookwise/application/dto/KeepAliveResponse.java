package com.bookwise.application.dto;

import com.bookwise.domain.model.KeepAliveConfig;
import java.time.Instant;

public record KeepAliveResponse(boolean enabled, int intervalMinutes, Instant activeUntil,
        Instant lastPingAt, String lastStatus, Long lastLatencyMs, int failureCount,
        boolean targetConfigured, String warning) {
    public static KeepAliveResponse from(KeepAliveConfig config, boolean configured) {
        return new KeepAliveResponse(config.enabled(), config.intervalMinutes(), config.activeUntil(),
                config.lastPingAt(), config.lastStatus(), config.lastLatencyMs(), config.failureCount(), configured,
                configured ? null : "Configure BOOKWISE_PUBLIC_URL ou RENDER_EXTERNAL_URL com uma URL HTTP(S) válida.");
    }
}
