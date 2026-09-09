package com.bookwise.infrastructure.persistence;

import com.bookwise.domain.model.Fine;
import com.bookwise.domain.model.FinePaymentStatus;
import com.bookwise.domain.page.PageResult;
import com.bookwise.domain.port.FineRepository;
import com.bookwise.infrastructure.persistence.entity.FineEntity;
import com.bookwise.infrastructure.persistence.repository.FineJpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

/**
 * Adapter que implementa a porta {@link FineRepository} sobre o Spring Data JPA.
 */
@Component
public class FineRepositoryAdapter implements FineRepository {

    private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "id");

    private final FineJpaRepository jpaRepository;

    public FineRepositoryAdapter(FineJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Fine save(Fine fine) {
        FineEntity target = fine.id() != null
                ? jpaRepository.findById(fine.id()).orElse(null)
                : null;
        return FineEntityMapper.toDomain(jpaRepository.save(FineEntityMapper.toEntity(fine, target)));
    }

    @Override
    public Optional<Fine> findById(Long id) {
        return jpaRepository.findById(id).map(FineEntityMapper::toDomain);
    }

    @Override
    public PageResult<Fine> findAll(int page, int size) {
        return toPageResult(jpaRepository.findAll(PageRequest.of(page, size, NEWEST_FIRST)));
    }

    @Override
    public PageResult<Fine> findAllByUserId(Long userId, int page, int size) {
        return toPageResult(jpaRepository.findByUserId(userId, PageRequest.of(page, size, NEWEST_FIRST)));
    }

    private PageResult<Fine> toPageResult(Page<FineEntity> result) {
        List<Fine> content = result.getContent().stream().map(FineEntityMapper::toDomain).toList();
        return new PageResult<>(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    @Override
    public List<Fine> findAll() {
        return jpaRepository.findAll(NEWEST_FIRST).stream().map(FineEntityMapper::toDomain).toList();
    }

    @Override
    public boolean existsByLoanId(Long loanId) {
        return jpaRepository.existsByLoanId(loanId);
    }

    @Override
    public Optional<Fine> findByLoanId(Long loanId) {
        return jpaRepository.findByLoanId(loanId).map(FineEntityMapper::toDomain);
    }

    @Override
    public boolean existsPendingByUserId(Long userId) {
        return jpaRepository.existsByUserIdAndPaymentStatus(userId, FinePaymentStatus.PENDING);
    }

    @Override
    public long count() {
        return jpaRepository.count();
    }
}
