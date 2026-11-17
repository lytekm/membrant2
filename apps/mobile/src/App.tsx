import { useEffect, useState } from 'react';
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MembrantProvider, useMembrant } from '@membrant/client';
import type { Goal } from '@membrant/core';
import { apiUrl, sessionStorage, storage } from './lib/storage';
import { AppearanceProvider, Button, ErrorBox, useTheme, type IconName } from './components/ui';
import { TodayScreen } from './features/today/TodayScreen';
import { GoalsScreen } from './features/goals/GoalsScreen';
import { CreateGoalSheet } from './features/goals/CreateGoalSheet';
import { GoalSheet } from './features/goals/GoalSheet';
import { CheckInSheet } from './features/checkins/CheckInSheet';
import { JourneyScreen } from './features/journey/JourneyScreen';
import { AccountScreen } from './features/account/AccountScreen';

const tabs: { id: string; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Today', icon: 'sunny-outline' },
  { id: 'goals', label: 'Goals', icon: 'flag-outline' },
  { id: 'journey', label: 'Journey', icon: 'trending-up-outline' },
  { id: 'account', label: 'You', icon: 'person-outline' },
];

function DailyApp() {
  const { state, loading, error, refresh, clearError, mode, signOut, resetDemo } = useMembrant();
  const { s, colors, isDark } = useTheme();
  const [tab, setTab] = useState('today');
  const [creating, setCreating] = useState(false);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    const listener = AppState.addEventListener('change', (status) => {
      if (status === 'active') void refresh();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void refresh();
    }, 30_000);
    return () => {
      listener.remove();
      clearInterval(timer);
    };
  }, [refresh]);
  useEffect(() => {
    setLoggingId(null);
    setSelectedId(null);
    setCreating(false);
  }, [mode]);
  const refreshNow = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };
  const logging = state?.goals.find((goal) => goal.id === loggingId);
  const selected = state?.goals.find((goal) => goal.id === selectedId);
  const openLog = (goal: Goal) => {
    setSelectedId(null);
    setLoggingId(goal.id);
  };
  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          key={`${tab}-${mode}`}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refreshNow()}
              tintColor={colors.accent}
            />
          }
        >
          <View style={s.between}>
            <View style={s.row}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{ color: colors.brand, fontSize: 28, lineHeight: 30, fontWeight: '700' }}
                >
                  m
                </Text>
              </View>
              <Text
                style={{ color: colors.text, fontSize: 20, fontWeight: '600', letterSpacing: -0.5 }}
              >
                membrant.
              </Text>
            </View>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={s.pillText}>{state?.profile.name.slice(0, 1).toUpperCase() ?? 'M'}</Text>
            </View>
          </View>
          {error && (
            <View style={{ gap: 8 }}>
              <ErrorBox message={error} />
              <Pressable accessibilityRole="button" onPress={clearError}>
                <Text style={s.link}>Dismiss</Text>
              </Pressable>
            </View>
          )}
          {loading ? (
            <View accessibilityLabel="Loading workspace" style={{ gap: 20 }}>
              {[70, 160, 230].map((height) => (
                <View
                  key={height}
                  style={{ height, borderRadius: 16, backgroundColor: colors.border }}
                />
              ))}
            </View>
          ) : !state ? (
            <>
              <Text style={s.heading}>Workspace unavailable</Text>
              <Button label="Try again" onPress={() => void refresh()} />
              <Button
                secondary
                label={mode === 'demo' ? 'Reset demo' : 'Sign out'}
                onPress={() => {
                  if (mode === 'demo') void resetDemo();
                  else void signOut().catch(() => {});
                }}
              />
            </>
          ) : (
            <>
              {tab === 'today' && (
                <TodayScreen
                  onCheckIn={openLog}
                  onCreate={() => setCreating(true)}
                  onAccount={() => setTab('account')}
                  onOpen={(goal) => setSelectedId(goal.id)}
                />
              )}
              {tab === 'goals' && (
                <GoalsScreen
                  onCreate={() => setCreating(true)}
                  onOpen={(goal) => setSelectedId(goal.id)}
                />
              )}
              {tab === 'journey' && <JourneyScreen />}
              {tab === 'account' && <AccountScreen />}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 10,
          paddingBottom: 6,
        }}
      >
        {tabs.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === item.id }}
            accessibilityLabel={item.label}
            onPress={() => setTab(item.id)}
            style={{ flex: 1, alignItems: 'center', gap: 5, paddingVertical: 8, minHeight: 52 }}
          >
            <Ionicons
              name={item.icon}
              size={23}
              color={tab === item.id ? colors.text : colors.muted}
            />
            <Text
              style={{
                fontSize: 10,
                color: tab === item.id ? colors.text : colors.muted,
                fontWeight: tab === item.id ? '600' : '400',
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {creating && <CreateGoalSheet onClose={() => setCreating(false)} />}
      {logging && <CheckInSheet goal={logging} onClose={() => setLoggingId(null)} />}
      {selected && (
        <GoalSheet goal={selected} onClose={() => setSelectedId(null)} onLog={openLog} />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MembrantProvider storage={storage} sessionStorage={sessionStorage} apiUrl={apiUrl}>
        <AppearanceProvider>
          <DailyApp />
        </AppearanceProvider>
      </MembrantProvider>
    </SafeAreaProvider>
  );
}
