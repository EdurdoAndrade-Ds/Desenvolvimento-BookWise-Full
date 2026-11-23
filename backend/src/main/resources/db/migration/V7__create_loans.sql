-- Emprestimos e seus itens (N:N com Livro via loan_items)
CREATE TABLE loans (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    user_name   VARCHAR(255) NOT NULL,
    loan_date   DATE NOT NULL,
    due_date    DATE NOT NULL,
    return_date DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_loans_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE loan_items (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    loan_id     BIGINT NOT NULL,
    book_id     BIGINT NOT NULL,
    book_title  VARCHAR(255) NOT NULL,
    quantity    INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT fk_loan_items_loan FOREIGN KEY (loan_id) REFERENCES loans (id) ON DELETE CASCADE,
    CONSTRAINT fk_loan_items_book FOREIGN KEY (book_id) REFERENCES books (id)
);

CREATE INDEX idx_loans_user ON loans (user_id);
CREATE INDEX idx_loan_items_loan ON loan_items (loan_id);
