# Working MVP features

## Goal planning

`packages/core` owns the four goal measures, templates and rule-based coaching. Web feature modules live under `apps/web/src/features`; the mobile modules are in the matching `apps/mobile/src/features` tree.

The web wizard has four stages: direction and motivation; measurement and timeframe; obstacles and a fallback plan; review. Validation is applied to each stage, then to the full goal on save. The mobile wizard uses three compact stages and the same domain validation. Templates are editable starting points, not goals automatically added to an account.

Web goal details provide editing, pause/resume, archive, permanent deletion with confirmation, and a full check-in history. Measurement structure stays fixed after creation so historical entries cannot silently change meaning. The timeframe, cadence, title, motivation, obstacle, fallback plan and next step can be edited. Native goal details focus on checking in, pausing/resuming and undoing the most recent 20 entries.

## Daily tracking

Web Overview and mobile Today lead with personal goals, their reasons, calendar-week check-ins and a direct check-in action. A random earlier check-in note reconnects users with their own writing. It excludes blank/current-day notes, includes the source goal/date, and stays stable during saves and refreshes. Count entries are incremental; percentage entries replace the latest reading; habits are limited to one entry per goal/day; milestone entries finish one step. Each check-in can carry a reflection. Both clients can log a missed day since a goal's start. Future dates are blocked by the UI. Domain and API validate again.

Successful native saves provide haptic feedback where supported. Neither client marks an entry as saved before storage or the API confirms it. Undo is available in goal history and recalculates all derived progress and rewards.

## Progress and reflection

The web progress view uses open sections for totals, a 12-week activity grid, a two-week chart, per-goal progress and milestones. Rewards and streaks are secondary details. Every displayed metric is calculated from workspace data. The demo uses relative-date sample entries and is labelled as such.

The mobile Journey view provides activity, milestones and a writing-focused weekly reflection. Level details are disclosed on request. Reflection records have wins, challenges and a next adjustment; the lightweight mobile editor preserves a challenge written on web. One review per Monday-based calendar week prevents repeated XP rewards.

## Shared presentation

The source of visual and copy rules is [design_language.md](../design_language.md). Semantic colors live in `packages/client/src/design.ts` and are consumed by both clients. Dark green-black is the default atmosphere; light mode uses a related natural palette. Brighter sage is reserved for primary actions, completion, active progress, important links and focus. Ordinary screens use functional labels; emotionally expressive copy is reserved for actual goal completion or meaningful milestones.

## Accounts and data

Settings/You connects to the standalone API via email and password. Demo and connected workspaces are separate. Web stores the session in browser localStorage; native stores it in Expo SecureStore (the optional Expo web preview uses AsyncStorage). Both clients refresh on foreground/focus and every 30 seconds while visible. Pull-to-refresh is also available on native.

Web can export its current workspace as JSON. Import is not part of this MVP. Demo reset asks for confirmation in settings. Persistent read failures show a recovery screen rather than overwriting unreadable data automatically.

## Adding a feature

1. Add data types and validation in `packages/core/src/schema.ts`.
2. Add a validated command to `reducer.ts` and a meaningful domain test.
3. Keep calculations pure and shared. Do not calculate a different streak or reward rule in a screen.
4. Add platform-specific UI in the appropriate feature folder.
5. Use `useMembrant().dispatch()` for all writes. Handle its rejected promise and keep unsaved form input visible.
6. Document semantics here and update the API contract if transport changes.
