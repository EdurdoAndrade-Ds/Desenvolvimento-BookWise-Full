package com.bookwise.config;

import java.math.BigDecimal;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Parametros de negocio configuraveis do BookWise, ligados ao prefixo
 * {@code bookwise} no {@code application.yml}. Extrair estas regras do codigo
 * atende ao principio Aberto/Fechado (OCP): a politica de prazo/multa/expiracao
 * pode mudar por configuracao, sem recompilar.
 *
 * <p>Todos os valores possuem padrao ({@link DefaultValue}), de modo que a
 * aplicacao funciona mesmo sem a secao {@code bookwise} no arquivo de
 * configuracao.
 *
 * @param loan        parametros de emprestimo
 * @param fine        parametros de multa
 * @param reservation parametros de reserva
 * @param report      parametros dos relatorios analiticos
 */
@ConfigurationProperties(prefix = "bookwise")
public record BusinessProperties(
        @DefaultValue Loan loan,
        @DefaultValue Fine fine,
        @DefaultValue Reservation reservation,
        @DefaultValue Report report) {

    /**
     * Parametros de emprestimo.
     *
     * @param defaultDays            prazo padrao (em dias) quando o pedido nao informa a data prevista
     * @param maxActivePerUser       maximo de emprestimos em aberto por usuario ({@code 0} = sem limite)
     * @param maxItemsPerLoan        maximo de itens (soma das quantidades) em um unico emprestimo
     *                               ({@code 0} = sem limite)
     * @param blockWhenFinePending   quando {@code true}, impede novo emprestimo para usuario com multa pendente
     * @param maxRenewals            quantidade maxima de renovacoes por emprestimo ({@code 0} = renovacao desabilitada)
     * @param renewalDays            dias acrescentados a data prevista a cada renovacao
     */
    public record Loan(
            @DefaultValue("14") int defaultDays,
            @DefaultValue("5") int maxActivePerUser,
            @DefaultValue("5") int maxItemsPerLoan,
            @DefaultValue("true") boolean blockWhenFinePending,
            @DefaultValue("2") int maxRenewals,
            @DefaultValue("7") int renewalDays) {
    }

    /**
     * Parametros de multa por atraso.
     *
     * @param perDay valor cobrado por dia de atraso
     */
    public record Fine(@DefaultValue("2.00") BigDecimal perDay) {
    }

    /**
     * Parametros de reserva.
     *
     * @param defaultExpirationDays prazo padrao (em dias) de validade quando nao informado
     * @param holdStock             quando {@code true}, a reserva de um livro fisico bloqueia
     *                              uma unidade do estoque ate ser convertida, cancelada ou expirada
     */
    public record Reservation(
            @DefaultValue("7") int defaultExpirationDays,
            @DefaultValue("true") boolean holdStock) {
    }

    /**
     * Parametros dos relatorios analiticos.
     *
     * @param lowStockThreshold estoque a partir do qual o livro fisico entra na lista de estoque critico
     * @param historyMonths     quantidade de meses da serie historica de emprestimos
     * @param rankingSize       quantidade de linhas retornadas pelos rankings
     */
    public record Report(
            @DefaultValue("3") int lowStockThreshold,
            @DefaultValue("7") int historyMonths,
            @DefaultValue("5") int rankingSize) {
    }
}
