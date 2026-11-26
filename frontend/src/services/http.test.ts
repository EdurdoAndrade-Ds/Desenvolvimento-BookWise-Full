import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, http } from './http';
import { getBackendStatus, updateBackendStatus } from './backendStatus';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('http', () => {
  it('retries GET network failures with backoff and updates status immediately', async () => {
    vi.useFakeTimers();
    updateBackendStatus({ phase: 'online' });
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
    vi.stubGlobal('fetch', fetch);
    const request = http.get('/test');
    await vi.advanceTimersByTimeAsync(0);
    expect(getBackendStatus().phase).toBe('waking');
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(500);
    await expect(request).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('retries 502/503 only three times then marks offline', async () => {
    vi.useFakeTimers();
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 503, json: async () => ({ message: 'Sleeping' }) });
    vi.stubGlobal('fetch', fetch);
    const result = expect(http.get('/test')).rejects.toMatchObject({
      status: 503,
      message: 'Sleeping',
    });
    await vi.advanceTimersByTimeAsync(1500);
    await result;
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(getBackendStatus().phase).toBe('offline');
  });

  it('aborts timed out requests and retries GET with bounded attempts', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () =>
            reject(new DOMException('timeout', 'AbortError')),
          );
        }),
    );
    vi.stubGlobal('fetch', fetch);
    const result = expect(http.get('/test', { timeoutMs: 100 })).rejects.toThrow('demorou');
    await vi.advanceTimersByTimeAsync(1800);
    await result;
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch.mock.calls.every((call) => call[1].signal.aborted)).toBe(true);
  });

  it.each(['post', 'put', 'delete'] as const)(
    'never retries %s after a network failure',
    async (method) => {
      const fetch = vi.fn().mockRejectedValue(new TypeError('offline'));
      vi.stubGlobal('fetch', fetch);
      await expect(http[method]('/test', {})).rejects.toThrow('offline');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(getBackendStatus().phase).toBe('waking');
    },
  );

  it('does not retry ordinary errors or malformed JSON', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ message: 'Conflict' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('bad JSON');
        },
      });
    vi.stubGlobal('fetch', fetch);
    await expect(http.get('/test')).rejects.toMatchObject({ status: 409 });
    await expect(http.get('/test')).rejects.toThrow(SyntaxError);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not start a request when externally cancelled', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const controller = new AbortController();
    controller.abort();
    await expect(http.get('/test', { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('retorna undefined para respostas 204', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(null) }),
    );

    await expect(http.delete('/api/v1/books/1')).resolves.toBeUndefined();
  });

  it('lanca ApiError com a mensagem do backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Estoque insuficiente' }),
      }),
    );

    await expect(http.post('/api/v1/loans', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Estoque insuficiente',
    });
  });

  it('usa mensagem padrao quando a resposta nao tem corpo JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('sem corpo')),
      }),
    );

    await expect(http.get('/api/v1/loans')).rejects.toBeInstanceOf(ApiError);
  });
});
