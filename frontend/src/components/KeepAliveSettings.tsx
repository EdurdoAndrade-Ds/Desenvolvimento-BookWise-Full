import { useEffect, useState } from 'react';
import {
  keepAliveDeadline,
  keepAliveService,
  type KeepAliveConfig,
} from '../services/keepAliveService';
import { updateBackendStatus, useBackendStatus } from '../services/backendStatus';
import BackendStatusDetails from './BackendStatusDetails';

export default function KeepAliveSettings() {
  const { keepAlive: config } = useBackendStatus();
  const [interval, setInterval] = useState(10);
  const [duration, setDuration] = useState('1');
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    let initialized = false;
    const load = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const value = await keepAliveService.get();
        if (!active) return;
        updateBackendStatus({ keepAlive: value });
        if (!initialized) {
          initialized = true;
          setInterval(value.intervalMinutes);
          setDuration(value.activeUntil ? 'time' : value.enabled ? 'off' : '1');
          if (value.activeUntil) {
            const date = new Date(value.activeUntil);
            setTime(
              `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
            );
          }
          setReady(true);
        }
      } catch (cause) {
        if (active)
          setError(
            cause instanceof Error ? cause.message : 'Não foi possível carregar a configuração.',
          );
      }
    };
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  async function save(enabled: boolean) {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const value: KeepAliveConfig = await keepAliveService.update({
        enabled,
        intervalMinutes: interval,
        activeUntil: enabled ? keepAliveDeadline(duration, time) : null,
      });
      updateBackendStatus({ keepAlive: value });
      setSuccess('Configuração salva.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
        Manter servidor ativo
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        O backend verifica a própria saúde no intervalo escolhido. Um servidor já adormecido precisa
        receber uma requisição para acordar.
      </p>
      <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <BackendStatusDetails keepAlive={config} />
      </div>
      {config?.warning && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
        >
          {config.warning}
        </p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save(config?.enabled ?? false);
        }}
        className="mt-5 space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
            <span className="block">Intervalo</span>
            <select
              disabled={!ready || busy}
              value={interval}
              onChange={(event) => setInterval(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-transparent p-2 dark:border-slate-700"
            >
              {[5, 10, 14].map((value) => (
                <option key={value} value={value}>
                  {value} min
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
            <span className="block">Duração</span>
            <select
              disabled={!ready || busy}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-transparent p-2 dark:border-slate-700"
            >
              <option value="1">1 h</option>
              <option value="4">4 h</option>
              <option value="8">8 h</option>
              <option value="time">Até horário</option>
              <option value="off">Até desligar</option>
            </select>
          </label>
          {duration === 'time' && (
            <label className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
              <span className="block">Horário (próxima ocorrência)</span>
              <input
                disabled={!ready || busy}
                type="time"
                required
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-transparent p-2 dark:border-slate-700"
              />
            </label>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={config?.enabled ?? false}
            disabled={!ready || busy}
            onClick={() => {
              void save(!config?.enabled);
            }}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {config?.enabled ? 'Desativar' : 'Ativar'}
          </button>
          <button
            type="submit"
            disabled={!ready || busy}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
          >
            Salvar alterações
          </button>
        </div>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-3 text-sm text-emerald-600">
          {success}
        </p>
      )}
      <div className="mt-5 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Último ping:{' '}
          {config?.lastPingAt ? new Date(config.lastPingAt).toLocaleString('pt-BR') : '—'} ·{' '}
          {config?.lastStatus ?? '—'} ·{' '}
          {config?.lastLatencyMs === null || config?.lastLatencyMs === undefined
            ? '—'
            : `${config.lastLatencyMs} ms`}
        </div>
        <div>Falhas consecutivas: {config?.failureCount ?? 0}</div>
      </div>
    </section>
  );
}
