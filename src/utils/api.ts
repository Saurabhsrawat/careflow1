/**
 * Authenticated API fetch helper
 * Ensures Bearer token and credentials: 'include' are always passed for CareFlow endpoints
 */

export function getAuthToken(): string | null {
  return localStorage.getItem('careflow_token');
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = getAuthHeaders((options.headers as Record<string, string>) || {});
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
}
