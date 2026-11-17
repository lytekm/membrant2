# Web planning workspace

Vite + React with React Router, native CSS semantic tokens, Phosphor icons and Radix Dialog for focus-managed modal flows.

`src/app` composes the shell and routes. `src/components` contains shared web presentation pieces. `src/features` owns the domain-specific screens and dialogs. All mutations use `@membrant/client`; calculations and validation use `@membrant/core`.

From the repository root: `npm run dev:web`, `npm run build`.

See [root setup](../../README.md), [features](../../docs/mvp/features.md) and [architecture](../../docs/mvp/architecture.md).
