import { Check } from '@phosphor-icons/react';
import { badges, progress, stats } from '@membrant/core';
import { useMembrant } from '@membrant/client';
import { EmptyState, PageHeader, ProgressBar, type GoalActions } from '../../components/ui';
import { ActivityChart, ActivityHeatmap } from './ActivityChart';

export function ProgressPage(actions: GoalActions) {
  const { state } = useMembrant();
  if (!state) return null;
  const summary = stats(state);
  const visibleGoals = state.goals.filter((goal) => goal.status !== 'archived');
  return (
    <>
      <PageHeader title="Progress" description="Your activity over time." />
      <div className="progress-summary">
        <div>
          <strong>{state.entries.length}</strong>
          <span>Check-ins</span>
        </div>
        <div>
          <strong>{summary.days}</strong>
          <span>Days with a check-in</span>
        </div>
        <div>
          <strong>{summary.completed}</strong>
          <span>Goals completed</span>
        </div>
        <div>
          <strong>{state.reviews.length}</strong>
          <span>Weeks reflected on</span>
        </div>
      </div>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Your activity</h2>
            <p>Each square is a day in the last 12 weeks.</p>
          </div>
        </div>
        <ActivityHeatmap entries={state.entries} />
      </section>
      <div className="dashboard-grid section-space">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>The last two weeks</h2>
              <p>Check-ins per day</p>
            </div>
          </div>
          <ActivityChart entries={state.entries} count={14} />
        </section>
        <section className="panel">
          <h2>Milestones</h2>
          <div className="badges-list">
            {badges(state).map((badge) => (
              <div className={badge.earned ? 'earned' : ''} key={badge.id}>
                <span className="badge-icon">
                  {badge.earned && <Check size={13} weight="bold" aria-hidden="true" />}
                </span>
                <div>
                  <strong>{badge.title}</strong>
                  <small>{badge.description}</small>
                  <span className="sr-only">{badge.earned ? 'Earned' : 'Not yet earned'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="panel section-space">
        <div className="section-heading">
          <div>
            <h2>Your goals</h2>
          </div>
        </div>
        {visibleGoals.length ? (
          <div className="goal-progress-list">
            {visibleGoals.map((goal) => {
              const current = progress(goal, state.entries);
              return (
                <button key={goal.id} onClick={() => actions.onOpen(goal)}>
                  <div>
                    <strong>{goal.title}</strong>
                    <span className="muted small">
                      {current.value.toLocaleString()} of {goal.target.toLocaleString()} {goal.unit}
                    </span>
                  </div>
                  <ProgressBar value={current.percent} />
                  <strong>{current.percent}%</strong>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No goals to show"
            text="Start a goal and your progress will appear here."
            action={() => actions.onCreate()}
          />
        )}
      </section>
      <details className="disclosure">
        <summary>Experience and streaks</summary>
        <div className="reward-details">
          <span>
            Level {summary.level} · {summary.xp.toLocaleString()} XP · {summary.streak} day streak
          </span>
          <ProgressBar value={summary.levelProgress / 3} label="Experience toward next level" />
          <span>
            {summary.levelProgress} / 300 XP toward level {summary.level + 1}
          </span>
        </div>
      </details>
    </>
  );
}
