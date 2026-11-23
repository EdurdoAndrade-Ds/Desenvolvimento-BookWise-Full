package com.bookwise.infrastructure.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KeepAliveClockConfig {
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
