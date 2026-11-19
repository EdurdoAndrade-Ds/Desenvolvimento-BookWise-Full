-- Capa do livro: guarda apenas a URL publica da imagem (o arquivo fica hospedado fora do banco)
ALTER TABLE books ADD COLUMN cover_url VARCHAR(500);

-- Capas dos livros do seed (V3), hospedadas na Open Library
UPDATE books SET cover_url = 'https://covers.openlibrary.org/b/id/8065615-L.jpg'  WHERE isbn = '9780132350884';
UPDATE books SET cover_url = 'https://covers.openlibrary.org/b/id/7087623-M.jpg'  WHERE isbn = '9780134757599';
UPDATE books SET cover_url = 'https://covers.openlibrary.org/b/id/14625765-L.jpg' WHERE isbn = '9788533613379';
UPDATE books SET cover_url = 'https://covers.openlibrary.org/b/id/14627509-L.jpg' WHERE isbn = '9788595084759';
UPDATE books SET cover_url = 'https://covers.openlibrary.org/b/id/15158720-L.jpg' WHERE isbn = '9788576572123';
UPDATE books SET cover_url = 'https://covers.openlibrary.org/b/id/15200523-L.jpg' WHERE isbn = '9788535914849';
UPDATE books SET cover_url = 'https://covers.openlibrary.org/b/id/5548424-M.jpg'  WHERE isbn = '9780321125217';
UPDATE books SET cover_url = 'https://covers.openlibrary.org/b/id/10143650-L.jpg' WHERE isbn = '9780135957059';
