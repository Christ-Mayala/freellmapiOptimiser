const LEGACY_DRY_SUFFIX = '/api/v1/freellm';

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function normalizeBase(rawBase: string): string {
  const base = trimTrailingSlash((rawBase || '').trim());
  if (!base) return '';

  // Legacy integration value used in docs; strip it so routes keep working.
  if (base.endsWith(LEGACY_DRY_SUFFIX)) {
    return base.slice(0, -LEGACY_DRY_SUFFIX.length);
  }

  return base;
}

const BASE = normalizeBase(import.meta.env.VITE_API_URL || '');

export function getApiBase(): string {
  return BASE;
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (BASE) {
    return `${BASE}${normalizedPath}`;
  }
  return new URL(normalizedPath, window.location.origin).toString();
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = new URL(buildApiUrl(path));
  url.searchParams.set('_t', Date.now().toString());
  const res = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    cache: 'no-store',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(body.error?.message ?? `HTTP ${res.status}`);
  }
  const data = await res.json();
  if (Array.isArray(data)) {
    return data as T;
  }
  if (data && typeof data === 'object' && data.success === false) {
    throw new Error(data.message);
  }
  return data as T;
}
