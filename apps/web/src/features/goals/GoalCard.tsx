import { ArrowUpRight, Check, Plus } from '@phosphor-icons/react';
import { formatDate, progress, weekCount, type AppState, type Goal } from '@membrant/core';
import { ProgressBar, type GoalActions } from '../../components/ui';

export function GoalCard({
  goal,
  state,
  onOpen,
  onLog,
}: { goal: Goal; state: AppState } & Pick<GoalActions, 'onOpen' | 'onLog'>) {
  const current = progress(goal, state.entries);
  const status =
    goal.status === 'archived'
      ? 'Archived'
      : current.complete
        ? 'Completed'
        : goal.status === 'paused'
          ? 'Paused'
          : 'Active';
  return (
    <article className="goal-card">
      <div className="goal-row-layout">
        <div className="goal-row-detail">
          <div className="row between goal-meta">
            <span>{goal.category}</span>
            <span className={`status ${current.complete ? 'success' : ''}`}>{status}</span>
          </div>
          <button className="goal-title" onClick={() => onOpen(goal)}>
            {goal.title}
            <ArrowUpRight size={18} aria-hidden="true" />
          </button>
          <p className="goal-reason">{goal.why}</p>
          <p className="goal-step">
            <strong>Next step</strong> · {goal.smallStep}
          </p>
        </div>
        <div className="goal-row-measure">
          <div className="row between progress-label">
            <span>
              <strong>{current.value.toLocaleString()}</strong> / {goal.target.toLocaleString()}{' '}
              {goal.unit}
            </span>
            <strong>{current.percent}%</strong>
          </div>
          <ProgressBar value={current.percent} label={`Progress toward ${goal.title}`} />
          <div className="row between goal-meta">
            <span>
              {weekCount(goal, state.entries)} / {goal.weeklyTarget} planned days this week
            </span>
            <span>By {formatDate(goal.targetDate)}</span>
          </div>
          <div className="goal-card-footer">
            {goal.status === 'active' && !current.complete ? (
              <button className="text-button" onClick={() => onLog(goal)}>
                <Plus size={16} />
                Check in
              </button>
            ) : (
              <button className="text-button quiet" onClick={() => onOpen(goal)}>
                {current.complete && <Check size={16} />}View goal
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
