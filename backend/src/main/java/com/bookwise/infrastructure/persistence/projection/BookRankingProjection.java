package com.bookwise.infrastructure.persistence.projection;

/**
 * Projecao do ranking de livros mais emprestados.
 */
public interface BookRankingProjection {

    Long getBookId();

    String getTitle();

    String getAuthor();

    long getLoanCount();

    long getUnitsLoaned();

    long getOpenLoans();
}
