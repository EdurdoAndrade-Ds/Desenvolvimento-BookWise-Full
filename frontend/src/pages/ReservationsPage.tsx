import { useEffect, useState, useCallback } from 'react';
import { Plus, BookMarked, RefreshCw, Ban } from 'lucide-react';
import type { Reservation, Page } from '../types/api';
import { reservationsService } from '../services/reservationsService';
import { ApiError } from '../services/http';
import { formatDate } from '../lib/format';
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_STYLES } from '../lib/reservationStatus';
import ReservationFormModal from '../components/ReservationFormModal';
import { useFeedback } from '../feedback/useFeedback';

const PAGE_SIZE = 8;

export default function ReservationsPage() {
  const [data, setData] = useState<Page<Reservation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const { confirm, notify } = useFeedback();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await reservationsService.list({ page, size: PAGE_SIZE }));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar as reservas. O backend está rodando em http://localhost:8080?',
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (reservation: Reservation) => {
    const confirmed = await confirm({
      title: `Cancelar a reserva #${reservation.id}?`,
      message: 'O estoque retido pela reserva será liberado.',
      confirmLabel: 'Cancelar reserva',
      tone: 'danger',
    });
    if (!confirmed) return;
    try {
      await reservationsService.cancel(reservation.id);
      await load();
      notify(`Reserva #${reservation.id} cancelada.`);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Erro ao cancelar a reserva.', 'error');
    }
  };

  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nova reserva
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {error ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </button>
          </div>
        ) : loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Carregando...</div>
        ) : data && data.content.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-slate-400">
            <BookMarked className="h-8 w-8" />
            <p className="text-sm">Nenhuma reserva registrada.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-medium">Usuário</th>
                <th className="px-6 py-3 font-medium">Livro</th>
                <th className="px-6 py-3 font-medium">Reserva</th>
                <th className="px-6 py-3 font-medium">Expira</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.content.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {r.userName}
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{r.bookTitle}</td>
                  <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                    {formatDate(r.reserveDate)}
                  </td>
                  <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                    {formatDate(r.expirationDate)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${RESERVATION_STATUS_STYLES[r.status]}`}
                    >
                      {RESERVATION_STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {(r.status === 'ACTIVE' || r.status === 'EXPIRED') && (
                      <button
                        onClick={() => handleCancel(r)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                        title="Cancelar reserva"
                      >
                        <Ban className="h-4 w-4" /> Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta && meta.totalElements > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>
            {meta.totalElements} reserva(s) · página {meta.page + 1} de {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={meta.page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Anterior
            </button>
            <button
              disabled={meta.page >= meta.totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {showModal && <ReservationFormModal onClose={() => setShowModal(false)} onCreated={load} />}
    </div>
  );
}
