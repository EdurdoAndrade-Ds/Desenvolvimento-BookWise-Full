package com.bookwise.domain.port;

import com.bookwise.domain.model.Sale;
import com.bookwise.domain.page.PageResult;
import java.util.List;
import java.util.Optional;

/**
 * Porta de saida para persistencia de vendas.
 */
public interface SaleRepository {

    Sale save(Sale sale);

    Optional<Sale> findById(Long id);

    /** Pagina de vendas, da mais recente para a mais antiga. */
    PageResult<Sale> findAll(int page, int size);

    PageResult<Sale> findAllByUserId(Long userId, int page, int size);

    /** Todas as vendas (agregacoes/estatisticas com volume pequeno). */
    List<Sale> findAll();

    long count();
}
