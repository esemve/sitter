import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkForUpdate } from './npm-registry.js';

// We need to mock fetch globally.
// Also mock packageVersion to a known value.

vi.mock('./version.js', () => ({
  packageVersion: '0.1.1',
}));

describe('checkForUpdate', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns newer version when available', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: '99.0.0' }),
    });

    const result = await checkForUpdate();
    expect(result).toBe('99.0.0');
  });

  it('returns null when current version is latest', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: '0.1.1' }),
    });

    const result = await checkForUpdate();
    expect(result).toBeNull();
  });

  it('returns null when registry returns non-ok response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await checkForUpdate();
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await checkForUpdate();
    expect(result).toBeNull();
  });

  it('returns null on timeout (aborted fetch)', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
      return new Promise((_resolve, reject) => {
        const onAbort = () => reject(new Error('AbortError'));
        if (init?.signal) {
          init.signal.addEventListener('abort', onAbort);
        }
      });
    });

    const result = await checkForUpdate();
    expect(result).toBeNull();
  });

  it('returns null when fetched version is older than current', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: '0.0.1' }),
    });

    const result = await checkForUpdate();
    expect(result).toBeNull();
  });
});
