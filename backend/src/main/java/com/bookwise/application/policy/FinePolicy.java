package com.bookwise.application.policy;

import com.bookwise.config.BusinessProperties;
import com.bookwise.domain.model.Fine;
import com.bookwise.domain.model.FinePaymentStatus;
import com.bookwise.domain.model.Loan;
import com.bookwise.domain.port.FineRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * Politica unica de multa por atraso. Concentra o calculo (dias de atraso x
 * valor diario configurado) e a materializacao da multa, usada tanto na
 * devolucao quanto na cobranca de emprestimos vencidos ainda em aberto.
 *
 * <p>A operacao e idempotente: a tabela {@code fines} mantem relacao 1:1 com o
 * emprestimo, portanto uma multa existente e atualizada (nunca duplicada) e
 * multas ja pagas nao sao alteradas.
 */
@Component
public class FinePolicy {

    private final FineRepository fineRepository;
    private final BusinessProperties properties;

    public FinePolicy(FineRepository fineRepository, BusinessProperties properties) {
        this.fineRepository = fineRepository;
        this.properties = properties;
    }

    /**
     * Cria ou atualiza a multa do emprestimo conforme o atraso apurado na data
     * de referencia. Para emprestimo em aberto, o atraso e medido ate a data de
     * referencia; para emprestimo devolvido, ate a data de devolucao.
     *
     * @param loan      emprestimo avaliado
     * @param reference data de apuracao (normalmente hoje)
     * @return a multa vigente, ou vazio quando nao ha atraso
     */
    public Optional<Fine> apply(Loan loan, LocalDate reference) {
        long daysLate = daysLate(loan, reference);
        if (daysLate <= 0) {
            return Optional.empty();
        }

        BigDecimal amount = properties.fine().perDay().multiply(BigDecimal.valueOf(daysLate));
        Optional<Fine> existing = fineRepository.findByLoanId(loan.id());
        if (existing.isEmpty()) {
            return Optional.of(fineRepository.save(new Fine(
                    null, loan.id(), loan.userName(), amount, (int) daysLate,
                    FinePaymentStatus.PENDING, null, null)));
        }

        Fine fine = existing.get();
        if (fine.paymentStatus() == FinePaymentStatus.PAID || fine.daysLate() >= daysLate) {
            return Optional.of(fine);
        }
        return Optional.of(fineRepository.save(fine.withCharge(amount, (int) daysLate)));
    }

    /** Dias de atraso do emprestimo na data de referencia ({@code 0} se em dia. */
    public long daysLate(Loan loan, LocalDate reference) {
        if (loan.dueDate() == null) {
            return 0;
        }
        LocalDate effective = loan.returnDate() != null ? loan.returnDate() : reference;
        if (!effective.isAfter(loan.dueDate())) {
            return 0;
        }
        return ChronoUnit.DAYS.between(loan.dueDate(), effective);
    }

    /** Indica se o usuario possui multa pendente de pagamento. */
    public boolean hasPendingFine(Long userId) {
        return fineRepository.existsPendingByUserId(userId);
    }
}
