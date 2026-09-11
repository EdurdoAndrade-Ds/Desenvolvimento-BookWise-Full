package com.bookwise;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Ponto de entrada da aplicacao BookWise.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class BookwiseApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookwiseApplication.class, args);
    }
}
