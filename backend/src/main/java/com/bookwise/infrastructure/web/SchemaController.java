package com.bookwise.infrastructure.web;

import com.bookwise.infrastructure.schema.SchemaIntrospectionService;
import com.bookwise.infrastructure.schema.SchemaResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint somente leitura para visualizar a estrutura do banco.
 */
@RestController
@RequestMapping("/api/v1/schema")
@Tag(name = "Schema", description = "Metadados estruturais do banco de dados")
public class SchemaController {

    private final SchemaIntrospectionService service;

    public SchemaController(SchemaIntrospectionService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(
            summary = "Inspeciona o schema do banco",
            description = "Retorna tabelas, atributos e relacionamentos via introspeccao JDBC, sem dados de linhas.")
    public SchemaResponse inspect() {
        return service.inspect();
    }
}
