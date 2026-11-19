package com.bookwise.application.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record KeepAliveRequest(@NotNull Boolean enabled, @NotNull Integer intervalMinutes,
        @Future Instant activeUntil) {
}
