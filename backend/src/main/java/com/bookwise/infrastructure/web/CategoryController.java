package com.bookwise.infrastructure.web;

import com.bookwise.application.dto.CategoryRequest;
import com.bookwise.application.dto.CategoryResponse;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
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
 * Endpoints REST para gestao de categorias (com auto-relacionamento).
 */
@RestController
@RequestMapping("/api/v1/categories")
@Tag(name = "Categories", description = "Gestao de categorias de livros")
public class CategoryController {

    private final CategoryService service;

    public CategoryController(CategoryService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Lista categorias", description = "Pagina de categorias, com filtro opcional por nome/descricao.")
    public PageResponse<CategoryResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q) {
        return service.list(q, page, size);
    }

    @GetMapping("/all")
    @Operation(summary = "Lista todas as categorias", description = "Sem paginacao (para seletor de categoria pai).")
    public List<CategoryResponse> listAll() {
        return service.listAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca categoria por id")
    public CategoryResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @Operation(summary = "Cria uma categoria")
    public ResponseEntity<CategoryResponse> create(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse created = service.create(request);
        return ResponseEntity
                .created(URI.create("/api/v1/categories/" + created.id()))
                .body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza uma categoria")
    public CategoryResponse update(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove uma categoria")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
