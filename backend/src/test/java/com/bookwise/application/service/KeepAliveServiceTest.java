package com.bookwise.application.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.bookwise.application.dto.KeepAliveRequest;
import com.bookwise.domain.exception.BusinessException;
import com.bookwise.domain.model.KeepAliveConfig;
import com.bookwise.domain.port.HealthPingClient;
import com.bookwise.domain.port.KeepAliveRepository;
import com.bookwise.infrastructure.config.KeepAliveTarget;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class KeepAliveServiceTest {
    private final Instant now = Instant.parse("2030-01-01T12:00:00Z");
    private final Clock clock = Clock.fixed(now, ZoneOffset.UTC);
    private final KeepAliveRepository repository = mock(KeepAliveRepository.class);
    private final HealthPingClient client = mock(HealthPingClient.class);
    private KeepAliveConfig stored;
    private KeepAliveService service;

    @BeforeEach
    void setUp() {
        stored = new KeepAliveConfig(true, 5, null, null, null, null, 0);
        when(repository.load()).thenAnswer(invocation -> stored);
        when(repository.save(any())).thenAnswer(invocation -> { stored = invocation.getArgument(0); return stored; });
        service = new KeepAliveService(repository, client, new KeepAliveTarget("http://localhost:8080/", ""), clock);
    }

    @Test
    void pingsImmediatelyThenWaitsForInterval() throws Exception {
        when(client.get(any())).thenReturn(200);
        service.tick();
        service.tick();
        verify(client, times(1)).get(java.net.URI.create("http://localhost:8080/actuator/health"));
        assertThat(stored.lastStatus()).isEqualTo("200");
        assertThat(stored.lastPingAt()).isEqualTo(now);
        assertThat(stored.lastLatencyMs()).isZero();
        stored = new KeepAliveConfig(true, 5, null, now.minusSeconds(300), "200", 10L, 0);
        service.tick();
        verify(client, times(2)).get(any());
    }

    @Test
    void expiryDisablesBeforeAnyPingIncludingAtExactDeadline() {
        stored = new KeepAliveConfig(true, 5, now, null, null, null, 0);
        service.tick();
        assertThat(stored.enabled()).isFalse();
        verifyNoInteractions(client);
        assertThat(service.get().enabled()).isFalse();
    }

    @Test
    void disabledOrMissingUrlDoesNotPing() {
        stored = KeepAliveConfig.disabled();
        service.tick();
        stored = new KeepAliveConfig(true, 5, null, null, null, null, 0);
        service = new KeepAliveService(repository, client, new KeepAliveTarget("", ""), clock);
        service.tick();
        verifyNoInteractions(client);
        assertThat(service.get().targetConfigured()).isFalse();
        assertThat(service.get().warning()).contains("BOOKWISE_PUBLIC_URL");
        assertThat(stored.lastPingAt()).isNull();
    }

    @Test
    void failuresCountAndSuccessResetsThem() throws Exception {
        when(client.get(any())).thenReturn(503).thenThrow(new IOException("not exposed")).thenReturn(200);
        service.tick();
        assertThat(stored.failureCount()).isEqualTo(1);
        assertThat(stored.lastStatus()).isEqualTo("503");
        stored = new KeepAliveConfig(true, 5, null, now.minusSeconds(300), stored.lastStatus(), 0L, 1);
        service.tick();
        assertThat(stored.failureCount()).isEqualTo(2);
        assertThat(stored.lastStatus()).isEqualTo("ERROR: IOException");
        stored = new KeepAliveConfig(true, 5, null, now.minusSeconds(300), stored.lastStatus(), 0L, 2);
        service.tick();
        assertThat(stored.failureCount()).isZero();
    }

    @Test
    void validatesIntervalAndFutureDeadline() {
        assertThatThrownBy(() -> service.update(new KeepAliveRequest(true, 6, null))).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> service.update(new KeepAliveRequest(true, 5, now))).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> service.update(new KeepAliveRequest(null, 5, null))).isInstanceOf(BusinessException.class);
        for (int interval : new int[] { 5, 10, 14 }) {
            assertThat(service.update(new KeepAliveRequest(true, interval, now.plusSeconds(3600))).intervalMinutes()).isEqualTo(interval);
        }
        assertThat(service.update(new KeepAliveRequest(false, 10, null)).enabled()).isFalse();
    }

    @Test
    void resolvesFallbackAndRejectsUnsafeOrInvalidUrls() {
        assertThat(new KeepAliveTarget(" ", "https://example.com/").healthUri().toString()).isEqualTo("https://example.com/actuator/health");
        assertThat(new KeepAliveTarget("file:///etc", "").healthUri()).isNull();
        assertThat(new KeepAliveTarget("https://user:password@example.com", "").healthUri()).isNull();
        assertThat(new KeepAliveTarget("not a url", "").healthUri()).isNull();
    }
}
