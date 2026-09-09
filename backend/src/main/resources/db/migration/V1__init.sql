-- =====================================================================
-- BookWise - migration inicial (placeholder)
-- =====================================================================
-- Esta migration cria uma tabela de controle apenas para validar a
-- conexao e o Flyway. As tabelas reais (users, books, loans, sales, ...)
-- serao criadas a partir do MER/DER na proxima etapa.
-- =====================================================================

CREATE TABLE app_info (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key         VARCHAR(100) NOT NULL UNIQUE,
    value       VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

INSERT INTO app_info (key, value) VALUES ('schema', 'bookwise-initialized');
