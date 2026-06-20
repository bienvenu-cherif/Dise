import Constants from 'expo-constants';

const configuredBase =
  process.env.EXPO_PUBLIC_API_BASE ||
  (Constants.expoConfig?.extra?.apiBase as string | undefined) ||
  'http://localhost:3000/api';

export const API_BASE = configuredBase.replace(/\/$/, '');

export async function request<T>(path: string, token?: string | null, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = Array.isArray(payload?.message) ? payload.message.join('\n') : payload?.message;
    throw new Error(message || response.statusText || 'Requete impossible');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
