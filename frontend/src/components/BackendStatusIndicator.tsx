import { useCallback, useEffect, useId, useRef } from 'react';
import { checkBackendHealth } from '../services/backendHealth';
import { updateBackendStatus, useBackendStatus } from '../services/backendStatus';
import { keepAliveService } from '../services/keepAliveService';
import BackendStatusDetails from './BackendStatusDetails';
import { popoverPosition } from '../lib/popoverPosition';

export default function BackendStatusIndicator({ admin = false }: { admin?: boolean }) {
  const status = useBackendStatus();
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const tooltip = useRef<HTMLSpanElement>(null);
  const positionTooltip = useCallback(() => {
    if (!trigger.current || !tooltip.current) return;
    const { left, top } = popoverPosition(
      trigger.current.getBoundingClientRect(),
      tooltip.current.getBoundingClientRect(),
      { width: window.innerWidth, height: window.innerHeight },
    );
    tooltip.current.style.setProperty('--tooltip-left', `${left}px`);
    tooltip.current.style.setProperty('--tooltip-top', `${top}px`);
  }, []);
  useEffect(() => {
    positionTooltip();
    const observer = new ResizeObserver(positionTooltip);
    if (tooltip.current) observer.observe(tooltip.current);
    window.addEventListener('resize', positionTooltip);
    window.addEventListener('scroll', positionTooltip, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', positionTooltip);
      window.removeEventListener('scroll', positionTooltip, true);
    };
  }, [positionTooltip]);
  useEffect(() => {
    if (!admin) return;
    let active = true;
    const load = () => {
      if (document.visibilityState !== 'visible') return;
      void keepAliveService
        .get()
        .then((config) => {
          if (active) updateBackendStatus({ keepAlive: config });
        })
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 60000);
    document.addEventListener('visibilitychange', load);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', load);
    };
  }, [admin]);
  const keepAlive = admin ? status.keepAlive : null;
  const keptAlive =
    keepAlive?.enabled &&
    keepAlive.targetConfigured &&
    (!keepAlive.activeUntil || Date.parse(keepAlive.activeUntil) > Date.now());
  const color =
    status.phase === 'online'
      ? keptAlive
        ? 'bg-blue-500'
        : 'bg-emerald-500'
      : status.phase === 'waking'
        ? 'bg-amber-400 motion-safe:animate-pulse'
        : 'bg-red-500';

  return (
    <span className="group relative inline-flex">
      <button
        ref={trigger}
        type="button"
        onFocus={positionTooltip}
        onPointerEnter={positionTooltip}
        onPointerDown={positionTooltip}
        onClick={() => {
          void checkBackendHealth();
        }}
        aria-label={`Status do servidor: ${status.phase}. Verificar novamente`}
        aria-describedby={id}
        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 dark:hover:bg-slate-800"
      >
        <span data-backend-state={status.phase} className={`h-2.5 w-2.5 rounded-full ${color}`} />
      </button>
      <span
        ref={tooltip}
        id={id}
        role="tooltip"
        className="backend-status-tooltip invisible absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 text-left text-xs text-slate-700 opacity-0 shadow-lg group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <BackendStatusDetails keepAlive={keepAlive} />
        <span className="mt-2 block text-slate-400">Clique para verificar novamente.</span>
      </span>
    </span>
  );
}
