import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Sale } from '../../types/api';
import { salesService } from '../../services/salesService';
import { ApiError } from '../../services/http';
import { formatCurrency, formatDate } from '../../lib/format';
import { useCurrentCustomer } from '../../context/useCurrentCustomer';
import { SALE_STATUS_LABELS, SALE_STATUS_STYLES } from '../../lib/saleStatus';

export default function MyPurchasesPage() {
  const { customer } = useCurrentCustomer();
  const [items, setItems] = useState<Sale[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!customer) return;
    try {
      const data = await salesService.list({ userId: customer.id, size: 100 });
      setItems(data.content);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar suas compras.');
    }
  }, [customer]);

  useEffect(() => {
    setItems([]);
    setError(null);
    void load();
  }, [load]);

  if (!customer) {
    return (
      <CustomerPage title="Minhas compras">
        <CustomerPrompt />
      </CustomerPage>
    );
  }
  if (error) {
    return (
      <CustomerPage title="Minhas compras">
        <ErrorMessage message={error} />
      </CustomerPage>
    );
  }
  if (items.length === 0) {
    return (
      <CustomerPage title="Minhas compras">
        <EmptyMessage message="Você ainda não possui compras." />
      </CustomerPage>
    );
  }

  return (
    <CustomerPage title="Minhas compras">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                  {item.items.map((book) => book.bookTitle).join(', ')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{formatDate(item.saleDate)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <strong className="text-brand-700 dark:text-brand-400">
                  {formatCurrency(item.totalPrice)}
                </strong>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${SALE_STATUS_STYLES[item.status]}`}
                >
                  {SALE_STATUS_LABELS[item.status]}
                </span>
              </div>
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
      Selecione um cliente no cabeçalho para visualizar suas compras.
    </p>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <p className="rounded-xl bg-red-50 p-4 text-red-700">{message}</p>;
}

function EmptyMessage({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed p-10 text-center text-slate-500">{message}</p>
  );
}
