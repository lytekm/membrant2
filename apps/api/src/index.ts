import { serve } from '@hono/node-server';
import { createApp } from './app';
import { openDatabase } from './database';

const db = openDatabase(process.env.DATABASE_PATH ?? './data/membrant.sqlite');
const origins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:8081')
  .split(',')
  .map((value) => value.trim());
const app = createApp(db, origins);
const server = serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT ?? 3001),
    hostname: process.env.HOST ?? '0.0.0.0',
  },
  (info) => console.log(`Membrant API listening on port ${info.port}`),
);
const shutdown = () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
