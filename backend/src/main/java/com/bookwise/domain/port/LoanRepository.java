package com.bookwise.domain.port;

import com.bookwise.domain.model.Loan;
import com.bookwise.domain.page.PageResult;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Porta de saida para persistencia de emprestimos.
 */
public interface LoanRepository {

    Loan save(Loan loan);

    Optional<Loan> findById(Long id);

    /** Pagina de emprestimos, ordenada do mais recente para o mais antigo. */
    PageResult<Loan> findAll(int page, int size);

    PageResult<Loan> findAllByUserId(Long userId, int page, int size);

    /** Todos os emprestimos (uso em agregacoes/estatisticas com volume pequeno). */
    List<Loan> findAll();

    /** Quantidade de emprestimos em aberto (sem devolucao) do usuario. */
    long countOpenByUserId(Long userId);

    /** Emprestimos em aberto cuja data prevista de devolucao ja passou. */
    List<Loan> findOpenOverdue(LocalDate reference);

    long count();
}
