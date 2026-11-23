import { http } from './http';
import { updateBackendStatus } from './backendStatus';

let pending: Promise<void> | null = null;

export function checkBackendHealth(): Promise<void> {
  if (document.visibilityState !== 'visible') return Promise.resolve();
  if (pending) return pending;
  const controller = new AbortController();
  const hidden = () => {
    if (document.visibilityState !== 'visible') controller.abort();
  };
  document.addEventListener('visibilitychange', hidden);
  const start = performance.now();
  const slow = setTimeout(() => updateBackendStatus({ phase: 'waking' }), 2000);
  pending = (async () => {
    try {
      const health = await http.get<{ status: string }>('/actuator/health', {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const latencyMs = Math.round(performance.now() - start);
      updateBackendStatus({
        phase: health.status === 'UP' ? (latencyMs < 2000 ? 'online' : 'waking') : 'offline',
        latencyMs,
        lastCheck: new Date().toISOString(),
        failures: 0,
      });
    } catch {
      if (!controller.signal.aborted)
        updateBackendStatus({ phase: 'offline', lastCheck: new Date().toISOString() });
    } finally {
      clearTimeout(slow);
      document.removeEventListener('visibilitychange', hidden);
      pending = null;
    }
  })();
  return pending;
}
