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

// === VERIFICATION ENVIRONNEMENT PRODUCTION ===
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  const rawBase = (import.meta.env.VITE_API_URL || '').trim();
  if (rawBase.includes('localhost') || rawBase.includes('127.0.0.1')) {
    console.error(
      '[FreeLLM] ERREUR: VITE_API_URL pointe vers localhost en production !\n' +
      'Configurez VITE_API_URL dans les variables d\'environnement Netlify.\n' +
      'URL actuelle: ' + rawBase
    );
  }
}


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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach((entry) => {
        const [key, value] = entry;
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ajouter la clé API si disponible
  const apiKey = localStorage.getItem('api_key');
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const res = await fetch(url.toString(), {
    headers,
    cache: 'no-store',
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ success: false, message: res.statusText }));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  const data = await res.json();
  if (data && typeof data === 'object' && data.success === false) {
    throw new Error(data.message);
  }
  if (data && typeof data === 'object' && data.success === true) {
    if (data.data !== undefined) {
      return data.data as T;
    }
    return data as T;
  }
  if (Array.isArray(data)) {
    return data as T;
  }
  return data as T;
}