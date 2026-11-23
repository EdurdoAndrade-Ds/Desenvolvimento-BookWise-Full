package com.bookwise.application.dto;

/**
 * Linha do ranking de livros mais emprestados.
 *
 * @param bookId      identificador do livro
 * @param title       titulo
 * @param author      autor
 * @param loanCount   quantidade de emprestimos que incluiram o livro
 * @param unitsLoaned soma das unidades emprestadas
 * @param openLoans   emprestimos do livro ainda em aberto
 */
public record BookRankingResponse(
        Long bookId,
        String title,
        String author,
        long loanCount,
        long unitsLoaned,
        long openLoans) {
}
