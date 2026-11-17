import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { goalStatus, progress, type Goal } from '@membrant/core';
import { useMembrant } from '@membrant/client';
import { Button, Chip, Progress, useTheme } from '../../components/ui';

export function GoalsScreen({ onCreate, onOpen }: { onCreate(): void; onOpen(goal: Goal): void }) {
  const { state } = useMembrant();
  const { s, colors } = useTheme();
  const [filter, setFilter] = useState('Active');
  if (!state) return null;
  const goals = state.goals.filter(
    (goal) =>
      filter === 'All' ||
      (filter === 'Completed'
        ? progress(goal, state.entries).complete && goal.status !== 'archived'
        : goal.status === 'active' && !progress(goal, state.entries).complete),
  );
  return (
    <>
      <Text accessibilityRole="header" style={s.title}>
        My goals
      </Text>
      <View style={{ alignSelf: 'flex-start' }}>
        <Button label="Create a goal" icon="add" onPress={onCreate} />
      </View>
      <View style={s.row}>
        {['Active', 'Completed', 'All'].map((label) => (
          <Chip
            key={label}
            label={label}
            selected={filter === label}
            onPress={() => setFilter(label)}
          />
        ))}
      </View>
      {goals.map((goal) => {
        const current = progress(goal, state.entries);
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${goal.title}`}
            onPress={() => onOpen(goal)}
            key={goal.id}
          >
            <View style={s.goalRow}>
              <View style={s.between}>
                <Text style={s.small}>{goal.category}</Text>
                <Text style={s.small}>{goalStatus(goal, state.entries)}</Text>
              </View>
              <Text style={s.heading}>{goal.title}</Text>
              <Text style={s.muted} numberOfLines={2}>
                {goal.why}
              </Text>
              <Progress value={current.percent} />
              <View style={s.between}>
                <Text style={s.small}>
                  {current.value} / {goal.target} {goal.unit}
                </Text>
                <Ionicons name="arrow-forward" color={colors.muted} size={18} />
              </View>
            </View>
          </Pressable>
        );
      })}
      {!goals.length && (
        <View style={s.goalRow}>
          <Text style={s.heading}>No goals in this view</Text>
          <Text style={s.muted}>
            Create a goal or choose another view to see your existing goals.
          </Text>
        </View>
      )}
    </>
  );
}
