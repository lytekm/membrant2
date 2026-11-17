import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { addDays, formatDate, weekStart, type Entry } from '@membrant/core';
import { useTheme } from './ui';

export function WeekTrail({ entries, date }: { entries: Entry[]; date: string }) {
  const { colors, s } = useTheme();
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(weekStart(date), index);
    return { date: day, count: entries.filter((entry) => entry.date === day).length };
  });
  return (
    <View
      accessibilityLabel={days
        .map(
          (day) =>
            `${formatDate(day.date)}: ${day.date > date ? 'upcoming' : `${day.count} check-ins`}`,
        )
        .join('; ')}
      accessible
      style={{ flexDirection: 'row', gap: 6 }}
    >
      {days.map((day) => (
        <View key={day.date} style={{ width: 22, gap: 8, alignItems: 'center' }}>
          <View
            style={{
              width: 19,
              height: 19,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: day.count
                ? colors.accent
                : day.date > date
                  ? colors.border
                  : colors.controlBorder,
              backgroundColor: day.count ? colors.accent : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {day.count > 0 && <Ionicons name="checkmark" size={12} color={colors.onAccent} />}
          </View>
          <Text style={[s.small, { fontSize: 10, fontWeight: day.date === date ? '700' : '400' }]}>
            {formatDate(day.date, { weekday: 'narrow' })}
          </Text>
        </View>
      ))}
    </View>
  );
}
