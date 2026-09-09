import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Fine } from '../../types/api';
import { finesService } from '../../services/finesService';
import { ApiError } from '../../services/http';
import { formatCurrency, formatDate } from '../../lib/format';
import { useCurrentCustomer } from '../../context/useCurrentCustomer';
import { FINE_STATUS_LABELS, FINE_STATUS_STYLES } from '../../lib/fineStatus';

export default function MyFinesPage() {
  const { customer } = useCurrentCustomer();
  const [items, setItems] = useState<Fine[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!customer) return;
    try {
      const data = await finesService.list({ userId: customer.id, size: 100 });
      setItems(data.content);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar suas multas.');
    }
  }, [customer]);

  useEffect(() => {
    setItems([]);
    setError(null);
    void load();
  }, [load]);

  const pay = async (fine: Fine) => {
    try {
      await finesService.pay(fine.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível registrar o pagamento.');
    }
  };

  if (!customer) {
    return (
      <CustomerPage title="Minhas multas">
        <CustomerPrompt />
      </CustomerPage>
    );
  }
  if (error) {
    return (
      <CustomerPage title="Minhas multas">
        <ErrorMessage message={error} />
      </CustomerPage>
    );
  }
  if (items.length === 0) {
    return (
      <CustomerPage title="Minhas multas">
        <EmptyMessage message="Você não possui multas." />
      </CustomerPage>
    );
  }

  return (
    <CustomerPage title="Minhas multas">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                {formatCurrency(item.value)}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {item.daysLate} dias em atraso ·{' '}
                {item.paymentDate
                  ? `paga em ${formatDate(item.paymentDate)}`
                  : 'Pagamento pendente'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${FINE_STATUS_STYLES[item.paymentStatus]}`}
              >
                {FINE_STATUS_LABELS[item.paymentStatus]}
              </span>
              {item.paymentStatus === 'PENDING' && (
                <button
                  onClick={() => pay(item)}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Pagar multa
                </button>
              )}
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
      Selecione um cliente no cabeçalho para visualizar suas multas.
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
