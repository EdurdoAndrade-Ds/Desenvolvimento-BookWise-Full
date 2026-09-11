package com.bookwise.application.dto;

import com.bookwise.domain.model.PriceAdjustmentType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Dados de entrada para um ajuste de preco em lote. O percentual e sempre
 * positivo: {@code type=DISCOUNT} reduz o preco e {@code type=INCREASE} aumenta.
 * Os filtros sao opcionais e combinaveis; sem nenhum deles o ajuste vale para
 * todo o acervo.
 */
public record DiscountRequest(
        @NotNull(message = "O percentual e obrigatorio")
        @DecimalMin(value = "0.01", message = "O percentual deve ser maior que zero")
        @DecimalMax(value = "90.00", message = "O percentual deve ser de no maximo 90")
        BigDecimal percentage,

        PriceAdjustmentType type,

        Long bookId,

        Long categoryId,

        String titleContains) {

    public PriceAdjustmentType resolvedType() {
        return type == null ? PriceAdjustmentType.DISCOUNT : type;
    }
}
