package com.bookwise.application.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bookwise.application.dto.CategoryRequest;
import com.bookwise.domain.exception.BusinessException;
import com.bookwise.domain.model.Category;
import com.bookwise.domain.port.CategoryRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository repository;

    private CategoryService service;

    @BeforeEach
    void setUp() {
        service = new CategoryService(repository);
    }

    @Test
    void updateShouldRejectCategoryAsItsOwnParent() {
        Category category = new Category(1L, "Fiction", null, null, null, null);
        when(repository.findById(category.id())).thenReturn(Optional.of(category));

        assertThrows(BusinessException.class,
                () -> service.update(category.id(), new CategoryRequest("Fiction", null, category.id())));

        verify(repository, never()).existsById(any());
        verify(repository, never()).save(any(Category.class));
    }
}
