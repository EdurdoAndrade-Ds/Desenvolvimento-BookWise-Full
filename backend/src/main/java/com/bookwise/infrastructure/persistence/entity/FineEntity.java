package com.bookwise.infrastructure.persistence.entity;

import com.bookwise.domain.model.FinePaymentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Mapeamento JPA da tabela {@code fines} (1:1 com emprestimo via loan_id unico).
 */
@Entity
@Table(name = "fines")
@Getter
@Setter
@NoArgsConstructor
public class FineEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "loan_id", nullable = false, unique = true)
    private Long loanId;

    @Column(name = "user_name", nullable = false)
    private String userName;

    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal value;

    @Column(name = "days_late", nullable = false)
    private int daysLate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    private FinePaymentStatus paymentStatus;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
