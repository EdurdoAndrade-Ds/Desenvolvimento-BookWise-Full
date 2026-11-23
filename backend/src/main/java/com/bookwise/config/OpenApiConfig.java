package com.bookwise.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuracao do contrato OpenAPI / Swagger UI.
 *
 * <p>Apos subir a aplicacao, a documentacao fica disponivel em:
 * <ul>
 *   <li>Swagger UI: http://localhost:8080/swagger-ui.html</li>
 *   <li>Contrato JSON: http://localhost:8080/v3/api-docs</li>
 * </ul>
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI bookwiseOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("BookWise API")
                        .description("API do sistema de gestao de bibliotecas e livrarias fisicas e digitais. "
                                + "Controle de estoque, emprestimos, vendas e usuarios.")
                        .version("v0.0.1")
                        .contact(new Contact().name("Equipe BookWise"))
                        .license(new License().name("MIT")));
    }
}
