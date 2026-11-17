import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import {
  KeyboardAvoidingView,
  AccessibilityInfo,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Goal } from '@membrant/core';
import { isAppearance, palettes, type Appearance } from '@membrant/client';
import { storage } from '../lib/storage';

const AppearanceContext = createContext<{
  appearance: Appearance;
  setAppearance(value: Appearance): void;
}>({ appearance: 'dark', setAppearance: () => {} });

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setValue] = useState<Appearance>('dark');
  useEffect(() => {
    let active = true;
    void storage
      .getItem('membrant.appearance')
      .then((value) => {
        if (active && isAppearance(value)) setValue(value);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const setAppearance = (value: Appearance) => {
    setValue(value);
    void storage.setItem('membrant.appearance', value).catch(() => {});
  };
  return (
    <AppearanceContext.Provider value={{ appearance, setAppearance }}>
      {children}
    </AppearanceContext.Provider>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}
export type IconName = ComponentProps<typeof Ionicons>['name'];
export const categoryIcons: Record<Goal['category'], IconName> = {
  Health: 'heart-outline',
  Learning: 'book-outline',
  Career: 'briefcase-outline',
  Personal: 'leaf-outline',
  Finance: 'wallet-outline',
};

export function useTheme() {
  const { appearance, setAppearance } = useContext(AppearanceContext);
  const system = useColorScheme();
  const isDark = appearance === 'system' ? system === 'dark' : appearance === 'dark';
  const colors = isDark ? palettes.dark : palettes.light;
  const s = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.bg },
        content: {
          padding: 24,
          paddingBottom: 40,
          gap: 28,
          maxWidth: 700,
          width: '100%',
          alignSelf: 'center',
        },
        row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        between: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        },
        title: {
          fontSize: 32,
          fontWeight: '600',
          color: colors.text,
          letterSpacing: -1.1,
          lineHeight: 39,
        },
        heading: { fontSize: 19, fontWeight: '600', color: colors.text, letterSpacing: -0.3 },
        body: { fontSize: 14, lineHeight: 22, color: colors.text },
        muted: { fontSize: 13, lineHeight: 21, color: colors.muted },
        small: { fontSize: 11, lineHeight: 17, color: colors.muted },
        eyebrow: {
          fontSize: 10,
          fontWeight: '600',
          color: colors.muted,
          letterSpacing: 0,
        },
        section: { paddingVertical: 12, gap: 20 },
        goalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 24, gap: 14 },
        quote: {
          fontFamily: Platform.OS === 'ios' || Platform.OS === 'web' ? 'Georgia' : 'serif',
          fontSize: 23,
          lineHeight: 35,
          color: colors.text,
        },
        thread: { paddingLeft: 20, borderLeftWidth: 1, borderLeftColor: colors.border, gap: 12 },
        icon: {
          width: 24,
          height: 24,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pill: {
          backgroundColor: colors.surfaceAlt,
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 6,
        },
        pillText: { color: colors.muted, fontSize: 12, fontWeight: '500' },
        divider: { borderTopColor: colors.border, borderTopWidth: 1, marginVertical: 5 },
        input: {
          borderWidth: 1,
          borderColor: colors.controlBorder,
          borderRadius: 8,
          paddingHorizontal: 14,
          paddingVertical: 12,
          minHeight: 48,
          color: colors.text,
          backgroundColor: colors.surface,
          fontSize: 16,
        },
        label: { color: colors.text, fontSize: 13, fontWeight: '500' },
        button: {
          backgroundColor: colors.accent,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: 'transparent',
          minHeight: 48,
          paddingVertical: 13,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        buttonText: { fontSize: 14, fontWeight: '600', color: colors.onAccent },
        secondary: { backgroundColor: 'transparent', borderColor: colors.controlBorder },
        secondaryText: { color: colors.text },
        link: { color: colors.accent, fontSize: 13, fontWeight: '600' },
      }),
    [colors],
  );
  return { colors, s, isDark, appearance, setAppearance };
}

export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
  icon,
}: {
  label: string;
  onPress(): void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: IconName;
}) {
  const { s, colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        focused && {
          outlineColor: colors.accent,
          outlineWidth: 2,
          outlineOffset: 3,
          outlineStyle: 'solid',
        },
        { opacity: disabled ? 0.5 : pressed ? 0.75 : 1 },
      ]}
    >
      {icon && <Ionicons name={icon} size={18} color={secondary ? colors.text : colors.onAccent} />}
      <Text style={[s.buttonText, secondary && s.secondaryText]}>{label}</Text>
    </Pressable>
  );
}
export function Section({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { s } = useTheme();
  return <View style={[s.section, style]}>{children}</View>;
}
export function Field({
  label,
  hint,
  writing = false,
  ...props
}: TextInputProps & { label: string; hint?: string; writing?: boolean }) {
  const { s, colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...props}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        style={[
          s.input,
          props.multiline && { minHeight: 96, textAlignVertical: 'top' },
          writing && {
            borderWidth: 0,
            borderBottomWidth: 1,
            borderRadius: 0,
            backgroundColor: 'transparent',
            paddingHorizontal: 0,
            minHeight: 128,
            lineHeight: 28,
          },
          focused && { borderColor: colors.accent },
          props.style,
        ]}
      />
      {hint && <Text style={s.small}>{hint}</Text>}
    </View>
  );
}
export function Progress({ value }: { value: number }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value) }}
      style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' }}
    >
      <View
        style={{
          height: 4,
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: colors.accent,
          borderRadius: 2,
        }}
      />
    </View>
  );
}
export function ErrorBox({ message }: { message: string | null }) {
  const { colors } = useTheme();
  return message ? (
    <View
      accessibilityRole="alert"
      style={{ padding: 14, borderRadius: 10, backgroundColor: colors.dangerSoft }}
    >
      <Text style={{ color: colors.danger, fontSize: 13, lineHeight: 21 }}>{message}</Text>
    </View>
  ) : null;
}
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress(): void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={Platform.OS === 'web' ? undefined : { selected }}
      aria-pressed={selected}
      onPress={onPress}
      style={{
        borderRadius: 8,
        minHeight: 44,
        justifyContent: 'center',
        padding: 11,
        borderWidth: 1,
        borderColor: selected ? colors.brand : colors.border,
        backgroundColor: selected ? colors.surfaceAlt : 'transparent',
      }}
    >
      <Text style={{ color: selected ? colors.text : colors.muted, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
export function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose(): void;
}) {
  const { s, colors } = useTheme();
  const reducedMotion = useReducedMotion();
  return (
    <Modal
      animationType={reducedMotion ? 'none' : 'slide'}
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.screen}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={[s.between, { padding: 20 }]}>
            <Text style={[s.heading, { flex: 1 }]}>{title}</Text>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              onPress={onClose}
              hitSlop={12}
              style={{ padding: 10 }}
            >
              <Ionicons name="close" color={colors.muted} size={23} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
