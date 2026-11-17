import { addDays, today } from './dates';
import { newGoal, templates } from './coaching';
import { emptyState } from './reducer';
import type { AppState, Entry } from './schema';

/** Relative dates keep the explicitly labelled sample workspace useful year-round. */
export function demoState(date = today()): AppState {
  const state = emptyState('Alex');
  const start = addDays(date, -18);
  const reading = {
    ...newGoal(templates[0], start),
    id: 'demo_reading',
    title: 'Read 300 pages',
    why: 'Make more space for curiosity and less space for scrolling.',
    obstacle: 'Getting distracted by my phone',
    plan: 'Leave my phone in another room while reading.',
  };
  const movement = {
    ...newGoal(templates[1], start),
    id: 'demo_movement',
    title: 'Find my movement rhythm',
    why: 'Feel more energetic and get outside during the workday.',
  };
  const project = {
    ...newGoal(templates[2], start),
    id: 'demo_project',
    title: 'Launch my personal website',
    why: 'Have a home for the work I am proud of.',
    milestones: [
      { id: 'demo_m1', title: 'Define the smallest useful version' },
      { id: 'demo_m2', title: 'Build the core experience' },
      { id: 'demo_m3', title: 'Get feedback from one person' },
      { id: 'demo_m4', title: 'Publish the first version' },
    ],
  };
  state.goals = [reading, movement, project];
  const add = (goalId: string, daysAgo: number, value: number, note = '', milestoneId?: string) => {
    const day = addDays(date, -daysAgo);
    const entry: Entry = {
      id: `demo_entry_${state.entries.length}`,
      goalId,
      date: day,
      value,
      note,
      createdAt: `${day}T12:00:00.000Z`,
    };
    if (milestoneId) entry.milestoneId = milestoneId;
    state.entries.push(entry);
  };
  [17, 15, 13, 11, 9, 7, 6, 4, 3, 2, 1].forEach((day, index) =>
    add(
      reading.id,
      day,
      index % 3 === 0 ? 20 : 10,
      day === 1 ? 'Reading before opening my phone made it easier to focus.' : '',
    ),
  );
  [16, 13, 10, 8, 6, 4, 2, 1].forEach((day) =>
    add(movement.id, day, 1, day === 2 ? 'A short walk still counts. Glad I went.' : ''),
  );
  add(project.id, 12, 1, 'Kept the scope to a homepage and three projects.', 'demo_m1');
  add(project.id, 3, 1, 'The first version is ready for feedback.', 'demo_m2');
  return state;
}
