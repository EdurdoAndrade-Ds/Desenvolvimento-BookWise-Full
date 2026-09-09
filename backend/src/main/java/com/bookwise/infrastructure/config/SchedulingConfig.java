package com.bookwise.infrastructure.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Habilita o agendador das rotinas de manutencao (expiracao de reservas e
 * cobranca de atrasos). Desligue com {@code bookwise.jobs.enabled=false}.
 */
@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "bookwise.jobs.enabled", havingValue = "true", matchIfMissing = true)
public class SchedulingConfig {
}
