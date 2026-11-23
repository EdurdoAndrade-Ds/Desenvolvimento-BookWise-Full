package com.bookwise.infrastructure.persistence;

import com.bookwise.domain.model.report.BookLoanRanking;
import com.bookwise.domain.model.report.BorrowerRanking;
import com.bookwise.domain.model.report.LibrarySummary;
import com.bookwise.domain.model.report.LowStockBook;
import com.bookwise.domain.model.report.MonthlyLoanCount;
import com.bookwise.domain.port.ReportRepository;
import com.bookwise.infrastructure.persistence.repository.ReportJpaRepository;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Adapter que implementa a porta {@link ReportRepository} sobre as consultas nativas
 * de {@link ReportJpaRepository}.
 */
@Component
public class ReportRepositoryAdapter implements ReportRepository {

    private final ReportJpaRepository jpaRepository;

    public ReportRepositoryAdapter(ReportJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public LibrarySummary summary(int lowStockThreshold, LocalDate reference) {
        var row = jpaRepository.summary(lowStockThreshold, reference);
        return new LibrarySummary(
                row.getTotalBooks(),
                row.getPhysicalStock(),
                row.getLowStockBooks(),
                row.getTotalUsers(),
                row.getActiveLoans(),
                row.getOverdueLoans(),
                row.getMonthSalesTotal(),
                row.getPendingFines(),
                row.getPendingFinesTotal(),
                row.getActiveReservations());
    }

    @Override
    public List<BookLoanRanking> topBorrowedBooks(int limit) {
        return jpaRepository.topBorrowedBooks(limit).stream()
                .map(row -> new BookLoanRanking(
                        row.getBookId(),
                        row.getTitle(),
                        row.getAuthor(),
                        row.getLoanCount(),
                        row.getUnitsLoaned(),
                        row.getOpenLoans()))
                .toList();
    }

    @Override
    public List<MonthlyLoanCount> loansByMonth(LocalDate from, LocalDate reference) {
        return jpaRepository.loansByMonth(from, reference).stream()
                .map(row -> new MonthlyLoanCount(
                        YearMonth.of(row.getRefYear(), row.getRefMonth()),
                        row.getTotal(),
                        row.getReturned(),
                        row.getOverdue()))
                .toList();
    }

    @Override
    public List<BorrowerRanking> topBorrowers(int limit) {
        return jpaRepository.topBorrowers(limit).stream()
                .map(row -> new BorrowerRanking(
                        row.getUserId(),
                        row.getName(),
                        row.getEmail(),
                        row.getLoanCount(),
                        row.getOpenLoans(),
                        row.getPendingFineTotal()))
                .toList();
    }

    @Override
    public List<LowStockBook> lowStockBooks(int threshold) {
        return jpaRepository.lowStockBooks(threshold).stream()
                .map(row -> new LowStockBook(
                        row.getBookId(),
                        row.getTitle(),
                        row.getAuthor(),
                        row.getStock(),
                        row.getUnitsOnLoan(),
                        row.getActiveReservations()))
                .toList();
    }
}
