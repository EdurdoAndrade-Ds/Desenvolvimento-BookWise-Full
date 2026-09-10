import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Loan } from '../../types/api';
import { loansService } from '../../services/loansService';
import { ApiError } from '../../services/http';
import { formatDate } from '../../lib/format';
import { useCurrentCustomer } from '../../context/CurrentCustomerContext';
import {
  LOAN_STATUS_LABELS,
  LOAN_STATUS_STYLES,
} from '../../lib/loanStatus';

export default function MyLoansPage() {
  const { customer } = useCurrentCustomer();
  const [items, setItems] = useState<Loan[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!customer) return;
    try {
      const data = await loansService.list({ userId: customer.id, size: 100 });
      setItems(data.content);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar seus empréstimos.',
      );
    }
  }, [customer]);

  useEffect(() => {
    setItems([]);
    setError(null);
    void load();
  }, [load]);

  if (!customer) {
    return (
      <CustomerPage title="Meus empréstimos">
        <CustomerPrompt />
      </CustomerPage>
    );
  }
  if (error) {
    return (
      <CustomerPage title="Meus empréstimos">
        <ErrorMessage message={error} />
      </CustomerPage>
    );
  }
  if (items.length === 0) {
    return (
      <CustomerPage title="Meus empréstimos">
        <EmptyMessage message="Você ainda não possui empréstimos." />
      </CustomerPage>
    );
  }

  return (
    <CustomerPage title="Meus empréstimos">
      <div className="space-y-3">
        {items.map((loan) => (
          <div
            key={loan.id}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                  {loan.items.map((item) => item.bookTitle).join(', ')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Empréstimo em {formatDate(loan.loanDate)} · devolução prevista em{' '}
                  {formatDate(loan.dueDate)}
                </p>
              </div>
              <span
                className={`inline-flex h-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${LOAN_STATUS_STYLES[loan.status]}`}
              >
                {LOAN_STATUS_LABELS[loan.status]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </CustomerPage>
  );
}

function CustomerPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
      {children}
    </div>
  );
}

function CustomerPrompt() {
  return (
    <p className="text-sm text-slate-500">
      Selecione um cliente no cabeçalho para visualizar seus dados.
    </p>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <p className="rounded-xl bg-red-50 p-4 text-red-700">{message}</p>;
}

function EmptyMessage({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed p-10 text-center text-slate-500">
      {message}
    </p>
  );
}
