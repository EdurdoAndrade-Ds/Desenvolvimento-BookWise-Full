package com.bookwise.infrastructure.persistence;

import com.bookwise.domain.model.Loan;
import com.bookwise.domain.page.PageResult;
import com.bookwise.domain.port.LoanRepository;
import com.bookwise.infrastructure.persistence.entity.LoanEntity;
import com.bookwise.infrastructure.persistence.repository.LoanJpaRepository;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

/**
 * Adapter que implementa a porta {@link LoanRepository} sobre o Spring Data JPA.
 */
@Component
public class LoanRepositoryAdapter implements LoanRepository {

    private static final Sort NEWEST_FIRST =
            Sort.by(Sort.Direction.DESC, "loanDate").and(Sort.by(Sort.Direction.DESC, "id"));

    private final LoanJpaRepository jpaRepository;

    public LoanRepositoryAdapter(LoanJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Loan save(Loan loan) {
        LoanEntity target = loan.id() != null
                ? jpaRepository.findById(loan.id()).orElse(null)
                : null;
        LoanEntity saved = jpaRepository.save(LoanEntityMapper.toEntity(loan, target));
        return LoanEntityMapper.toDomain(saved);
    }

    @Override
    public Optional<Loan> findById(Long id) {
        return jpaRepository.findById(id).map(LoanEntityMapper::toDomain);
    }

    @Override
    public PageResult<Loan> findAll(int page, int size) {
        return toPageResult(jpaRepository.findPageIds(PageRequest.of(page, size, NEWEST_FIRST)));
    }

    @Override
    public PageResult<Loan> findAllByUserId(Long userId, int page, int size) {
        return toPageResult(jpaRepository.findPageIdsByUserId(
                userId, PageRequest.of(page, size, NEWEST_FIRST)));
    }

    private PageResult<Loan> toPageResult(Page<Long> idsPage) {
        List<Long> ids = idsPage.getContent();
        Map<Long, LoanEntity> entitiesById = new HashMap<>();
        if (!ids.isEmpty()) {
            jpaRepository.findAllWithItemsByIdIn(ids)
                    .forEach(entity -> entitiesById.put(entity.getId(), entity));
        }
        List<Loan> content = ids.stream()
                .map(entitiesById::get)
                .map(LoanEntityMapper::toDomain)
                .toList();
        return new PageResult<>(
                content,
                idsPage.getNumber(),
                idsPage.getSize(),
                idsPage.getTotalElements(),
                idsPage.getTotalPages());
    }

    @Override
    public List<Loan> findAll() {
        return jpaRepository.findAll(NEWEST_FIRST).stream()
                .map(LoanEntityMapper::toDomain)
                .toList();
    }

    @Override
    public long countOpenByUserId(Long userId) {
        return jpaRepository.countByUserIdAndReturnDateIsNull(userId);
    }

    @Override
    public List<Loan> findOpenOverdue(LocalDate reference) {
        return jpaRepository.findOpenOverdue(reference).stream()
                .map(LoanEntityMapper::toDomain)
                .toList();
    }

    @Override
    public long count() {
        return jpaRepository.count();
    }
}
