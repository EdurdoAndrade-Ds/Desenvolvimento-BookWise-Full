package com.bookwise.infrastructure.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.OffsetDateTime;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint simples para verificar se a API esta no ar.
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Health", description = "Verificacao de disponibilidade da API")
public class HealthController {

    @GetMapping("/ping")
    @Operation(summary = "Ping", description = "Retorna 'pong' e o horario do servidor para confirmar que a API esta no ar.")
    public Map<String, Object> ping() {
        return Map.of(
                "message", "pong",
                "service", "bookwise-api",
                "timestamp", OffsetDateTime.now().toString());
    }
}
