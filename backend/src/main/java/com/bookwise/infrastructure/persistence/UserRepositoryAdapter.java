package com.bookwise.infrastructure.persistence;

import com.bookwise.domain.model.User;
import com.bookwise.domain.page.PageResult;
import com.bookwise.domain.port.UserRepository;
import com.bookwise.infrastructure.persistence.entity.UserEntity;
import com.bookwise.infrastructure.persistence.repository.UserJpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

/**
 * Adapter que implementa a porta de dominio {@link UserRepository} sobre o
 * Spring Data JPA, convertendo entre entidade e dominio.
 */
@Component
public class UserRepositoryAdapter implements UserRepository {

    private final UserJpaRepository jpaRepository;

    public UserRepositoryAdapter(UserJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public User save(User user) {
        UserEntity target = user.id() != null
                ? jpaRepository.findById(user.id()).orElse(null)
                : null;
        UserEntity saved = jpaRepository.save(UserEntityMapper.toEntity(user, target));
        return UserEntityMapper.toDomain(saved);
    }

    @Override
    public Optional<User> findById(Long id) {
        return jpaRepository.findById(id).map(UserEntityMapper::toDomain);
    }

    @Override
    public PageResult<User> search(String query, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<UserEntity> result = (query == null || query.isBlank())
                ? jpaRepository.findAll(pageRequest)
                : jpaRepository.search(query.trim(), pageRequest);
        List<User> content = result.getContent().stream()
                .map(UserEntityMapper::toDomain)
                .toList();
        return new PageResult<>(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    @Override
    public boolean existsById(Long id) {
        return jpaRepository.existsById(id);
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public long count() {
        return jpaRepository.count();
    }
}
