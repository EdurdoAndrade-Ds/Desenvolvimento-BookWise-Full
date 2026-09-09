package com.bookwise.domain.model;

/**
 * Filtro dos livros afetados por um ajuste de preco em lote. Todos os campos
 * sao opcionais e combinaveis; nulos em todos eles atinge o acervo inteiro.
 *
 * @param bookId         id de um livro especifico
 * @param categoryId     id de uma categoria
 * @param titleContains  trecho do titulo
 */
public record PriceAdjustment(Long bookId, Long categoryId, String titleContains) {
}
