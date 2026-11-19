package com.bookwise.infrastructure.persistence.repository;

import com.bookwise.infrastructure.persistence.entity.LoanEntity;
import com.bookwise.infrastructure.persistence.projection.BookRankingProjection;
import com.bookwise.infrastructure.persistence.projection.BorrowerRankingProjection;
import com.bookwise.infrastructure.persistence.projection.LowStockProjection;
import com.bookwise.infrastructure.persistence.projection.MonthlyLoanProjection;
import com.bookwise.infrastructure.persistence.projection.SummaryProjection;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

/**
 * Consultas analiticas em SQL nativo (JOIN, GROUP BY, subqueries e agregacoes),
 * executadas no banco em vez de agregar os registros na aplicacao.
 *
 * <p>O SQL usa apenas construcoes portaveis entre PostgreSQL (producao/docker)
 * e H2 em modo PostgreSQL (perfil {@code local} e testes).
 */
public interface ReportJpaRepository extends Repository<LoanEntity, Long> {

    @Query(value = """
            select
              (select count(*) from books) as totalBooks,
              (select coalesce(sum(b.stock), 0) from books b
                 where b.format = 'PHYSICAL') as physicalStock,
              (select count(*) from books b
                 where b.format = 'PHYSICAL'
                   and coalesce(b.stock, 0) <= :lowStockThreshold) as lowStockBooks,
              (select count(*) from users) as totalUsers,
              (select count(*) from loans l where l.return_date is null) as activeLoans,
              (select count(*) from loans l
                 where l.return_date is null and l.due_date < :reference) as overdueLoans,
              (select coalesce(sum(s.total_price), 0) from sales s
                 where s.status = 'PAID'
                   and extract(year from s.sale_date) = extract(year from cast(:reference as date))
                   and extract(month from s.sale_date) = extract(month from cast(:reference as date))
              ) as monthSalesTotal,
              (select count(*) from fines f where f.payment_status = 'PENDING') as pendingFines,
              (select coalesce(sum(f.amount), 0) from fines f
                 where f.payment_status = 'PENDING') as pendingFinesTotal,
              (select count(*) from reservations r
                 where r.status = 'ACTIVE'
                   and (r.expiration_date is null or r.expiration_date >= :reference)
              ) as activeReservations
            """, nativeQuery = true)
    SummaryProjection summary(
            @Param("lowStockThreshold") int lowStockThreshold,
            @Param("reference") LocalDate reference);

    @Query(value = """
            select b.id as bookId,
                   b.title as title,
                   b.author as author,
                   count(distinct l.id) as loanCount,
                   coalesce(sum(li.quantity), 0) as unitsLoaned,
                   sum(case when l.return_date is null then 1 else 0 end) as openLoans
            from loan_items li
              join loans l on l.id = li.loan_id
              join books b on b.id = li.book_id
            group by b.id, b.title, b.author
            order by count(distinct l.id) desc, coalesce(sum(li.quantity), 0) desc, b.title asc
            limit :limit
            """, nativeQuery = true)
    List<BookRankingProjection> topBorrowedBooks(@Param("limit") int limit);

    @Query(value = """
            select cast(extract(year from l.loan_date) as integer) as refYear,
                   cast(extract(month from l.loan_date) as integer) as refMonth,
                   count(*) as total,
                   sum(case when l.return_date is not null then 1 else 0 end) as returned,
                   sum(case when l.return_date is null and l.due_date < :reference
                            then 1 else 0 end) as overdue
            from loans l
            where l.loan_date >= :from
            group by cast(extract(year from l.loan_date) as integer),
                     cast(extract(month from l.loan_date) as integer)
            order by 1 asc, 2 asc
            """, nativeQuery = true)
    List<MonthlyLoanProjection> loansByMonth(
            @Param("from") LocalDate from, @Param("reference") LocalDate reference);

    @Query(value = """
            select u.id as userId,
                   u.name as name,
                   u.email as email,
                   count(distinct l.id) as loanCount,
                   sum(case when l.return_date is null then 1 else 0 end) as openLoans,
                   coalesce((select sum(f.amount) from fines f
                               join loans lf on lf.id = f.loan_id
                              where lf.user_id = u.id
                                and f.payment_status = 'PENDING'), 0) as pendingFineTotal
            from loans l
              join users u on u.id = l.user_id
            group by u.id, u.name, u.email
            order by count(distinct l.id) desc, u.name asc
            limit :limit
            """, nativeQuery = true)
    List<BorrowerRankingProjection> topBorrowers(@Param("limit") int limit);

    @Query(value = """
            select b.id as bookId,
                   b.title as title,
                   b.author as author,
                   coalesce(b.stock, 0) as stock,
                   coalesce((select sum(li.quantity) from loan_items li
                               join loans l on l.id = li.loan_id
                              where li.book_id = b.id
                                and l.return_date is null), 0) as unitsOnLoan,
                   (select count(*) from reservations r
                     where r.book_id = b.id and r.status = 'ACTIVE') as activeReservations
            from books b
            where b.format = 'PHYSICAL'
              and coalesce(b.stock, 0) <= :threshold
            order by coalesce(b.stock, 0) asc, b.title asc
            """, nativeQuery = true)
    List<LowStockProjection> lowStockBooks(@Param("threshold") int threshold);
}
