-- Tabela de livros
CREATE TABLE books (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    author      VARCHAR(255) NOT NULL,
    isbn        VARCHAR(20)  NOT NULL UNIQUE,
    format      VARCHAR(20)  NOT NULL,
    price       NUMERIC(10, 2),
    stock       INTEGER,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_books_title ON books (title);
CREATE INDEX idx_books_author ON books (author);
