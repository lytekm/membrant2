import { useState } from 'react';
import {
  Archive,
  ArrowCounterClockwise,
  CheckCircle,
  Pause,
  PencilSimple,
  Play,
  Plus,
  Trash,
} from '@phosphor-icons/react';
import {
  formatDate,
  goalStatus,
  paceHint,
  progress,
  type Goal,
  type GoalPatch,
} from '@membrant/core';
import { message, useMembrant } from '@membrant/client';
import { CoachNote, ErrorMessage, Field, Modal, ProgressBar } from '../../components/ui';

export function GoalDetail({
  goal,
  onClose,
  onLog,
}: {
  goal: Goal;
  onClose(): void;
  onLog(goal: Goal): void;
}) {
  const { state, dispatch, busy } = useMembrant();
  const [editing, setEditing] = useState(false);
  const [patch, setPatch] = useState<GoalPatch>({
    title: goal.title,
    why: goal.why,
    targetDate: goal.targetDate,
    weeklyTarget: goal.weeklyTarget,
    smallStep: goal.smallStep,
    obstacle: goal.obstacle,
    plan: goal.plan,
  });
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!state) return null;
  const current = progress(goal, state.entries);
  const entries = [...state.entries]
    .filter((entry) => entry.goalId === goal.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const run = async (action: () => Promise<void>) => {
    try {
      setError(null);
      await action();
    } catch (cause) {
      setError(message(cause));
    }
  };
  return (
    <Modal
      title={goal.title}
      description={`${goal.category} · ${goalStatus(goal, state.entries)}`}
      onClose={() => {
        if (!busy) onClose();
      }}
      wide
    >
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await dispatch({ type: 'goal.update', goalId: goal.id, patch });
              setEditing(false);
            });
          }}
        >
          <div className="form-stack">
            <Field label="Goal title">
              <input
                required
                minLength={3}
                maxLength={100}
                value={patch.title}
                onChange={(e) => setPatch({ ...patch, title: e.target.value })}
              />
            </Field>
            <Field label="Why this matters">
              <textarea
                required
                minLength={3}
                maxLength={1000}
                value={patch.why}
                onChange={(e) => setPatch({ ...patch, why: e.target.value })}
              />
            </Field>
            <div className="form-grid">
              <Field label="Target date">
                <input
                  required
                  type="date"
                  min={goal.startDate}
                  value={patch.targetDate}
                  onChange={(e) => setPatch({ ...patch, targetDate: e.target.value })}
                />
              </Field>
              <Field label="Check-in days per week">
                <input
                  required
                  type="number"
                  min={1}
                  max={7}
                  value={patch.weeklyTarget}
                  onChange={(e) => setPatch({ ...patch, weeklyTarget: Number(e.target.value) })}
                />
              </Field>
            </div>
            <Field label="My next small step">
              <textarea
                required
                minLength={3}
                maxLength={300}
                value={patch.smallStep}
                onChange={(e) => setPatch({ ...patch, smallStep: e.target.value })}
              />
            </Field>
            <Field label="What might get in the way?">
              <input
                maxLength={500}
                value={patch.obstacle}
                onChange={(e) => setPatch({ ...patch, obstacle: e.target.value })}
              />
            </Field>
            <Field label="When that happens, I will…">
              <input
                maxLength={500}
                value={patch.plan}
                onChange={(e) => setPatch({ ...patch, plan: e.target.value })}
              />
            </Field>
          </div>
          <ErrorMessage error={error} />
          <footer className="modal-footer">
            <button className="button secondary" type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className="button primary" disabled={busy} type="submit">
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </footer>
        </form>
      ) : (
        <>
          <div className="detail-progress">
            <div>
              <div className="row between">
                <strong>
                  {current.value.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                </strong>
                <strong>{current.percent}%</strong>
              </div>
              <ProgressBar value={current.percent} />
            </div>
          </div>
          <div className="detail-why">
            <h3>Why it matters</h3>
            <p>{goal.why}</p>
          </div>
          <CoachNote title={current.complete ? 'Goal completed' : 'Your pace'}>
            {paceHint(goal, state.entries)}
          </CoachNote>
          <div className="detail-plan">
            <div>
              <small>Next small step</small>
              <p>{goal.smallStep}</p>
            </div>
            {goal.plan && (
              <div>
                <small>When life gets in the way</small>
                <p>{goal.plan}</p>
              </div>
            )}
          </div>
          <div className="detail-actions">
            {!current.complete && goal.status === 'active' && (
              <button className="button primary" onClick={() => onLog(goal)}>
                <Plus size={16} />
                Check in
              </button>
            )}
            <button className="button secondary" onClick={() => setEditing(true)}>
              <PencilSimple size={16} />
              Edit plan
            </button>
            <button
              className="text-button quiet"
              disabled={busy}
              onClick={() =>
                void run(() =>
                  dispatch({
                    type: 'goal.status',
                    goalId: goal.id,
                    status: goal.status === 'active' ? 'paused' : 'active',
                  }),
                )
              }
            >
              {goal.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
              {goal.status === 'active' ? 'Pause' : 'Resume'}
            </button>
            {goal.status !== 'archived' && (
              <button
                className="text-button quiet"
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    dispatch({ type: 'goal.status', goalId: goal.id, status: 'archived' }),
                  )
                }
              >
                <Archive size={16} />
                Archive
              </button>
            )}
          </div>
          {goal.metricType === 'milestone' && (
            <section className="detail-section">
              <h3>Your milestones</h3>
              <ul className="milestone-list">
                {goal.milestones.map((milestone) => {
                  const entry = entries.find((item) => item.milestoneId === milestone.id);
                  return (
                    <li key={milestone.id}>
                      <CheckCircle
                        size={20}
                        className={entry ? 'accent' : 'muted'}
                        weight={entry ? 'fill' : 'regular'}
                      />
                      <span>{milestone.title}</span>
                      {entry && <small className="muted">{formatDate(entry.date)}</small>}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          <section className="detail-section">
            <h3>
              Check-in history <span className="muted">({entries.length})</span>
            </h3>
            {entries.length ? (
              <div className="entry-list">
                {entries.map((entry) => (
                  <article key={entry.id}>
                    <div>
                      <small>
                        {formatDate(entry.date, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </small>
                      <strong>
                        {goal.metricType === 'habit'
                          ? 'Checked in'
                          : goal.metricType === 'milestone'
                            ? goal.milestones.find((item) => item.id === entry.milestoneId)?.title
                            : `${goal.metricType === 'count' ? '+' : ''}${entry.value} ${goal.unit}`}
                      </strong>
                      {entry.note && <p>{entry.note}</p>}
                    </div>
                    <button
                      className="icon-button"
                      aria-label={`Undo check-in from ${formatDate(entry.date)}`}
                      title="Undo check-in"
                      disabled={busy}
                      onClick={() =>
                        void run(() => dispatch({ type: 'entry.delete', entryId: entry.id }))
                      }
                    >
                      <ArrowCounterClockwise size={18} />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">Your first check-in will appear here.</p>
            )}
          </section>
          <ErrorMessage error={error} />
          <footer className="modal-footer">
            {confirmDelete ? (
              <div className="delete-confirm">
                <p>Delete this goal and all its check-ins? This cannot be undone.</p>
                <div className="row">
                  <button className="button secondary" onClick={() => setConfirmDelete(false)}>
                    Keep goal
                  </button>
                  <button
                    className="button danger"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await dispatch({ type: 'goal.delete', goalId: goal.id });
                        onClose();
                      })
                    }
                  >
                    Delete permanently
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span className="small muted">
                  Started {formatDate(goal.startDate)} · Target {formatDate(goal.targetDate)}
                </span>
                <button className="text-button danger-text" onClick={() => setConfirmDelete(true)}>
                  <Trash size={16} />
                  Delete goal
                </button>
              </>
            )}
          </footer>
        </>
      )}
    </Modal>
  );
}
