import { useState } from 'react';
import { Text, View } from 'react-native';
import { formatDate, paceHint, progress, type Goal } from '@membrant/core';
import { message, useMembrant } from '@membrant/client';
import { Button, Section, ErrorBox, Progress, Sheet, useTheme } from '../../components/ui';

export function GoalSheet({
  goal,
  onClose,
  onLog,
}: {
  goal: Goal;
  onClose(): void;
  onLog(goal: Goal): void;
}) {
  const { state, dispatch, busy } = useMembrant();
  const { s } = useTheme();
  const [error, setError] = useState<string | null>(null);
  if (!state) return null;
  const current = progress(goal, state.entries);
  const entries = state.entries
    .filter((entry) => entry.goalId === goal.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const run = (action: () => Promise<void>) => {
    setError(null);
    void action().catch((cause: unknown) => setError(message(cause)));
  };
  return (
    <Sheet title="Your goal" onClose={onClose}>
      <Text style={s.title}>{goal.title}</Text>
      <View style={s.between}>
        <Text style={s.muted}>
          {current.value} / {goal.target} {goal.unit}
        </Text>
        <Text style={s.link}>{current.percent}%</Text>
      </View>
      <Progress value={current.percent} />
      <Section>
        <Text style={s.heading}>Why it matters</Text>
        <Text style={s.quote}>{goal.why}</Text>
        <Text style={s.small}>{paceHint(goal, state.entries)}</Text>
      </Section>
      <View style={{ gap: 8 }}>
        <Text style={s.heading}>Next step</Text>
        <Text style={s.body}>{goal.smallStep}</Text>
        {goal.plan ? <Text style={s.muted}>When life gets in the way: {goal.plan}</Text> : null}
      </View>
      {goal.status === 'active' && !current.complete && (
        <Button label="Check in" onPress={() => onLog(goal)} icon="add" />
      )}
      <Button
        secondary
        disabled={busy}
        label={goal.status === 'active' ? 'Pause this goal' : 'Resume this goal'}
        onPress={() =>
          run(() =>
            dispatch({
              type: 'goal.status',
              goalId: goal.id,
              status: goal.status === 'active' ? 'paused' : 'active',
            }),
          )
        }
      />
      <ErrorBox message={error} />
      <Text style={s.heading}>Recent check-ins</Text>
      {entries.slice(0, 20).map((entry) => (
        <View key={entry.id} style={[s.thread, { paddingBottom: 12 }]}>
          <View style={s.between}>
            <Text style={[s.body, { flex: 1 }]}>
              {goal.metricType === 'habit'
                ? 'Checked in'
                : goal.metricType === 'milestone'
                  ? goal.milestones.find((item) => item.id === entry.milestoneId)?.title
                  : `${entry.value} ${goal.unit}`}
            </Text>
            <Text style={s.small}>{formatDate(entry.date)}</Text>
          </View>
          {entry.note ? (
            <Text style={[s.quote, { fontSize: 18, lineHeight: 29 }]}>{entry.note}</Text>
          ) : null}
          <View style={{ alignSelf: 'flex-start' }}>
            <Button
              secondary
              label="Undo check-in"
              disabled={busy}
              icon="arrow-undo-outline"
              onPress={() => run(() => dispatch({ type: 'entry.delete', entryId: entry.id }))}
            />
          </View>
        </View>
      ))}
      {!entries.length && <Text style={s.muted}>Your first check-in will appear here.</Text>}
      <Text style={s.small}>
        Started {formatDate(goal.startDate)} · Target {formatDate(goal.targetDate)}
        {'\n'}Edit the full plan in your web workspace.
      </Text>
    </Sheet>
  );
}
