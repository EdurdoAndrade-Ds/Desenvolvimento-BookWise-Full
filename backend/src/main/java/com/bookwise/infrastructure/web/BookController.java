package com.bookwise.infrastructure.web;

import com.bookwise.application.dto.BookRequest;
import com.bookwise.application.dto.BookResponse;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.service.BookService;
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
 * Endpoints REST para gestao de livros. Alinhado ao contrato
 * {@code contracts/openapi.yaml}.
 */
@RestController
@RequestMapping("/api/v1/books")
@Tag(name = "Books", description = "Gestao de livros e estoque (fisico e digital)")
public class BookController {

    private final BookService service;

    public BookController(BookService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Lista livros", description = "Retorna uma pagina de livros, com filtro opcional por titulo, autor ou ISBN.")
    public PageResponse<BookResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q) {
        return service.list(q, page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca livro por id")
    public BookResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @Operation(summary = "Cria um livro")
    public ResponseEntity<BookResponse> create(@Valid @RequestBody BookRequest request) {
        BookResponse created = service.create(request);
        return ResponseEntity
                .created(URI.create("/api/v1/books/" + created.id()))
                .body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza um livro")
    public BookResponse update(@PathVariable Long id, @Valid @RequestBody BookRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove um livro")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
