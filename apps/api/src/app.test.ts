import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { newGoal, templates, today } from '@membrant/core';
import { createApp } from './app';
import { openDatabase } from './database';

describe('shared workspace API', () => {
  let db: DatabaseSync;
  let app: ReturnType<typeof createApp>;
  beforeEach(() => {
    db = openDatabase(':memory:');
    app = createApp(db);
  });
  afterEach(() => db.close());
  const json = (body: unknown, token?: string) => ({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const register = async (email = 'alex@example.com') => {
    const response = await app.request(
      '/api/auth/register',
      json({ email, password: 'test-password-123', name: 'Alex' }),
    );
    expect(response.status).toBe(201);
    return (await response.json()) as { token: string };
  };
  it('requires authentication and gives each account a separate empty workspace', async () => {
    expect((await app.request('/api/state')).status).toBe(401);
    const first = await register();
    const second = await register('second@example.com');
    const goal = { ...newGoal(templates[0]), why: 'Make time for reading.' };
    const response = await app.request(
      '/api/commands',
      json({ requestId: 'r1', revision: 0, command: { type: 'goal.create', goal } }, first.token),
    );
    expect(response.status).toBe(200);
    const privateState = await (
      await app.request('/api/state', { headers: { Authorization: `Bearer ${second.token}` } })
    ).json();
    expect(privateState.goals).toEqual([]);
    const attack = await app.request(
      '/api/commands',
      json(
        { requestId: 'r2', revision: 0, command: { type: 'goal.delete', goalId: goal.id } },
        second.token,
      ),
    );
    expect(attack.status).toBe(400);
  });
  it('rejects stale edits and makes a retried command idempotent', async () => {
    const { token } = await register();
    const body = {
      requestId: 'same-request',
      revision: 0,
      command: {
        type: 'goal.create',
        goal: { ...newGoal(templates[0]), why: 'Make time for reading.' },
      },
    };
    expect((await app.request('/api/commands', json(body, token))).status).toBe(200);
    const retry = await (await app.request('/api/commands', json(body, token))).json();
    expect(retry.goals).toHaveLength(1);
    expect(retry.revision).toBe(1);
    const stale = await app.request(
      '/api/commands',
      json(
        {
          requestId: 'different-request',
          revision: 0,
          command: { type: 'profile.update', name: 'Changed' },
        },
        token,
      ),
    );
    expect(stale.status).toBe(409);
    const current = await (
      await app.request('/api/state', { headers: { Authorization: `Bearer ${token}` } })
    ).json();
    expect(current.profile.name).toBe('Alex');
  });
  it('validates mutations on the server and rolls back invalid entries', async () => {
    const { token } = await register();
    const goal = { ...newGoal(templates[1]), why: 'Get outside more often.' };
    await app.request(
      '/api/commands',
      json({ requestId: 'goal', revision: 0, command: { type: 'goal.create', goal } }, token),
    );
    const invalid = await app.request(
      '/api/commands',
      json(
        {
          requestId: 'entry',
          revision: 1,
          command: {
            type: 'entry.create',
            entry: {
              id: 'entry',
              goalId: goal.id,
              date: today(),
              value: 9,
              note: '',
              createdAt: new Date().toISOString(),
            },
          },
        },
        token,
      ),
    );
    expect(invalid.status).toBe(400);
    const state = await (
      await app.request('/api/state', { headers: { Authorization: `Bearer ${token}` } })
    ).json();
    expect(state.revision).toBe(1);
    expect(state.entries).toHaveLength(0);
  });
  it('hashes credentials, supports a second-device login, and revokes only the signed-out session', async () => {
    const first = await register();
    const user = db.prepare('SELECT password_hash FROM users').get() as { password_hash: string };
    expect(user.password_hash).not.toContain('test-password');
    const session = db.prepare('SELECT token_hash FROM sessions').get() as { token_hash: string };
    expect(session.token_hash).not.toBe(first.token);
    expect(
      (
        await app.request(
          '/api/auth/login',
          json({ email: 'alex@example.com', password: 'wrong-password' }),
        )
      ).status,
    ).toBe(401);
    const login = await app.request(
      '/api/auth/login',
      json({ email: ' ALEX@example.com ', password: 'test-password-123', name: '' }),
    );
    expect(login.status).toBe(200);
    const second = await login.json();
    expect((await app.request('/api/auth/logout', json({}, first.token))).status).toBe(200);
    expect(
      (await app.request('/api/state', { headers: { Authorization: `Bearer ${first.token}` } }))
        .status,
    ).toBe(401);
    expect(
      (await app.request('/api/state', { headers: { Authorization: `Bearer ${second.token}` } }))
        .status,
    ).toBe(200);
  });
  it('survives application recreation with the same database and rejects expired sessions', async () => {
    const { token } = await register();
    await app.request(
      '/api/commands',
      json(
        {
          requestId: 'profile',
          revision: 0,
          command: { type: 'profile.update', name: 'Still here' },
        },
        token,
      ),
    );
    app = createApp(db);
    const state = await (
      await app.request('/api/state', { headers: { Authorization: `Bearer ${token}` } })
    ).json();
    expect(state.profile.name).toBe('Still here');
    db.prepare('UPDATE sessions SET expires_at = 0').run();
    expect(
      (await app.request('/api/state', { headers: { Authorization: `Bearer ${token}` } })).status,
    ).toBe(401);
  });
  it('rejects malformed JSON and does not allow cross-origin access by default', async () => {
    const response = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://unrelated.example' },
      body: 'not-json',
    });
    expect(response.status).toBe(400);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});
