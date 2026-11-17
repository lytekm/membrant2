import { describe, expect, it } from 'vitest';
import {
  addDays,
  applyCommand,
  coaching,
  dateSchema,
  daysBetween,
  demoState,
  emptyState,
  goalSchema,
  newGoal,
  progress,
  stats,
  streak,
  templates,
  weekCount,
  weekStart,
  type AppState,
  type Entry,
  type Goal,
} from './index';

const date = '2026-10-08';
function setup(template = templates[0]) {
  const goal = {
    ...newGoal(template, '2026-10-01'),
    id: 'goal1',
    why: 'Make space for a meaningful practice.',
  };
  return { goal, state: applyCommand(emptyState('Tester'), { type: 'goal.create', goal }, date) };
}
function entry(goal: Goal, overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'entry1',
    goalId: goal.id,
    date,
    value: 10,
    note: '',
    createdAt: `${date}T12:00:00.000Z`,
    ...overrides,
  };
}
function log(state: AppState, value: Entry) {
  return applyCommand(state, { type: 'entry.create', entry: value }, date);
}

describe('progress and rewards', () => {
  it('adds count increments to a baseline, counts distinct days for cadence, and caps progress at 100%', () => {
    const { goal, state } = setup();
    const baselineGoal = { ...goal, baseline: 100 };
    let next = { ...state, goals: [baselineGoal] };
    next = log(next, entry(baselineGoal, { value: 30 }));
    next = log(next, entry(baselineGoal, { id: 'entry2', value: 40 }));
    expect(progress(baselineGoal, next.entries)).toEqual({
      value: 170,
      percent: 35,
      complete: false,
    });
    expect(weekCount(baselineGoal, next.entries, date)).toBe(1);
    expect(stats(next, date).xp).toBe(20);
    next = log(next, entry(baselineGoal, { id: 'entry3', value: 200 }));
    expect(progress(baselineGoal, next.entries).percent).toBe(100);
    expect(stats(next, date).xp).toBe(120);
    next = applyCommand(next, { type: 'entry.delete', entryId: 'entry3' }, date);
    expect(stats(next, date).xp).toBe(20);
    expect(progress(baselineGoal, next.entries).complete).toBe(false);
  });
  it('rejects duplicate habit days even when the entry ID differs', () => {
    const { state, goal } = setup(templates[1]);
    const next = log(state, entry(goal, { value: 1 }));
    expect(() => log(next, entry(goal, { id: 'different', value: 1 }))).toThrow(/already has/);
    expect(() => log(state, entry(goal, { value: 2 }))).toThrow();
  });
  it('only accepts a known, unfinished milestone and supports undo', () => {
    const { state, goal } = setup(templates[2]);
    expect(() => log(state, entry(goal, { value: 1, milestoneId: 'unknown' }))).toThrow(
      /Choose a milestone/,
    );
    const next = log(state, entry(goal, { value: 1, milestoneId: goal.milestones[0].id }));
    expect(progress(goal, next.entries).percent).toBe(25);
    expect(() =>
      log(next, entry(goal, { id: 'different', value: 1, milestoneId: goal.milestones[0].id })),
    ).toThrow(/already complete/);
    const undone = applyCommand(next, { type: 'entry.delete', entryId: 'entry1' }, date);
    expect(progress(goal, undone.entries).percent).toBe(0);
  });
  it('uses the latest percentage by calendar date, not the largest value or insertion order', () => {
    const { goal } = setup();
    const percentGoal = { ...goal, metricType: 'percent' as const, unit: '%', target: 100 };
    const logs = [
      entry(percentGoal, { value: 60 }),
      entry(percentGoal, {
        id: 'older',
        date: '2026-10-07',
        value: 80,
        createdAt: `${date}T14:00:00.000Z`,
      }),
      entry(percentGoal, { id: 'correction', value: 40, createdAt: `${date}T13:00:00.000Z` }),
    ];
    expect(progress(percentGoal, logs).value).toBe(40);
  });
  it('allows yesterday to keep a streak alive, then resets after a missed day', () => {
    const { goal } = setup();
    const logs = [
      entry(goal, { date: '2026-10-07' }),
      entry(goal, { id: 'a', date: '2026-10-06' }),
      entry(goal, { id: 'b', date: '2026-10-06' }),
    ];
    expect(streak(logs, date)).toBe(2);
    expect(streak(logs, '2026-10-09')).toBe(0);
  });
  it('replaces a weekly reflection without rewarding it twice', () => {
    const { state } = setup();
    const first = applyCommand(
      state,
      {
        type: 'review.save',
        review: { id: 'r1', date, wins: 'I showed up.', challenge: '', nextStep: 'Start earlier.' },
      },
      date,
    );
    const updated = applyCommand(
      first,
      {
        type: 'review.save',
        review: {
          id: 'r2',
          date: '2026-10-07',
          wins: 'I learned something.',
          challenge: '',
          nextStep: 'Keep it small.',
        },
      },
      date,
    );
    expect(updated.reviews).toHaveLength(1);
    expect(stats(updated, date).xp).toBe(30);
  });
});

describe('validation and lifecycle', () => {
  it('rejects impossible dates and an inverted timeline', () => {
    expect(dateSchema.safeParse('2026-02-30').success).toBe(false);
    const { goal } = setup();
    expect(goalSchema.safeParse({ ...goal, targetDate: '2026-09-30' }).success).toBe(false);
    expect(goalSchema.safeParse({ ...goal, target: goal.baseline }).success).toBe(false);
  });
  it('blocks logging before a goal starts, after completion, and while paused', () => {
    const { state, goal } = setup();
    expect(() => log(state, entry(goal, { date: '2026-09-30' }))).toThrow(/Choose a check-in date/);
    expect(() => log(state, entry(goal, { date: '2026-10-10' }))).toThrow(/Choose a check-in date/);
    const paused = applyCommand(
      state,
      { type: 'goal.status', goalId: goal.id, status: 'paused' },
      date,
    );
    expect(() => log(paused, entry(goal))).toThrow(/Resume/);
    const completed = log(state, entry(goal, { value: 300 }));
    expect(() => log(completed, entry(goal, { id: 'again' }))).toThrow(/complete/);
  });
  it('removes dependent check-ins when deleting a goal', () => {
    const { state, goal } = setup();
    const next = applyCommand(
      log(state, entry(goal)),
      { type: 'goal.delete', goalId: goal.id },
      date,
    );
    expect(next.goals).toHaveLength(0);
    expect(next.entries).toHaveLength(0);
    expect(stats(next, date).xp).toBe(0);
  });
  it('validates edits without changing the measurement or history', () => {
    const { state, goal } = setup();
    const next = applyCommand(
      log(state, entry(goal)),
      { type: 'goal.update', goalId: goal.id, patch: { title: 'A better title', weeklyTarget: 2 } },
      date,
    );
    expect(next.goals[0].title).toBe('A better title');
    expect(next.goals[0].target).toBe(goal.target);
    expect(next.entries).toHaveLength(1);
  });
  it('uses calendar day arithmetic across daylight-saving changes and week boundaries', () => {
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(weekStart('2026-10-11')).toBe('2026-10-05');
    expect(weekStart('2026-10-12')).toBe('2026-10-12');
  });
  it('accepts a device one calendar day ahead of the server, but not a future-dated plan', () => {
    const { goal } = setup();
    expect(() =>
      applyCommand(
        emptyState(),
        { type: 'goal.create', goal: { ...goal, startDate: '2026-10-09' } },
        date,
      ),
    ).not.toThrow();
    expect(() =>
      applyCommand(
        emptyState(),
        { type: 'goal.create', goal: { ...goal, startDate: '2026-10-10' } },
        date,
      ),
    ).toThrow(/today/);
  });
  it('flags a habit target that will not fit its cadence and responds to time obstacles', () => {
    const { goal } = setup(templates[1]);
    const tips = coaching({ ...goal, target: 100, weeklyTarget: 2, obstacle: 'I have no time' });
    expect(tips.some((tip) => tip.tone === 'attention')).toBe(true);
    expect(tips.some((tip) => tip.title === 'Attach it to something familiar')).toBe(true);
  });
  it('generates internally consistent demo data relative to the requested day', () => {
    const state = demoState(date);
    expect(
      state.entries.every(
        (entry) => entry.date < date && state.goals.some((goal) => goal.id === entry.goalId),
      ),
    ).toBe(true);
    expect(stats(state, date).active).toBe(3);
    expect(stats(emptyState(), date).consistency).toBe(0);
  });
});
