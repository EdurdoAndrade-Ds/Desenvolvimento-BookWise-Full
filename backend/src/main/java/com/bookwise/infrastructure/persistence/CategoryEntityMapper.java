package com.bookwise.infrastructure.persistence;

import com.bookwise.domain.model.Category;
import com.bookwise.infrastructure.persistence.entity.CategoryEntity;

/**
 * Conversoes entre a entidade JPA de categoria e o modelo de dominio.
 */
final class CategoryEntityMapper {

    private CategoryEntityMapper() {
    }

    static Category toDomain(CategoryEntity entity) {
        CategoryEntity parent = entity.getParent();
        return new Category(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                parent != null ? parent.getId() : null,
                parent != null ? parent.getName() : null,
                entity.getCreatedAt());
    }

    /**
     * Aplica os dados do dominio na entidade. {@code parent} ja resolvido pelo adapter.
     */
    static CategoryEntity toEntity(Category category, CategoryEntity target, CategoryEntity parent) {
        CategoryEntity entity = target != null ? target : new CategoryEntity();
        entity.setName(category.name());
        entity.setDescription(category.description());
        entity.setParent(parent);
        if (category.createdAt() != null) {
            entity.setCreatedAt(category.createdAt());
        }
        return entity;
    }
}
