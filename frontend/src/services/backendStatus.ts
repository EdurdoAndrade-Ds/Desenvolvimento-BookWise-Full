import { useSyncExternalStore } from 'react';
import type { KeepAliveConfig } from './keepAliveService';

export type BackendPhase = 'online' | 'waking' | 'offline';
export interface BackendStatus {
  phase: BackendPhase;
  latencyMs: number | null;
  lastCheck: string | null;
  failures: number;
  keepAlive: KeepAliveConfig | null;
}

let status: BackendStatus = {
  phase: 'waking',
  latencyMs: null,
  lastCheck: null,
  failures: 0,
  keepAlive: null,
};
const listeners = new Set<() => void>();
export const getBackendStatus = () => status;
export function updateBackendStatus(update: Partial<BackendStatus>) {
  status = { ...status, ...update };
  listeners.forEach((listener) => listener());
}
export function reportNetworkFailure(exhausted = false) {
  updateBackendStatus({
    phase: exhausted ? 'offline' : 'waking',
    latencyMs: null,
    lastCheck: new Date().toISOString(),
    failures: status.failures + 1,
  });
}
export function useBackendStatus() {
  return useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, getBackendStatus);
}
