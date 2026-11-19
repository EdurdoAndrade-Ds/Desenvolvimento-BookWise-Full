-- =====================================================================
-- BookWise - consultas de demonstracao (PostgreSQL)
-- =====================================================================
-- Como conectar no banco do Render:
--   PGPASSWORD=<senha> psql -h <host>.oregon-postgres.render.com -U <usuario> <database>
-- ou pelo DBeaver/pgAdmin usando a External Database URL.
--
-- Sugestao de roteiro para a apresentacao:
--   1. blocos 1 e 2  -> estrutura do banco (DDL gerado pelo Flyway)
--   2. blocos 3 a 6  -> consultas com JOIN, GROUP BY, HAVING e subquery
--   3. blocos 7 e 8  -> relatorios usados pelo dashboard da aplicacao
--   4. bloco 9       -> UPDATE de desconto (mesma query que o back-office roda)
--   5. bloco 10      -> transacao e rollback
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Estrutura: tabelas criadas e historico de migrations do Flyway
-- ---------------------------------------------------------------------
SELECT table_name
  FROM information_schema.tables
 WHERE table_schema = 'public'
 ORDER BY table_name;

SELECT installed_rank, version, description, success
  FROM flyway_schema_history
 ORDER BY installed_rank;

-- Colunas, tipos e obrigatoriedade da tabela books
SELECT column_name, data_type, is_nullable, character_maximum_length
  FROM information_schema.columns
 WHERE table_name = 'books'
 ORDER BY ordinal_position;


-- ---------------------------------------------------------------------
-- 2. Estrutura: chaves primarias e estrangeiras (integridade referencial)
-- ---------------------------------------------------------------------
SELECT tc.table_name,
       tc.constraint_name,
       tc.constraint_type,
       kcu.column_name,
       ccu.table_name  AS referencia_tabela,
       ccu.column_name AS referencia_coluna
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON kcu.constraint_name = tc.constraint_name
  LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
   AND tc.constraint_type = 'FOREIGN KEY'
 WHERE tc.table_schema = 'public'
   AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')
 ORDER BY tc.table_name, tc.constraint_type;


-- ---------------------------------------------------------------------
-- 3. Acervo: catalogo com categorias (JOIN + LEFT JOIN + agregacao de texto)
-- ---------------------------------------------------------------------
SELECT b.id,
       b.title,
       b.author,
       b.genre,
       b.published_year,
       b.format,
       b.price,
       b.stock,
       COALESCE(STRING_AGG(c.name, ', ' ORDER BY c.name), 'sem categoria') AS categorias
  FROM books b
  LEFT JOIN book_categories bc ON bc.book_id = b.id
  LEFT JOIN categories c       ON c.id = bc.category_id
 GROUP BY b.id, b.title, b.author, b.genre, b.published_year, b.format, b.price, b.stock
 ORDER BY b.title;

-- Valor total do estoque fisico por genero (GROUP BY + HAVING)
SELECT b.genre,
       COUNT(*)                     AS titulos,
       SUM(b.stock)                 AS unidades,
       ROUND(AVG(b.price), 2)       AS preco_medio,
       SUM(b.price * b.stock)       AS valor_estoque
  FROM books b
 WHERE b.format = 'PHYSICAL'
 GROUP BY b.genre
HAVING SUM(b.stock) > 0
 ORDER BY valor_estoque DESC;


-- ---------------------------------------------------------------------
-- 4. Emprestimos: situacao atual de cada emprestimo (JOIN + CASE + datas)
-- ---------------------------------------------------------------------
SELECT l.id,
       u.name  AS usuario,
       u.email,
       l.loan_date,
       l.due_date,
       l.return_date,
       l.renewal_count,
       SUM(li.quantity) AS itens,
       CASE
           WHEN l.return_date IS NOT NULL                     THEN 'DEVOLVIDO'
           WHEN l.due_date < CURRENT_DATE                     THEN 'ATRASADO'
           ELSE 'EM ANDAMENTO'
       END AS situacao,
       GREATEST(CURRENT_DATE - l.due_date, 0) AS dias_de_atraso
  FROM loans l
  JOIN users u      ON u.id = l.user_id
  JOIN loan_items li ON li.loan_id = l.id
 GROUP BY l.id, u.name, u.email, l.loan_date, l.due_date, l.return_date, l.renewal_count
 ORDER BY l.id DESC;

-- Livros emprestados no momento (nao devolvidos)
SELECT b.title,
       b.author,
       u.name AS usuario,
       l.due_date
  FROM loan_items li
  JOIN loans l ON l.id = li.loan_id
  JOIN books b ON b.id = li.book_id
  JOIN users u ON u.id = l.user_id
 WHERE l.return_date IS NULL
 ORDER BY l.due_date;


-- ---------------------------------------------------------------------
-- 5. Usuarios: perfil de uso (subquery correlacionada + LEFT JOIN)
-- ---------------------------------------------------------------------
SELECT u.id,
       u.name,
       u.role,
       (SELECT COUNT(*) FROM loans l WHERE l.user_id = u.id)                              AS emprestimos,
       (SELECT COUNT(*) FROM loans l WHERE l.user_id = u.id AND l.return_date IS NULL)    AS em_aberto,
       (SELECT COUNT(*) FROM reservations r WHERE r.user_id = u.id)                       AS reservas,
       (SELECT COALESCE(SUM(s.total_price), 0) FROM sales s WHERE s.user_id = u.id)       AS total_comprado,
       (SELECT COALESCE(SUM(f.amount), 0)
          FROM fines f
          JOIN loans l ON l.id = f.loan_id
         WHERE l.user_id = u.id
           AND f.payment_status = 'PENDING')                                              AS multa_pendente
  FROM users u
 ORDER BY emprestimos DESC, u.name;

-- Usuarios que nunca pegaram um livro emprestado (NOT EXISTS)
SELECT u.id, u.name, u.email
  FROM users u
 WHERE NOT EXISTS (SELECT 1 FROM loans l WHERE l.user_id = u.id)
 ORDER BY u.name;


-- ---------------------------------------------------------------------
-- 6. Categorias: auto-relacionamento pai/filho e contagem de livros
-- ---------------------------------------------------------------------
SELECT filha.id,
       filha.name        AS categoria,
       pai.name          AS categoria_pai,
       COUNT(bc.book_id) AS livros
  FROM categories filha
  LEFT JOIN categories pai      ON pai.id = filha.parent_id
  LEFT JOIN book_categories bc  ON bc.category_id = filha.id
 GROUP BY filha.id, filha.name, pai.name
 ORDER BY pai.name NULLS FIRST, filha.name;

-- Hierarquia completa de categorias (CTE recursiva)
WITH RECURSIVE arvore AS (
    SELECT id, name, parent_id, CAST(name AS TEXT) AS caminho, 1 AS nivel
      FROM categories
     WHERE parent_id IS NULL
    UNION ALL
    SELECT c.id, c.name, c.parent_id, a.caminho || ' > ' || c.name, a.nivel + 1
      FROM categories c
      JOIN arvore a ON a.id = c.parent_id
)
SELECT nivel, caminho
  FROM arvore
 ORDER BY caminho;


-- ---------------------------------------------------------------------
-- 7. Relatorios do dashboard: as mesmas queries nativas do backend
--    (ver ReportJpaRepository / endpoints GET /api/v1/reports/*)
-- ---------------------------------------------------------------------
-- 7.1 Resumo geral (/reports/summary)
SELECT (SELECT COUNT(*) FROM books)                                           AS total_livros,
       (SELECT COALESCE(SUM(stock), 0) FROM books)                            AS estoque_total,
       (SELECT COUNT(*) FROM users)                                           AS total_usuarios,
       (SELECT COUNT(*) FROM loans WHERE return_date IS NULL)                 AS emprestimos_ativos,
       (SELECT COUNT(*) FROM loans
         WHERE return_date IS NULL AND due_date < CURRENT_DATE)               AS emprestimos_atrasados,
       (SELECT COUNT(*) FROM reservations WHERE status = 'ACTIVE')            AS reservas_ativas,
       (SELECT COALESCE(SUM(total_price), 0) FROM sales WHERE status = 'PAID') AS receita_vendas,
       (SELECT COALESCE(SUM(amount), 0) FROM fines WHERE payment_status = 'PENDING') AS multas_pendentes;

-- 7.2 Livros mais emprestados (/reports/top-books)
SELECT b.id,
       b.title,
       b.author,
       SUM(li.quantity) AS unidades_emprestadas,
       COUNT(DISTINCT l.id) AS emprestimos
  FROM loan_items li
  JOIN loans l ON l.id = li.loan_id
  JOIN books b ON b.id = li.book_id
 GROUP BY b.id, b.title, b.author
 ORDER BY unidades_emprestadas DESC, b.title
 LIMIT 5;

-- 7.3 Emprestimos por mes (/reports/loans-by-month)
SELECT TO_CHAR(DATE_TRUNC('month', l.loan_date), 'YYYY-MM') AS mes,
       COUNT(*)                                             AS emprestimos,
       COUNT(l.return_date)                                 AS devolvidos
  FROM loans l
 GROUP BY DATE_TRUNC('month', l.loan_date)
 ORDER BY DATE_TRUNC('month', l.loan_date);

-- 7.4 Usuarios que mais emprestam (/reports/top-borrowers)
SELECT u.id,
       u.name,
       COUNT(DISTINCT l.id) AS emprestimos,
       COUNT(DISTINCT CASE WHEN l.return_date IS NULL THEN l.id END) AS em_aberto
  FROM users u
  JOIN loans l ON l.user_id = u.id
 GROUP BY u.id, u.name
 ORDER BY emprestimos DESC, u.name
 LIMIT 5;

-- 7.5 Estoque critico (/reports/low-stock)
SELECT b.id, b.title, b.author, b.stock
  FROM books b
 WHERE b.format = 'PHYSICAL'
   AND b.stock <= 3
 ORDER BY b.stock, b.title;


-- ---------------------------------------------------------------------
-- 8. Vendas: faturamento e ticket medio (JOIN + agregacao + janela)
-- ---------------------------------------------------------------------
SELECT s.id,
       u.name          AS usuario,
       s.sale_date,
       s.payment_method,
       s.status,
       s.total_price,
       SUM(s.total_price) OVER (ORDER BY s.sale_date, s.id) AS acumulado
  FROM sales s
  JOIN users u ON u.id = s.user_id
 ORDER BY s.sale_date, s.id;

-- Livros mais vendidos e receita por titulo
SELECT b.title,
       SUM(si.quantity)                   AS unidades,
       SUM(si.quantity * si.unit_price)   AS receita
  FROM sale_items si
  JOIN books b ON b.id = si.book_id
  JOIN sales s ON s.id = si.sale_id
 WHERE s.status = 'PAID'
 GROUP BY b.title
 ORDER BY receita DESC;


-- ---------------------------------------------------------------------
-- 9. Ajuste de preco: a mesma query que o back-office executa
--    (BookService.adjustPrices -> UPDATE nativo parametrizado)
-- ---------------------------------------------------------------------
-- Antes
SELECT id, title, price FROM books WHERE title = 'Duna';

-- Desconto de 8% em um titulo: fator 0.92 (atencao: 1.08 seria AUMENTO de 8%)
UPDATE books
   SET price = ROUND(price * 0.92, 2)
 WHERE title = 'Duna'
   AND price IS NOT NULL;

-- Depois
SELECT id, title, price FROM books WHERE title = 'Duna';

-- Desconto de 10% em uma categoria inteira (subquery com EXISTS)
UPDATE books
   SET price = ROUND(price * 0.90, 2)
 WHERE price IS NOT NULL
   AND EXISTS (SELECT 1
                 FROM book_categories bc
                 JOIN categories c ON c.id = bc.category_id
                WHERE bc.book_id = books.id
                  AND c.name = 'Tecnologia');

-- Reajuste de 8% para cima em todo o acervo
UPDATE books
   SET price = ROUND(price * 1.08, 2)
 WHERE price IS NOT NULL;


-- ---------------------------------------------------------------------
-- 10. Transacao: mostrar que da para desfazer um UPDATE (ROLLBACK)
-- ---------------------------------------------------------------------
BEGIN;
UPDATE books SET stock = stock + 10 WHERE title = 'Duna';
SELECT title, stock FROM books WHERE title = 'Duna';
ROLLBACK;
SELECT title, stock FROM books WHERE title = 'Duna';


-- ---------------------------------------------------------------------
-- 11. Plano de execucao: mostrar uso de indice
-- ---------------------------------------------------------------------
EXPLAIN ANALYZE
SELECT * FROM books WHERE title = 'Duna';
