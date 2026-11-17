import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatDate, progress, today, weekStart, type Goal } from '@membrant/core';
import { useMembrant } from '@membrant/client';
import { Button, useTheme } from '../../components/ui';
import { WeekTrail } from '../../components/WeekTrail';
import { JournalMemory } from './JournalMemory';

export function TodayScreen({
  onCheckIn,
  onCreate,
  onAccount,
  onOpen,
}: {
  onCheckIn(goal: Goal): void;
  onCreate(): void;
  onAccount(): void;
  onOpen(goal: Goal): void;
}) {
  const { state, mode } = useMembrant();
  const { s, colors } = useTheme();
  if (!state) return null;
  const date = today();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const active = state.goals.filter(
    (goal) => goal.status === 'active' && !progress(goal, state.entries).complete,
  );
  return (
    <>
      <View style={{ gap: 16 }}>
        <Text style={s.muted}>
          {formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <Text accessibilityRole="header" style={s.title}>
          {greeting}, {state.profile.name.split(' ')[0]}.
        </Text>
      </View>
      <View style={{ alignSelf: 'flex-start' }}>
        <Button label="Create a goal" icon="add" onPress={onCreate} />
      </View>
      {mode === 'demo' && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Connect your account"
          onPress={onAccount}
          style={{ minHeight: 44, justifyContent: 'center', gap: 4 }}
        >
          <Text style={s.small}>Demo workspace · Example goals and reflections</Text>
          <Text style={s.muted}>Make it yours ↗</Text>
        </Pressable>
      )}
      <View style={{ gap: 6 }}>
        <Text accessibilityRole="header" style={s.heading}>
          Your goals
        </Text>
        <Text style={s.small}>
          Week of {formatDate(weekStart(date), { month: 'long', day: 'numeric' })}
        </Text>
      </View>
      <View>
        {active.map((goal) => {
          const entries = state.entries.filter(
            (entry) =>
              entry.goalId === goal.id && entry.date >= weekStart(date) && entry.date <= date,
          );
          const logged = entries.some((entry) => entry.date === date);
          return (
            <View key={goal.id} style={s.goalRow} testID={`today-goal-${goal.id}`}>
              <View style={[s.between, { flexWrap: 'wrap' }]}>
                <Text style={s.small}>{goal.category}</Text>
                {logged && (
                  <Text style={[s.small, { color: colors.accent }]}>✓ Checked in today</Text>
                )}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${goal.title}`}
                onPress={() => onOpen(goal)}
                style={[s.between, { minHeight: 44 }]}
              >
                <Text style={[s.heading, { flex: 1, lineHeight: 28 }]}>{goal.title}</Text>
                <Ionicons
                  name="arrow-up-outline"
                  style={{ transform: [{ rotate: '45deg' }] }}
                  size={17}
                  color={colors.muted}
                />
              </Pressable>
              <Text style={s.muted}>{goal.why}</Text>
              <WeekTrail entries={entries} date={date} />
              <View style={[s.between, { flexWrap: 'wrap' }]}>
                <Text style={s.small}>
                  {entries.length} {entries.length === 1 ? 'check-in' : 'check-ins'} this week
                </Text>
                <Button secondary icon="add" label="Check in" onPress={() => onCheckIn(goal)} />
              </View>
            </View>
          );
        })}
        {!active.length && (
          <View style={s.goalRow}>
            <Text style={s.heading}>No active goals</Text>
            <Text style={s.muted}>Create a goal and choose a reason that matters to you.</Text>
          </View>
        )}
      </View>
      <JournalMemory state={state} date={date} onOpen={onOpen} />
    </>
  );
}
