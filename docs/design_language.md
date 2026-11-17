# Membrant design language

## The thesis

**Membrant should feel like opening a quiet personal notebook that understands your progress.**

Personal, natural, deliberate, tactile, quietly optimistic. The atmosphere should register
before the color does. The content is a person's goals, reasons, actions and writing, rather
than an analytics dashboard decorated with encouraging copy.

This is the current visual direction for **both web and mobile**. It supersedes the original
neutral/blue card-based direction and the dashboard-only green experiment.

## Product hierarchy

1. **What matters to me?** A goal, in my words, with my reason for pursuing it.
2. **What can I do?** A next step and an obvious way to check in.
3. **What has changed?** A weekly check-in trail and chronological history.
4. **What have I noticed?** My own writing, with its date and context.
5. **How am I doing over time?** Progress, milestones and optional reward details.

Do not lead the home screen with totals, streaks, levels, charts or announcements.
Create a goal remains the prominent home action. Check-in actions sit beside their goals.

## Color foundations

Colors are semantic, not selected per page. Shared values live in
`packages/client/src/design.ts`; web maps them to CSS variables and native uses them directly.

### Default dark palette

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Background | `bg` | `#111915` | Very dark green-black canvas |
| Surface | `surface` | `#19231d` | Dialogs, sheets, fields, occasional elevated objects |
| Secondary surface | `surfaceAlt` | `#222e26` | Hover, selected navigation, neutral controls |
| Primary text | `text` | `#ecebe3` | Warm off-white headings and reading text |
| Secondary text | `muted` | `#a4afa3` | Desaturated sage-grey supporting information |
| Brand green | `brand` | `#7f9b83` | Wordmark details, subdued identity, thread markers |
| Action green | `accent` | `#b3d4a5` | Primary actions, completed states, active progress, important links, focus |
| Action hover | `accentHover` | `#c6dfbb` | Feedback on an existing primary action |
| On-action text | `onAccent` | `#142017` | Dark lettering on brighter sage |
| Muted green | `border` | `#34443a` | Quiet separators and inactive UI |
| Control boundary | `controlBorder` | `#657c69` | Identifiable input boundaries and unfilled state markers |
| Soft green | `soft` | `#27392b` | Small selected or completed-state areas |
| Historical progress | `mid` | `#5d7b60` | Earlier activity; today's progress earns the brighter green |

Danger and warning retain subdued, semantic colors. They communicate errors and destructive
actions, never decorative variety. Completion uses the action green, not another green family.

### Light counterpart

Light mode is a deliberate counterpart, not an inverted dark palette. Use `#f4f6f0` for the
canvas, `#fafbf7` for surfaces, `#29382d` for primary text, `#5e6e60` for secondary text,
`#58765a` for the brand, and `#356442` for actions. Darker green keeps small action text readable.

New installations open in dark mode. Honor a saved preference. Web has a light/dark toggle;
mobile offers Dark, Light and System in You. System mode follows device changes.

### Color discipline

- Most of every screen is canvas, text and negative space.
- Reserve brighter sage for the five semantic uses above. Category icons, generic headings,
  all statistics, navigation backgrounds and ordinary hints do not earn it.
- One filled primary action per local task. Secondary actions are neutral or text-only.
- No blue leftovers, green glow, gradient panels or ornamental colored badges.
- Foreground/background pairs must meet WCAG AA. Quiet does not mean illegible.

## Typography and structure

- Web uses the existing self-hosted Inter; mobile uses the platform system sans-serif.
- Page titles: approximately 30–36px, medium/semibold, left aligned, normal sentence case.
- Section titles: 16–20px. Reading text: 14–16px with 1.6–1.8 line height.
- Metadata: 11–13px; it is secondary through placement and weight, not near-invisible contrast.
- Personal writing may use a platform serif (Georgia on web/iOS, serif on Android). This
  distinguishes the person's words from interface instructions. Never style generated copy
  as if it were a personal quotation.
- Use space, type and alignment to group content. Cards require a reason to be objects.
- A 4px spacing base: 4, 8, 12, 16, 24, 32, 48, 64. Sections breathe; related controls stay close.
- Controls use 8px corners; dialogs use 12px. Circles indicate dated or completed states.
- Shadows belong to overlays, not every section. No cards inside cards.

## The thread

The distinctive motif is a small action connected to another action in time.

- A horizontal weekly trail for each goal: Monday through Sunday, filled on checked-in days.
- A vertical thread for dated notes, check-in history and milestones.
- Filled nodes mean recorded or completed; unfilled nodes mean upcoming or not yet earned.
- Date, text and accessible labels always accompany the visual. Color is not the only signal.
- Count actual check-ins when saying “check-ins.” Cadence counts distinct days; label it as days.
- A missing day is an absence of data, never a failure state or broken chain.

## Patterns across both clients

### Home / Today

Date, personal greeting, Create a goal, then an open list of active goals. Each goal shows its
reason, calendar-week check-ins and Check in. A past journal note appears with its date and
source goal. Random selection is stable through saves/refreshes and can be changed explicitly.
Exclude blank notes and today's writing from this retrospective. Empty states explain how to
add content; never substitute a generic motivational quotation.

### Goals and goal detail

Goals are readable rows, not a KPI grid. Show reason and next step, then understated measurable
progress. In detail, retain editing and lifecycle controls, prioritize the next action, and use
a chronological thread for history. Secondary management can use progressive disclosure.

### Goal creation

An editorial sequence: direction and reason, measurement, a workable plan, review. Show the
current stage quietly. Tuck optional categorization and template selection behind disclosure.
Keep useful, specific coaching; avoid repeated advice panels and decorative stepper circles.

### Check-in

Plain title, appropriate metric input, date and optional writing. Reflections feel like a
notebook entry, not a settings form. Routine success says “Check-in saved.” Goal completion and
meaningful milestones may earn a more personal response after persistence succeeds.

### Progress

Open sections for actual totals, activity, milestones and per-goal progress. Charts support
understanding without becoming the visual identity. Levels/XP and streaks are available as
secondary details rather than the reason to use Membrant.

### Reflections

Generous writing space, quiet prompts, dates and the person's own words. No decorative reward
banner. Keep save/error states clear. Previous writing reads as a journal, not a tile gallery.

## Voice: earn the emotional moment

| Routine context | Prefer | Avoid |
| --- | --- | --- |
| Page heading | “My goals”, “Progress”, “Reflections” | A slogan on every page |
| Check-in | “Check in”, “Save check-in” | “Every small step counts” |
| Routine save | “Check-in saved” | Multiple congratulatory sentences |
| Empty history | “Your first check-in will appear here.” | “Your story is still ahead” |
| Account | “Account”, “Connected”, “Sign in” | “One direction. Every device.” |
| Goal completion | “You reached your goal.” | Confetti or congratulations on every save |
| Thirty check-in days | “Thirty days. You did it.” | Generic encouragement unrelated to the data |

Warmth comes primarily from the user's reasons and writing. No motivational sidebar, footer,
chart caption or persistent wellness slogan. Specific coaching is useful information, not a
license to add ambient encouragement. Never rewrite saved user-authored content.

## Interaction and accessibility

- Keep keyboard focus obvious. Web dialogs retain focus management and Escape behavior.
- Native controls have at least 44px targets, accessible names and selected/disabled states.
- Respect reduced motion, including native sheet transitions. Haptics acknowledge a saved action.
- Prefer short opacity/transform feedback; no perpetual motion or animated background texture.
- Preserve explicit loading, empty, validation, network failure and saving states.
- Mobile collapses to one reading column. Long titles, reasons and reflections must wrap.
- Test both themes, narrow web widths, Expo web and native build/export paths. Browser tests
  do not replace physical-device validation.

## Review filter

If the borders, backgrounds and icons disappeared, would the screen still communicate what
matters? Can the user find their next action before encountering analytics? Is every bright
green element doing one of its five jobs? Has the interface left room for the person's voice?
