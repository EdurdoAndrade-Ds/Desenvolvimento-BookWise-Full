package com.bookwise.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Mapeamento JPA da tabela {@code loan_items} (itens de um emprestimo).
 */
@Entity
@Table(name = "loan_items")
@Getter
@Setter
@NoArgsConstructor
public class LoanItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "loan_id", nullable = false)
    private LoanEntity loan;

    @Column(name = "book_id", nullable = false)
    private Long bookId;

    @Column(name = "book_title", nullable = false)
    private String bookTitle;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_loan_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal unitLoanPrice = BigDecimal.ZERO;
}
