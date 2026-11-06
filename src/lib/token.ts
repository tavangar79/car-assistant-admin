// The admin token lives in localStorage. A 10-day token there is an accepted risk (API-ADMIN.md).
const TOKEN_KEY = 'carAssistantAdmin.token';
const EXPIRES_KEY = 'carAssistantAdmin.expiresAt';

export function saveToken(token: string, expiresAt: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRES_KEY, expiresAt);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

/** The stored token, or null when there is none or it has expired. */
export function readToken(now: Date = new Date()): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiresAt = localStorage.getItem(EXPIRES_KEY);
  if (!token) return null;
  if (expiresAt && Date.parse(expiresAt) <= now.getTime()) {
    clearToken();
    return null;
  }
  return token;
}
