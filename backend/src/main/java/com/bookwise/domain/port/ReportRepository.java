package com.bookwise.domain.port;

import com.bookwise.domain.model.report.BookLoanRanking;
import com.bookwise.domain.model.report.BorrowerRanking;
import com.bookwise.domain.model.report.LibrarySummary;
import com.bookwise.domain.model.report.LowStockBook;
import com.bookwise.domain.model.report.MonthlyLoanCount;
import java.time.LocalDate;
import java.util.List;

/**
 * Porta de saida para os relatorios analiticos, agregados diretamente no banco.
 */
public interface ReportRepository {

    LibrarySummary summary(int lowStockThreshold, LocalDate reference);

    List<BookLoanRanking> topBorrowedBooks(int limit);

    List<MonthlyLoanCount> loansByMonth(LocalDate from, LocalDate reference);

    List<BorrowerRanking> topBorrowers(int limit);

    List<LowStockBook> lowStockBooks(int threshold);
}
