package com.bookwise.infrastructure.persistence;

import com.bookwise.domain.model.Sale;
import com.bookwise.domain.model.SaleItem;
import com.bookwise.infrastructure.persistence.entity.SaleEntity;
import com.bookwise.infrastructure.persistence.entity.SaleItemEntity;
import java.util.List;

/**
 * Conversoes entre a entidade JPA de venda e o modelo de dominio.
 */
final class SaleEntityMapper {

    private SaleEntityMapper() {
    }

    static Sale toDomain(SaleEntity entity) {
        List<SaleItem> items = entity.getItems().stream()
                .map(i -> new SaleItem(i.getBookId(), i.getBookTitle(), i.getQuantity(), i.getUnitPrice()))
                .toList();
        return new Sale(
                entity.getId(),
                entity.getUserId(),
                entity.getUserName(),
                items,
                entity.getPaymentMethod(),
                entity.getSaleDate(),
                entity.getTotalPrice(),
                entity.getStatus(),
                entity.getCreatedAt());
    }

    /**
     * Aplica os dados do dominio na entidade. Quando {@code target} for nulo,
     * cria uma nova entidade (insercao) com seus itens.
     */
    static SaleEntity toEntity(Sale sale, SaleEntity target) {
        SaleEntity entity = target != null ? target : new SaleEntity();
        entity.setUserId(sale.userId());
        entity.setUserName(sale.userName());
        entity.setPaymentMethod(sale.paymentMethod());
        entity.setSaleDate(sale.saleDate());
        entity.setTotalPrice(sale.totalPrice());
        entity.setStatus(sale.status());
        if (sale.createdAt() != null) {
            entity.setCreatedAt(sale.createdAt());
        }
        // Itens sao definidos apenas na criacao.
        if (target == null) {
            for (SaleItem item : sale.items()) {
                SaleItemEntity itemEntity = new SaleItemEntity();
                itemEntity.setBookId(item.bookId());
                itemEntity.setBookTitle(item.bookTitle());
                itemEntity.setQuantity(item.quantity());
                itemEntity.setUnitPrice(item.unitPrice());
                entity.addItem(itemEntity);
            }
        }
        return entity;
    }
}
