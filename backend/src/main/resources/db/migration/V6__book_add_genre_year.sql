-- Enriquece a tabela books com genero e ano de publicacao (alinha ao Livro oficial)
ALTER TABLE books ADD COLUMN genre VARCHAR(50);
ALTER TABLE books ADD COLUMN published_year INTEGER;

CREATE INDEX idx_books_genre ON books (genre);

-- Backfill dos dados de exemplo ja existentes (V3)
UPDATE books SET genre = 'Tecnologia',        published_year = 2008 WHERE isbn = '9780132350884';
UPDATE books SET genre = 'Tecnologia',        published_year = 2018 WHERE isbn = '9780134757599';
UPDATE books SET genre = 'Fantasia',          published_year = 1954 WHERE isbn = '9788533613379';
UPDATE books SET genre = 'Fantasia',          published_year = 1937 WHERE isbn = '9788595084759';
UPDATE books SET genre = 'Ficcao Cientifica', published_year = 1965 WHERE isbn = '9788576572123';
UPDATE books SET genre = 'Ficcao Cientifica', published_year = 1949 WHERE isbn = '9788535914849';
UPDATE books SET genre = 'Tecnologia',        published_year = 2003 WHERE isbn = '9780321125217';
UPDATE books SET genre = 'Tecnologia',        published_year = 1999 WHERE isbn = '9780135957059';
