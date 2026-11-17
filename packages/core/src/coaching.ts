import type { Goal } from './schema';
import { addDays, daysBetween, today, uid } from './dates';

export interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  category: Goal['category'];
  intent: Goal['intent'];
  metricType: Goal['metricType'];
  target: number;
  unit: string;
  weeks: number;
  weeklyTarget: number;
  smallStep: string;
  milestones?: string[];
}

export const templates: GoalTemplate[] = [
  {
    id: 'read',
    title: 'Make room for reading',
    description: 'Read 300 pages in six weeks, with four reading days each week.',
    category: 'Learning',
    intent: 'Build a habit',
    metricType: 'count',
    target: 300,
    unit: 'pages',
    weeks: 6,
    weeklyTarget: 4,
    smallStep: 'Read 10 pages after my morning coffee.',
  },
  {
    id: 'move',
    title: 'Move a little more',
    description: 'Plan three movement sessions a week for six weeks.',
    category: 'Health',
    intent: 'Build a habit',
    metricType: 'habit',
    target: 18,
    unit: 'days',
    weeks: 6,
    weeklyTarget: 3,
    smallStep: 'Take a 15-minute walk after lunch.',
  },
  {
    id: 'ship',
    title: 'Bring an idea to life',
    description: 'Take a project from its first outline to a published version in four milestones.',
    category: 'Career',
    intent: 'Create something',
    metricType: 'milestone',
    target: 4,
    unit: 'steps',
    weeks: 4,
    weeklyTarget: 3,
    smallStep: 'Write down the one problem my project will solve.',
    milestones: [
      'Define the smallest useful version',
      'Build the core experience',
      'Get feedback from one person',
      'Publish the first version',
    ],
  },
  {
    id: 'learn',
    title: 'Learn something new',
    description: 'Track 600 minutes of practice across eight weeks.',
    category: 'Learning',
    intent: 'Learn a skill',
    metricType: 'count',
    target: 600,
    unit: 'minutes',
    weeks: 8,
    weeklyTarget: 3,
    smallStep: 'Practice one concept for 25 minutes.',
  },
  {
    id: 'save',
    title: 'Build a little breathing room',
    description: 'Set a savings target and record weekly contributions.',
    category: 'Finance',
    intent: 'Reach a target',
    metricType: 'count',
    target: 500,
    unit: 'dollars',
    weeks: 12,
    weeklyTarget: 1,
    smallStep: 'Set aside a small amount after payday.',
  },
  {
    id: 'reset',
    title: 'A moment for yourself',
    description: 'Write a short reflection on five days each week.',
    category: 'Personal',
    intent: 'Build a habit',
    metricType: 'habit',
    target: 20,
    unit: 'days',
    weeks: 4,
    weeklyTarget: 5,
    smallStep: 'Write one sentence about my day before bed.',
  },
];

export function newGoal(template?: GoalTemplate, date = today()): Goal {
  return {
    id: uid('goal'),
    title: template?.title ?? '',
    category: template?.category ?? 'Personal',
    intent: template?.intent ?? 'Build a habit',
    metricType: template?.metricType ?? 'habit',
    unit: template?.unit ?? 'days',
    baseline: 0,
    target: template?.target ?? 12,
    weeklyTarget: template?.weeklyTarget ?? 3,
    startDate: date,
    targetDate: addDays(date, (template?.weeks ?? 4) * 7),
    why: '',
    obstacle: '',
    plan: '',
    smallStep: template?.smallStep ?? '',
    status: 'active',
    milestones: (template?.milestones ?? []).map((title) => ({ id: uid('step'), title })),
    createdAt: new Date().toISOString(),
  };
}

/** Transparent, deterministic coaching. No model, network request, or health advice. */
export function coaching(goal: Goal): { title: string; text: string; tone: 'tip' | 'attention' }[] {
  const tips: { title: string; text: string; tone: 'tip' | 'attention' }[] = [];
  const duration = daysBetween(goal.startDate, goal.targetDate);
  const weeks = Number.isFinite(duration) ? Math.max(1 / 7, (duration + 1) / 7) : 4;
  const sessions = Math.max(1, weeks * goal.weeklyTarget);
  if (goal.metricType === 'habit' && goal.target > Math.ceil(sessions)) {
    tips.push({
      title: 'Give yourself more runway',
      text: `At ${goal.weeklyTarget} days a week, plan for about ${Math.ceil(goal.target / goal.weeklyTarget)} weeks to reach ${goal.target} days. Extend the date or reduce the target.`,
      tone: 'attention',
    });
  } else if (goal.metricType === 'count') {
    tips.push({
      title: 'Make the target tangible',
      text: `That works out to about ${Math.ceil(Math.max(0, goal.target - goal.baseline) / sessions)} ${goal.unit} per check-in. Does that fit an ordinary day?`,
      tone: 'tip',
    });
  } else {
    tips.push({
      title: 'Your weekly plan',
      text: `Plan ${goal.weeklyTarget} check-in days each week. You can change the cadence later.`,
      tone: 'tip',
    });
  }
  if (goal.weeklyTarget >= 6)
    tips.push({
      title: 'Leave some breathing room',
      text: 'A daily commitment can be demanding. Three or four days a week is a strong starting point.',
      tone: 'attention',
    });
  if (/time|busy|schedule/i.test(goal.obstacle))
    tips.push({
      title: 'Attach it to something familiar',
      text: 'Try: “After my morning coffee, I’ll spend 10 minutes on my next step.” A reliable cue makes starting easier.',
      tone: 'tip',
    });
  else if (/motivat|energy|tired/i.test(goal.obstacle))
    tips.push({
      title: 'Plan a low-energy version',
      text: 'Choose a two-minute version for difficult days. Keeping the connection matters more than doing the full session.',
      tone: 'tip',
    });
  else if (goal.obstacle)
    tips.push({
      title: 'Turn the obstacle into a plan',
      text: `Finish this sentence: “If ${goal.obstacle.toLowerCase()}, then I will…” Keep the response small and specific.`,
      tone: 'tip',
    });
  if (!goal.smallStep)
    tips.push({
      title: 'Choose a first step',
      text: 'What could you do in 10 minutes? Start with an action, a time, and a place.',
      tone: 'tip',
    });
  return tips;
}
