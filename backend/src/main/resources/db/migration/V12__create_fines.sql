-- Multas geradas por devolucao em atraso (1:1 com emprestimo)
CREATE TABLE fines (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    loan_id        BIGINT NOT NULL UNIQUE,
    user_name      VARCHAR(255) NOT NULL,
    amount         NUMERIC(12, 2) NOT NULL,
    days_late      INTEGER NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    payment_date   DATE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_fines_loan FOREIGN KEY (loan_id) REFERENCES loans (id)
);
