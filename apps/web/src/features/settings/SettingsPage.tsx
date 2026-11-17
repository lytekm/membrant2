import { useState } from 'react';
import { ArrowRight, DownloadSimple, SignOut } from '@phosphor-icons/react';
import { today } from '@membrant/core';
import { message, useMembrant } from '@membrant/client';
import { ErrorMessage, Field, PageHeader } from '../../components/ui';

export function SettingsPage() {
  const { state, session, mode, authenticate, dispatch, signOut, resetDemo, busy } = useMembrant();
  const [kind, setKind] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profileName, setProfileName] = useState(state?.profile.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [resetConfirm, setResetConfirm] = useState(false);
  const auth = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await authenticate(kind, { name, email, password });
      setPassword('');
    } catch (cause) {
      setError(message(cause));
    }
  };
  const exportData = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `membrant-${mode}-${today()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice('Your workspace export is ready.');
  };
  return (
    <>
      <PageHeader title="Settings" description="Your account, preferences and data." />
      <div className="settings-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Account</h2>
              <p>Use the same goals and reflections on web and mobile.</p>
            </div>
          </div>
          {session ? (
            <div className="form-stack">
              <div className="connection-card">
                <span className="connection-dot" />
                <div>
                  <strong>Connected</strong>
                  <p>{session.email}</p>
                </div>
              </div>
              <p className="muted">
                Sign in with this account on mobile to see the same goals and check-ins. Changes
                refresh automatically while the app is open.
              </p>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => {
                  void signOut().catch((cause: unknown) => setError(message(cause)));
                }}
              >
                <SignOut size={17} />
                Sign out
              </button>
            </div>
          ) : (
            <>
              <div className="tabs settings-tabs">
                <button
                  className={kind === 'register' ? 'selected' : ''}
                  onClick={() => setKind('register')}
                >
                  Create an account
                </button>
                <button
                  className={kind === 'login' ? 'selected' : ''}
                  onClick={() => setKind('login')}
                >
                  Sign in
                </button>
              </div>
              <p className="muted small">
                A connected account starts with an empty workspace. Your demo stays on this device.
              </p>
              <form className="form-stack" onSubmit={(e) => void auth(e)}>
                {kind === 'register' && (
                  <Field label="Your name">
                    <input
                      required
                      autoComplete="given-name"
                      maxLength={60}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Field>
                )}
                <Field label="Email">
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Field label="Password" hint="At least 10 characters.">
                  <input
                    required
                    type="password"
                    minLength={10}
                    maxLength={200}
                    autoComplete={kind === 'register' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
                <button className="button primary" disabled={busy} type="submit">
                  {busy ? 'Connecting…' : kind === 'register' ? 'Create account' : 'Sign in'}
                  <ArrowRight size={17} />
                </button>
              </form>
            </>
          )}
          <ErrorMessage error={error} />
        </section>
        <div className="form-stack">
          <section className="panel">
            <h2>Profile</h2>
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                void dispatch({ type: 'profile.update', name: profileName })
                  .then(() => setNotice('Your name is updated.'))
                  .catch((cause: unknown) => setError(message(cause)));
              }}
            >
              <Field label="Display name">
                <input
                  required
                  maxLength={60}
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </Field>
              <button className="button secondary" type="submit" disabled={busy}>
                Save name
              </button>
            </form>
          </section>
          <section className="panel">
            <h2>Export data</h2>
            <p className="muted">Download your goals, check-ins, and reflections as a JSON file.</p>
            <button className="button secondary" onClick={exportData}>
              <DownloadSimple size={18} />
              Export workspace
            </button>
          </section>
          {mode === 'demo' && (
            <section className="panel">
              <h2>Demo workspace</h2>
              <p className="muted">
                Restore the example workspace. This replaces your changes to the demo on this
                device.
              </p>
              {resetConfirm ? (
                <div className="row">
                  <button className="button secondary" onClick={() => setResetConfirm(false)}>
                    Cancel
                  </button>
                  <button
                    className="button danger"
                    disabled={busy}
                    onClick={() => {
                      void resetDemo()
                        .then(() => {
                          setResetConfirm(false);
                          setNotice('Demo restored.');
                        })
                        .catch((cause: unknown) => setError(message(cause)));
                    }}
                  >
                    Reset demo
                  </button>
                </div>
              ) : (
                <button className="text-button" onClick={() => setResetConfirm(true)}>
                  Restore example data
                </button>
              )}
            </section>
          )}
          <span role="status" className="success-text">
            {notice}
          </span>
        </div>
      </div>
    </>
  );
}
