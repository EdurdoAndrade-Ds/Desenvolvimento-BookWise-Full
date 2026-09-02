package com.bookwise.domain.model;

import java.time.OffsetDateTime;

/**
 * Entidade de dominio User. Imutavel e livre de dependencias de framework.
 */
public record User(
        Long id,
        String name,
        String email,
        UserRole role,
        OffsetDateTime createdAt) {

    /**
     * Cria uma copia deste usuario aplicando os dados de uma atualizacao,
     * preservando id e data de criacao.
     */
    public User withUpdatedData(String name, String email, UserRole role) {
        return new User(this.id, name, email, role, this.createdAt);
    }
}
