package com.bookwise.application.dto;

import com.bookwise.domain.model.PriceAdjustmentType;
import java.math.BigDecimal;

/**
 * Resultado de um ajuste de preco em lote.
 *
 * @param type         sentido do ajuste aplicado
 * @param percentage   percentual informado
 * @param factor       fator multiplicado no preco
 * @param updatedBooks quantidade de livros atualizados
 */
public record PriceAdjustmentResponse(
        PriceAdjustmentType type,
        BigDecimal percentage,
        BigDecimal factor,
        int updatedBooks) {
}
