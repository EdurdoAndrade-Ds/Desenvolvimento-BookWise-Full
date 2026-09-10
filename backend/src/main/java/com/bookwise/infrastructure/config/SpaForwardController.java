package com.bookwise.infrastructure.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Encaminha rotas do React Router para o shell estatico da aplicacao.
 */
@Controller
public class SpaForwardController {

    private static final String SPA_PATH =
            "^(?!api$|v3$|swagger-ui(?:\\..*|$)|actuator(?:\\..*|$)|h2-console(?:\\..*|$))[^.]*$";

    @GetMapping({"/{path:" + SPA_PATH + "}", "/{path:" + SPA_PATH + "}/**"})
    public String forward() {
        return "forward:/index.html";
    }
}
