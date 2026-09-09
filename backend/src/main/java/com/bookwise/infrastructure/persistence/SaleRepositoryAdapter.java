package com.bookwise.infrastructure.persistence;

import com.bookwise.domain.model.Sale;
import com.bookwise.domain.page.PageResult;
import com.bookwise.domain.port.SaleRepository;
import com.bookwise.infrastructure.persistence.entity.SaleEntity;
import com.bookwise.infrastructure.persistence.repository.SaleJpaRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

/**
 * Adapter que implementa a porta {@link SaleRepository} sobre o Spring Data JPA.
 */
@Component
public class SaleRepositoryAdapter implements SaleRepository {

    private static final Sort NEWEST_FIRST =
            Sort.by(Sort.Direction.DESC, "saleDate").and(Sort.by(Sort.Direction.DESC, "id"));

    private final SaleJpaRepository jpaRepository;

    public SaleRepositoryAdapter(SaleJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Sale save(Sale sale) {
        SaleEntity target = sale.id() != null
                ? jpaRepository.findById(sale.id()).orElse(null)
                : null;
        SaleEntity saved = jpaRepository.save(SaleEntityMapper.toEntity(sale, target));
        return SaleEntityMapper.toDomain(saved);
    }

    @Override
    public Optional<Sale> findById(Long id) {
        return jpaRepository.findById(id).map(SaleEntityMapper::toDomain);
    }

    @Override
    public PageResult<Sale> findAll(int page, int size) {
        return toPageResult(jpaRepository.findPageIds(PageRequest.of(page, size, NEWEST_FIRST)));
    }

    @Override
    public PageResult<Sale> findAllByUserId(Long userId, int page, int size) {
        return toPageResult(jpaRepository.findPageIdsByUserId(
                userId, PageRequest.of(page, size, NEWEST_FIRST)));
    }

    private PageResult<Sale> toPageResult(Page<Long> idsPage) {
        List<Long> ids = idsPage.getContent();
        Map<Long, SaleEntity> entitiesById = new HashMap<>();
        if (!ids.isEmpty()) {
            jpaRepository.findAllWithItemsByIdIn(ids)
                    .forEach(entity -> entitiesById.put(entity.getId(), entity));
        }
        List<Sale> content = ids.stream()
                .map(entitiesById::get)
                .map(SaleEntityMapper::toDomain)
                .toList();
        return new PageResult<>(
                content,
                idsPage.getNumber(),
                idsPage.getSize(),
                idsPage.getTotalElements(),
                idsPage.getTotalPages());
    }

    @Override
    public List<Sale> findAll() {
        return jpaRepository.findAll(NEWEST_FIRST).stream().map(SaleEntityMapper::toDomain).toList();
    }

    @Override
    public long count() {
        return jpaRepository.count();
    }
}
