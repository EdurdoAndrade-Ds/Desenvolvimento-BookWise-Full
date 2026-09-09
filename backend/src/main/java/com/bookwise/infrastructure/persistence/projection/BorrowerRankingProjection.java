package com.bookwise.infrastructure.persistence.projection;

import java.math.BigDecimal;

/**
 * Projecao do ranking de usuarios que mais pegaram livros emprestados.
 */
public interface BorrowerRankingProjection {

    Long getUserId();

    String getName();

    String getEmail();

    long getLoanCount();

    long getOpenLoans();

    BigDecimal getPendingFineTotal();
}
