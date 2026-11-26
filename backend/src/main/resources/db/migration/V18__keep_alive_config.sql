CREATE TABLE keep_alive_config (
    id BIGINT PRIMARY KEY CHECK (id = 1),
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    interval_minutes INTEGER NOT NULL DEFAULT 10 CHECK (interval_minutes IN (5, 10, 14)),
    active_until TIMESTAMP WITH TIME ZONE,
    last_ping_at TIMESTAMP WITH TIME ZONE,
    last_status VARCHAR(160),
    last_latency_ms BIGINT CHECK (last_latency_ms >= 0),
    failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count >= 0)
);

INSERT INTO keep_alive_config (id, enabled, interval_minutes, failure_count) VALUES (1, FALSE, 10, 0);
