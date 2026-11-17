import { useState } from 'react';
import type { Entry, Goal } from '@membrant/core';

/** A person's past words, stable through foreground refreshes and new check-ins. */
export function useJournalMemory(entries: Entry[], goals: Goal[], date: string) {
  const goalIds = new Set(goals.map((goal) => goal.id));
  const notes = entries.filter(
    (entry) => entry.date < date && entry.note.trim() && goalIds.has(entry.goalId),
  );
  const [selectedId, setSelectedId] = useState(
    () => notes[Math.floor(Math.random() * notes.length)]?.id,
  );
  const selected = notes.find((entry) => entry.id === selectedId) ?? notes[0];
  const goal = goals.find((item) => item.id === selected?.goalId);
  const another = () => {
    const remaining = notes.filter((entry) => entry.id !== selected?.id);
    if (remaining.length) setSelectedId(remaining[Math.floor(Math.random() * remaining.length)].id);
  };
  return { selected, goal, count: notes.length, another };
}
