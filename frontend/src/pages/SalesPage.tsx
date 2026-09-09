import { useEffect, useState, useCallback } from 'react';
import { Plus, ShoppingCart, RefreshCw, Ban } from 'lucide-react';
import type { Sale, Page } from '../types/api';
import { salesService } from '../services/salesService';
import { ApiError } from '../services/http';
import { formatCurrency, formatDate } from '../lib/format';
import { SALE_STATUS_LABELS, SALE_STATUS_STYLES } from '../lib/saleStatus';
import SaleFormModal from '../components/SaleFormModal';

const PAGE_SIZE = 8;

export default function SalesPage() {
  const [data, setData] = useState<Page<Sale> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await salesService.list({ page, size: PAGE_SIZE }));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar as vendas. O backend está rodando em http://localhost:8080?',
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (sale: Sale) => {
    if (!window.confirm(`Cancelar a venda #${sale.id}? O estoque será restaurado.`)) return;
    try {
      await salesService.cancel(sale.id);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Erro ao cancelar a venda.');
    }
  };

  const booksSummary = (sale: Sale) =>
    sale.items
      .map((i) => (i.quantity > 1 ? `${i.bookTitle} (${i.quantity})` : i.bookTitle))
      .join(', ');

  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Nova venda
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
            <ShoppingCart className="h-8 w-8" />
            <p className="text-sm">Nenhuma venda registrada.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Livros</th>
                <th className="px-6 py-3 font-medium">Pagamento</th>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.content.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {sale.userName}
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-300">
                    {booksSummary(sale)}
                  </td>
                  <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                    {sale.paymentMethod ?? '—'}
                  </td>
                  <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                    {formatDate(sale.saleDate)}
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">
                    {formatCurrency(sale.totalPrice)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${SALE_STATUS_STYLES[sale.status]}`}
                    >
                      {SALE_STATUS_LABELS[sale.status]}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {sale.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancel(sale)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                        title="Cancelar venda"
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
            {meta.totalElements} venda(s) · página {meta.page + 1} de {meta.totalPages}
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

      {showModal && <SaleFormModal onClose={() => setShowModal(false)} onCreated={load} />}
    </div>
  );
}
