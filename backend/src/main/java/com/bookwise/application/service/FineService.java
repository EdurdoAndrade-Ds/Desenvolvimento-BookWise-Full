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

    /**
     * Lista uma pagina de multas, opcionalmente filtrando por usuario.
     *
     * @param page   indice da pagina (base zero)
     * @param size   tamanho da pagina
     * @param userId id do usuario para filtrar, ou {@code null} para todas
     * @return pagina de multas
     */
    @Transactional(readOnly = true)
    public PageResponse<FineResponse> list(int page, int size, Long userId) {
        var result = userId == null
                ? repository.findAll(page, size)
                : repository.findAllByUserId(userId, page, size);
        return FineMapper.toPageResponse(result);
    }

    /**
     * Busca uma multa pelo identificador.
     *
     * @param id identificador da multa
     * @return a multa encontrada
     * @throws FineNotFoundException se nao existir multa com o id informado
     */
    @Transactional(readOnly = true)
    public FineResponse getById(Long id) {
        return repository.findById(id)
                .map(FineMapper::toResponse)
                .orElseThrow(() -> new FineNotFoundException(id));
    }

    /**
     * Registra o pagamento de uma multa.
     *
     * @param id identificador da multa
     * @return a multa marcada como paga
     * @throws FineNotFoundException se a multa nao existir
     * @throws BusinessException     se a multa ja estiver paga
     */
    public FineResponse pay(Long id) {
        Fine fine = repository.findById(id)
                .orElseThrow(() -> new FineNotFoundException(id));
        if (fine.paymentStatus() == FinePaymentStatus.PAID) {
            throw new BusinessException("Multa ja paga");
        }
        return FineMapper.toResponse(repository.save(fine.asPaid(LocalDate.now())));
    }
}
