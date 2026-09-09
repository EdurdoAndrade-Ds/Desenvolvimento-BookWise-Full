-- Reservas de livros
CREATE TABLE reservations (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    user_name       VARCHAR(255) NOT NULL,
    book_id         BIGINT NOT NULL,
    book_title      VARCHAR(255) NOT NULL,
    reserve_date    DATE NOT NULL,
    expiration_date DATE,
    status          VARCHAR(20) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_reservations_book FOREIGN KEY (book_id) REFERENCES books (id)
);

CREATE INDEX idx_reservations_user ON reservations (user_id);
