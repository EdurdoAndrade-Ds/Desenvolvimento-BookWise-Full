package com.bookwise.infrastructure.config;

import com.bookwise.domain.model.Book;
import com.bookwise.domain.model.BookFormat;
import com.bookwise.domain.model.Category;
import com.bookwise.domain.model.CategoryRef;
import com.bookwise.domain.model.Fine;
import com.bookwise.domain.model.FinePaymentStatus;
import com.bookwise.domain.model.Loan;
import com.bookwise.domain.model.LoanItem;
import com.bookwise.domain.model.Reservation;
import com.bookwise.domain.model.ReservationStatus;
import com.bookwise.domain.model.Sale;
import com.bookwise.domain.model.SaleItem;
import com.bookwise.domain.model.SaleStatus;
import com.bookwise.domain.model.User;
import com.bookwise.domain.model.UserRole;
import com.bookwise.domain.port.BookRepository;
import com.bookwise.domain.port.CategoryRepository;
import com.bookwise.domain.port.FineRepository;
import com.bookwise.domain.port.LoanRepository;
import com.bookwise.domain.port.ReservationRepository;
import com.bookwise.domain.port.SaleRepository;
import com.bookwise.domain.port.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Popula a base com dados de exemplo no perfil {@code local} (H2 em memoria),
 * apenas quando as tabelas estiverem vazias.
 */
@Component
@Profile("local")
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private static final BigDecimal FINE_PER_DAY = new BigDecimal("2.00");

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final LoanRepository loanRepository;
    private final SaleRepository saleRepository;
    private final CategoryRepository categoryRepository;
    private final ReservationRepository reservationRepository;
    private final FineRepository fineRepository;

    public DataSeeder(
            BookRepository bookRepository,
            UserRepository userRepository,
            LoanRepository loanRepository,
            SaleRepository saleRepository,
            CategoryRepository categoryRepository,
            ReservationRepository reservationRepository,
            FineRepository fineRepository) {
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.loanRepository = loanRepository;
        this.saleRepository = saleRepository;
        this.categoryRepository = categoryRepository;
        this.reservationRepository = reservationRepository;
        this.fineRepository = fineRepository;
    }

    @Override
    public void run(String... args) {
        seedBooks();
        seedUsers();
        seedCategories();
        seedBookCategories();
        seedLoans();
        seedSales();
        seedReservations();
        seedFines();
    }

    private void seedReservations() {
        if (reservationRepository.count() > 0) {
            return;
        }
        List<User> users = userRepository.search(null, 0, 100).content();
        List<Book> books = bookRepository.search(null, 0, 100).content();
        if (users.isEmpty() || books.isEmpty()) {
            return;
        }
        LocalDate today = LocalDate.now();
        saveReservation(user(users, "Joao"), book(books, "O Senhor dos Aneis"),
                today.minusDays(2), today.plusDays(5), ReservationStatus.ACTIVE);
        saveReservation(user(users, "Ana"), book(books, "Clean Code"),
                today.minusDays(20), today.minusDays(6), ReservationStatus.ACTIVE); // expira (derivado)
        saveReservation(user(users, "Carlos"), book(books, "Duna"),
                today.minusDays(1), today.plusDays(6), ReservationStatus.FULFILLED);
        log.info("DataSeeder: reservas de exemplo inseridas.");
    }

    private void saveReservation(
            User u, Book b, LocalDate reserveDate, LocalDate expiration, ReservationStatus status) {
        if (u == null || b == null) {
            return;
        }
        reservationRepository.save(new Reservation(
                null, u.id(), u.name(), b.id(), b.title(), reserveDate, expiration, status, null));
    }

    private void seedFines() {
        if (fineRepository.count() > 0) {
            return;
        }
        for (Loan loan : loanRepository.findAll()) {
            if (loan.returnDate() != null
                    && loan.returnDate().isAfter(loan.dueDate())
                    && !fineRepository.existsByLoanId(loan.id())) {
                long daysLate = ChronoUnit.DAYS.between(loan.dueDate(), loan.returnDate());
                BigDecimal value = FINE_PER_DAY.multiply(BigDecimal.valueOf(daysLate));
                fineRepository.save(new Fine(
                        null, loan.id(), loan.userName(), value, (int) daysLate,
                        FinePaymentStatus.PENDING, null, null));
            }
        }
        log.info("DataSeeder: multas de exemplo geradas.");
    }

    private void seedBookCategories() {
        List<Book> books = bookRepository.search(null, 0, 100).content();
        List<Category> cats = categoryRepository.findAll();
        if (books.isEmpty() || cats.isEmpty() || !books.get(0).categories().isEmpty()) {
            return;
        }
        link(books, cats, "Clean Code", "Tecnologia");
        link(books, cats, "Refactoring", "Tecnologia");
        link(books, cats, "Domain-Driven Design", "Tecnologia");
        link(books, cats, "The Pragmatic Programmer", "Tecnologia");
        link(books, cats, "O Senhor dos Aneis", "Fantasia");
        link(books, cats, "O Hobbit", "Fantasia");
        link(books, cats, "Duna", "Ficcao Cientifica");
        link(books, cats, "1984", "Ficcao Cientifica");
        log.info("DataSeeder: livros vinculados a categorias.");
    }

    private void link(List<Book> books, List<Category> cats, String titlePart, String categoryName) {
        Book b = books.stream().filter(x -> x.title().contains(titlePart)).findFirst().orElse(null);
        Category c = cats.stream().filter(x -> x.name().equals(categoryName)).findFirst().orElse(null);
        if (b == null || c == null) {
            return;
        }
        bookRepository.save(b.withCategories(List.of(new CategoryRef(c.id(), c.name()))));
    }

    private void seedCategories() {
        if (categoryRepository.count() > 0) {
            return;
        }
        Category ficcao = categoryRepository.save(cat("Ficcao", "Obras de ficcao em geral", null));
        Category naoFiccao = categoryRepository.save(cat("Nao-Ficcao", "Obras factuais", null));
        categoryRepository.save(cat("Infantil", "Literatura infantil", null));
        categoryRepository.save(cat("Tecnologia", "Livros de TI, programacao e engenharia", naoFiccao.id()));
        categoryRepository.save(cat("Historia", "Livros historicos", naoFiccao.id()));
        categoryRepository.save(cat("Fantasia", "Literatura fantastica", ficcao.id()));
        categoryRepository.save(cat("Ficcao Cientifica", "Sci-fi", ficcao.id()));
        log.info("DataSeeder: categorias de exemplo inseridas.");
    }

    private Category cat(String name, String description, Long parentId) {
        return new Category(null, name, description, parentId, null, null);
    }

    private void seedBooks() {
        if (bookRepository.count() > 0) {
            return;
        }
        List<Book> seed = List.of(
                book("Clean Code", "Robert C. Martin", "9780132350884", "Tecnologia", 2008, BookFormat.PHYSICAL, "189.90", 12),
                book("Refactoring", "Martin Fowler", "9780134757599", "Tecnologia", 2018, BookFormat.PHYSICAL, "219.90", 7),
                book("O Senhor dos Aneis", "J.R.R. Tolkien", "9788533613379", "Fantasia", 1954, BookFormat.PHYSICAL, "149.90", 20),
                book("O Hobbit", "J.R.R. Tolkien", "9788595084759", "Fantasia", 1937, BookFormat.DIGITAL, "39.90", 0),
                book("Duna", "Frank Herbert", "9788576572123", "Ficcao Cientifica", 1965, BookFormat.PHYSICAL, "89.90", 15),
                book("1984", "George Orwell", "9788535914849", "Ficcao Cientifica", 1949, BookFormat.DIGITAL, "29.90", 0),
                book("Domain-Driven Design", "Eric Evans", "9780321125217", "Tecnologia", 2003, BookFormat.PHYSICAL, "259.90", 3),
                book("The Pragmatic Programmer", "Andrew Hunt", "9780135957059", "Tecnologia", 1999, BookFormat.PHYSICAL, "199.90", 9));
        seed.forEach(bookRepository::save);
        log.info("DataSeeder: {} livros de exemplo inseridos.", seed.size());
    }

    private void seedUsers() {
        if (userRepository.count() > 0) {
            return;
        }
        List<User> seed = List.of(
                user("Admin BookWise", "admin@bookwise.com", UserRole.ADMIN),
                user("Bruno Bibliotecario", "bruno@bookwise.com", UserRole.LIBRARIAN),
                user("Maria Silva", "maria@bookwise.com", UserRole.READER),
                user("Joao Souza", "joao@bookwise.com", UserRole.READER),
                user("Ana Costa", "ana@bookwise.com", UserRole.READER),
                user("Carlos Lima", "carlos@bookwise.com", UserRole.READER));
        seed.forEach(userRepository::save);
        log.info("DataSeeder: {} usuarios de exemplo inseridos.", seed.size());
    }

    private void seedLoans() {
        if (loanRepository.count() > 0) {
            return;
        }
        List<User> users = userRepository.search(null, 0, 100).content();
        List<Book> books = bookRepository.search(null, 0, 100).content();
        if (users.isEmpty() || books.isEmpty()) {
            return;
        }

        LocalDate today = LocalDate.now();
        int seeded = 0;

        // Devolvido no prazo.
        seeded += saveLoan(user(users, "Maria"), today.minusDays(20), today.minusDays(6), today.minusDays(8),
                item(book(books, "Clean Code"), 1));
        // Ativo (dentro do prazo).
        seeded += saveLoan(user(users, "Joao"), today.minusDays(3), today.plusDays(11), null,
                item(book(books, "O Senhor dos Aneis"), 1));
        // Atrasado (vencido e nao devolvido).
        seeded += saveLoan(user(users, "Ana"), today.minusDays(25), today.minusDays(5), null,
                item(book(books, "Duna"), 1), item(book(books, "Domain-Driven Design"), 1));
        // Ativo recente.
        seeded += saveLoan(user(users, "Carlos"), today.minusDays(1), today.plusDays(13), null,
                item(book(books, "Refactoring"), 1));
        // Devolvido em ATRASO (gera multa no seedFines).
        seeded += saveLoan(user(users, "Bruno"), today.minusDays(30), today.minusDays(16), today.minusDays(12),
                item(book(books, "1984"), 1));

        log.info("DataSeeder: {} emprestimos de exemplo inseridos.", seeded);
    }

    private int saveLoan(
            User borrower, LocalDate loanDate, LocalDate dueDate, LocalDate returnDate, LoanItem... items) {
        if (borrower == null || items.length == 0) {
            return 0;
        }
        loanRepository.save(new Loan(
                null, borrower.id(), borrower.name(), List.of(items), loanDate, dueDate, returnDate, null));
        return 1;
    }

    private LoanItem item(Book book, int quantity) {
        return new LoanItem(book.id(), book.title(), quantity);
    }

    private void seedSales() {
        if (saleRepository.count() > 0) {
            return;
        }
        List<User> users = userRepository.search(null, 0, 100).content();
        List<Book> books = bookRepository.search(null, 0, 100).content();
        if (users.isEmpty() || books.isEmpty()) {
            return;
        }

        LocalDate today = LocalDate.now();
        int seeded = 0;

        seeded += saveSale(user(users, "Maria"), "PIX", today, SaleStatus.PAID,
                saleItem(book(books, "Clean Code"), 1));
        seeded += saveSale(user(users, "Joao"), "Cartao Credito", today.minusDays(2), SaleStatus.PAID,
                saleItem(book(books, "Duna"), 1), saleItem(book(books, "1984"), 2));
        seeded += saveSale(user(users, "Ana"), "Dinheiro", today.minusMonths(1), SaleStatus.PAID,
                saleItem(book(books, "Refactoring"), 1));
        seeded += saveSale(user(users, "Carlos"), "Cartao Debito", today.minusDays(5), SaleStatus.CANCELLED,
                saleItem(book(books, "O Hobbit"), 1));

        log.info("DataSeeder: {} vendas de exemplo inseridas.", seeded);
    }

    private int saveSale(
            User buyer, String paymentMethod, LocalDate saleDate, SaleStatus status, SaleItem... items) {
        if (buyer == null || items.length == 0) {
            return 0;
        }
        BigDecimal total = BigDecimal.ZERO;
        for (SaleItem it : items) {
            total = total.add(it.subtotal());
        }
        saleRepository.save(new Sale(
                null, buyer.id(), buyer.name(), List.of(items), paymentMethod, saleDate, total, status, null));
        return 1;
    }

    private SaleItem saleItem(Book book, int quantity) {
        BigDecimal price = book.price() != null ? book.price() : BigDecimal.ZERO;
        return new SaleItem(book.id(), book.title(), quantity, price);
    }

    private User user(List<User> users, String namePart) {
        return users.stream().filter(u -> u.name().contains(namePart)).findFirst().orElse(null);
    }

    private Book book(List<Book> books, String titlePart) {
        return books.stream().filter(b -> b.title().contains(titlePart)).findFirst().orElseThrow();
    }

    private Book book(
            String title,
            String author,
            String isbn,
            String genre,
            int publishedYear,
            BookFormat format,
            String price,
            int stock) {
        return new Book(
                null, title, author, isbn, genre, publishedYear, format, new BigDecimal(price), stock,
                List.of(), null);
    }

    private User user(String name, String email, UserRole role) {
        return new User(null, name, email, role, null);
    }
}
