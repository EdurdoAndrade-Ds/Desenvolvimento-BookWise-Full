package com.bookwise.domain.model;

import java.math.BigDecimal;
import java.math.MathContext;

/**
 * Sentido de um ajuste de preco em lote.
 */
public enum PriceAdjustmentType {

    /** Reduz o preco: 8% de desconto multiplica por 0.92. */
    DISCOUNT {
        @Override
        public BigDecimal factorFor(BigDecimal percentage) {
            return BigDecimal.ONE.subtract(rate(percentage));
        }
    },

    /** Aumenta o preco: 8% de aumento multiplica por 1.08. */
    INCREASE {
        @Override
        public BigDecimal factorFor(BigDecimal percentage) {
            return BigDecimal.ONE.add(rate(percentage));
        }
    };

    /**
     * Converte o percentual informado no fator aplicado ao preco.
     *
     * @param percentage percentual positivo (8 = 8%)
     * @return fator multiplicador do preco
     */
    public abstract BigDecimal factorFor(BigDecimal percentage);

    private static BigDecimal rate(BigDecimal percentage) {
        return percentage.divide(BigDecimal.valueOf(100), MathContext.DECIMAL64);
    }
}
