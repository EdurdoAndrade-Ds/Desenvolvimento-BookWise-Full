import { http } from './http';

export interface KeepAliveConfig {
  enabled: boolean;
  intervalMinutes: number;
  activeUntil: string | null;
  lastPingAt: string | null;
  lastStatus: string | null;
  lastLatencyMs: number | null;
  failureCount: number;
  targetConfigured: boolean;
  warning: string | null;
}
export type KeepAliveInput = Pick<KeepAliveConfig, 'enabled' | 'intervalMinutes' | 'activeUntil'>;
export const keepAliveService = {
  get: () => http.get<KeepAliveConfig>('/api/v1/admin/keep-alive'),
  update: (input: KeepAliveInput) => http.put<KeepAliveConfig>('/api/v1/admin/keep-alive', input),
};

export function keepAliveDeadline(duration: string, time: string, now = new Date()): string | null {
  if (duration === 'off') return null;
  if (duration === 'time') {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Informe um horário válido.');
    const [hours, minutes] = time.split(':').map(Number);
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.toISOString();
  }
  if (!['1', '4', '8'].includes(duration)) throw new Error('Duração inválida.');
  return new Date(now.getTime() + Number(duration) * 3600000).toISOString();
}
