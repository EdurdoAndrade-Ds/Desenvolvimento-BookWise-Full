package com.bookwise.infrastructure.persistence;

import com.bookwise.domain.model.Loan;
import com.bookwise.domain.model.LoanItem;
import com.bookwise.infrastructure.persistence.entity.LoanEntity;
import com.bookwise.infrastructure.persistence.entity.LoanItemEntity;
import java.util.List;

/**
 * Conversoes entre a entidade JPA de emprestimo e o modelo de dominio.
 */
final class LoanEntityMapper {

    private LoanEntityMapper() {
    }

    static Loan toDomain(LoanEntity entity) {
        List<LoanItem> items = entity.getItems().stream()
                .map(i -> new LoanItem(i.getBookId(), i.getBookTitle(), i.getQuantity()))
                .toList();
        return new Loan(
                entity.getId(),
                entity.getUserId(),
                entity.getUserName(),
                items,
                entity.getLoanDate(),
                entity.getDueDate(),
                entity.getReturnDate(),
                entity.getRenewalCount(),
                entity.getCreatedAt());
    }

    /**
     * Aplica os dados do dominio na entidade. Quando {@code target} for nulo,
     * cria uma nova entidade (insercao) com seus itens.
     */
    static LoanEntity toEntity(Loan loan, LoanEntity target) {
        LoanEntity entity = target != null ? target : new LoanEntity();
        entity.setUserId(loan.userId());
        entity.setUserName(loan.userName());
        entity.setLoanDate(loan.loanDate());
        entity.setDueDate(loan.dueDate());
        entity.setReturnDate(loan.returnDate());
        entity.setRenewalCount(loan.renewalCount());
        if (loan.createdAt() != null) {
            entity.setCreatedAt(loan.createdAt());
        }
        // Itens so sao definidos na criacao (nao ha edicao de itens neste fluxo).
        if (target == null) {
            for (LoanItem item : loan.items()) {
                LoanItemEntity itemEntity = new LoanItemEntity();
                itemEntity.setBookId(item.bookId());
                itemEntity.setBookTitle(item.bookTitle());
                itemEntity.setQuantity(item.quantity());
                entity.addItem(itemEntity);
            }
        }
        return entity;
    }
}
