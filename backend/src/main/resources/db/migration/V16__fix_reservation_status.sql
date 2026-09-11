-- Normaliza o status das reservas para os valores do enum ReservationStatus
-- (ACTIVE, FULFILLED, CANCELLED, EXPIRED). A massa de demonstracao da V14
-- gravou 'CONVERTED' para a reserva convertida em emprestimo, valor que nao
-- existe no enum e quebra a leitura da tabela.
UPDATE reservations SET status = 'FULFILLED' WHERE status = 'CONVERTED';

ALTER TABLE reservations
    ADD CONSTRAINT ck_reservations_status
    CHECK (status IN ('ACTIVE', 'FULFILLED', 'CANCELLED', 'EXPIRED'));
