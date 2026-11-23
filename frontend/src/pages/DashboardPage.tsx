import { useEffect, useState } from 'react';
import { BookOpen, ArrowLeftRight, ShoppingCart, Users, AlertTriangle } from 'lucide-react';
import StatCard from '../components/StatCard';
import type { BookRanking, LibrarySummary, Loan, MonthlyLoan } from '../types/api';
import { loansService } from '../services/loansService';
import { reportsService } from '../services/reportsService';
import { formatCurrency, formatDate } from '../lib/format';
import { LOAN_STATUS_LABELS, LOAN_STATUS_STYLES } from '../lib/loanStatus';

const MONTHS_PT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

function monthLabel(month: string): string {
  const index = Number(month.slice(5, 7)) - 1;
  return MONTHS_PT[index] ?? month;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<LibrarySummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyLoan[]>([]);
  const [topBooks, setTopBooks] = useState<BookRanking[]>([]);
  const [recentLoans, setRecentLoans] = useState<Loan[]>([]);

  useEffect(() => {
    reportsService
      .summary()
      .then(setSummary)
      .catch(() => setSummary(null));

    reportsService
      .loansByMonth()
      .then(setMonthly)
      .catch(() => setMonthly([]));

    reportsService
      .topBooks()
      .then(setTopBooks)
      .catch(() => setTopBooks([]));

    loansService
      .list({ size: 5 })
      .then((page) => setRecentLoans(page.content))
      .catch(() => setRecentLoans([]));
  }, []);

  const maxLoan = Math.max(1, ...monthly.map((m) => m.total));

  return (
    <div className="space-y-6">
      {/* Cards de metricas (agregados via SQL nativo em /api/v1/reports/summary) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total de Livros"
          value={summary?.totalBooks ?? '—'}
          icon={BookOpen}
          hint="dado real da API"
          accent="bg-brand-100 text-brand-700 dark:bg-brand-600/20 dark:text-brand-300"
        />
        <StatCard
          label="Empréstimos Ativos"
          value={summary?.activeLoans ?? '—'}
          icon={ArrowLeftRight}
          hint="dado real da API"
          accent="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
        />
        <StatCard
          label="Vendas do Mês"
          value={summary === null ? '—' : formatCurrency(summary.monthSalesTotal)}
          icon={ShoppingCart}
          hint="dado real da API"
          accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
        />
        <StatCard
          label="Usuários"
          value={summary?.totalUsers ?? '—'}
          icon={Users}
          hint="dado real da API"
          accent="bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Grafico de emprestimos por mes (GROUP BY no banco) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Empréstimos por mês
            </h2>
            <span className="text-sm text-slate-400">agregado no banco</span>
          </div>
          <div className="flex h-56 items-stretch gap-4">
            {monthly.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-brand-500 transition-all hover:bg-brand-600"
                    style={{ height: `${(m.total / maxLoan) * 100}%` }}
                    title={`${m.total} empréstimo(s) · ${m.returned} devolvido(s) · ${m.overdue} atrasado(s)`}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {monthLabel(m.month)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas / resumo */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
            Atenção
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-500/10">
              <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  {summary?.lowStockBooks ?? '—'} livro(s) com estoque baixo
                </p>
                <p className="text-amber-600 dark:text-amber-400/80">
                  Físicos com 3 unidades ou menos.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 dark:bg-red-500/10">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div className="text-sm">
                <p className="font-medium text-red-800 dark:text-red-300">
                  {summary?.overdueLoans ?? '—'} empréstimo(s) atrasado(s)
                </p>
                <p className="text-red-600 dark:text-red-400/80">Vencidos e não devolvidos.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
              <ShoppingCart className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <div className="text-sm">
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {summary?.pendingFines ?? '—'} multa(s) pendente(s)
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  {summary === null
                    ? 'Total a receber indisponível.'
                    : `Total a receber: ${formatCurrency(summary.pendingFinesTotal)}.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ranking de livros mais emprestados (JOIN + GROUP BY + ORDER BY no banco) */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Livros mais emprestados
          </h2>
          <span className="text-sm text-slate-400">ranking no banco</span>
        </div>
        {topBooks.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">Nenhum empréstimo registrado.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium">Livro</th>
                <th className="px-6 py-3 font-medium">Autor</th>
                <th className="px-6 py-3 font-medium">Empréstimos</th>
                <th className="px-6 py-3 font-medium">Unidades</th>
                <th className="px-6 py-3 font-medium">Em aberto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {topBooks.map((book) => (
                <tr key={book.bookId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {book.title}
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{book.author}</td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{book.loanCount}</td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-300">
                    {book.unitsLoaned}
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{book.openLoans}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Emprestimos recentes (pagina pequena, sem agregacao no navegador) */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Empréstimos recentes
          </h2>
        </div>
        {recentLoans.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">Nenhum empréstimo registrado.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium">Usuário</th>
                <th className="px-6 py-3 font-medium">Livros</th>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {loan.userName}
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-300">
                    {loan.items.map((i) => i.bookTitle).join(', ')}
                  </td>
                  <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                    {formatDate(loan.loanDate)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${LOAN_STATUS_STYLES[loan.status]}`}
                    >
                      {LOAN_STATUS_LABELS[loan.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
