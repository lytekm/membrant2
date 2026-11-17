import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { message, useMembrant } from '@membrant/client';
import { Button, Section, Chip, ErrorBox, Field, useTheme } from '../../components/ui';
import { apiUrl } from '../../lib/storage';

export function AccountScreen() {
  const { session, authenticate, signOut, busy, resetDemo } = useMembrant();
  const { s, appearance, setAppearance } = useTheme();
  const [kind, setKind] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reset, setReset] = useState(false);
  const [showConnection, setShowConnection] = useState(false);
  const auth = async () => {
    setError(null);
    try {
      await authenticate(kind, { name, email, password });
      setPassword('');
    } catch (cause) {
      setError(message(cause));
    }
  };
  return (
    <>
      <Text accessibilityRole="header" style={s.title}>
        You
      </Text>
      <Section>
        <Text accessibilityRole="header" style={s.heading}>
          Appearance
        </Text>
        <View style={[s.row, { flexWrap: 'wrap' }]}>
          {(['dark', 'light', 'system'] as const).map((value) => (
            <Chip
              key={value}
              label={value[0].toUpperCase() + value.slice(1)}
              selected={appearance === value}
              onPress={() => setAppearance(value)}
            />
          ))}
        </View>
      </Section>
      <Section>
        <Text style={s.heading}>{session ? 'Connected' : 'Account'}</Text>
        {session ? (
          <>
            <Text style={s.body}>{session.email}</Text>
            <Text style={s.muted}>
              Your goals and check-ins are shared with the web workspace. Pull down to refresh at
              any time.
            </Text>
            <Button
              secondary
              label="Sign out"
              disabled={busy}
              icon="log-out-outline"
              onPress={() => {
                void signOut().catch((cause: unknown) => setError(message(cause)));
              }}
            />
          </>
        ) : (
          <>
            <Text style={s.muted}>
              You’re exploring a local demo with example goals. Connect an account to use your own
              shared workspace.
            </Text>
            <View style={s.row}>
              <Chip label="Sign in" selected={kind === 'login'} onPress={() => setKind('login')} />
              <Chip
                label="Create account"
                selected={kind === 'register'}
                onPress={() => setKind('register')}
              />
            </View>
            {kind === 'register' && (
              <Field
                label="Your name"
                value={name}
                onChangeText={setName}
                maxLength={60}
                textContentType="givenName"
              />
            )}
            <Field
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />
            <Field
              label="Password"
              hint="At least 10 characters."
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType={kind === 'register' ? 'newPassword' : 'password'}
              value={password}
              onChangeText={setPassword}
              maxLength={200}
            />
            <Button
              label={busy ? 'Connecting…' : kind === 'register' ? 'Create account' : 'Sign in'}
              disabled={busy}
              onPress={() => void auth()}
            />
            <Text style={s.small}>
              New accounts start with an empty workspace. Your demo stays on this device.
            </Text>
          </>
        )}
        <ErrorBox message={error} />
      </Section>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: showConnection }}
        onPress={() => setShowConnection(!showConnection)}
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        <Text style={s.muted}>Connection details {showConnection ? '−' : '+'}</Text>
      </Pressable>
      {showConnection && (
        <Section>
          <Text selectable style={s.small}>
            {apiUrl}
          </Text>
          <Text style={s.small}>
            On a physical phone, set EXPO_PUBLIC_API_URL to your computer’s Wi-Fi address and
            restart Expo. See the README for setup.
          </Text>
        </Section>
      )}
      {!session && (
        <Section>
          <Text style={s.heading}>Demo workspace</Text>
          <Text style={s.muted}>
            Restore the example goals and remove demo changes on this device.
          </Text>
          {reset ? (
            <>
              <Button
                label="Confirm demo reset"
                secondary
                onPress={() => {
                  void resetDemo()
                    .then(() => setReset(false))
                    .catch((cause: unknown) => setError(message(cause)));
                }}
              />
              <Button secondary label="Keep my changes" onPress={() => setReset(false)} />
            </>
          ) : (
            <Button secondary label="Restore example data" onPress={() => setReset(true)} />
          )}
        </Section>
      )}
    </>
  );
}
