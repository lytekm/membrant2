import { commandSchema, goalSchema, stateSchema, type AppState, type Command } from './schema';
import { addDays, today, weekStart } from './dates';
import { progress } from './progress';

export function emptyState(name = 'Friend'): AppState {
  return { schemaVersion: 1, revision: 0, profile: { name }, goals: [], entries: [], reviews: [] };
}

/** The same validated command reducer runs in demo storage and on the API. */
export function applyCommand(state: AppState, input: Command, date = today()): AppState {
  const command = commandSchema.parse(input);
  let next: AppState = { ...state, revision: state.revision + 1 };
  const findGoal = (id: string) => {
    const goal = state.goals.find((item) => item.id === id);
    if (!goal) throw new Error('This goal no longer exists. Refresh and try again.');
    return goal;
  };
  switch (command.type) {
    case 'goal.create': {
      if (state.goals.some((goal) => goal.id === command.goal.id))
        throw new Error('This goal already exists.');
      if (command.goal.startDate > addDays(date, 1))
        throw new Error('Start your goal today or earlier.');
      next.goals = [...state.goals, command.goal];
      break;
    }
    case 'goal.update': {
      const goal = goalSchema.parse({ ...findGoal(command.goalId), ...command.patch });
      next.goals = state.goals.map((item) => (item.id === goal.id ? goal : item));
      break;
    }
    case 'goal.status':
      findGoal(command.goalId);
      next.goals = state.goals.map((goal) =>
        goal.id === command.goalId ? { ...goal, status: command.status } : goal,
      );
      break;
    case 'goal.delete':
      findGoal(command.goalId);
      next.goals = state.goals.filter((goal) => goal.id !== command.goalId);
      next.entries = state.entries.filter((entry) => entry.goalId !== command.goalId);
      break;
    case 'entry.create': {
      const entry = command.entry;
      const goal = findGoal(entry.goalId);
      const logs = state.entries.filter((item) => item.goalId === goal.id);
      if (state.entries.some((item) => item.id === entry.id))
        throw new Error('This check-in already exists.');
      if (goal.status !== 'active') throw new Error('Resume this goal before checking in.');
      if (progress(goal, logs).complete)
        throw new Error('This goal is complete. Undo a check-in to make a correction.');
      // A one-day allowance accommodates the server and device being in different timezones.
      if (entry.date > addDays(date, 1) || entry.date < goal.startDate)
        throw new Error('Choose a check-in date between the start of this goal and today.');
      if (
        goal.metricType === 'habit' &&
        (entry.value !== 1 || logs.some((item) => item.date === entry.date))
      )
        throw new Error('This habit already has a check-in for that day, or the value is not 1.');
      if (goal.metricType === 'percent' && entry.value > 100)
        throw new Error('Progress must be between 1 and 100 percent.');
      if (goal.metricType === 'milestone') {
        if (entry.value !== 1 || !goal.milestones.some((item) => item.id === entry.milestoneId))
          throw new Error('Choose a milestone from this goal.');
        if (logs.some((item) => item.milestoneId === entry.milestoneId))
          throw new Error('This milestone is already complete.');
      } else if (entry.milestoneId) throw new Error('This goal does not track milestones.');
      next.entries = [...state.entries, entry];
      break;
    }
    case 'entry.delete':
      if (!state.entries.some((entry) => entry.id === command.entryId))
        throw new Error('This check-in has already been removed.');
      next.entries = state.entries.filter((entry) => entry.id !== command.entryId);
      break;
    case 'review.save': {
      if (command.review.date > addDays(date, 1))
        throw new Error('A reflection cannot be dated in the future.');
      const week = weekStart(command.review.date);
      next.reviews = [
        ...state.reviews.filter((review) => weekStart(review.date) !== week),
        command.review,
      ];
      break;
    }
    case 'profile.update':
      next.profile = { name: command.name };
      break;
  }
  return stateSchema.parse(next);
}
