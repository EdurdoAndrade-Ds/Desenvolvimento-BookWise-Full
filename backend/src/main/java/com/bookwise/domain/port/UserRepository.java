package com.bookwise.domain.port;

import com.bookwise.domain.model.User;
import com.bookwise.domain.page.PageResult;
import java.util.Optional;

/**
 * Porta de saida para persistencia de usuarios.
 */
public interface UserRepository {

    User save(User user);

    Optional<User> findById(Long id);

    /**
     * Busca paginada. Quando {@code query} for nulo/vazio, retorna todos os usuarios.
     */
    PageResult<User> search(String query, int page, int size);

    boolean existsById(Long id);

    void deleteById(Long id);

    long count();
}
