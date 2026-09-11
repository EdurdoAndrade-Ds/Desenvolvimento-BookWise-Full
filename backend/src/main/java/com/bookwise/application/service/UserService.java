package com.bookwise.application.service;

import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.dto.UserRequest;
import com.bookwise.application.dto.UserResponse;
import com.bookwise.application.mapper.UserMapper;
import com.bookwise.domain.exception.UserNotFoundException;
import com.bookwise.domain.model.User;
import com.bookwise.domain.port.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso relacionados a usuarios.
 */
@Service
@Transactional
public class UserService {

    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    /**
     * Lista uma pagina de usuarios, opcionalmente filtrando por um termo.
     *
     * @param query termo de busca (nome/email), ou {@code null} para todos
     * @param page  indice da pagina (base zero)
     * @param size  tamanho da pagina
     * @return pagina de usuarios
     */
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> list(String query, int page, int size) {
        return UserMapper.toPageResponse(repository.search(query, page, size));
    }

    /**
     * Busca um usuario pelo identificador.
     *
     * @param id identificador do usuario
     * @return o usuario encontrado
     * @throws UserNotFoundException se nao existir usuario com o id informado
     */
    @Transactional(readOnly = true)
    public UserResponse getById(Long id) {
        return repository.findById(id)
                .map(UserMapper::toResponse)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    /**
     * Cria um novo usuario.
     *
     * @param request dados do usuario
     * @return o usuario criado
     */
    public UserResponse create(UserRequest request) {
        User saved = repository.save(UserMapper.toNewDomain(request));
        return UserMapper.toResponse(saved);
    }

    /**
     * Atualiza um usuario existente, preservando id e data de criacao.
     *
     * @param id      identificador do usuario
     * @param request novos dados do usuario
     * @return o usuario atualizado
     * @throws UserNotFoundException se o usuario nao existir
     */
    public UserResponse update(Long id, UserRequest request) {
        User existing = repository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        User updated = existing.withUpdatedData(request.name(), request.email(), request.role());
        return UserMapper.toResponse(repository.save(updated));
    }

    /**
     * Remove um usuario pelo identificador.
     *
     * @param id identificador do usuario
     * @throws UserNotFoundException se o usuario nao existir
     */
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new UserNotFoundException(id);
        }
        repository.deleteById(id);
    }
}
