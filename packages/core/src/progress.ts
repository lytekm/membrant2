import type { AppState, Entry, Goal } from './schema';
import { addDays, daysBetween, today, weekStart } from './dates';

export function goalEntries(goal: Goal, entries: Entry[]): Entry[] {
  return entries.filter((entry) => entry.goalId === goal.id);
}

export function progress(goal: Goal, entries: Entry[]) {
  const logs = goalEntries(goal, entries);
  let value = goal.baseline;
  if (goal.metricType === 'percent') {
    value =
      [...logs].sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
      )[0]?.value ?? goal.baseline;
  } else if (goal.metricType === 'habit') {
    value += new Set(logs.map((entry) => entry.date)).size;
  } else if (goal.metricType === 'milestone') {
    value += new Set(logs.map((entry) => entry.milestoneId).filter(Boolean)).size;
  } else {
    value += logs.reduce((total, entry) => total + entry.value, 0);
  }
  const percent = Math.min(
    100,
    Math.max(0, Math.round(((value - goal.baseline) / (goal.target - goal.baseline)) * 100)),
  );
  return { value, percent, complete: value >= goal.target };
}

export function streak(entries: Entry[], date = today()): number {
  const dates = new Set(entries.map((entry) => entry.date));
  let cursor = dates.has(date) ? date : addDays(date, -1);
  let total = 0;
  while (dates.has(cursor)) {
    total++;
    cursor = addDays(cursor, -1);
  }
  return total;
}

export function weekCount(goal: Goal, entries: Entry[], date = today()): number {
  const start = weekStart(date);
  return new Set(
    goalEntries(goal, entries)
      .filter((entry) => entry.date >= start && entry.date <= date)
      .map((entry) => entry.date),
  ).size;
}

export function goalStatus(goal: Goal, entries: Entry[], date = today()): string {
  if (goal.status === 'archived') return 'Archived';
  if (progress(goal, entries).complete) return 'Completed';
  if (goal.status === 'paused') return 'Paused';
  if (goal.targetDate < date) return 'Past target date';
  if (weekCount(goal, entries, date) >= goal.weeklyTarget) return 'Weekly target met';
  return 'Active';
}

export function activity(entries: Entry[], count = 7, date = today()) {
  return Array.from({ length: count }, (_, index) => {
    const day = addDays(date, index - count + 1);
    return { date: day, count: entries.filter((entry) => entry.date === day).length };
  });
}

export function stats(state: AppState, date = today()) {
  const active = state.goals.filter(
    (goal) => goal.status === 'active' && !progress(goal, state.entries).complete,
  );
  const completed = state.goals.filter((goal) => progress(goal, state.entries).complete).length;
  const days = new Set(state.entries.map((entry) => entry.date)).size;
  const rewardedCheckins = new Set(state.entries.map((entry) => `${entry.goalId}:${entry.date}`))
    .size;
  const xp = rewardedCheckins * 20 + completed * 100 + state.reviews.length * 30;
  const planned = active.reduce((sum, goal) => sum + goal.weeklyTarget, 0);
  const logged = active.reduce(
    (sum, goal) => sum + Math.min(goal.weeklyTarget, weekCount(goal, state.entries, date)),
    0,
  );
  return {
    active: active.length,
    completed,
    days,
    xp,
    level: Math.floor(xp / 300) + 1,
    levelProgress: xp % 300,
    streak: streak(state.entries, date),
    consistency: planned ? Math.round((logged / planned) * 100) : 0,
    logged,
    planned,
  };
}

export function badges(state: AppState) {
  const summary = stats(state);
  return [
    {
      id: 'first',
      title: 'First step',
      description: 'Make your first check-in',
      earned: state.entries.length > 0,
    },
    {
      id: 'seven',
      title: 'Showing up',
      description: 'Check in on 7 different days',
      earned: summary.days >= 7,
    },
    {
      id: 'finish',
      title: 'Finish line',
      description: 'Complete your first goal',
      earned: summary.completed > 0,
    },
    {
      id: 'reflect',
      title: 'Look inward',
      description: 'Write a weekly reflection',
      earned: state.reviews.length > 0,
    },
  ];
}

export function paceHint(goal: Goal, entries: Entry[], date = today()): string {
  const current = progress(goal, entries);
  if (current.complete)
    return `Completed: ${current.value.toLocaleString()} ${goal.unit} recorded.`;
  const remaining = daysBetween(date, goal.targetDate);
  if (remaining < 0) return 'The target date has passed. Edit the date or adjust your next step.';
  if (goal.metricType === 'habit')
    return `${weekCount(goal, entries, date)} of ${goal.weeklyTarget} planned check-in days this week.`;
  const perWeek = Math.ceil((goal.target - current.value) / Math.max(1, (remaining + 1) / 7));
  return `About ${perWeek.toLocaleString()} ${goal.unit} a week to reach your target date.`;
}
