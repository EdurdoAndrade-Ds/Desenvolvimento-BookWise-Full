package com.bookwise.application.service;

import com.bookwise.application.dto.BookRankingResponse;
import com.bookwise.application.dto.BorrowerRankingResponse;
import com.bookwise.application.dto.LibrarySummaryResponse;
import com.bookwise.application.dto.LowStockBookResponse;
import com.bookwise.application.dto.MonthlyLoanResponse;
import com.bookwise.application.mapper.ReportMapper;
import com.bookwise.config.BusinessProperties;
import com.bookwise.domain.model.report.MonthlyLoanCount;
import com.bookwise.domain.port.ReportRepository;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso dos relatorios analiticos. As agregacoes sao feitas em SQL nativo
 * (ver {@code ReportJpaRepository}); aqui apenas aplicamos os parametros
 * configuraveis e completamos os meses sem movimento na serie historica.
 */
@Service
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository repository;
    private final BusinessProperties properties;

    public ReportService(ReportRepository repository, BusinessProperties properties) {
        this.repository = repository;
        this.properties = properties;
    }

    /**
     * Indicadores consolidados do acervo.
     *
     * @return resumo com contagens, somas e valores em aberto
     */
    public LibrarySummaryResponse summary() {
        return ReportMapper.toResponse(
                repository.summary(properties.report().lowStockThreshold(), LocalDate.now()));
    }

    /**
     * Ranking dos livros mais emprestados.
     *
     * @param limit quantidade de linhas, ou {@code null} para o padrao configurado
     * @return livros ordenados por numero de emprestimos
     */
    public List<BookRankingResponse> topBorrowedBooks(Integer limit) {
        return repository.topBorrowedBooks(resolveLimit(limit)).stream()
                .map(ReportMapper::toResponse)
                .toList();
    }

    /**
     * Serie historica de emprestimos por mes, incluindo meses sem movimento.
     *
     * @param months quantidade de meses, ou {@code null} para o padrao configurado
     * @return serie ordenada do mes mais antigo para o mais recente
     */
    public List<MonthlyLoanResponse> loansByMonth(Integer months) {
        int window = months != null && months > 0 ? months : properties.report().historyMonths();
        YearMonth first = YearMonth.now().minusMonths(window - 1L);
        Map<YearMonth, MonthlyLoanCount> byMonth =
                repository.loansByMonth(first.atDay(1), LocalDate.now()).stream()
                        .collect(Collectors.toMap(MonthlyLoanCount::month, Function.identity()));

        List<MonthlyLoanResponse> series = new ArrayList<>(window);
        for (int i = 0; i < window; i++) {
            YearMonth month = first.plusMonths(i);
            MonthlyLoanCount count = byMonth.get(month);
            series.add(count == null
                    ? new MonthlyLoanResponse(ReportMapper.format(month), 0, 0, 0)
                    : ReportMapper.toResponse(count));
        }
        return series;
    }

    /**
     * Ranking dos usuarios com mais emprestimos.
     *
     * @param limit quantidade de linhas, ou {@code null} para o padrao configurado
     * @return usuarios ordenados por numero de emprestimos
     */
    public List<BorrowerRankingResponse> topBorrowers(Integer limit) {
        return repository.topBorrowers(resolveLimit(limit)).stream()
                .map(ReportMapper::toResponse)
                .toList();
    }

    /**
     * Livros fisicos com estoque igual ou abaixo do limite.
     *
     * @param threshold limite de estoque, ou {@code null} para o padrao configurado
     * @return livros ordenados do menor para o maior estoque
     */
    public List<LowStockBookResponse> lowStockBooks(Integer threshold) {
        int limit = threshold != null && threshold >= 0
                ? threshold
                : properties.report().lowStockThreshold();
        return repository.lowStockBooks(limit).stream()
                .map(ReportMapper::toResponse)
                .toList();
    }

    private int resolveLimit(Integer limit) {
        return limit != null && limit > 0 ? limit : properties.report().rankingSize();
    }
}
