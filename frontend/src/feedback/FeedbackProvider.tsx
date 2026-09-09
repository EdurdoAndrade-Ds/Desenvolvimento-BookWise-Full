import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { FeedbackContext, type ConfirmOptions, type NoticeTone } from './feedbackContext';

interface PendingConfirm extends ConfirmOptions {
  resolve: (answer: boolean) => void;
}

interface Notice {
  id: number;
  message: string;
  tone: NoticeTone;
}

const NOTICE_TIMEOUT_MS = 5000;

/**
 * Concentra confirmacoes e avisos da aplicacao em componentes React, sem depender
 * de `window.confirm`/`window.alert` (bloqueados quando a app roda dentro de um iframe).
 */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextNoticeId = useRef(0);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  );

  const notify = useCallback((message: string, tone: NoticeTone = 'info') => {
    const id = nextNoticeId.current++;
    setNotices((current) => [...current, { id, message, tone }]);
    window.setTimeout(
      () => setNotices((current) => current.filter((notice) => notice.id !== id)),
      NOTICE_TIMEOUT_MS,
    );
  }, []);

  const settle = (answer: boolean) => {
    pending?.resolve(answer);
    setPending(null);
  };

  const value = useMemo(() => ({ confirm, notify }), [confirm, notify]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {pending && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="flex items-start gap-3 px-6 py-5">
              <span
                className={`mt-0.5 rounded-full p-2 ${
                  pending.tone === 'danger'
                    ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300'
                    : 'bg-brand-50 text-brand-600 dark:bg-brand-600/10 dark:text-brand-300'
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  {pending.title}
                </h2>
                {pending.message && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{pending.message}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => settle(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => settle(true)}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                  pending.tone === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                {pending.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notices.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[70] flex w-full max-w-sm flex-col gap-2">
          {notices.map((notice) => (
            <div
              key={notice.id}
              role="status"
              className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm shadow-lg ${
                notice.tone === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-white dark:bg-slate-700'
              }`}
            >
              <span className="flex-1">{notice.message}</span>
              <button
                type="button"
                aria-label="Fechar aviso"
                onClick={() =>
                  setNotices((current) => current.filter((item) => item.id !== notice.id))
                }
                className="rounded p-0.5 text-white/80 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
