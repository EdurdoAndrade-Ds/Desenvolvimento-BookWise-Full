package com.bookwise.infrastructure.web;

import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.dto.UserRequest;
import com.bookwise.application.dto.UserResponse;
import com.bookwise.application.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints REST para gestao de usuarios. Alinhado ao contrato
 * {@code contracts/openapi.yaml}.
 */
@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "Gestao de usuarios (leitores, bibliotecarios, administradores)")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Lista usuarios", description = "Retorna uma pagina de usuarios, com filtro opcional por nome ou email.")
    public PageResponse<UserResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q) {
        return service.list(q, page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca usuario por id")
    public UserResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @Operation(summary = "Cria um usuario")
    public ResponseEntity<UserResponse> create(@Valid @RequestBody UserRequest request) {
        UserResponse created = service.create(request);
        return ResponseEntity
                .created(URI.create("/api/v1/users/" + created.id()))
                .body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza um usuario")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove um usuario")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
