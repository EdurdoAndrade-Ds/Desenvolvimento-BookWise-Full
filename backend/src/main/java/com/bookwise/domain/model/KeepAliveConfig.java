package com.bookwise.domain.model;

import java.time.Instant;

public record KeepAliveConfig(boolean enabled, int intervalMinutes, Instant activeUntil,
        Instant lastPingAt, String lastStatus, Long lastLatencyMs, int failureCount) {
    public static KeepAliveConfig disabled() {
        return new KeepAliveConfig(false, 10, null, null, null, null, 0);
    }
}
