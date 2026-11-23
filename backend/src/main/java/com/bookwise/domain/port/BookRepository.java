package com.bookwise.domain.port;

import com.bookwise.domain.model.Book;
import com.bookwise.domain.model.PriceAdjustment;
import com.bookwise.domain.page.PageResult;
import java.math.BigDecimal;
import java.util.Optional;

/**
 * Porta de saida para persistencia de livros. A implementacao vive na camada
 * de infraestrutura (adapter JPA).
 */
public interface BookRepository {

    Book save(Book book);

    Optional<Book> findById(Long id);

    /**
     * Busca paginada. Quando {@code query} for nulo/vazio, retorna todos os livros.
     */
    PageResult<Book> search(String query, int page, int size);

    boolean existsById(Long id);

    void deleteById(Long id);

    long count();

    /**
     * Multiplica em lote o preco dos livros que atendem ao filtro.
     *
     * @param factor     fator aplicado ao preco (0.92 = 8% de desconto)
     * @param adjustment filtro dos livros afetados
     * @return quantidade de livros atualizados
     */
    int adjustPrices(BigDecimal factor, PriceAdjustment adjustment);
}
