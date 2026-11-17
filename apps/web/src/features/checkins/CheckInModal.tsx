import { useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import { progress, today, uid, type Goal } from '@membrant/core';
import { message, useMembrant } from '@membrant/client';
import { ErrorMessage, Field, Modal } from '../../components/ui';

export function CheckInModal({ goal, onClose }: { goal: Goal; onClose(): void }) {
  const { state, dispatch, busy } = useMembrant();
  const [value, setValue] = useState(
    goal.metricType === 'percent'
      ? String(Math.min(100, progress(goal, state!.entries).value + 10))
      : goal.metricType === 'count'
        ? ''
        : '1',
  );
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const available = goal.milestones.filter(
    (milestone) =>
      !state!.entries.some(
        (entry) => entry.goalId === goal.id && entry.milestoneId === milestone.id,
      ),
  );
  const [milestoneId, setMilestoneId] = useState(available[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [initialComplete] = useState(() => progress(goal, state!.entries).complete);
  const [initialDays] = useState(() => new Set(state!.entries.map((entry) => entry.date)).size);
  const completed = !initialComplete && progress(goal, state!.entries).complete;
  const thirtyDays =
    initialDays < 30 && new Set(state!.entries.map((entry) => entry.date)).size === 30;
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (date > today()) {
      setError('Choose today or an earlier date.');
      return;
    }
    if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
      setError('Add a positive amount for this check-in.');
      return;
    }
    try {
      await dispatch({
        type: 'entry.create',
        entry: {
          id: uid('entry'),
          goalId: goal.id,
          date,
          value: Number(value),
          note,
          ...(goal.metricType === 'milestone' ? { milestoneId } : {}),
          createdAt: new Date().toISOString(),
        },
      });
      setSaved(true);
    } catch (cause) {
      setError(message(cause));
    }
  };
  return (
    <Modal
      title={saved ? 'Check-in saved' : 'Check in'}
      description={goal.title}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      {saved ? (
        <div className="checkin-success">
          <CheckCircle size={40} weight="regular" />
          {(completed || thirtyDays) && (
            <h2>{completed ? 'You reached your goal.' : 'Thirty days. You did it.'}</h2>
          )}
          <p>
            {progress(goal, state!.entries).value.toLocaleString()} / {goal.target.toLocaleString()}{' '}
            {goal.unit} recorded.
          </p>
          <button className="button primary" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form className="checkin-form" onSubmit={(event) => void save(event)}>
          <div className="form-stack">
            {goal.metricType === 'habit' && (
              <div className="next-step">
                <CheckCircle size={24} />
                <p>{goal.smallStep}</p>
              </div>
            )}
            {(goal.metricType === 'count' || goal.metricType === 'percent') && (
              <Field
                label={
                  goal.metricType === 'percent'
                    ? 'Overall progress (%)'
                    : `How many ${goal.unit} did you add?`
                }
                hint={
                  goal.metricType === 'percent'
                    ? 'This replaces your current percentage.'
                    : 'This amount is added to your total.'
                }
              >
                <input
                  autoFocus
                  required
                  type="number"
                  min={goal.metricType === 'percent' ? 1 : 0.01}
                  max={goal.metricType === 'percent' ? 100 : 1_000_000_000}
                  step="any"
                  placeholder="0"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </Field>
            )}
            {goal.metricType === 'milestone' && (
              <Field label="Which milestone did you finish?">
                <select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)}>
                  {available.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Check-in date">
              <input
                required
                type="date"
                min={goal.startDate}
                max={today()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="A quick reflection (optional)">
              <textarea
                rows={3}
                maxLength={2000}
                placeholder="What would you like to remember?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
            <ErrorMessage error={error} />
          </div>
          <footer className="modal-footer">
            <button type="button" className="text-button quiet" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="button primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save check-in'}
            </button>
          </footer>
        </form>
      )}
    </Modal>
  );
}
