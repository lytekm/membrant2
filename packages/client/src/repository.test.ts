import { describe, expect, it, vi } from 'vitest';
import { emptyState, newGoal, templates } from '@membrant/core';
import { DEMO_KEY, localRepository, remoteRepository, type StorageAdapter } from './repository';

function memoryStorage(): StorageAdapter {
  const values = new Map<string, string>();
  return {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
    removeItem: async (key) => {
      values.delete(key);
    },
  };
}
describe('repository boundaries', () => {
  it('persists demo writes and rejects stale tabs', async () => {
    const storage = memoryStorage();
    const repo = localRepository(storage);
    const state = await repo.read();
    await repo.execute({ type: 'profile.update', name: 'Updated' }, state.revision, 'r1');
    expect((await localRepository(storage).read()).profile.name).toBe('Updated');
    await expect(
      repo.execute({ type: 'profile.update', name: 'Stale' }, state.revision, 'r2'),
    ).rejects.toThrow(/another tab/);
  });
  it('preserves unreadable data and does not silently replace it', async () => {
    const storage = memoryStorage();
    await storage.setItem(DEMO_KEY, '{invalid data');
    await expect(localRepository(storage).read()).rejects.toThrow(/preserved/);
    expect(await storage.getItem(DEMO_KEY)).toBe('{invalid data');
  });
  it('does not report success when device persistence fails', async () => {
    const storage = memoryStorage();
    const repo = localRepository(storage);
    const state = await repo.read();
    storage.setItem = async () => {
      throw new Error('Disk full');
    };
    await expect(
      repo.execute({ type: 'profile.update', name: 'Not saved' }, state.revision, 'r1'),
    ).rejects.toThrow('Disk full');
    expect((await repo.read()).profile.name).toBe(state.profile.name);
  });
  it('reuses the request ID after a lost response, avoiding duplicate remote writes', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Connection lost'))
      .mockResolvedValueOnce(new Response(JSON.stringify(emptyState()), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      await remoteRepository('http://example.test', 'test-token').execute(
        { type: 'goal.create', goal: { ...newGoal(templates[0]), why: 'A meaningful reason' } },
        0,
        'stable-request',
      );
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0][1].body).toBe(fetchMock.mock.calls[1][1].body);
      expect(JSON.parse(fetchMock.mock.calls[1][1].body).requestId).toBe('stable-request');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
