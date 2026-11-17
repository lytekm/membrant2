# Reference shared API

Hono on Node with `node:sqlite`, salted scrypt passwords and hashed bearer sessions. Both clients use the same authenticated command endpoint. SQLite transactions cover revision checks, mutation and idempotency records.

Run `npm run dev:api` from the root. The working database defaults to `apps/api/data/membrant.sqlite`. Optional configuration is described in `.env.example`.

The API can run without either UI. Health: `GET /api/health`. See the [API contract](../../docs/mvp/api.md) and [architecture](../../docs/mvp/architecture.md) for the document model and the replacement boundary for the existing dev-journal backend.
