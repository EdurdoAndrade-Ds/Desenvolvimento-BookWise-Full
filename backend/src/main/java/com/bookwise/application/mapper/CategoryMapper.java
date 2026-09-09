package com.bookwise.application.mapper;

import com.bookwise.application.dto.CategoryRequest;
import com.bookwise.application.dto.CategoryResponse;
import com.bookwise.application.dto.PageMeta;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.domain.model.Category;
import com.bookwise.domain.page.PageResult;
import java.util.List;

/**
 * Conversoes entre o dominio (Category) e os DTOs da camada de aplicacao.
 */
public final class CategoryMapper {

    private CategoryMapper() {
    }

    /** Converte uma requisicao em uma nova categoria (sem id/createdAt). */
    public static Category toNewDomain(CategoryRequest request) {
        return new Category(null, request.name(), request.description(), request.parentId(), null, null);
    }

    public static CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
                category.id(),
                category.name(),
                category.description(),
                category.parentId(),
                category.parentName(),
                category.createdAt());
    }

    public static PageResponse<CategoryResponse> toPageResponse(PageResult<Category> page) {
        List<CategoryResponse> content = page.content().stream().map(CategoryMapper::toResponse).toList();
        PageMeta meta = new PageMeta(page.page(), page.size(), page.totalElements(), page.totalPages());
        return new PageResponse<>(content, meta);
    }
}
