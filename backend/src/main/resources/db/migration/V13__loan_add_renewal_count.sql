-- Controle de renovacoes do emprestimo (limite configuravel em bookwise.loan.max-renewals).
ALTER TABLE loans ADD COLUMN renewal_count INTEGER NOT NULL DEFAULT 0;
