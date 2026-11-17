import { z } from 'zod';

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Choose a valid date.');
const idSchema = z.string().min(1).max(100);
export const categories = ['Health', 'Learning', 'Career', 'Personal', 'Finance'] as const;
export const intents = [
  'Build a habit',
  'Learn a skill',
  'Create something',
  'Reach a target',
] as const;
export const metricTypes = ['count', 'habit', 'percent', 'milestone'] as const;
export const milestoneSchema = z.object({ id: idSchema, title: z.string().trim().min(1).max(160) });

export const goalSchema = z
  .object({
    id: idSchema,
    title: z.string().trim().min(3, 'Give your goal a little more detail.').max(100),
    category: z.enum(categories),
    intent: z.enum(intents),
    metricType: z.enum(metricTypes),
    unit: z.string().trim().min(1).max(30),
    baseline: z.number().finite().min(0).max(1_000_000_000),
    target: z.number().finite().positive().max(1_000_000_000),
    weeklyTarget: z.number().int().min(1).max(7),
    startDate: dateSchema,
    targetDate: dateSchema,
    why: z.string().trim().min(3, 'Add a reason you can come back to.').max(1000),
    obstacle: z.string().trim().max(500),
    plan: z.string().trim().max(500),
    smallStep: z.string().trim().min(3, 'Choose a small next step.').max(300),
    status: z.enum(['active', 'paused', 'archived']),
    milestones: z.array(milestoneSchema).max(30),
    createdAt: z.string().datetime(),
  })
  .superRefine((goal, ctx) => {
    if (goal.targetDate < goal.startDate)
      ctx.addIssue({
        code: 'custom',
        path: ['targetDate'],
        message: 'The finish date must be on or after the start date.',
      });
    if (goal.target <= goal.baseline)
      ctx.addIssue({
        code: 'custom',
        path: ['target'],
        message: 'Your target must be above your starting point.',
      });
    if (goal.metricType === 'percent' && (goal.target !== 100 || goal.baseline !== 0))
      ctx.addIssue({
        code: 'custom',
        path: ['target'],
        message: 'Percentage goals run from 0 to 100.',
      });
    if (goal.metricType === 'habit' && (goal.baseline !== 0 || !Number.isInteger(goal.target)))
      ctx.addIssue({
        code: 'custom',
        path: ['target'],
        message: 'Habit goals need a whole number of days and a zero starting point.',
      });
    if (
      goal.metricType === 'milestone' &&
      (goal.milestones.length === 0 ||
        goal.target !== goal.milestones.length ||
        goal.baseline !== 0)
    )
      ctx.addIssue({
        code: 'custom',
        path: ['milestones'],
        message: 'Add at least one milestone; each milestone is one step.',
      });
    if (new Set(goal.milestones.map((m) => m.id)).size !== goal.milestones.length)
      ctx.addIssue({
        code: 'custom',
        path: ['milestones'],
        message: 'Milestone IDs must be unique.',
      });
  });

export const entrySchema = z.object({
  id: idSchema,
  goalId: idSchema,
  date: dateSchema,
  value: z.number().finite().positive().max(1_000_000_000),
  note: z.string().trim().max(2000),
  milestoneId: idSchema.optional(),
  createdAt: z.string().datetime(),
});
export const reviewSchema = z.object({
  id: idSchema,
  date: dateSchema,
  wins: z.string().trim().min(3).max(2000),
  challenge: z.string().trim().max(2000),
  nextStep: z.string().trim().min(3).max(2000),
});
export const stateSchema = z.object({
  schemaVersion: z.literal(1),
  revision: z.number().int().nonnegative(),
  profile: z.object({ name: z.string().trim().min(1).max(60) }),
  goals: z.array(goalSchema).max(500),
  entries: z.array(entrySchema).max(50_000),
  reviews: z.array(reviewSchema).max(5000),
});

export const goalPatchSchema = z
  .object({
    title: z.string().trim().min(3).max(100),
    category: z.enum(categories),
    targetDate: dateSchema,
    weeklyTarget: z.number().int().min(1).max(7),
    why: z.string().trim().min(3).max(1000),
    obstacle: z.string().trim().max(500),
    plan: z.string().trim().max(500),
    smallStep: z.string().trim().min(3).max(300),
  })
  .partial();
export const commandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('goal.create'), goal: goalSchema }),
  z.object({ type: z.literal('goal.update'), goalId: idSchema, patch: goalPatchSchema }),
  z.object({
    type: z.literal('goal.status'),
    goalId: idSchema,
    status: z.enum(['active', 'paused', 'archived']),
  }),
  z.object({ type: z.literal('goal.delete'), goalId: idSchema }),
  z.object({ type: z.literal('entry.create'), entry: entrySchema }),
  z.object({ type: z.literal('entry.delete'), entryId: idSchema }),
  z.object({ type: z.literal('review.save'), review: reviewSchema }),
  z.object({ type: z.literal('profile.update'), name: z.string().trim().min(1).max(60) }),
]);

export type Goal = z.infer<typeof goalSchema>;
export type Entry = z.infer<typeof entrySchema>;
export type Review = z.infer<typeof reviewSchema>;
export type AppState = z.infer<typeof stateSchema>;
export type Command = z.infer<typeof commandSchema>;
export type GoalPatch = z.infer<typeof goalPatchSchema>;
export type MetricType = Goal['metricType'];
