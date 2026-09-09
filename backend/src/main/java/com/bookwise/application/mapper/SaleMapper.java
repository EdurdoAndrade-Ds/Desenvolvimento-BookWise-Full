package com.bookwise.application.mapper;

import com.bookwise.application.dto.PageMeta;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.dto.SaleItemResponse;
import com.bookwise.application.dto.SaleResponse;
import com.bookwise.domain.model.Sale;
import com.bookwise.domain.page.PageResult;
import java.util.List;

/**
 * Conversoes entre o dominio (Sale) e os DTOs da camada de aplicacao.
 */
public final class SaleMapper {

    private SaleMapper() {
    }

    public static SaleResponse toResponse(Sale sale) {
        List<SaleItemResponse> items = sale.items().stream()
                .map(i -> new SaleItemResponse(i.bookId(), i.bookTitle(), i.quantity(), i.unitPrice()))
                .toList();
        return new SaleResponse(
                sale.id(),
                sale.userId(),
                sale.userName(),
                items,
                sale.paymentMethod(),
                sale.saleDate(),
                sale.totalPrice(),
                sale.status());
    }

    public static PageResponse<SaleResponse> toPageResponse(PageResult<Sale> page) {
        List<SaleResponse> content = page.content().stream().map(SaleMapper::toResponse).toList();
        PageMeta meta = new PageMeta(page.page(), page.size(), page.totalElements(), page.totalPages());
        return new PageResponse<>(content, meta);
    }
}
