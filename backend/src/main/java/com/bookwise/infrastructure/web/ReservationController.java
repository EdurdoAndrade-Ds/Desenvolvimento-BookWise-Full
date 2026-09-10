package com.bookwise.infrastructure.web;

import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.dto.ReservationRequest;
import com.bookwise.application.dto.ReservationResponse;
import com.bookwise.application.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints REST para gestao de reservas.
 */
@RestController
@RequestMapping("/api/v1/reservations")
@Tag(name = "Reservations", description = "Controle de reservas de livros")
public class ReservationController {

    private final ReservationService service;

    public ReservationController(ReservationService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Lista reservas")
    public PageResponse<ReservationResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Filtra reservas pelo id do usuario.")
            @RequestParam(required = false) Long userId) {
        return service.list(page, size, userId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca reserva por id")
    public ReservationResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @Operation(summary = "Registra uma reserva")
    public ResponseEntity<ReservationResponse> create(@Valid @RequestBody ReservationRequest request) {
        ReservationResponse created = service.create(request);
        return ResponseEntity
                .created(URI.create("/api/v1/reservations/" + created.id()))
                .body(created);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancela uma reserva")
    public ReservationResponse cancel(@PathVariable Long id) {
        return service.cancel(id);
    }
}
