package com.bookwise.application.policy;

import com.bookwise.domain.exception.BusinessException;
import com.bookwise.domain.model.Book;
import com.bookwise.domain.model.BookFormat;
import com.bookwise.domain.port.BookRepository;
import org.springframework.stereotype.Component;

/**
 * Politica unica de movimentacao de estoque. Centraliza a regra "somente livro
 * fisico movimenta estoque", eliminando a duplicacao que existia entre
 * emprestimo, venda e reserva (cada fluxo repetia a checagem de formato, a
 * validacao de disponibilidade e a mensagem de erro).
 */
@Component
public class StockPolicy {

    private final BookRepository bookRepository;

    public StockPolicy(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    /**
     * Baixa o estoque de um livro fisico. Livros digitais nao possuem estoque e
     * sao ignorados.
     *
     * @param book     livro a movimentar
     * @param quantity quantidade solicitada
     * @throws BusinessException se o estoque disponivel for menor que a quantidade
     */
    public void withdraw(Book book, int quantity) {
        if (!movesStock(book)) {
            return;
        }
        int available = availableOf(book);
        if (available < quantity) {
            throw new BusinessException(
                    "Estoque insuficiente para o livro '" + book.title() + "' (disponivel: " + available + ")");
        }
        bookRepository.save(book.withStock(available - quantity));
    }

    /**
     * Devolve unidades ao estoque de um livro fisico (devolucao de emprestimo,
     * cancelamento de venda, liberacao de reserva).
     *
     * @param bookId   identificador do livro
     * @param quantity quantidade a restaurar
     */
    public void restore(Long bookId, int quantity) {
        bookRepository.findById(bookId).ifPresent(book -> {
            if (movesStock(book)) {
                bookRepository.save(book.withStock(availableOf(book) + quantity));
            }
        });
    }

    /** Indica se o livro tem estoque controlado (apenas exemplares fisicos). */
    public boolean movesStock(Book book) {
        return book.format() == BookFormat.PHYSICAL;
    }

    private int availableOf(Book book) {
        return book.stock() == null ? 0 : book.stock();
    }
}
