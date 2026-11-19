package com.bookwise.application.dto;

import java.math.BigDecimal;

/**
 * Linha do ranking de usuarios com mais emprestimos.
 *
 * @param userId           identificador do usuario
 * @param name             nome
 * @param email            e-mail
 * @param loanCount        total de emprestimos do usuario
 * @param openLoans        emprestimos em aberto
 * @param pendingFineTotal valor de multas pendentes
 */
public record BorrowerRankingResponse(
        Long userId,
        String name,
        String email,
        long loanCount,
        long openLoans,
        BigDecimal pendingFineTotal) {
}
