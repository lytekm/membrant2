import { useState } from 'react';
import { Plus, MagnifyingGlass } from '@phosphor-icons/react';
import { progress } from '@membrant/core';
import { useMembrant } from '@membrant/client';
import { EmptyState, PageHeader, type GoalActions } from '../../components/ui';
import { GoalCard } from './GoalCard';

export function GoalsPage(actions: GoalActions) {
  const { state } = useMembrant();
  const [filter, setFilter] = useState('Active');
  const [search, setSearch] = useState('');
  if (!state) return null;
  const goals = state.goals.filter((goal) => {
    const complete = progress(goal, state.entries).complete;
    return (
      goal.title.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'All' ||
        (filter === 'Completed'
          ? complete && goal.status !== 'archived'
          : filter === 'Active'
            ? goal.status === 'active' && !complete
            : goal.status === filter.toLowerCase()))
    );
  });
  return (
    <>
      <PageHeader
        title="My goals"
        description="Your reasons, plans and progress."
        action={
          <button className="button primary" onClick={() => actions.onCreate()}>
            <Plus size={18} />
            Create a goal
          </button>
        }
      />
      <div className="filter-row">
        <div className="tabs" aria-label="Filter goals">
          {['Active', 'Paused', 'Completed', 'Archived', 'All'].map((tab) => (
            <button
              key={tab}
              aria-pressed={filter === tab}
              className={filter === tab ? 'selected' : ''}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <label className="search-input">
          <MagnifyingGlass size={18} />
          <input
            aria-label="Search goals"
            placeholder="Find a goal…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {goals.length ? (
        <div className="goal-grid">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} state={state} {...actions} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={search ? 'No matching goals' : `No ${filter.toLowerCase()} goals`}
          text={
            search
              ? 'Try a different search or filter.'
              : 'Create a goal or choose another view to see your existing goals.'
          }
          action={() => actions.onCreate()}
        />
      )}
    </>
  );
}
