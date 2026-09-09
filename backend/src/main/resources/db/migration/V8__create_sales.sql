-- Vendas e seus itens (N:N com Livro via sale_items)
CREATE TABLE sales (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        BIGINT NOT NULL,
    user_name      VARCHAR(255) NOT NULL,
    payment_method VARCHAR(50),
    sale_date      DATE NOT NULL,
    total_price    NUMERIC(12, 2) NOT NULL,
    status         VARCHAR(20) NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_sales_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE sale_items (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sale_id    BIGINT NOT NULL,
    book_id    BIGINT NOT NULL,
    book_title VARCHAR(255) NOT NULL,
    quantity   INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL,
    CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
    CONSTRAINT fk_sale_items_book FOREIGN KEY (book_id) REFERENCES books (id)
);

CREATE INDEX idx_sales_user ON sales (user_id);
CREATE INDEX idx_sale_items_sale ON sale_items (sale_id);
