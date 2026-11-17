import { applyCommand, demoState, stateSchema, type AppState, type Command } from '@membrant/core';

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
export interface Session {
  token: string;
  name: string;
  email: string;
}
export interface Repository {
  read(): Promise<AppState>;
  execute(command: Command, revision: number, requestId: string): Promise<AppState>;
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export const DEMO_KEY = 'membrant.demo.v1';
export const SESSION_KEY = 'membrant.session.v1';

export function localRepository(storage: StorageAdapter): Repository {
  const read = async () => {
    const raw = await storage.getItem(DEMO_KEY);
    if (raw) {
      try {
        return stateSchema.parse(JSON.parse(raw));
      } catch {
        throw new Error(
          'Your demo data could not be read. It has been preserved. Reset the demo from the recovery screen to start again.',
        );
      }
    }
    const state = demoState();
    await storage.setItem(DEMO_KEY, JSON.stringify(state));
    return state;
  };
  return {
    read,
    async execute(command, revision) {
      const state = await read();
      if (state.revision !== revision)
        throw new ApiError(
          'This workspace changed in another tab. We refreshed it; please try again.',
          409,
        );
      const next = applyCommand(state, command);
      await storage.setItem(DEMO_KEY, JSON.stringify(next));
      return next;
    },
  };
}

export async function apiRequest<T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error(
      'Cannot reach the shared backend. Check your connection and API address, then try again.',
    );
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error('The backend returned an unexpected response. Check the API address.');
  }
  if (!response.ok)
    throw new ApiError(
      (data as { error?: string }).error ?? 'Something went wrong. Please try again.',
      response.status,
    );
  return data as T;
}

export function remoteRepository(baseUrl: string, token: string): Repository {
  const headers = { Authorization: `Bearer ${token}` };
  return {
    async read() {
      return stateSchema.parse(await apiRequest(baseUrl, '/api/state', { headers }));
    },
    async execute(command, revision, requestId) {
      const options = {
        method: 'POST',
        headers,
        body: JSON.stringify({ command, revision, requestId }),
      };
      try {
        return stateSchema.parse(await apiRequest(baseUrl, '/api/commands', options));
      } catch (cause) {
        if (cause instanceof ApiError && cause.status < 500) throw cause;
        // A lost response may already have committed. Reuse the request ID for one safe retry.
        return stateSchema.parse(await apiRequest(baseUrl, '/api/commands', options));
      }
    },
  };
}
