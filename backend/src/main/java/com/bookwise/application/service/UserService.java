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

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> list(String query, int page, int size) {
        return UserMapper.toPageResponse(repository.search(query, page, size));
    }

    @Transactional(readOnly = true)
    public UserResponse getById(Long id) {
        return repository.findById(id)
                .map(UserMapper::toResponse)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    public UserResponse create(UserRequest request) {
        User saved = repository.save(UserMapper.toNewDomain(request));
        return UserMapper.toResponse(saved);
    }

    public UserResponse update(Long id, UserRequest request) {
        User existing = repository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        User updated = existing.withUpdatedData(request.name(), request.email(), request.role());
        return UserMapper.toResponse(repository.save(updated));
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new UserNotFoundException(id);
        }
        repository.deleteById(id);
    }
}
