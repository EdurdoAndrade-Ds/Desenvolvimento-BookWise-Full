package com.bookwise.application.service;

import com.bookwise.application.dto.CategoryRequest;
import com.bookwise.application.dto.CategoryResponse;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.mapper.CategoryMapper;
import com.bookwise.domain.exception.BusinessException;
import com.bookwise.domain.exception.CategoryNotFoundException;
import com.bookwise.domain.model.Category;
import com.bookwise.domain.port.CategoryRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso relacionados a categorias.
 */
@Service
@Transactional
public class CategoryService {

    private final CategoryRepository repository;

    public CategoryService(CategoryRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponse<CategoryResponse> list(String query, int page, int size) {
        return CategoryMapper.toPageResponse(repository.search(query, page, size));
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listAll() {
        return repository.findAll().stream().map(CategoryMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getById(Long id) {
        return repository.findById(id)
                .map(CategoryMapper::toResponse)
                .orElseThrow(() -> new CategoryNotFoundException(id));
    }

    public CategoryResponse create(CategoryRequest request) {
        validateParent(request.parentId(), null);
        return CategoryMapper.toResponse(repository.save(CategoryMapper.toNewDomain(request)));
    }

    public CategoryResponse update(Long id, CategoryRequest request) {
        Category existing = repository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException(id));
        validateParent(request.parentId(), id);
        Category updated = existing.withUpdatedData(request.name(), request.description(), request.parentId());
        return CategoryMapper.toResponse(repository.save(updated));
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new CategoryNotFoundException(id);
        }
        repository.deleteById(id);
    }

    private void validateParent(Long parentId, Long selfId) {
        if (parentId == null) {
            return;
        }
        if (parentId.equals(selfId)) {
            throw new BusinessException("Uma categoria nao pode ser pai de si mesma");
        }
        if (!repository.existsById(parentId)) {
            throw new CategoryNotFoundException(parentId);
        }
    }
}
