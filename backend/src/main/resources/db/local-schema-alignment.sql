ALTER TABLE loans ADD CONSTRAINT fk_loans_user FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE sales ADD CONSTRAINT fk_sales_user FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE reservations ADD CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE reservations ADD CONSTRAINT fk_reservations_book FOREIGN KEY (book_id) REFERENCES books (id);
ALTER TABLE fines ADD CONSTRAINT fk_fines_loan FOREIGN KEY (loan_id) REFERENCES loans (id);
ALTER TABLE loan_items ADD CONSTRAINT fk_loan_items_book FOREIGN KEY (book_id) REFERENCES books (id);
ALTER TABLE sale_items ADD CONSTRAINT fk_sale_items_book FOREIGN KEY (book_id) REFERENCES books (id);
