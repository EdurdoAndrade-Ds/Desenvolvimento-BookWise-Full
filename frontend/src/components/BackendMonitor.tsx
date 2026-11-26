import { useEffect } from 'react';
import { checkBackendHealth } from '../services/backendHealth';
import { useBackendStatus } from '../services/backendStatus';

export default function BackendMonitor() {
  const status = useBackendStatus();
  useEffect(() => {
    const check = () => {
      void checkBackendHealth();
    };
    check();
    const timer = setInterval(check, 60000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  return status.phase === 'waking' ? (
    <div
      role="status"
      className="pointer-events-none fixed bottom-4 right-4 z-50 max-w-xs rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm dark:border-amber-800 dark:bg-slate-900 dark:text-amber-200"
    >
      Acordando servidor… Você pode continuar navegando.
    </div>
  ) : null;
}
