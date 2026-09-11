package com.bookwise.application.dto;

import java.math.BigDecimal;

/**
 * Indicadores consolidados do acervo.
 *
 * @param totalBooks         titulos cadastrados
 * @param physicalStock      soma do estoque dos livros fisicos
 * @param lowStockBooks      livros fisicos com estoque critico
 * @param totalUsers         usuarios cadastrados
 * @param activeLoans        emprestimos em aberto
 * @param overdueLoans       emprestimos em aberto e atrasados
 * @param monthSalesTotal    faturamento das vendas pagas no mes de referencia
 * @param pendingFines       multas com pagamento pendente
 * @param pendingFinesTotal  valor total das multas pendentes
 * @param activeReservations reservas ativas e dentro da validade
 */
public record LibrarySummaryResponse(
        long totalBooks,
        long physicalStock,
        long lowStockBooks,
        long totalUsers,
        long activeLoans,
        long overdueLoans,
        BigDecimal monthSalesTotal,
        long pendingFines,
        BigDecimal pendingFinesTotal,
        long activeReservations) {
}
