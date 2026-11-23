package com.bookwise.infrastructure.scheduling;

import com.bookwise.application.service.LoanService;
import com.bookwise.application.service.ReservationService;
import java.time.LocalDate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Rotinas periodicas de manutencao da biblioteca: expiracao de reservas e
 * cobranca de emprestimos vencidos que continuam em aberto. Adapter de entrada
 * (agendador) que apenas delega para os casos de uso.
 *
 * <p>Pode ser desligado com {@code bookwise.jobs.enabled=false} e os horarios
 * sao configuraveis por cron.
 */
@Component
@ConditionalOnProperty(name = "bookwise.jobs.enabled", havingValue = "true", matchIfMissing = true)
public class LibraryMaintenanceJobs {

    private static final Logger log = LoggerFactory.getLogger(LibraryMaintenanceJobs.class);

    private final ReservationService reservationService;
    private final LoanService loanService;

    public LibraryMaintenanceJobs(ReservationService reservationService, LoanService loanService) {
        this.reservationService = reservationService;
        this.loanService = loanService;
    }

    /** Marca reservas vencidas como EXPIRED e devolve ao estoque as unidades bloqueadas. */
    @Scheduled(cron = "${bookwise.jobs.reservation-expiration-cron:0 5 0 * * *}")
    public void expireReservations() {
        int expired = reservationService.expireOverdue(LocalDate.now());
        if (expired > 0) {
            log.info("Reservas expiradas: {}", expired);
        }
    }

    /** Gera/atualiza multas dos emprestimos vencidos ainda nao devolvidos. */
    @Scheduled(cron = "${bookwise.jobs.overdue-fine-cron:0 10 0 * * *}")
    public void chargeOverdueLoans() {
        int charged = loanService.chargeOverdueLoans(LocalDate.now());
        if (charged > 0) {
            log.info("Emprestimos com multa apurada por atraso em aberto: {}", charged);
        }
    }
}
