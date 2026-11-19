package com.bookwise.infrastructure.persistence;

import com.bookwise.domain.model.User;
import com.bookwise.infrastructure.persistence.entity.UserEntity;

/**
 * Conversoes entre a entidade JPA e o modelo de dominio.
 */
final class UserEntityMapper {

    private UserEntityMapper() {
    }

    static User toDomain(UserEntity entity) {
        return new User(
                entity.getId(),
                entity.getName(),
                entity.getEmail(),
                entity.getRole(),
                entity.getCreatedAt());
    }

    /**
     * Aplica os dados do dominio na entidade. Quando {@code target} for nulo,
     * cria uma nova entidade (fluxo de insercao).
     */
    static UserEntity toEntity(User user, UserEntity target) {
        UserEntity entity = target != null ? target : new UserEntity();
        entity.setName(user.name());
        entity.setEmail(user.email());
        entity.setRole(user.role());
        if (user.createdAt() != null) {
            entity.setCreatedAt(user.createdAt());
        }
        return entity;
    }
}
