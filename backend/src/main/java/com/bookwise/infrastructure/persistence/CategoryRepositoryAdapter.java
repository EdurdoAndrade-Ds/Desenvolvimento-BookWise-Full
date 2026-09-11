package com.bookwise.infrastructure.persistence;

import com.bookwise.domain.model.Category;
import com.bookwise.domain.page.PageResult;
import com.bookwise.domain.port.CategoryRepository;
import com.bookwise.infrastructure.persistence.entity.CategoryEntity;
import com.bookwise.infrastructure.persistence.repository.CategoryJpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

/**
 * Adapter que implementa a porta {@link CategoryRepository} sobre o Spring Data JPA.
 */
@Component
public class CategoryRepositoryAdapter implements CategoryRepository {

    private final CategoryJpaRepository jpaRepository;

    public CategoryRepositoryAdapter(CategoryJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Category save(Category category) {
        CategoryEntity target = category.id() != null
                ? jpaRepository.findById(category.id()).orElse(null)
                : null;
        CategoryEntity parent = category.parentId() != null
                ? jpaRepository.findById(category.parentId()).orElse(null)
                : null;
        CategoryEntity saved = jpaRepository.save(CategoryEntityMapper.toEntity(category, target, parent));
        return CategoryEntityMapper.toDomain(saved);
    }

    @Override
    public Optional<Category> findById(Long id) {
        return jpaRepository.findById(id).map(CategoryEntityMapper::toDomain);
    }

    @Override
    public PageResult<Category> search(String query, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("name"));
        Page<CategoryEntity> result = (query == null || query.isBlank())
                ? jpaRepository.findAll(pageRequest)
                : jpaRepository.search(query.trim(), pageRequest);
        List<Category> content = result.getContent().stream()
                .map(CategoryEntityMapper::toDomain)
                .toList();
        return new PageResult<>(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    @Override
    public List<Category> findAll() {
        return jpaRepository.findAll(Sort.by("name")).stream()
                .map(CategoryEntityMapper::toDomain)
                .toList();
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
