import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Reservation } from '../../types/api';
import { reservationsService } from '../../services/reservationsService';
import { ApiError } from '../../services/http';
import { formatDate } from '../../lib/format';
import { useCurrentCustomer } from '../../context/CurrentCustomerContext';
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_STYLES,
} from '../../lib/reservationStatus';

export default function MyReservationsPage() {
  const { customer } = useCurrentCustomer();
  const [items, setItems] = useState<Reservation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!customer) return;
    try {
      const data = await reservationsService.list({ userId: customer.id, size: 100 });
      setItems(data.content);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar suas reservas.',
      );
    }
  }, [customer]);

  useEffect(() => {
    setItems([]);
    setError(null);
    void load();
  }, [load]);

  const cancel = async (reservation: Reservation) => {
    try {
      await reservationsService.cancel(reservation.id);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível cancelar a reserva.',
      );
    }
  };

  if (!customer) {
    return (
      <CustomerPage title="Minhas reservas">
        <CustomerPrompt />
      </CustomerPage>
    );
  }
  if (error) {
    return (
      <CustomerPage title="Minhas reservas">
        <ErrorMessage message={error} />
      </CustomerPage>
    );
  }
  if (items.length === 0) {
    return (
      <CustomerPage title="Minhas reservas">
        <EmptyMessage message="Você ainda não possui reservas." />
      </CustomerPage>
    );
  }

  return (
    <CustomerPage title="Minhas reservas">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                {item.bookTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Reservado em {formatDate(item.reserveDate)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${RESERVATION_STATUS_STYLES[item.status]}`}
              >
                {RESERVATION_STATUS_LABELS[item.status]}
              </span>
              {item.status === 'ACTIVE' && (
                <button
                  onClick={() => cancel(item)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Cancelar reserva
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </CustomerPage>
  );
}

function CustomerPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
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
      Selecione um cliente no cabeçalho para visualizar suas reservas.
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
