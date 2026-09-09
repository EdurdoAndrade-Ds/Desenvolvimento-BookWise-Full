package com.bookwise.domain.model;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Entidade de dominio Book. Imutavel e livre de dependencias de framework.
 */
public record Book(
        Long id,
        String title,
        String author,
        String isbn,
        String genre,
        Integer publishedYear,
        BookFormat format,
        BigDecimal price,
        Integer stock,
        List<CategoryRef> categories,
        OffsetDateTime createdAt) {

    /**
     * Cria uma copia deste livro aplicando os dados de uma atualizacao,
     * preservando id e data de criacao.
     */
    public Book withUpdatedData(
            String title,
            String author,
            String isbn,
            String genre,
            Integer publishedYear,
            BookFormat format,
            BigDecimal price,
            Integer stock,
            List<CategoryRef> categories) {
        return new Book(
                this.id, title, author, isbn, genre, publishedYear, format, price, stock,
                categories, this.createdAt);
    }

    /** Copia deste livro com um novo valor de estoque. */
    public Book withStock(Integer newStock) {
        return new Book(
                this.id, this.title, this.author, this.isbn, this.genre, this.publishedYear,
                this.format, this.price, newStock, this.categories, this.createdAt);
    }

    /** Copia deste livro com novas categorias associadas. */
    public Book withCategories(List<CategoryRef> newCategories) {
        return new Book(
                this.id, this.title, this.author, this.isbn, this.genre, this.publishedYear,
                this.format, this.price, this.stock, newCategories, this.createdAt);
    }
}
