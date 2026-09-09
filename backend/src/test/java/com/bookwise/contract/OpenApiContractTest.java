package com.bookwise.contract;

import static org.assertj.core.api.Assertions.assertThat;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.parser.OpenAPIV3Parser;
import io.swagger.v3.parser.core.models.ParseOptions;
import io.swagger.v3.parser.core.models.SwaggerParseResult;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

/**
 * Garante que o contrato de referencia (contracts/openapi.yaml) e um documento
 * OpenAPI valido. Roda a cada build, protegendo o contrato contra regressoes.
 */
class OpenApiContractTest {

    private static final Path CONTRACT = Path.of("..", "contracts", "openapi.yaml");

    @Test
    void contractFileExists() {
        assertThat(Files.exists(CONTRACT))
                .as("contrato esperado em %s", CONTRACT.toAbsolutePath())
                .isTrue();
    }

    @Test
    void contractIsValidOpenApi() {
        ParseOptions options = new ParseOptions();
        options.setResolve(true);
        options.setResolveFully(true);

        SwaggerParseResult result =
                new OpenAPIV3Parser().readLocation(CONTRACT.toString(), null, options);

        assertThat(result.getMessages())
                .as("erros de validacao do contrato OpenAPI")
                .isEmpty();

        OpenAPI api = result.getOpenAPI();
        assertThat(api).isNotNull();
        assertThat(api.getInfo().getTitle()).isEqualTo("BookWise API");
        assertThat(api.getPaths()).isNotEmpty();
    }
}
