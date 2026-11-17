import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { demoState, uid, type AppState, type Command } from '@membrant/core';
import {
  ApiError,
  apiRequest,
  DEMO_KEY,
  SESSION_KEY,
  localRepository,
  remoteRepository,
  type Session,
  type StorageAdapter,
} from './repository';

type Credentials = { name?: string; email: string; password: string };
interface ContextValue {
  state: AppState | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  session: Session | null;
  mode: 'demo' | 'connected';
  dispatch(command: Command): Promise<void>;
  refresh(): Promise<void>;
  authenticate(kind: 'login' | 'register', credentials: Credentials): Promise<void>;
  signOut(): Promise<void>;
  resetDemo(): Promise<void>;
  clearError(): void;
}
const Context = createContext<ContextValue | null>(null);

export function MembrantProvider({
  children,
  storage,
  sessionStorage = storage,
  apiUrl,
}: {
  children: ReactNode;
  storage: StorageAdapter;
  sessionStorage?: StorageAdapter;
  apiUrl: string;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const repository = useMemo(
    () => (session ? remoteRepository(apiUrl, session.token) : localRepository(storage)),
    [session, apiUrl, storage],
  );
  const repositoryRef = useRef(repository);
  repositoryRef.current = repository;

  useEffect(() => {
    let cancelled = false;
    sessionStorage
      .getItem(SESSION_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const saved = JSON.parse(raw) as Session;
        if (typeof saved.token !== 'string' || typeof saved.email !== 'string')
          throw new Error('Invalid session');
        setSession(saved);
      })
      .catch(() => {
        if (!cancelled) setError('Could not restore your session. Sign in again to reconnect.');
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionStorage]);

  const publish = useCallback((next: AppState) => {
    setState((previous) => (!previous || next.revision >= previous.revision ? next : previous));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setLoading(true);
    setState(null);
    repository
      .read()
      .then((next) => {
        if (!cancelled) setState(next);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(message(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [repository, hydrated]);

  const refresh = useCallback(async () => {
    if (!hydrated || locked.current) return;
    try {
      const next = await repository.read();
      if (repositoryRef.current === repository) publish(next);
    } catch (cause) {
      if (repositoryRef.current === repository) setError(message(cause));
    }
  }, [repository, hydrated, publish]);

  const dispatch = useCallback(
    async (command: Command) => {
      if (!stateRef.current || locked.current)
        throw new Error('Please wait for the current save to finish.');
      locked.current = true;
      setBusy(true);
      setError(null);
      try {
        const next = await repository.execute(command, stateRef.current.revision, uid('request'));
        if (repositoryRef.current === repository) {
          stateRef.current = next;
          publish(next);
        }
      } catch (cause) {
        if (cause instanceof ApiError && cause.status === 409) {
          try {
            const next = await repository.read();
            stateRef.current = next;
            publish(next);
          } catch {
            /* Keep the original conflict visible. */
          }
        }
        setError(message(cause));
        throw cause;
      } finally {
        locked.current = false;
        setBusy(false);
      }
    },
    [repository, publish],
  );

  const authenticate = useCallback(
    async (kind: 'login' | 'register', credentials: Credentials) => {
      if (locked.current) throw new Error('Please wait for the current save to finish.');
      locked.current = true;
      setBusy(true);
      setError(null);
      try {
        const payload =
          kind === 'register'
            ? credentials
            : { email: credentials.email, password: credentials.password };
        const result = await apiRequest<Session>(apiUrl, `/api/auth/${kind}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        await sessionStorage.setItem(SESSION_KEY, JSON.stringify(result));
        setSession(result);
      } catch (cause) {
        setError(message(cause));
        throw cause;
      } finally {
        locked.current = false;
        setBusy(false);
      }
    },
    [apiUrl, sessionStorage],
  );

  const signOut = useCallback(async () => {
    if (locked.current) return;
    if (session) {
      // Revoke remotely before forgetting the token. A failure is surfaced so it can be retried.
      try {
        await apiRequest(apiUrl, '/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.token}` },
        });
      } catch (cause) {
        if (!(cause instanceof ApiError && cause.status === 401)) {
          setError(message(cause));
          throw cause;
        }
      }
    }
    await sessionStorage.removeItem(SESSION_KEY);
    setError(null);
    setSession(null);
  }, [session, apiUrl, sessionStorage]);

  const resetDemo = useCallback(async () => {
    if (session || locked.current) return;
    const next = demoState();
    await storage.setItem(DEMO_KEY, JSON.stringify(next));
    stateRef.current = next;
    setState(next);
    setError(null);
  }, [session, storage]);

  return (
    <Context.Provider
      value={{
        state,
        loading,
        busy,
        error,
        session,
        mode: session ? 'connected' : 'demo',
        dispatch,
        refresh,
        authenticate,
        signOut,
        resetDemo,
        clearError: () => setError(null),
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function message(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  return 'Something went wrong. Please try again.';
}

export function useMembrant() {
  const value = useContext(Context);
  if (!value) throw new Error('useMembrant must be used inside MembrantProvider');
  return value;
}
