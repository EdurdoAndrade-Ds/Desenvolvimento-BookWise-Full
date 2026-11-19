import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkBackendHealth } from './backendHealth';
import { getBackendStatus, updateBackendStatus } from './backendStatus';

let visibility = 'visible';
const events = new EventTarget();
beforeEach(() => {
  visibility = 'visible';
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] });
  vi.stubGlobal('document', {
    get visibilityState() {
      return visibility;
    },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  });
  updateBackendStatus({ phase: 'waking', lastCheck: null, latencyMs: null });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('health checks', () => {
  it('fast health 200 marks online and records latency', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ status: 'UP' }) }),
    );
    await checkBackendHealth();
    expect(getBackendStatus()).toMatchObject({ phase: 'online', latencyMs: 0, failures: 0 });
    expect(getBackendStatus().lastCheck).not.toBeNull();
  });
  it('does not check hidden tabs', async () => {
    visibility = 'hidden';
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await checkBackendHealth();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('slow health marks waking and concurrent checks share a request', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () => resolve({ ok: true, status: 200, json: async () => ({ status: 'UP' }) }),
                2500,
              ),
            ),
        ),
    );
    const check = checkBackendHealth();
    expect(checkBackendHealth()).toBe(check);
    await vi.advanceTimersByTimeAsync(2000);
    expect(getBackendStatus().phase).toBe('waking');
    await vi.advanceTimersByTimeAsync(500);
    await check;
    expect(getBackendStatus()).toMatchObject({ phase: 'waking', latencyMs: 2500 });
  });
  it('marks offline after exhausted retries and recovers on the next check', async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError('offline'));
    vi.stubGlobal('fetch', fetch);
    const check = checkBackendHealth();
    await vi.advanceTimersByTimeAsync(1500);
    await check;
    expect(getBackendStatus().phase).toBe('offline');
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ status: 'UP' }) });
    await checkBackendHealth();
    expect(getBackendStatus().phase).toBe('online');
  });
  it('cancels checks when the tab is hidden without declaring offline', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementation(
          (_url, options) =>
            new Promise((_resolve, reject) =>
              options.signal.addEventListener('abort', () =>
                reject(new DOMException('hidden', 'AbortError')),
              ),
            ),
        ),
    );
    const check = checkBackendHealth();
    visibility = 'hidden';
    events.dispatchEvent(new Event('visibilitychange'));
    await check;
    expect(getBackendStatus().phase).not.toBe('offline');
  });
});
