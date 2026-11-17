# Membrant

**A personal space for goals and reflection.**

A working goal-tracking MVP with two complementary clients:

- **Web:** a Vite + React workspace for guided goal planning, management, trends and reflection.
- **Mobile:** an Expo + React Native companion for daily actions, quick check-ins and earned rewards.
- **Shared API:** a runnable Node/Hono + SQLite backend with accounts and cross-device persistence.
- **Shared packages:** TypeScript domain rules, validation, coaching, rewards and data access.

This rebuild follows the original product documents in `docs/`. Current implementation decisions are in [`docs/mvp`](docs/mvp/architecture.md).

## Start the web app

Use **Node 24 LTS** and npm. Node 22.13+ is the minimum; the API uses built-in `node:sqlite`.

From the repository root:

```sh
npm install
npm run dev
```

- Web: **http://localhost:5173**
- API health: **http://localhost:3001/api/health**

On Windows PowerShell with script execution disabled, use `npm.cmd` and `npx.cmd` instead of `npm` and `npx`.

The app immediately opens an explicitly labelled **demo workspace** with example goals. It works without an API connection, and demo edits persist on that device. To use your own goals across devices, open **Settings → Create an account**. New accounts start empty; demo data stays separate.

After the first install, use `npm ci` for reproducible installation from `package-lock.json`.

## Start the mobile app

In a second terminal at the repository root:

```sh
npm run dev:mobile
```

This project is pinned to **Expo SDK 58 / React Native 0.88 / React 19.3**. Use an SDK-58-compatible Expo Go installation from [expo.dev/go](https://expo.dev/go), or an SDK-58 development build. Both clients use React 19.3 so shared hooks resolve to one runtime.

For a physical phone:

1. Keep the phone and computer on the same Wi-Fi.
2. Create `apps/mobile/.env` using `apps/mobile/.env.example` as a reference.
3. Set your computer's LAN address, for example:

   ```dotenv
   EXPO_PUBLIC_API_URL=http://192.168.1.25:3001
   ```

4. Restart Expo after changing the variable. The API started by `npm run dev` listens on `0.0.0.0`.
5. Allow the development server through your local firewall if necessary, then scan Expo's QR code.
6. Open **You → Sign in** with the account created on web.

`localhost` on a phone points to the phone, not your computer. Use `http://10.0.2.2:3001` for the Android emulator; the iOS simulator can use `http://localhost:3001`. Windows supports Android development; an iOS simulator requires macOS.

You can also preview the **separate Expo interface** in a browser:

```sh
npm run web --workspace @membrant/mobile
```

## What the MVP does

| Web planning workspace                              | Mobile daily companion                       |
| --------------------------------------------------- | -------------------------------------------- |
| Four-step guided SMART goal wizard                  | Compact, three-step goal creation            |
| Six customizable templates                          | Template starting points                     |
| Count, habit, percentage and milestone goals        | Quick check-ins for all four measures        |
| Edit plans, pause/resume, archive and delete        | Next actions and pause/resume                |
| Full check-in history and undo                      | Recent check-ins and undo                    |
| Weekly activity, 12-week grid and per-goal progress | Weekly activity and a daily summary          |
| XP, levels, streaks and badges                      | XP, levels, streaks, badges and save haptics |
| Weekly reflection and check-in notes                | Quick reflection and check-in notes          |
| JSON data export and profile settings               | Shared-account connection                    |

Both clients have light/dark themes, persistent demo storage, input validation and visible save/network errors. Connected clients refresh on focus and every 30 seconds while active; mobile also supports pull-to-refresh. Connected mode requires network access. There is no offline upload queue yet.

Coaching is **rule-based**, using the target, timeframe, cadence and obstacles. It requires no AI provider or API key.

## Existing backend and future integrations

The supplied workspace contained documentation but no dev-journal API contract or backend configuration. The included API is therefore a **standalone reference backend**, not an integration with that service.

The replacement point is the `Repository` interface in [`packages/client/src/repository.ts`](packages/client/src/repository.ts). Both platforms share it. The existing backend can adopt the documented [API contract](docs/mvp/api.md), or a new repository can translate between its endpoints and Membrant's commands. Fitness/dev-journal plugins are intentionally deferred.

## Project layout

```text
apps/
  web/src/features/       dashboard, goals, check-ins, progress, reflections, templates, settings
  mobile/src/features/    today, goals, check-ins, journey, account
  api/src/                routes, authentication and SQLite persistence
packages/
  core/src/               schemas, commands, dates, coaching, progress and demo fixtures
  client/src/             repository adapters and shared React provider
tests/e2e/                browser and Expo-web integration flows
docs/mvp/                 current architecture, features, API and verification notes
```

## Commands

Run from the root unless indicated otherwise.

```sh
npm run dev                     # Web + API
npm run dev:web                 # Just Vite
npm run dev:api                 # Just the shared API
npm run dev:mobile              # Expo development server
npm run check                   # All TypeScript checks, unit/API tests, web build
npm run build                   # Web production build → apps/web/dist
npm run export --workspace @membrant/mobile  # iOS, Android and web JS/assets
npm run format                  # Format current source and MVP documentation
```

End-to-end tests:

```sh
npx playwright install chromium
npm run test:e2e
```

The E2E suite starts isolated web/API/Expo servers on ports **5175 / 3101 / 8083** and uses an in-memory test database. It covers goal creation and lifecycle, check-in persistence and undo, templates, reflections, responsive themes, and a real web-account → Expo check-in → web-progress flow. The Expo browser tests exercise shared React Native screens; they are not physical-device tests.

## Configuration and persistence

All defaults work for desktop development. Optional configuration files:

| File               | Variables                                          |
| ------------------ | -------------------------------------------------- |
| `apps/web/.env`    | `VITE_API_URL` (default `http://localhost:3001`)   |
| `apps/mobile/.env` | `EXPO_PUBLIC_API_URL`                              |
| `apps/api/.env`    | `PORT`, `HOST`, `DATABASE_PATH`, `ALLOWED_ORIGINS` |

Example files are checked in; actual `.env` files are ignored. Frontend API addresses are public configuration, not secrets.

SQLite is created at `apps/api/data/membrant.sqlite` when starting through the workspace scripts. Keep this directory on persistent storage. For a simple file backup, stop the API before copying the database directory. Demo state and the web session are stored in localStorage; native sessions use Expo SecureStore.

For web hosting, deploy `apps/web/dist` with an SPA fallback to `index.html`. Set `VITE_API_URL` before building. Run the API with `npm run start --workspace @membrant/api`, a persistent database path, an HTTPS endpoint and an explicit `ALLOWED_ORIGINS` list. Production native builds should use an HTTPS API URL; local HTTP examples are for development.

## Documentation

- [Architecture and domain rules](docs/mvp/architecture.md)
- [Feature behavior and extension guide](docs/mvp/features.md)
- [Shared API contract](docs/mvp/api.md)
- [Verification and current limitations](docs/mvp/verification.md)
- [Design language and shared color system](docs/design_language.md)
- [Original documentation index](docs/README.md)
