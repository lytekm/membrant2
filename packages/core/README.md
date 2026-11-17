# Shared domain

Pure TypeScript and Zod. No React, browser, native or database imports.

- `schema.ts`: runtime contracts and inferred types.
- `reducer.ts`: validated commands and lifecycle rules.
- `progress.ts`: progress, cadence, streak, XP and badge calculations.
- `dates.ts`: local calendar-date helpers.
- `coaching.ts`: editable templates and deterministic suggestions.
- `demo.ts`: explicitly labelled sample workspace.

Run `npm test` from the root. Domain behavior is documented in [architecture](../../docs/mvp/architecture.md#domain-semantics).
