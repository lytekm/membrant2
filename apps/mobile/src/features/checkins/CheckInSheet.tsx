import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { progress, today, uid, type Goal } from '@membrant/core';
import { message, useMembrant } from '@membrant/client';
import { Button, Chip, ErrorBox, Field, Sheet, useTheme } from '../../components/ui';

export function CheckInSheet({ goal, onClose }: { goal: Goal; onClose(): void }) {
  const { state, dispatch, busy } = useMembrant();
  const { s, colors } = useTheme();
  const [value, setValue] = useState(
    goal.metricType === 'percent'
      ? String(Math.min(100, progress(goal, state!.entries).value + 10))
      : goal.metricType === 'count'
        ? ''
        : '1',
  );
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const available = goal.milestones.filter(
    (milestone) =>
      !state!.entries.some(
        (entry) => entry.goalId === goal.id && entry.milestoneId === milestone.id,
      ),
  );
  const [milestoneId, setMilestoneId] = useState(available[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [initialComplete] = useState(() => progress(goal, state!.entries).complete);
  const [initialDays] = useState(() => new Set(state!.entries.map((entry) => entry.date)).size);
  const completed = !initialComplete && progress(goal, state!.entries).complete;
  const thirtyDays =
    initialDays < 30 && new Set(state!.entries.map((entry) => entry.date)).size === 30;
  const save = async () => {
    setError(null);
    if (date > today()) {
      setError('Choose today or an earlier date.');
      return;
    }
    if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
      setError('Add a positive amount.');
      return;
    }
    try {
      await dispatch({
        type: 'entry.create',
        entry: {
          id: uid('entry'),
          goalId: goal.id,
          value: Number(value),
          date,
          note,
          createdAt: new Date().toISOString(),
          ...(goal.metricType === 'milestone' ? { milestoneId } : {}),
        },
      });
      setSaved(true);
      if (Platform.OS !== 'web')
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (cause) {
      setError(message(cause));
    }
  };
  return (
    <Sheet
      title={saved ? 'Check-in saved' : 'Check in'}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      {saved ? (
        <View style={{ gap: 24, alignItems: 'flex-start', paddingTop: 24 }}>
          <Ionicons name="checkmark-circle-outline" color={colors.accent} size={44} />
          {(completed || thirtyDays) && (
            <Text style={s.title}>
              {completed ? 'You reached your goal.' : 'Thirty days. You did it.'}
            </Text>
          )}
          <Text style={s.muted}>
            {progress(goal, state!.entries).value.toLocaleString()} / {goal.target.toLocaleString()}{' '}
            {goal.unit} recorded.
          </Text>
          <Button label="Done" onPress={onClose} />
        </View>
      ) : (
        <>
          <Text style={s.heading}>{goal.title}</Text>
          <Text style={s.muted}>{goal.smallStep}</Text>
          {(goal.metricType === 'count' || goal.metricType === 'percent') && (
            <Field
              label={
                goal.metricType === 'percent'
                  ? 'Overall progress (%)'
                  : `How many ${goal.unit} did you add?`
              }
              hint={
                goal.metricType === 'percent'
                  ? 'Set your absolute progress from 1 to 100.'
                  : 'This amount is added to your total.'
              }
              keyboardType="decimal-pad"
              value={value}
              onChangeText={setValue}
              placeholder="0"
              autoFocus
            />
          )}
          {goal.metricType === 'milestone' && (
            <View style={{ gap: 10 }}>
              <Text style={s.label}>Which step did you finish?</Text>
              {available.map((milestone) => (
                <Chip
                  key={milestone.id}
                  label={milestone.title}
                  selected={milestoneId === milestone.id}
                  onPress={() => setMilestoneId(milestone.id)}
                />
              ))}
            </View>
          )}
          <Field
            label="Check-in date"
            hint="YYYY-MM-DD. Today is filled in for you."
            value={date}
            onChangeText={setDate}
            autoCapitalize="none"
            maxLength={10}
          />
          <Field
            label="A quick reflection (optional)"
            placeholder="What would you like to remember?"
            multiline
            writing
            maxLength={2000}
            value={note}
            onChangeText={setNote}
          />
          <ErrorBox message={error} />
          <Button
            label={busy ? 'Saving…' : 'Save check-in'}
            disabled={busy}
            onPress={() => void save()}
          />
        </>
      )}
    </Sheet>
  );
}
