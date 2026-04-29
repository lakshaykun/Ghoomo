function trimTrailingSlash(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

export function resolveApiBaseUrl() {
  const configuredUrl = trimTrailingSlash(import.meta.env.VITE_API_URL);

  if (configuredUrl) {
    return configuredUrl;
  }

  return '/api';
}