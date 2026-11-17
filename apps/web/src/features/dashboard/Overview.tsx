import { ArrowRight, ArrowUpRight, Plus } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { formatDate, progress, today, weekStart } from '@membrant/core';
import { useMembrant } from '@membrant/client';
import type { GoalActions } from '../../components/ui';
import { GoalFocusRow } from './GoalFocusRow';
import { JournalQuote } from './JournalQuote';
import './dashboard.css';

export function Overview(actions: GoalActions) {
  const { state, mode } = useMembrant();
  if (!state) return null;

  const date = today();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const active = state.goals.filter(
    (goal) => goal.status === 'active' && !progress(goal, state.entries).complete,
  );

  return (
    <div className="journal-dashboard">
      <header className="page-heading journal-heading">
        <div>
          <p className="journal-date">
            <time dateTime={date}>
              {formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}
            </time>
          </p>
          <h1>
            {greeting}, {state.profile.name.split(' ')[0]}.
          </h1>
        </div>
        <button className="button primary journal-create" onClick={() => actions.onCreate()}>
          <Plus size={18} aria-hidden="true" />
          Create a goal
        </button>
      </header>

      {mode === 'demo' && (
        <div className="journal-demo">
          <span>
            Demo workspace <span aria-hidden="true">·</span> Example goals and reflections
          </span>
          <Link to="/settings">
            Make it yours <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      )}

      <div className="journal-layout">
        <section className="journal-goals" aria-labelledby="journal-goals-heading">
          <header className="journal-section-heading">
            <div>
              <h2 id="journal-goals-heading">Your goals</h2>
              <p>Week of {formatDate(weekStart(date), { month: 'long', day: 'numeric' })}</p>
            </div>
            <Link className="journal-link" to="/goals">
              All goals <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </header>

          {active.length ? (
            <div className="goal-focus-list">
              {active.map((goal) => (
                <GoalFocusRow
                  key={goal.id}
                  goal={goal}
                  entries={state.entries}
                  date={date}
                  onOpen={actions.onOpen}
                  onLog={actions.onLog}
                />
              ))}
            </div>
          ) : (
            <div className="journal-empty">
              <span className="journal-empty-thread" aria-hidden="true" />
              <h3>
                {state.goals.length
                  ? 'Room for your next goal.'
                  : 'What would you like to make time for?'}
              </h3>
              <p>
                {state.goals.length
                  ? 'Your completed and paused goals are in My goals. Start something new when you’re ready.'
                  : 'Create a goal, give it a reason, and choose a small first step.'}
              </p>
            </div>
          )}
        </section>

        <JournalQuote
          entries={state.entries}
          goals={state.goals}
          date={date}
          onOpen={actions.onOpen}
        />
      </div>
    </div>
  );
}
