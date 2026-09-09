import { useEffect, useState, useCallback } from 'react';
import { CircleDollarSign, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { Fine, Page } from '../types/api';
import { finesService } from '../services/finesService';
import { ApiError } from '../services/http';
import { formatCurrency, formatDate } from '../lib/format';
import { FINE_STATUS_LABELS, FINE_STATUS_STYLES } from '../lib/fineStatus';

const PAGE_SIZE = 8;

export default function FinesPage() {
  const [data, setData] = useState<Page<Fine> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await finesService.list({ page, size: PAGE_SIZE }));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar as multas. O backend está rodando em http://localhost:8080?',
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePay = async (fine: Fine) => {
    if (
      !window.confirm(`Registrar pagamento da multa #${fine.id} (${formatCurrency(fine.value)})?`)
    )
      return;
    try {
      await finesService.pay(fine.id);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Erro ao registrar pagamento.');
    }
  };

  const meta = data?.meta;

  return (
    <div className="space-y-5">
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
            <CircleDollarSign className="h-8 w-8" />
            <p className="text-sm">Nenhuma multa registrada.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-medium">Empréstimo</th>
                <th className="px-6 py-3 font-medium">Usuário</th>
                <th className="px-6 py-3 font-medium">Dias em atraso</th>
                <th className="px-6 py-3 font-medium">Valor</th>
                <th className="px-6 py-3 font-medium">Pagamento</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.content.map((fine) => (
                <tr key={fine.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-100">
                    #{fine.loanId}
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{fine.userName}</td>
                  <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{fine.daysLate}</td>
                  <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">
                    {formatCurrency(fine.value)}
                  </td>
                  <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                    {formatDate(fine.paymentDate)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${FINE_STATUS_STYLES[fine.paymentStatus]}`}
                    >
                      {FINE_STATUS_LABELS[fine.paymentStatus]}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {fine.paymentStatus === 'PENDING' && (
                      <button
                        onClick={() => handlePay(fine)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                        title="Registrar pagamento"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Pagar
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
            {meta.totalElements} multa(s) · página {meta.page + 1} de {meta.totalPages}
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
    </div>
  );
}
