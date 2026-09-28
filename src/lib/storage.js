export const STORAGE_KEYS = {
  incidents: 'esagip_incidents_v1',
  users: 'esagip_users_v1',
  session: 'esagip_session_v1',
  settings: 'esagip_settings_v1'
};

export function readStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
