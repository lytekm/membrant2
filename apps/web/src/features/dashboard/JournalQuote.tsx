import { useId, useState } from 'react';
import { ArrowClockwise, ArrowRight, ArrowUpRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { formatDate, type Entry, type Goal } from '@membrant/core';
import { useJournalMemory } from '@membrant/client';
import type { GoalActions } from '../../components/ui';

type JournalQuoteProps = Pick<GoalActions, 'onOpen'> & {
  entries: Entry[];
  goals: Goal[];
  date: string;
};

export function JournalQuote({ entries, goals, date, onOpen }: JournalQuoteProps) {
  const headingId = useId();
  const quoteId = useId();
  const { selected, goal, count, another: selectAnother } = useJournalMemory(entries, goals, date);
  const [expanded, setExpanded] = useState(false);
  const longNote = !!selected && selected.note.trim().length > 260;
  const excerpt = selected?.note
    .trim()
    .slice(0, 260)
    .replace(/\s+\S*$/, '');

  const another = () => {
    selectAnother();
    setExpanded(false);
  };

  return (
    <aside className="journal-memory" aria-labelledby={headingId}>
      <div className="journal-memory-heading">
        <span className="journal-memory-thread" aria-hidden="true" />
        <h2 id={headingId}>From your journal</h2>
      </div>
      {selected && goal ? (
        <>
          <div className="journal-memory-content" aria-live="polite" aria-atomic="true">
            <p className="journal-memory-date">
              You wrote on{' '}
              <time dateTime={selected.date}>
                {formatDate(selected.date, {
                  month: 'long',
                  day: 'numeric',
                  ...(selected.date.slice(0, 4) !== date.slice(0, 4) ? { year: 'numeric' } : {}),
                })}
              </time>
            </p>
            <blockquote id={quoteId}>
              <p>“{longNote && !expanded ? `${excerpt}…` : selected.note.trim()}”</p>
            </blockquote>
            {longNote && (
              <button
                className="journal-link journal-expand"
                aria-expanded={expanded}
                aria-controls={quoteId}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Show less' : 'Read full reflection'}
              </button>
            )}
            <button className="journal-memory-source" onClick={() => onOpen(goal)}>
              {goal.title} <ArrowUpRight size={14} aria-hidden="true" />
            </button>
          </div>
          {count > 1 && (
            <button className="journal-link journal-another" onClick={another}>
              <ArrowClockwise size={15} aria-hidden="true" /> Another reflection
            </button>
          )}
        </>
      ) : (
        <div className="journal-memory-empty">
          <h3>A place for your own words.</h3>
          <p>
            Add a reflection to a check-in. On a future day, a few words from that moment will find
            their way here.
          </p>
        </div>
      )}
      <Link to="/reflections" className="journal-link journal-notebook-link">
        Open reflections <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </aside>
  );
}
