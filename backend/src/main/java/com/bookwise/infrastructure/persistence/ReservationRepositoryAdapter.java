package com.bookwise.infrastructure.persistence;

import com.bookwise.domain.model.Reservation;
import com.bookwise.domain.page.PageResult;
import com.bookwise.domain.port.ReservationRepository;
import com.bookwise.infrastructure.persistence.entity.ReservationEntity;
import com.bookwise.infrastructure.persistence.repository.ReservationJpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

/**
 * Adapter que implementa a porta {@link ReservationRepository} sobre o Spring Data JPA.
 */
@Component
public class ReservationRepositoryAdapter implements ReservationRepository {

    private static final Sort NEWEST_FIRST =
            Sort.by(Sort.Direction.DESC, "reserveDate").and(Sort.by(Sort.Direction.DESC, "id"));

    private final ReservationJpaRepository jpaRepository;

    public ReservationRepositoryAdapter(ReservationJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Reservation save(Reservation reservation) {
        ReservationEntity target = reservation.id() != null
                ? jpaRepository.findById(reservation.id()).orElse(null)
                : null;
        ReservationEntity saved = jpaRepository.save(ReservationEntityMapper.toEntity(reservation, target));
        return ReservationEntityMapper.toDomain(saved);
    }

    @Override
    public Optional<Reservation> findById(Long id) {
        return jpaRepository.findById(id).map(ReservationEntityMapper::toDomain);
    }

    @Override
    public PageResult<Reservation> findAll(int page, int size) {
        return toPageResult(jpaRepository.findAll(PageRequest.of(page, size, NEWEST_FIRST)));
    }

    @Override
    public PageResult<Reservation> findAllByUserId(Long userId, int page, int size) {
        return toPageResult(jpaRepository.findByUserId(userId, PageRequest.of(page, size, NEWEST_FIRST)));
    }

    private PageResult<Reservation> toPageResult(Page<ReservationEntity> result) {
        List<Reservation> content = result.getContent().stream()
                .map(ReservationEntityMapper::toDomain)
                .toList();
        return new PageResult<>(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    @Override
    public List<Reservation> findAll() {
        return jpaRepository.findAll(NEWEST_FIRST).stream()
                .map(ReservationEntityMapper::toDomain)
                .toList();
    }

    @Override
    public long count() {
        return jpaRepository.count();
    }
}
