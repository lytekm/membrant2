# Shared API contract

Base address in local development: `http://localhost:3001`.

All responses are JSON. Protected routes require `Authorization: Bearer <token>`. The server derives the workspace owner from that token; clients never supply a user ID. Responses use `Cache-Control: no-store`.

## Routes

| Method | Path                 | Description                                            |
| ------ | -------------------- | ------------------------------------------------------ |
| GET    | `/api/health`        | Public health/version check                            |
| POST   | `/api/auth/register` | `{ name, email, password }`; create an empty workspace |
| POST   | `/api/auth/login`    | `{ email, password }`; create another session          |
| POST   | `/api/auth/logout`   | Revoke the current bearer session                      |
| GET    | `/api/state`         | Read the authenticated user's workspace                |
| POST   | `/api/commands`      | Apply one validated mutation                           |

Registration returns HTTP 201; login returns HTTP 200:

```json
{
  "token": "opaque-random-session-token",
  "name": "Alex",
  "email": "alex@example.com"
}
```

Emails are trimmed and lowercased. Passwords must contain 10–200 characters. Names must be 1–60 characters on registration. Password hashes are salted scrypt; session tokens are random 256-bit secrets with SHA-256 hashes stored in the database. Sessions expire in 30 days. Signing out one device does not sign out every device. Failed and in-flight auth attempts are limited per normalized email in a 15-minute window. This MVP has no email verification, password recovery or mail service.

## Workspace shape

The runtime source of truth is `packages/core/src/schema.ts`, exported as `stateSchema`.

```ts
type AppState = {
  schemaVersion: 1;
  revision: number;
  profile: { name: string };
  goals: Goal[];
  entries: Entry[];
  reviews: Review[];
};
```

Limits: 500 goals, 50,000 entries and 5,000 weekly reflections per workspace. Command requests are limited to 256 KiB. The complete document is returned after each successful command. This keeps the MVP contract small; pagination and normalized tables belong in the next backend iteration.

## Commands

```json
{
  "requestId": "a-unique-id-for-this-attempt",
  "revision": 4,
  "command": {
    "type": "profile.update",
    "name": "Alex"
  }
}
```

Supported discriminants:

- `goal.create`: `goal` (full validated goal).
- `goal.update`: `goalId`, `patch` (editable plan fields only).
- `goal.status`: `goalId`, `status` (`active`, `paused`, `archived`).
- `goal.delete`: `goalId`; also removes the goal's entries.
- `entry.create`: `entry` (ID, goal ID, local date, positive value, optional milestone ID, note, UTC creation timestamp).
- `entry.delete`: `entryId`; derived progress and XP are recalculated.
- `review.save`: `review`; replaces the reflection for the same Monday-based calendar week.
- `profile.update`: `name`.

The expected revision prevents one device from overwriting another's work. A successful mutation increments it by one. A mismatched revision returns **409**; the client refreshes and asks the user to retry their still-visible form. Within each user workspace, an already-used `requestId` returns the current state without applying another mutation. The remote repository retries one failed network/server response using the same ID.

Changes, revision checks and request-ID insertion occur in one SQLite transaction. Pure validation and mutation rules are reused by device-local demo storage. The API is authoritative for connected writes.

## Errors

```json
{ "error": "A readable explanation." }
```

- `400`: malformed JSON, invalid fields or invalid domain operation.
- `401`: missing, invalid, expired or revoked session.
- `409`: existing email or stale workspace revision.
- `413`: request too large.
- `429`: too many authentication attempts.
- `500`: unexpected server failure; full details stay on the server.

## Connecting the existing backend later

Either implement these routes in the dev-journal backend or write a `Repository` adapter that translates `read()` and `execute()` into that backend's endpoints. Authentication can also be adapted in `MembrantProvider`. Keep existing provider/session ownership conventions in that service, and enforce workspace isolation there.

Plugin ingestion should eventually become an authenticated server-side command that turns external observations into idempotent entries. No external-app adapter or ingestion endpoint is implemented in this MVP.
