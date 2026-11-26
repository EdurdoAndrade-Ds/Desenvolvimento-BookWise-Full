import { afterEach, describe, expect, it, vi } from 'vitest';
import { keepAliveDeadline, keepAliveService } from './keepAliveService';

afterEach(() => vi.unstubAllGlobals());

describe('keep alive', () => {
  const now = new Date(2030, 0, 1, 12, 30, 0);
  it('supports finite durations and until disabled', () => {
    for (const hours of ['1', '4', '8']) {
      expect(Date.parse(keepAliveDeadline(hours, '', now)!)).toBe(
        now.getTime() + Number(hours) * 3600000,
      );
    }
    expect(keepAliveDeadline('off', '', now)).toBeNull();
  });
  it('selects the next local occurrence of a clock time', () => {
    expect(keepAliveDeadline('time', '13:00', now)).toBe(
      new Date(2030, 0, 1, 13, 0, 0).toISOString(),
    );
    expect(keepAliveDeadline('time', '12:30', now)).toBe(
      new Date(2030, 0, 2, 12, 30, 0).toISOString(),
    );
    expect(keepAliveDeadline('time', '10:00', now)).toBe(
      new Date(2030, 0, 2, 10, 0, 0).toISOString(),
    );
  });
  it('rejects missing/invalid times and durations', () => {
    for (const time of ['', '24:00', '12:99', 'bad'])
      expect(() => keepAliveDeadline('time', time, now)).toThrow();
    expect(() => keepAliveDeadline('2', '', now)).toThrow();
  });
  it('uses the admin endpoint and does not retry configuration writes', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ enabled: false }) });
    vi.stubGlobal('fetch', fetch);
    await keepAliveService.get();
    await keepAliveService.update({ enabled: false, intervalMinutes: 5, activeUntil: null });
    expect(fetch.mock.calls.map((call) => [call[0], call[1].method])).toEqual([
      ['/api/v1/admin/keep-alive', 'GET'],
      ['/api/v1/admin/keep-alive', 'PUT'],
    ]);
  });
});
