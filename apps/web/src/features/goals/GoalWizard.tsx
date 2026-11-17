import { useState } from 'react';
import { ArrowLeft, ArrowRight, Flag } from '@phosphor-icons/react';
import {
  categories,
  coaching,
  formatDate,
  goalSchema,
  intents,
  newGoal,
  uid,
  type Goal,
  type GoalTemplate,
  type MetricType,
} from '@membrant/core';
import { message, useMembrant } from '@membrant/client';
import { CoachNote, ErrorMessage, Field, Modal } from '../../components/ui';

const steps = ['Direction', 'Measurement', 'Plan', 'Review'];
const metrics: { value: MetricType; title: string; description: string }[] = [
  { value: 'habit', title: 'Show up regularly', description: 'Count days you do the thing' },
  {
    value: 'count',
    title: 'Build toward a number',
    description: 'Pages, minutes, dollars and more',
  },
  {
    value: 'milestone',
    title: 'Finish a set of steps',
    description: 'Break a project into milestones',
  },
  {
    value: 'percent',
    title: 'Track overall progress',
    description: 'Set your current completion %',
  },
];
export function GoalWizard({ template, onClose }: { template?: GoalTemplate; onClose(): void }) {
  const { dispatch, busy } = useMembrant();
  const [goal, setGoal] = useState(() => newGoal(template));
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const patch = (values: Partial<Goal>) => setGoal((current) => ({ ...current, ...values }));
  const changeMetric = (metricType: MetricType) =>
    patch({
      metricType,
      baseline: 0,
      target:
        metricType === 'percent'
          ? 100
          : metricType === 'milestone'
            ? Math.max(1, goal.milestones.length)
            : metricType === 'habit'
              ? 12
              : 100,
      unit:
        metricType === 'percent'
          ? '%'
          : metricType === 'milestone'
            ? 'steps'
            : metricType === 'habit'
              ? 'days'
              : 'minutes',
      milestones:
        metricType === 'milestone' && !goal.milestones.length
          ? [{ id: uid('step'), title: '' }]
          : goal.milestones,
    });
  const next = async () => {
    setError(null);
    const parsed = goalSchema.safeParse(goal);
    const fields =
      step === 0
        ? ['title', 'why']
        : step === 1
          ? ['target', 'baseline', 'targetDate', 'unit', 'milestones', 'weeklyTarget']
          : step === 2
            ? ['smallStep']
            : null;
    const issue = !parsed.success
      ? parsed.error.issues.find((item) => !fields || fields.includes(String(item.path[0])))
      : undefined;
    if (issue) {
      setError(issue.message);
      return;
    }
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    try {
      await dispatch({ type: 'goal.create', goal });
      onClose();
    } catch (cause) {
      setError(message(cause));
    }
  };
  return (
    <Modal
      title="Create a goal"
      onClose={() => {
        if (!busy) onClose();
      }}
      wide
    >
      <div className="wizard-progress" aria-live="polite">
        <span>
          {step + 1} / 4 · {steps[step]}
        </span>
        <span className="wizard-progress-line" aria-hidden="true">
          {steps.map((title, index) => (
            <i key={title} className={index <= step ? 'current' : ''} />
          ))}
        </span>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void next();
        }}
      >
        <div className="wizard-body" key={step}>
          {step === 0 && (
            <>
              <h2>What are you moving toward?</h2>
              <p className="muted">
                Something specific enough that you’ll know when you’ve made progress.
              </p>
              <Field label="My goal">
                <input
                  autoFocus
                  maxLength={100}
                  value={goal.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder="e.g. Read 300 pages over the next six weeks"
                />
              </Field>
              <Field label="Why does this matter to you?">
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={goal.why}
                  onChange={(e) => patch({ why: e.target.value })}
                  placeholder="What would this change for you?"
                />
              </Field>
              <details className="disclosure">
                <summary>Area of life and goal type</summary>
                <div className="form-grid">
                  <Field label="This is about">
                    <select
                      value={goal.intent}
                      onChange={(e) => patch({ intent: e.target.value as Goal['intent'] })}
                    >
                      {intents.map((intent) => (
                        <option key={intent}>{intent}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Area of life">
                    <select
                      value={goal.category}
                      onChange={(e) => patch({ category: e.target.value as Goal['category'] })}
                    >
                      {categories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </details>
            </>
          )}
          {step === 1 && (
            <>
              <h2>What will progress look like?</h2>
              <p className="muted">Choose one way to measure it. Keep the tracking simple.</p>
              <div className="metric-options">
                {metrics.map((metric) => (
                  <button
                    type="button"
                    key={metric.value}
                    aria-pressed={goal.metricType === metric.value}
                    className={goal.metricType === metric.value ? 'selected' : ''}
                    onClick={() => changeMetric(metric.value)}
                  >
                    <strong>{metric.title}</strong>
                    <small>{metric.description}</small>
                  </button>
                ))}
              </div>
              {(goal.metricType === 'count' || goal.metricType === 'habit') && (
                <div className="form-grid">
                  <Field label="Target">
                    <input
                      type="number"
                      min={1}
                      max={1_000_000_000}
                      step={goal.metricType === 'habit' ? 1 : 'any'}
                      value={goal.target || ''}
                      onChange={(e) => patch({ target: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Unit">
                    <input
                      maxLength={30}
                      value={goal.unit}
                      readOnly={goal.metricType === 'habit'}
                      onChange={(e) => patch({ unit: e.target.value })}
                    />
                  </Field>
                  {goal.metricType === 'count' && (
                    <Field label="Starting point" hint="New check-ins add to this number.">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={goal.baseline}
                        onChange={(e) => patch({ baseline: Number(e.target.value) })}
                      />
                    </Field>
                  )}
                </div>
              )}
              {goal.metricType === 'milestone' && (
                <div className="milestone-editor">
                  {goal.milestones.map((milestone, index) => (
                    <div className="row" key={milestone.id}>
                      <Field label={`Milestone ${index + 1}`}>
                        <input
                          maxLength={160}
                          value={milestone.title}
                          placeholder="A clear, finishable step"
                          onChange={(e) =>
                            patch({
                              milestones: goal.milestones.map((item) =>
                                item.id === milestone.id
                                  ? { ...item, title: e.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                      </Field>
                      {goal.milestones.length > 1 && (
                        <button
                          type="button"
                          className="text-button"
                          aria-label={`Remove milestone ${index + 1}`}
                          onClick={() =>
                            patch({
                              milestones: goal.milestones.filter(
                                (item) => item.id !== milestone.id,
                              ),
                              target: goal.milestones.length - 1,
                            })
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-button"
                    disabled={goal.milestones.length >= 30}
                    onClick={() =>
                      patch({
                        milestones: [...goal.milestones, { id: uid('step'), title: '' }],
                        target: goal.milestones.length + 1,
                      })
                    }
                  >
                    + Add a milestone
                  </button>
                </div>
              )}
              <div className="form-grid">
                <Field label="Check-in days per week">
                  <select
                    value={goal.weeklyTarget}
                    onChange={(e) => patch({ weeklyTarget: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <option key={day} value={day}>
                        {day} {day === 1 ? 'day' : 'days'} a week
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Target date">
                  <input
                    type="date"
                    min={goal.startDate}
                    value={goal.targetDate}
                    onChange={(e) => patch({ targetDate: e.target.value })}
                  />
                </Field>
              </div>
              {coaching(goal)
                .slice(0, 2)
                .map((tip) => (
                  <CoachNote key={tip.title} title={tip.title} attention={tip.tone === 'attention'}>
                    {tip.text}
                  </CoachNote>
                ))}
            </>
          )}
          {step === 2 && (
            <>
              <h2>What will help you start?</h2>
              <p className="muted">Choose a next step and a fallback for difficult days.</p>
              <Field label="What might get in the way? (optional)">
                <input
                  maxLength={500}
                  value={goal.obstacle}
                  onChange={(e) => patch({ obstacle: e.target.value })}
                  placeholder="e.g. Busy evenings, low energy, not knowing where to start"
                />
              </Field>
              <Field label="When that happens, I will… (optional)">
                <input
                  maxLength={500}
                  value={goal.plan}
                  onChange={(e) => patch({ plan: e.target.value })}
                  placeholder="e.g. Do a 5-minute version before lunch"
                />
              </Field>
              <Field
                label="My smallest next step"
                hint="An action you can do on an ordinary day. Add a time or cue."
              >
                <textarea
                  rows={3}
                  maxLength={300}
                  value={goal.smallStep}
                  onChange={(e) => patch({ smallStep: e.target.value })}
                  placeholder="After my morning coffee, I will read 10 pages."
                />
              </Field>
              {coaching(goal)
                .slice(-2)
                .map((tip) => (
                  <CoachNote key={tip.title} title={tip.title} attention={tip.tone === 'attention'}>
                    {tip.text}
                  </CoachNote>
                ))}
            </>
          )}
          {step === 3 && (
            <>
              <div className="review-heading">
                <h2>{goal.title}</h2>
                <p>{goal.why}</p>
              </div>
              <div className="goal-plan">
                <div>
                  <small>Target</small>
                  <strong>
                    {goal.target.toLocaleString()} {goal.unit}
                  </strong>
                </div>
                <div>
                  <small>Cadence</small>
                  <strong>{goal.weeklyTarget} days a week</strong>
                </div>
                <div>
                  <small>Target date</small>
                  <strong>
                    {formatDate(goal.targetDate, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </strong>
                </div>
              </div>
              <div className="next-step">
                <div>
                  <small>Your next small step</small>
                  <p>{goal.smallStep}</p>
                </div>
              </div>
              {goal.milestones.length > 0 && goal.metricType === 'milestone' && (
                <ul className="review-milestones">
                  {goal.milestones.map((item) => (
                    <li key={item.id}>{item.title}</li>
                  ))}
                </ul>
              )}
              {coaching(goal)
                .filter((tip) => tip.tone === 'attention')
                .map((tip) => (
                  <CoachNote key={tip.title} title={tip.title} attention>
                    {tip.text}
                  </CoachNote>
                ))}
              <p className="muted small">You can edit the plan after creating your goal.</p>
            </>
          )}
        </div>
        <ErrorMessage error={error} />
        <footer className="modal-footer">
          <button
            type="button"
            className="button secondary"
            onClick={() => (step ? setStep(step - 1) : onClose())}
            disabled={busy}
          >
            {step > 0 && <ArrowLeft size={16} />}
            {step ? 'Back' : 'Cancel'}
          </button>
          <span className="small muted">Step {step + 1} of 4</span>
          <button className="button primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : step === 3 ? 'Start my goal' : 'Continue'}
            {step === 3 ? <Flag size={17} /> : <ArrowRight size={17} />}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
