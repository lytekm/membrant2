import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { activity, badges, formatDate, stats, today, uid, weekStart } from '@membrant/core';
import { message, useMembrant } from '@membrant/client';
import { Button, Section, ErrorBox, Field, Progress, useTheme } from '../../components/ui';

export function JourneyScreen() {
  const { state, dispatch, busy } = useMembrant();
  const { s, colors } = useTheme();
  const existing = state?.reviews.find((review) => weekStart(review.date) === weekStart());
  const [wins, setWins] = useState(existing?.wins ?? '');
  const [nextStep, setNextStep] = useState(existing?.nextStep ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  if (!state) return null;
  const summary = stats(state);
  const save = async () => {
    setError(null);
    setSaved(false);
    try {
      await dispatch({
        type: 'review.save',
        review: {
          id: existing?.id ?? uid('review'),
          date: today(),
          wins,
          challenge: existing?.challenge ?? '',
          nextStep,
        },
      });
      setSaved(true);
    } catch (cause) {
      setError(message(cause));
    }
  };
  return (
    <>
      <Text accessibilityRole="header" style={s.title}>
        Your journey
      </Text>
      <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }]}>
        {[
          { value: state.entries.length, label: 'Check-ins' },
          { value: summary.days, label: 'Days' },
          { value: summary.completed, label: 'Goals completed' },
        ].map((stat) => (
          <View key={stat.label} style={{ gap: 6 }}>
            <Text style={[s.title, { fontSize: 28 }]}>{stat.value}</Text>
            <Text style={s.small}>{stat.label}</Text>
          </View>
        ))}
      </View>
      <Section>
        <Text accessibilityRole="header" style={s.heading}>
          Last seven days
        </Text>
        <View style={[s.between, { gap: 4 }]}>
          {activity(state.entries).map((day) => (
            <View
              key={day.date}
              accessible
              accessibilityLabel={`${formatDate(day.date)}: ${day.count} check-ins`}
              style={{ alignItems: 'center', gap: 12, flex: 1 }}
            >
              <Text style={[s.body, { color: day.count ? colors.accent : colors.muted }]}>
                {day.count}
              </Text>
              <View
                style={{
                  height: 3,
                  width: '80%',
                  backgroundColor: day.count ? colors.accent : colors.border,
                }}
              />
              <Text style={s.small}>{formatDate(day.date, { weekday: 'narrow' })}</Text>
            </View>
          ))}
        </View>
      </Section>
      <Section>
        <Text accessibilityRole="header" style={s.heading}>
          Milestones
        </Text>
        {badges(state).map((badge) => (
          <View
            key={badge.id}
            style={[s.thread, { flexDirection: 'row', alignItems: 'center', gap: 16 }]}
          >
            <Ionicons
              name={badge.earned ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={badge.earned ? colors.accent : colors.controlBorder}
            />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.body}>{badge.title}</Text>
              <Text style={s.small}>
                {badge.description} · {badge.earned ? 'Earned' : 'Not yet earned'}
              </Text>
            </View>
          </View>
        ))}
      </Section>
      <Section>
        <Text accessibilityRole="header" style={s.heading}>
          This week’s reflection
        </Text>
        <Text style={s.small}>Week of {formatDate(weekStart())}</Text>
        <Field
          label="What went well?"
          multiline
          writing
          value={wins}
          maxLength={2000}
          onChangeText={(value) => {
            setWins(value);
            setSaved(false);
          }}
          placeholder="I noticed…"
        />
        <Field
          label="One thing I’ll try next week"
          multiline
          writing
          value={nextStep}
          maxLength={2000}
          onChangeText={(value) => {
            setNextStep(value);
            setSaved(false);
          }}
          placeholder="Next week, I’ll…"
        />
        <ErrorBox message={error} />
        <Button
          label={busy ? 'Saving…' : existing ? 'Update reflection' : 'Save reflection'}
          disabled={busy}
          onPress={() => void save()}
        />
        {saved && (
          <Text accessibilityLiveRegion="polite" style={{ color: colors.success }}>
            Reflection saved.
          </Text>
        )}
      </Section>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: showRewards }}
        onPress={() => setShowRewards(!showRewards)}
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        <Text style={s.muted}>Experience and streaks {showRewards ? '−' : '+'}</Text>
      </Pressable>
      {showRewards && (
        <Section>
          <Text style={s.body}>
            Level {summary.level} · {summary.xp} XP · {summary.streak} day streak
          </Text>
          <Progress value={summary.levelProgress / 3} />
          <Text style={s.small}>
            {summary.levelProgress} / 300 XP toward level {summary.level + 1}
          </Text>
        </Section>
      )}
    </>
  );
}
