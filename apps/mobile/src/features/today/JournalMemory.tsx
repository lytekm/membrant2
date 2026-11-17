import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useJournalMemory } from '@membrant/client';
import { formatDate, type AppState, type Goal } from '@membrant/core';
import { useTheme } from '../../components/ui';

export function JournalMemory({
  state,
  date,
  onOpen,
}: {
  state: AppState;
  date: string;
  onOpen(goal: Goal): void;
}) {
  const { s, colors } = useTheme();
  const { selected, goal, count, another } = useJournalMemory(state.entries, state.goals, date);
  const [expanded, setExpanded] = useState(false);
  const note = selected?.note.trim() ?? '';
  const long = note.length > 260;
  return (
    <View style={{ gap: 24, paddingVertical: 20 }}>
      <Text accessibilityRole="header" style={s.heading}>
        From your journal
      </Text>
      {selected && goal ? (
        <>
          <View style={s.thread} accessibilityLiveRegion="polite">
            <Text style={s.small}>
              You wrote on{' '}
              {formatDate(selected.date, { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
            <Text style={s.quote}>
              “{long && !expanded ? `${note.slice(0, 260).replace(/\s+\S*$/, '')}…` : note}”
            </Text>
            {long && (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setExpanded(!expanded)}
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <Text style={s.link}>{expanded ? 'Show less' : 'Read full reflection'}</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${goal.title}`}
              onPress={() => onOpen(goal)}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={s.muted}>{goal.title} ↗</Text>
            </Pressable>
          </View>
          {count > 1 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Another reflection"
              onPress={() => {
                another();
                setExpanded(false);
              }}
              style={[s.row, { minHeight: 44, paddingLeft: 20 }]}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.muted} />
              <Text style={s.muted}>Another reflection</Text>
            </Pressable>
          )}
        </>
      ) : (
        <Text style={s.muted}>
          Add a reflection to a check-in. You can revisit it here on a future day.
        </Text>
      )}
    </View>
  );
}
