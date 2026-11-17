import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { z, ZodError } from 'zod';
import { applyCommand, commandSchema, emptyState, stateSchema } from '@membrant/core';
import { hashPassword, newToken, tokenHash, verifyPassword } from './auth';

type User = { id: string; email: string; name: string; password_hash: string };
const credentials = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email('Enter a valid email address.')),
  password: z.string().min(10, 'Use at least 10 characters for your password.').max(200),
  name: z.string().trim().max(60).optional(),
});

export function createApp(
  db: DatabaseSync,
  origins = ['http://localhost:5173', 'http://localhost:8081'],
) {
  const app = new Hono<{ Variables: { userId: string; tokenHash: string } }>();
  const attempts = new Map<string, { count: number; until: number }>();
  app.use(
    '*',
    cors({
      origin: origins,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use('*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    c.header('X-Content-Type-Options', 'nosniff');
    await next();
  });
  app.use(
    '*',
    bodyLimit({
      maxSize: 256 * 1024,
      onError: (c) => c.json({ error: 'This request is too large.' }, 413),
    }),
  );
  app.get('/api/health', (c) => c.json({ status: 'ok', app: 'membrant', version: 1 }));

  app.post('/api/auth/:action', async (c, next) => {
    const action = c.req.param('action');
    if (action === 'logout') return next();
    if (action !== 'register' && action !== 'login') return c.json({ error: 'Not found.' }, 404);
    const input = credentials.parse(await c.req.json());
    const now = Date.now();
    for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
    const attempt = attempts.get(input.email) ?? { count: 0, until: now + 15 * 60_000 };
    attempt.count++;
    attempts.set(input.email, attempt);
    if (attempt.count > 12)
      return c.json({ error: 'Too many attempts. Please try again in 15 minutes.' }, 429);
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(input.email) as
      User | undefined;
    if (action === 'register') {
      if (!input.name) return c.json({ error: 'Add your name to create an account.' }, 400);
      if (user)
        return c.json({ error: 'An account with that email already exists. Try signing in.' }, 409);
      const hash = await hashPassword(input.password);
      user = { id: randomUUID(), email: input.email, name: input.name, password_hash: hash };
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?)').run(
          user.id,
          user.email,
          user.name,
          hash,
          new Date().toISOString(),
        );
        db.prepare('INSERT INTO workspaces VALUES (?, ?)').run(
          user.id,
          JSON.stringify(emptyState(user.name)),
        );
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        if (String(error).includes('UNIQUE'))
          return c.json({ error: 'An account with that email already exists.' }, 409);
        throw error;
      }
    } else {
      if (!user) {
        await hashPassword(input.password);
        return c.json({ error: 'Email or password is incorrect.' }, 401);
      }
      if (!(await verifyPassword(input.password, user.password_hash)))
        return c.json({ error: 'Email or password is incorrect.' }, 401);
    }
    attempts.delete(input.email);
    const token = newToken();
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
    db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(
      tokenHash(token),
      user.id,
      now + 30 * 86_400_000,
    );
    return c.json({ token, name: user.name, email: user.email }, action === 'register' ? 201 : 200);
  });

  app.use('/api/*', async (c, next) => {
    const token = c.req.header('Authorization')?.replace(/^Bearer /, '');
    if (!token) return c.json({ error: 'Sign in to access your workspace.' }, 401);
    const hash = tokenHash(token);
    const session = db
      .prepare('SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?')
      .get(hash, Date.now()) as { user_id: string } | undefined;
    if (!session)
      return c.json({ error: 'Your session expired. Sign out and sign in again.' }, 401);
    c.set('userId', session.user_id);
    c.set('tokenHash', hash);
    return next();
  });
  const readState = (userId: string) => {
    const row = db.prepare('SELECT document FROM workspaces WHERE user_id = ?').get(userId) as {
      document: string;
    };
    return stateSchema.parse(JSON.parse(row.document));
  };
  app.get('/api/state', (c) => c.json(readState(c.get('userId'))));
  app.post('/api/auth/logout', (c) => {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(c.get('tokenHash'));
    return c.json({ ok: true });
  });
  app.post('/api/commands', async (c) => {
    const input = z
      .object({
        requestId: z.string().min(1).max(100),
        revision: z.number().int().nonnegative(),
        command: commandSchema,
      })
      .parse(await c.req.json());
    const userId = c.get('userId');
    db.exec('BEGIN IMMEDIATE');
    try {
      const state = readState(userId);
      if (
        db
          .prepare('SELECT request_id FROM requests WHERE user_id = ? AND request_id = ?')
          .get(userId, input.requestId)
      ) {
        db.exec('COMMIT');
        return c.json(state);
      }
      if (state.revision !== input.revision) {
        db.exec('ROLLBACK');
        return c.json(
          { error: 'Your workspace changed on another device. We refreshed it; please try again.' },
          409,
        );
      }
      const nextState = applyCommand(state, input.command);
      db.prepare('UPDATE workspaces SET document = ? WHERE user_id = ?').run(
        JSON.stringify(nextState),
        userId,
      );
      db.prepare('INSERT INTO requests VALUES (?, ?, ?)').run(userId, input.requestId, Date.now());
      db.exec('COMMIT');
      return c.json(nextState);
    } catch (error) {
      db.exec('ROLLBACK');
      if (error instanceof ZodError) throw error;
      return c.json(
        { error: error instanceof Error ? error.message : 'Could not save this change.' },
        400,
      );
    }
  });
  app.notFound((c) => c.json({ error: 'Not found.' }, 404));
  app.onError((error, c) => {
    if (error instanceof ZodError)
      return c.json({ error: error.issues[0]?.message ?? 'Please check your input.' }, 400);
    if (error instanceof SyntaxError) return c.json({ error: 'Send valid JSON.' }, 400);
    console.error('API error:', error);
    return c.json({ error: 'The backend could not complete this request.' }, 500);
  });
  return app;
}
