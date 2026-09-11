-- Massa de demonstracao: categorias, emprestimos (ativos, atrasados e devolvidos),
-- multas, vendas e reservas. As datas sao relativas a CURRENT_DATE para que os
-- relatorios do dashboard (emprestimos por mes, rankings, estoque critico) sempre
-- apresentem dados recentes. O estoque dos livros e ajustado para refletir as
-- unidades retidas por emprestimos em aberto e reservas ativas.

INSERT INTO categories (name, description, parent_id) VALUES
    ('Tecnologia', 'Engenharia de software e computacao', NULL),
    ('Literatura', 'Ficcao e classicos', NULL);

INSERT INTO categories (name, description, parent_id)
SELECT 'Engenharia de Software', 'Praticas de codigo e arquitetura', id FROM categories WHERE name = 'Tecnologia';

INSERT INTO categories (name, description, parent_id)
SELECT 'Ficcao Cientifica', 'Distopias e space opera', id FROM categories WHERE name = 'Literatura';

INSERT INTO book_categories (book_id, category_id)
SELECT b.id, c.id
  FROM books b
  JOIN categories c ON c.name = 'Engenharia de Software'
 WHERE b.title IN ('Clean Code', 'Refactoring', 'Domain-Driven Design', 'The Pragmatic Programmer');

INSERT INTO book_categories (book_id, category_id)
SELECT b.id, c.id
  FROM books b
  JOIN categories c ON c.name = 'Tecnologia'
 WHERE b.title IN ('Clean Code', 'Refactoring', 'Domain-Driven Design', 'The Pragmatic Programmer');

INSERT INTO book_categories (book_id, category_id)
SELECT b.id, c.id
  FROM books b
  JOIN categories c ON c.name = 'Ficcao Cientifica'
 WHERE b.title IN ('Duna', '1984');

INSERT INTO book_categories (book_id, category_id)
SELECT b.id, c.id
  FROM books b
  JOIN categories c ON c.name = 'Literatura'
 WHERE b.title IN ('Duna', '1984', 'O Senhor dos Aneis', 'O Hobbit');

-- Emprestimos devolvidos em dia (historico dos ultimos meses)
INSERT INTO loans (user_id, user_name, loan_date, due_date, return_date, renewal_count)
SELECT u.id, u.name, d.loan_date, d.loan_date + 14, d.return_date, d.renewal_count
  FROM (VALUES
        ('maria@bookwise.com', CURRENT_DATE - 150, CURRENT_DATE - 140, 0),
        ('joao@bookwise.com',  CURRENT_DATE - 132, CURRENT_DATE - 121, 0),
        ('ana@bookwise.com',   CURRENT_DATE - 118, CURRENT_DATE - 105, 1),
        ('maria@bookwise.com', CURRENT_DATE - 96,  CURRENT_DATE - 84,  0),
        ('carlos@bookwise.com',CURRENT_DATE - 74,  CURRENT_DATE - 63,  0),
        ('joao@bookwise.com',  CURRENT_DATE - 61,  CURRENT_DATE - 50,  0),
        ('maria@bookwise.com', CURRENT_DATE - 44,  CURRENT_DATE - 33,  0),
        ('ana@bookwise.com',   CURRENT_DATE - 28,  CURRENT_DATE - 16,  0)
       ) AS d(email, loan_date, return_date, renewal_count)
  JOIN users u ON u.email = d.email;

-- Emprestimo devolvido com atraso (gera multa paga)
INSERT INTO loans (user_id, user_name, loan_date, due_date, return_date, renewal_count)
SELECT u.id, u.name, CURRENT_DATE - 80, CURRENT_DATE - 66, CURRENT_DATE - 60, 0
  FROM users u WHERE u.email = 'carlos@bookwise.com';

-- Emprestimos em aberto dentro do prazo
INSERT INTO loans (user_id, user_name, loan_date, due_date, return_date, renewal_count)
SELECT u.id, u.name, d.loan_date, d.loan_date + 14, NULL, d.renewal_count
  FROM (VALUES
        ('maria@bookwise.com', CURRENT_DATE - 5, 0),
        ('joao@bookwise.com',  CURRENT_DATE - 2, 0),
        ('ana@bookwise.com',   CURRENT_DATE - 9, 1)
       ) AS d(email, loan_date, renewal_count)
  JOIN users u ON u.email = d.email;

-- Emprestimos em atraso, ainda nao devolvidos (geram multa pendente)
INSERT INTO loans (user_id, user_name, loan_date, due_date, return_date, renewal_count)
SELECT u.id, u.name, d.loan_date, d.loan_date + 14, NULL, 0
  FROM (VALUES
        ('carlos@bookwise.com', CURRENT_DATE - 32),
        ('joao@bookwise.com',   CURRENT_DATE - 25)
       ) AS d(email, loan_date)
  JOIN users u ON u.email = d.email;

-- Itens dos emprestimos: um livro por emprestimo, alternando o acervo fisico
INSERT INTO loan_items (loan_id, book_id, book_title, quantity)
SELECT l.id, b.id, b.title, 1
  FROM (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM loans) l
  JOIN (SELECT id, title, row_number() OVER (ORDER BY id) AS rn
          FROM books
         WHERE format = 'PHYSICAL') b
    ON b.rn = ((l.rn - 1) % (SELECT count(*) FROM books WHERE format = 'PHYSICAL')) + 1;

-- Multa paga do emprestimo devolvido com atraso (6 dias x R$ 2,00)
INSERT INTO fines (loan_id, user_name, amount, days_late, payment_status, payment_date)
SELECT l.id, l.user_name, 12.00, 6, 'PAID', l.return_date
  FROM loans l
 WHERE l.return_date IS NOT NULL AND l.return_date > l.due_date;

-- Multas pendentes dos emprestimos em atraso ainda em aberto
INSERT INTO fines (loan_id, user_name, amount, days_late, payment_status, payment_date)
SELECT l.id,
       l.user_name,
       (CURRENT_DATE - l.due_date) * 2.00,
       (CURRENT_DATE - l.due_date),
       'PENDING',
       NULL
  FROM loans l
 WHERE l.return_date IS NULL AND l.due_date < CURRENT_DATE;

-- Vendas pagas distribuidas nos ultimos meses
INSERT INTO sales (user_id, user_name, payment_method, sale_date, total_price, status)
SELECT u.id, u.name, d.payment_method, d.sale_date, 0, 'PAID'
  FROM (VALUES
        ('maria@bookwise.com',  'CREDIT_CARD', CURRENT_DATE - 120),
        ('joao@bookwise.com',   'PIX',         CURRENT_DATE - 88),
        ('ana@bookwise.com',    'CREDIT_CARD', CURRENT_DATE - 57),
        ('carlos@bookwise.com', 'BOLETO',      CURRENT_DATE - 34),
        ('maria@bookwise.com',  'PIX',         CURRENT_DATE - 12),
        ('joao@bookwise.com',   'CREDIT_CARD', CURRENT_DATE - 3)
       ) AS d(email, payment_method, sale_date)
  JOIN users u ON u.email = d.email;

-- Itens das vendas: dois titulos por venda, com o preco vigente do livro
INSERT INTO sale_items (sale_id, book_id, book_title, quantity, unit_price)
SELECT s.id, b.id, b.title, 1, b.price
  FROM (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM sales) s
  JOIN (SELECT id, title, price, row_number() OVER (ORDER BY id) AS rn FROM books) b
    ON b.rn IN (((s.rn - 1) % (SELECT count(*) FROM books)) + 1,
                ((s.rn + 2) % (SELECT count(*) FROM books)) + 1);

UPDATE sales s
   SET total_price = (SELECT coalesce(sum(si.quantity * si.unit_price), 0)
                        FROM sale_items si
                       WHERE si.sale_id = s.id);

-- Reservas: ativas (retem estoque), convertida e expirada
INSERT INTO reservations (user_id, user_name, book_id, book_title, reserve_date, expiration_date, status)
SELECT u.id, u.name, b.id, b.title, d.reserve_date, d.reserve_date + 7, d.status
  FROM (VALUES
        ('ana@bookwise.com',    'Duna',                 CURRENT_DATE - 2,  'ACTIVE'),
        ('carlos@bookwise.com', 'O Senhor dos Aneis',   CURRENT_DATE - 4,  'ACTIVE'),
        ('maria@bookwise.com',  'Refactoring',          CURRENT_DATE - 20, 'CONVERTED'),
        ('joao@bookwise.com',   'Domain-Driven Design', CURRENT_DATE - 40, 'EXPIRED')
       ) AS d(email, title, reserve_date, status)
  JOIN users u ON u.email = d.email
  JOIN books b ON b.title = d.title;

-- Ajusta o estoque fisico pelas unidades retidas por emprestimos em aberto e reservas ativas
UPDATE books b
   SET stock = greatest(b.stock - coalesce((
           SELECT sum(li.quantity)
             FROM loan_items li
             JOIN loans l ON l.id = li.loan_id
            WHERE li.book_id = b.id AND l.return_date IS NULL), 0)
       - coalesce((
           SELECT count(*)
             FROM reservations r
            WHERE r.book_id = b.id AND r.status = 'ACTIVE'), 0), 0)
 WHERE b.format = 'PHYSICAL';

-- Baixa o estoque vendido dos livros fisicos
UPDATE books b
   SET stock = greatest(b.stock - coalesce((
           SELECT sum(si.quantity)
             FROM sale_items si
            WHERE si.book_id = b.id), 0), 0)
 WHERE b.format = 'PHYSICAL';
