-- Relacao N:N entre Livro e Categoria
CREATE TABLE book_categories (
    book_id     BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    PRIMARY KEY (book_id, category_id),
    CONSTRAINT fk_bc_book FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
    CONSTRAINT fk_bc_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
);

CREATE INDEX idx_bc_category ON book_categories (category_id);
