package com.bookwise.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "keep_alive_config")
@Getter
@Setter
@NoArgsConstructor
public class KeepAliveEntity {
    @Id
    private Long id = 1L;
    @Column(nullable = false)
    private boolean enabled;
    @Column(nullable = false)
    private int intervalMinutes = 10;
    private Instant activeUntil;
    private Instant lastPingAt;
    @Column(length = 160)
    private String lastStatus;
    private Long lastLatencyMs;
    @Column(nullable = false)
    private int failureCount;
}
