# Membrant MVP architecture

The five documents directly in `docs/` are the original product brief. This directory documents the working rebuild and supersedes their stack and delivery status.

## Product split

- **Web / Vite + React:** guided goal creation, templates, editing and lifecycle management, progress trends, weekly reflection, data export.
- **Mobile / Expo + React Native:** today's next steps, quick check-ins, optional notes, recent history and undo, earned rewards, lightweight goal creation.
- **Shared:** goal definitions, validation, coaching rules, progress calculations, rewards, commands, API client and session state. UI components stay platform-specific.

## Workspace

```
apps/web          browser planning workspace
apps/mobile       native daily companion
apps/api          standalone reference REST API and SQLite persistence
packages/core     platform-independent TypeScript domain
packages/client   repository implementations and React state provider
docs/mvp          current decisions, setup and feature documentation
```

## Storage and backend boundary

No existing dev-journal backend contract was present in the supplied workspace. A standalone reference API makes this MVP runnable; it is not claimed to be integrated with that backend. Replace the `Repository` adapter to connect the existing service later. No plugin system is implemented yet.

Both clients start in an explicitly labelled **demo workspace** persisted only on that device. Creating an account or signing in connects to the shared API and opens a separate, initially empty workspace. Demo data is never silently uploaded. Signing out returns to the device's demo workspace.

The API applies validated commands transactionally to a per-user JSON document in SQLite. Bearer sessions expire after 30 days; only token hashes are stored. Passwords use salted scrypt. Client request IDs make retries idempotent; revisions reject stale cross-device writes with HTTP 409. Clients refresh after conflicts and require the user to retry. A failed network save is never presented as saved. Connected mode requires a network connection; offline command queuing is deferred.

The document model is intentionally small for a personal MVP. It is capped by validation and a request-size limit. A normalized database or the existing backend should replace it for larger datasets.

## Domain semantics

- Count: positive, incremental quantities added to a baseline. Downward measurements such as body weight are outside this MVP.
- Percent: latest calendar-date entry is the absolute progress, 1–100. Delete an entry to correct a mistake or return to zero.
- Habit: one check-in per goal per local calendar day; accumulated days, not a fragile unbroken streak.
- Milestone: one check-in per milestone. Undo removes that completion.
- Completion is derived from progress. Paused and archived goals cannot receive check-ins. Deleting a goal deletes its entries.
- Weekly cadence is a target number of distinct check-in days, Monday through Sunday, not an appointment schedule.
- Calendar dates use local `YYYY-MM-DD` strings; timestamps use UTC. Server validation of start/check-in dates allows one day of timezone skew.
- Streaks allow today to be unfinished if yesterday had activity. Rest days never subtract XP.
- XP: 20 per unique goal/day, 100 per completed goal, 30 per weekly reflection. Multiple logs cannot farm check-in XP. Undo recalculates rewards honestly.
- One reflection per calendar week. Editing replaces that week's reflection.
- Coaching is transparent deterministic guidance based on cadence, timeframe and obstacles, not an AI or medical recommendation.

## Design

The original neutral/blue, accessible, focused direction is retained. Web uses Inter, self-hosted through Fontsource, cool gray surfaces, a blue accent, 8px controls and 16px panels. Dark mode follows the OS with an explicit toggle. Native uses platform typography and the same semantic palette. Motion is limited to state feedback and respects reduced-motion preferences. The interface labels example data and distinguishes saved, saving, loading and error states.

## Deliberate MVP boundaries

No integrations, notifications, social features, tasks/projects subsystem, model-generated coaching, password reset/email delivery, or background/offline sync. These should be added behind the existing feature and repository boundaries rather than coupled to screens.
