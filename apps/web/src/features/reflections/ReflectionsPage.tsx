import { useState } from 'react';
import { Check } from '@phosphor-icons/react';
import { formatDate, today, uid, weekStart } from '@membrant/core';
import { message, useMembrant } from '@membrant/client';
import { ErrorMessage, Field, PageHeader } from '../../components/ui';

export function ReflectionsPage() {
  const { state, dispatch, busy } = useMembrant();
  const existing = state?.reviews.find((review) => weekStart(review.date) === weekStart());
  const [wins, setWins] = useState(existing?.wins ?? '');
  const [challenge, setChallenge] = useState(existing?.challenge ?? '');
  const [nextStep, setNextStep] = useState(existing?.nextStep ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  if (!state) return null;
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await dispatch({
        type: 'review.save',
        review: { id: existing?.id ?? uid('review'), date: today(), wins, challenge, nextStep },
      });
      setSaved(true);
    } catch (cause) {
      setError(message(cause));
    }
  };
  const notes = [...state.entries]
    .filter((entry) => entry.note)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);
  return (
    <>
      <PageHeader title="Reflections" description="A record of what you notice." />
      <div className="reflection-layout">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>This week</h2>
              <p>Week of {formatDate(weekStart())}</p>
            </div>
          </div>
          <form
            className="form-stack journal-form"
            onSubmit={(e) => void save(e)}
            onChange={() => setSaved(false)}
          >
            <Field label="What went well?">
              <textarea
                required
                minLength={3}
                maxLength={2000}
                rows={3}
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                placeholder="I’m glad I made time for…"
              />
            </Field>
            <Field label="What felt difficult? (optional)">
              <textarea
                maxLength={2000}
                rows={3}
                value={challenge}
                onChange={(e) => setChallenge(e.target.value)}
                placeholder="I noticed it was harder when…"
              />
            </Field>
            <Field label="One thing I’ll try next week">
              <textarea
                required
                minLength={3}
                maxLength={2000}
                rows={3}
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                placeholder="I’ll make it easier by…"
              />
            </Field>
            <ErrorMessage error={error} />
            <div className="row between">
              <span className="small success-text" role="status">
                {saved && (
                  <>
                    <Check size={16} />
                    Reflection saved
                  </>
                )}
              </span>
              <button className="button primary" type="submit" disabled={busy}>
                {busy ? 'Saving…' : existing ? 'Update reflection' : 'Save reflection'}
              </button>
            </div>
          </form>
        </section>
        <aside>
          <h2>From your check-ins</h2>
          <div className="journal-notes">
            {notes.length ? (
              notes.map((entry) => (
                <article key={entry.id}>
                  <small>
                    {formatDate(entry.date)} ·{' '}
                    {state.goals.find((goal) => goal.id === entry.goalId)?.title}
                  </small>
                  <p>{entry.note}</p>
                </article>
              ))
            ) : (
              <p className="muted">Add a note to a check-in and it will appear here.</p>
            )}
          </div>
        </aside>
      </div>
      {state.reviews.length > 0 && (
        <section className="section-space">
          <h2>Previous reflections</h2>
          <div className="review-grid">
            {[...state.reviews]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((review) => (
                <article className="panel" key={review.id}>
                  <small className="muted">Week of {formatDate(weekStart(review.date))}</small>
                  <h3>What went well</h3>
                  <p>{review.wins}</p>
                  {review.challenge && (
                    <>
                      <h3>What felt difficult</h3>
                      <p>{review.challenge}</p>
                    </>
                  )}
                  <h3>Next week</h3>
                  <p>{review.nextStep}</p>
                </article>
              ))}
          </div>
        </section>
      )}
    </>
  );
}
