package com.bookwise.application.mapper;

import com.bookwise.application.dto.FineResponse;
import com.bookwise.application.dto.PageMeta;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.domain.model.Fine;
import com.bookwise.domain.page.PageResult;
import java.util.List;

/**
 * Conversoes entre o dominio (Fine) e os DTOs da camada de aplicacao.
 */
public final class FineMapper {

    private FineMapper() {
    }

    public static FineResponse toResponse(Fine fine) {
        return new FineResponse(
                fine.id(),
                fine.loanId(),
                fine.userName(),
                fine.value(),
                fine.daysLate(),
                fine.paymentStatus(),
                fine.paymentDate());
    }

    public static PageResponse<FineResponse> toPageResponse(PageResult<Fine> page) {
        List<FineResponse> content = page.content().stream().map(FineMapper::toResponse).toList();
        PageMeta meta = new PageMeta(page.page(), page.size(), page.totalElements(), page.totalPages());
        return new PageResponse<>(content, meta);
    }
}
