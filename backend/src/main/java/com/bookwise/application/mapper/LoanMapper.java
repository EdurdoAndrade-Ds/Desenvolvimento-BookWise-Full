package com.bookwise.application.mapper;

import com.bookwise.application.dto.LoanItemResponse;
import com.bookwise.application.dto.LoanResponse;
import com.bookwise.application.dto.PageMeta;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.domain.model.Loan;
import com.bookwise.domain.page.PageResult;
import java.time.LocalDate;
import java.util.List;

/**
 * Conversoes entre o dominio (Loan) e os DTOs da camada de aplicacao.
 * O status e derivado em relacao a data de referencia informada.
 */
public final class LoanMapper {

    private LoanMapper() {
    }

    public static LoanResponse toResponse(Loan loan, LocalDate reference) {
        List<LoanItemResponse> items = loan.items().stream()
                .map(i -> new LoanItemResponse(i.bookId(), i.bookTitle(), i.quantity()))
                .toList();
        return new LoanResponse(
                loan.id(),
                loan.userId(),
                loan.userName(),
                items,
                loan.loanDate(),
                loan.dueDate(),
                loan.returnDate(),
                loan.statusAt(reference));
    }

    public static PageResponse<LoanResponse> toPageResponse(PageResult<Loan> page, LocalDate reference) {
        List<LoanResponse> content = page.content().stream()
                .map(l -> toResponse(l, reference))
                .toList();
        PageMeta meta = new PageMeta(page.page(), page.size(), page.totalElements(), page.totalPages());
        return new PageResponse<>(content, meta);
    }
}
