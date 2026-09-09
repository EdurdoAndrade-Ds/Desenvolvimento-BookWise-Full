package com.bookwise.application.mapper;

import com.bookwise.application.dto.PageMeta;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.dto.UserRequest;
import com.bookwise.application.dto.UserResponse;
import com.bookwise.domain.model.User;
import com.bookwise.domain.page.PageResult;
import java.util.List;

/**
 * Conversoes entre o dominio (User) e os DTOs da camada de aplicacao.
 */
public final class UserMapper {

    private UserMapper() {
    }

    /** Converte uma requisicao em um novo User (sem id/createdAt). */
    public static User toNewDomain(UserRequest request) {
        return new User(null, request.name(), request.email(), request.role(), null);
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(
                user.id(),
                user.name(),
                user.email(),
                user.role(),
                user.createdAt());
    }

    public static PageResponse<UserResponse> toPageResponse(PageResult<User> page) {
        List<UserResponse> content = page.content().stream()
                .map(UserMapper::toResponse)
                .toList();
        PageMeta meta = new PageMeta(page.page(), page.size(), page.totalElements(), page.totalPages());
        return new PageResponse<>(content, meta);
    }
}
