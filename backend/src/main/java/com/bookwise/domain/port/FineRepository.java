package com.bookwise.domain.port;

import com.bookwise.domain.model.Fine;
import com.bookwise.domain.page.PageResult;
import java.util.List;
import java.util.Optional;

/**
 * Porta de saida para persistencia de multas.
 */
public interface FineRepository {

    Fine save(Fine fine);

    Optional<Fine> findById(Long id);

    PageResult<Fine> findAll(int page, int size);

    PageResult<Fine> findAllByUserId(Long userId, int page, int size);

    List<Fine> findAll();

    boolean existsByLoanId(Long loanId);

    long count();
}
