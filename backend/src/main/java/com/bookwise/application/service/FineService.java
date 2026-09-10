package com.bookwise.application.service;

import com.bookwise.application.dto.FineResponse;
import com.bookwise.application.dto.PageResponse;
import com.bookwise.application.mapper.FineMapper;
import com.bookwise.domain.exception.BusinessException;
import com.bookwise.domain.exception.FineNotFoundException;
import com.bookwise.domain.model.Fine;
import com.bookwise.domain.model.FinePaymentStatus;
import com.bookwise.domain.port.FineRepository;
import java.time.LocalDate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso de multas. Multas sao geradas automaticamente na devolucao de
 * emprestimos em atraso (ver LoanService); aqui listamos e registramos pagamento.
 */
@Service
@Transactional
public class FineService {

    private final FineRepository repository;

    public FineService(FineRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponse<FineResponse> list(int page, int size, Long userId) {
        var result = userId == null
                ? repository.findAll(page, size)
                : repository.findAllByUserId(userId, page, size);
        return FineMapper.toPageResponse(result);
    }

    @Transactional(readOnly = true)
    public FineResponse getById(Long id) {
        return repository.findById(id)
                .map(FineMapper::toResponse)
                .orElseThrow(() -> new FineNotFoundException(id));
    }

    public FineResponse pay(Long id) {
        Fine fine = repository.findById(id)
                .orElseThrow(() -> new FineNotFoundException(id));
        if (fine.paymentStatus() == FinePaymentStatus.PAID) {
            throw new BusinessException("Multa ja paga");
        }
        return FineMapper.toResponse(repository.save(fine.asPaid(LocalDate.now())));
    }
}
