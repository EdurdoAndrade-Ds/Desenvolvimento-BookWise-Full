package com.bookwise.application.mapper;

import com.bookwise.application.dto.BookRankingResponse;
import com.bookwise.application.dto.BorrowerRankingResponse;
import com.bookwise.application.dto.LibrarySummaryResponse;
import com.bookwise.application.dto.LowStockBookResponse;
import com.bookwise.application.dto.MonthlyLoanResponse;
import com.bookwise.domain.model.report.BookLoanRanking;
import com.bookwise.domain.model.report.BorrowerRanking;
import com.bookwise.domain.model.report.LibrarySummary;
import com.bookwise.domain.model.report.LowStockBook;
import com.bookwise.domain.model.report.MonthlyLoanCount;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;

/**
 * Conversao dos relatorios de dominio para os DTOs expostos pela API.
 */
public final class ReportMapper {

    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    private ReportMapper() {
    }

    public static LibrarySummaryResponse toResponse(LibrarySummary summary) {
        return new LibrarySummaryResponse(
                summary.totalBooks(),
                summary.physicalStock(),
                summary.lowStockBooks(),
                summary.totalUsers(),
                summary.activeLoans(),
                summary.overdueLoans(),
                summary.monthSalesTotal(),
                summary.pendingFines(),
                summary.pendingFinesTotal(),
                summary.activeReservations());
    }

    public static BookRankingResponse toResponse(BookLoanRanking ranking) {
        return new BookRankingResponse(
                ranking.bookId(),
                ranking.title(),
                ranking.author(),
                ranking.loanCount(),
                ranking.unitsLoaned(),
                ranking.openLoans());
    }

    public static MonthlyLoanResponse toResponse(MonthlyLoanCount count) {
        return new MonthlyLoanResponse(
                format(count.month()), count.total(), count.returned(), count.overdue());
    }

    public static BorrowerRankingResponse toResponse(BorrowerRanking ranking) {
        return new BorrowerRankingResponse(
                ranking.userId(),
                ranking.name(),
                ranking.email(),
                ranking.loanCount(),
                ranking.openLoans(),
                ranking.pendingFineTotal());
    }

    public static LowStockBookResponse toResponse(LowStockBook book) {
        return new LowStockBookResponse(
                book.bookId(),
                book.title(),
                book.author(),
                book.stock(),
                book.unitsOnLoan(),
                book.activeReservations());
    }

    public static String format(YearMonth month) {
        return month.format(MONTH_FORMAT);
    }
}
