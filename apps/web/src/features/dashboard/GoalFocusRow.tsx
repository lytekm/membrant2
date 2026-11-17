import { ArrowUpRight, Check, Plus } from '@phosphor-icons/react';
import { addDays, formatDate, weekStart, type Entry, type Goal } from '@membrant/core';
import type { GoalActions } from '../../components/ui';

type GoalFocusRowProps = Pick<GoalActions, 'onOpen' | 'onLog'> & {
  goal: Goal;
  entries: Entry[];
  date: string;
};

/** A weekly count is check-ins, not distinct days or a percentage of the goal. */
export function GoalFocusRow({ goal, entries, date, onOpen, onLog }: GoalFocusRowProps) {
  const start = weekStart(date);
  const weekEntries = entries.filter(
    (entry) => entry.goalId === goal.id && entry.date >= start && entry.date <= date,
  );
  const checkedInToday = weekEntries.some((entry) => entry.date === date);
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(start, index);
    return { date: day, count: weekEntries.filter((entry) => entry.date === day).length };
  });

  return (
    <article className="goal-focus-row" aria-label={goal.title}>
      <div className="goal-focus-heading">
        <span className="goal-focus-category">{goal.category}</span>
        {checkedInToday && (
          <span className="goal-focus-today">
            <Check size={13} aria-hidden="true" /> Checked in today
          </span>
        )}
      </div>
      <h3>
        <button className="goal-focus-title" onClick={() => onOpen(goal)}>
          {goal.title}
          <ArrowUpRight size={17} aria-hidden="true" />
        </button>
      </h3>
      <p className="goal-focus-reason">{goal.why}</p>

      <div className="goal-focus-footer">
        <div className="goal-focus-week">
          <ol className="week-thread" aria-label={`This week’s check-ins for ${goal.title}`}>
            {days.map((day) => {
              const label = `${formatDate(day.date, { weekday: 'long', month: 'short', day: 'numeric' })}: ${
                day.date > date
                  ? 'upcoming'
                  : `${day.count} ${day.count === 1 ? 'check-in' : 'check-ins'}`
              }`;
              return (
                <li
                  key={day.date}
                  className={`${day.count ? 'is-checked' : ''} ${day.date === date ? 'is-today' : ''} ${day.date > date ? 'is-future' : ''}`}
                  title={label}
                  aria-current={day.date === date ? 'date' : undefined}
                >
                  <span className="sr-only">{label}</span>
                  <span className="week-thread-mark" aria-hidden="true">
                    {day.count > 0 && <Check size={11} weight="bold" />}
                  </span>
                  <span className="week-thread-day" aria-hidden="true">
                    {formatDate(day.date, { weekday: 'short' }).slice(0, 1)}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="goal-focus-count">
            <strong>{weekEntries.length}</strong>{' '}
            {weekEntries.length === 1 ? 'check-in' : 'check-ins'} <span>this week</span>
          </p>
        </div>
        <button className="button journal-checkin" onClick={() => onLog(goal)}>
          <Plus size={15} aria-hidden="true" />
          Check in
        </button>
      </div>
    </article>
  );
}
