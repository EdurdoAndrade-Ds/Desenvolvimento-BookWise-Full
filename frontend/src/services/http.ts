// Cliente HTTP minimalista sobre fetch.
// Em desenvolvimento a base e vazia e o proxy do Vite (vite.config.ts) envia
// '/api/...' para http://localhost:8080. Em deploys onde o frontend e servido
// separado do backend, defina VITE_API_URL com a origem da API.

import { reportNetworkFailure } from './backendStatus';

const baseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

interface RequestOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const attempts = method === 'GET' ? 3 : 1;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (options.signal?.aborted) throw new DOMException('Operação cancelada', 'AbortError');
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, options.timeoutMs ?? 8000);
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      if (!response.ok) {
        let message = `Erro ${response.status}`;
        try {
          const data = await response.json();
          if (data?.message) message = data.message;
        } catch {
          // resposta sem corpo JSON
        }
        throw new ApiError(response.status, message);
      }
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    } catch (error) {
      if (options.signal?.aborted) throw error;
      const connectionFailure =
        error instanceof ApiError
          ? error.status === 502 || error.status === 503
          : !(error instanceof SyntaxError);
      if (!connectionFailure) throw error;
      const exhausted = attempt === attempts - 1;
      reportNetworkFailure(exhausted && method === 'GET');
      if (exhausted) {
        if (controller.signal.aborted)
          throw new Error('O servidor demorou para responder. Tente novamente.');
        throw error;
      }
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', abort);
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
  }
  throw new Error('Servidor indisponível');
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
