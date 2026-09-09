import { useEffect, useState } from 'react';
import { BookOpen, ArrowLeftRight, ShoppingCart, Users, AlertTriangle } from 'lucide-react';
import StatCard from '../components/StatCard';
import type { Book, Loan, Sale } from '../types/api';
import { booksService } from '../services/booksService';
import { usersService } from '../services/usersService';
import { loansService } from '../services/loansService';
import { salesService } from '../services/salesService';
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

interface MonthBucket {
  key: string;
  label: string;
  value: number;
}

function buildLast7Months(loans: Loan[]): MonthBucket[] {
  const now = new Date();
  const buckets: MonthBucket[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: MONTHS_PT[d.getMonth()],
      value: 0,
    });
  }
  loans.forEach((l) => {
    const key = l.loanDate.slice(0, 7);
    const b = buckets.find((x) => x.key === key);
    if (b) b.value += 1;
  });
  return buckets;
}

export default function DashboardPage() {
  const [totalBooks, setTotalBooks] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [monthSales, setMonthSales] = useState<number | null>(null);

  useEffect(() => {
    booksService
      .list({ size: 500 })
      .then((page) => {
        setTotalBooks(page.meta.totalElements);
        setLowStock(
          page.content.filter((b: Book) => b.format === 'PHYSICAL' && (b.stock ?? 0) <= 3).length,
        );
      })
      .catch(() => {
        setTotalBooks(null);
        setLowStock(null);
      });

    usersService
      .list({ size: 1 })
      .then((page) => setTotalUsers(page.meta.totalElements))
      .catch(() => setTotalUsers(null));

    loansService
      .list({ size: 500 })
      .then((page) => setLoans(page.content))
      .catch(() => setLoans(null));

    salesService
      .list({ size: 500 })
      .then((page) => {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const total = page.content
          .filter((s: Sale) => s.status === 'PAID' && s.saleDate.slice(0, 7) === currentMonth)
          .reduce((sum: number, s: Sale) => sum + (s.totalPrice ?? 0), 0);
        setMonthSales(total);
      })
      .catch(() => setMonthSales(null));
  }, []);

  const activeCount = loans?.filter((l) => l.status === 'ACTIVE').length ?? null;
  const lateCount = loans?.filter((l) => l.status === 'LATE').length ?? 0;
  const recentLoans = loans?.slice(0, 5) ?? [];
  const monthly = buildLast7Months(loans ?? []);
  const maxLoan = Math.max(1, ...monthly.map((m) => m.value));

  return (
    <div className="space-y-6">
      {/* Cards de metricas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total de Livros"
          value={totalBooks ?? '—'}
          icon={BookOpen}
          hint="dado real da API"
          accent="bg-brand-100 text-brand-700 dark:bg-brand-600/20 dark:text-brand-300"
        />
        <StatCard
          label="Empréstimos Ativos"
          value={activeCount ?? '—'}
          icon={ArrowLeftRight}
          hint="dado real da API"
          accent="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
        />
        <StatCard
          label="Vendas do Mês"
          value={monthSales === null ? '—' : formatCurrency(monthSales)}
          icon={ShoppingCart}
          hint="dado real da API"
          accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
        />
        <StatCard
          label="Usuários"
          value={totalUsers ?? '—'}
          icon={Users}
          hint="dado real da API"
          accent="bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Grafico de emprestimos por mes (real) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Empréstimos por mês
            </h2>
            <span className="text-sm text-slate-400">últimos 7 meses</span>
          </div>
          <div className="flex h-56 items-stretch gap-4">
            {monthly.map((m) => (
              <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-brand-500 transition-all hover:bg-brand-600"
                    style={{ height: `${(m.value / maxLoan) * 100}%` }}
                    title={`${m.value} empréstimo(s)`}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {m.label}
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
                  {lowStock ?? '—'} livro(s) com estoque baixo
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
                  {lateCount} empréstimo(s) atrasado(s)
                </p>
                <p className="text-red-600 dark:text-red-400/80">Vencidos e não devolvidos.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emprestimos recentes (real) */}
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
