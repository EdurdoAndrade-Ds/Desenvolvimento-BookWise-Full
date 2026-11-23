ALTER TABLE books ADD COLUMN loan_price NUMERIC(10, 2);
ALTER TABLE books ADD CONSTRAINT ck_books_loan_price CHECK (loan_price >= 0);

ALTER TABLE loan_items ADD COLUMN unit_loan_price NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE loan_items ADD CONSTRAINT ck_loan_items_unit_loan_price CHECK (unit_loan_price >= 0);

ALTER TABLE loans ADD COLUMN charge_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE loans ADD COLUMN charge_status VARCHAR(20);
ALTER TABLE loans ADD COLUMN charge_payment_date DATE;
ALTER TABLE loans ADD CONSTRAINT ck_loans_charge_amount CHECK (charge_amount >= 0);
ALTER TABLE loans ADD CONSTRAINT ck_loans_charge_status CHECK (charge_status IN ('PENDING', 'PAID'));
ALTER TABLE loans ADD CONSTRAINT ck_loans_charge_state CHECK (
    (charge_amount = 0 AND charge_status IS NULL AND charge_payment_date IS NULL)
    OR (charge_amount > 0 AND charge_status IS NOT NULL AND (
        (charge_status = 'PENDING' AND charge_payment_date IS NULL)
        OR (charge_status = 'PAID' AND charge_payment_date IS NOT NULL)
    ))
);
