import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  addDays,
  categories,
  coaching,
  goalSchema,
  newGoal,
  templates,
  today,
  uid,
  type Goal,
  type GoalTemplate,
} from '@membrant/core';
import { message, useMembrant } from '@membrant/client';
import { Button, Section, Chip, ErrorBox, Field, Sheet, useTheme } from '../../components/ui';

export function CreateGoalSheet({ onClose }: { onClose(): void }) {
  const { dispatch, busy } = useMembrant();
  const { s, colors } = useTheme();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(() => newGoal());
  const [weeks, setWeeks] = useState('4');
  const [milestones, setMilestones] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const patch = (value: Partial<Goal>) => setGoal((current) => ({ ...current, ...value }));
  const useTemplate = (template: GoalTemplate) => {
    setGoal(newGoal(template));
    setWeeks(String(template.weeks));
    setMilestones(template.milestones?.join('\n') ?? '');
  };
  const next = async () => {
    setError(null);
    if (step === 0) {
      if (goal.title.trim().length < 3 || goal.why.trim().length < 3) {
        setError('Add a specific goal and a reason that matters to you.');
        return;
      }
      setStep(1);
      return;
    }
    const nextGoal = {
      ...goal,
      targetDate: addDays(today(), Number(weeks) * 7),
      ...(goal.metricType === 'milestone'
        ? {
            milestones: milestones
              .split('\n')
              .map((title) => title.trim())
              .filter(Boolean)
              .map((title) => ({ id: uid('step'), title })),
            target: milestones.split('\n').filter((line) => line.trim()).length,
          }
        : {}),
    };
    if (!Number.isInteger(Number(weeks)) || Number(weeks) < 1 || Number(weeks) > 520) {
      setError('Choose a timeline between 1 and 520 weeks.');
      return;
    }
    if (step === 1) {
      const parsed = goalSchema.safeParse({
        ...nextGoal,
        smallStep: nextGoal.smallStep || 'Choose a small step',
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0].message);
        return;
      }
      setGoal(nextGoal);
      setStep(2);
      return;
    }
    const parsed = goalSchema.safeParse(nextGoal);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    try {
      await dispatch({ type: 'goal.create', goal: parsed.data });
      onClose();
    } catch (cause) {
      setError(message(cause));
    }
  };
  return (
    <Sheet
      title="Create a goal"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <Text style={s.small}>
        {step + 1} / 3 · {['Direction', 'Measurement', 'Plan'][step]}
      </Text>
      {step === 0 && (
        <>
          <Text style={s.title}>What are you moving toward?</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showTemplates }}
            onPress={() => setShowTemplates(!showTemplates)}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={s.muted}>{showTemplates ? 'Hide templates' : 'Choose a template'}</Text>
          </Pressable>
          {showTemplates && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {templates.map((template) => (
                <Chip
                  key={template.id}
                  label={template.title}
                  onPress={() => useTemplate(template)}
                />
              ))}
            </View>
          )}
          <Field
            label="My goal"
            placeholder="e.g. Read 300 pages"
            value={goal.title}
            onChangeText={(title) => patch({ title })}
            maxLength={100}
          />
          <Field
            label="Why does this matter?"
            placeholder="I want to make more space for…"
            value={goal.why}
            onChangeText={(why) => patch({ why })}
            multiline
            writing
            maxLength={1000}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showCategory }}
            onPress={() => setShowCategory(!showCategory)}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={s.muted}>Area of life · {goal.category}</Text>
          </Pressable>
          {showCategory && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {categories.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  selected={goal.category === category}
                  onPress={() => patch({ category })}
                />
              ))}
            </View>
          )}
        </>
      )}
      {step === 1 && (
        <>
          <Text style={s.title}>How will you measure it?</Text>
          <Text style={s.muted}>Choose a measure, target and timeline.</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(
              [
                { id: 'habit', label: 'Days I show up', unit: 'days', target: 12 },
                { id: 'count', label: 'A number', unit: 'minutes', target: 100 },
                { id: 'percent', label: 'Percentage', unit: '%', target: 100 },
                { id: 'milestone', label: 'Milestones', unit: 'steps', target: 1 },
              ] as const
            ).map((metric) => (
              <Chip
                key={metric.id}
                label={metric.label}
                selected={goal.metricType === metric.id}
                onPress={() =>
                  patch({
                    metricType: metric.id,
                    unit: metric.unit,
                    target: metric.target,
                    baseline: 0,
                    intent:
                      metric.id === 'habit'
                        ? 'Build a habit'
                        : metric.id === 'milestone'
                          ? 'Create something'
                          : 'Reach a target',
                  })
                }
              />
            ))}
          </View>
          {goal.metricType === 'milestone' ? (
            <Field
              label="Milestones (one per line)"
              hint="Keep each step clear and finishable."
              multiline
              value={milestones}
              onChangeText={setMilestones}
              maxLength={4800}
            />
          ) : goal.metricType !== 'percent' ? (
            <>
              <Field
                label="Target"
                keyboardType="decimal-pad"
                value={String(goal.target || '')}
                onChangeText={(value) => patch({ target: Number(value) })}
              />
              {goal.metricType === 'count' && (
                <Field
                  label="Unit"
                  placeholder="minutes, pages, dollars…"
                  value={goal.unit}
                  onChangeText={(unit) => patch({ unit })}
                  maxLength={30}
                />
              )}
            </>
          ) : (
            <Text style={s.muted}>Track your progress from 0 to 100%.</Text>
          )}
          <Field
            label="Days per week"
            keyboardType="number-pad"
            value={String(goal.weeklyTarget || '')}
            onChangeText={(value) => patch({ weeklyTarget: Number(value) })}
            hint="1 to 7 check-in days each week."
          />
          <Field
            label="Timeline in weeks"
            keyboardType="number-pad"
            value={weeks}
            onChangeText={setWeeks}
          />
        </>
      )}
      {step === 2 && (
        <>
          <Text style={s.title}>What will help you start?</Text>
          <Section>
            <Text style={s.heading}>{goal.title}</Text>
            <Text style={s.muted}>
              {goal.target} {goal.unit} · {goal.weeklyTarget} days a week · {weeks} weeks
            </Text>
            <Text style={s.body}>{goal.why}</Text>
          </Section>
          <Field
            label="My next small step"
            placeholder="After my morning coffee, I'll…"
            value={goal.smallStep}
            onChangeText={(smallStep) => patch({ smallStep })}
            multiline
            maxLength={300}
          />
          <Field
            label="What might get in the way? (optional)"
            placeholder="Busy evenings, low energy…"
            value={goal.obstacle}
            onChangeText={(obstacle) => patch({ obstacle })}
            maxLength={500}
          />
          <Field
            label="When that happens, I will… (optional)"
            value={goal.plan}
            onChangeText={(plan) => patch({ plan })}
            maxLength={500}
          />
          {coaching(goal)
            .slice(0, 2)
            .map((tip) => (
              <View
                key={tip.title}
                style={{
                  paddingLeft: 16,
                  borderLeftWidth: 1,
                  borderLeftColor: colors.brand,
                  gap: 6,
                }}
              >
                <Text style={s.label}>{tip.title}</Text>
                <Text style={s.muted}>{tip.text}</Text>
              </View>
            ))}
        </>
      )}
      <ErrorBox message={error} />
      <Button
        label={busy ? 'Saving…' : step === 2 ? 'Start my goal' : 'Continue'}
        disabled={busy}
        onPress={() => void next()}
      />
      {step > 0 && (
        <Button secondary label="Back" disabled={busy} onPress={() => setStep(step - 1)} />
      )}
    </Sheet>
  );
}
