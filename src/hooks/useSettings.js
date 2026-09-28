'use client';

import { useEffect, useState } from 'react';

import { STORAGE_KEYS, readStorage, writeStorage } from '../lib/storage';

// Fallback prefs used before anything is loaded
const DEFAULT_SETTINGS = {
  sound: true,
  refresh: true,
  status: true,
  system: true
};

// ========================================
// SETTINGS
// ========================================

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings({
      ...DEFAULT_SETTINGS,
      ...readStorage(STORAGE_KEYS.settings, {})
    });
  }, []);

  const toggle = key => {
    const next = {
      ...settings,
      [key]: !settings[key]
    };

    setSettings(next);
    writeStorage(STORAGE_KEYS.settings, next);
  };

  return { settings, toggle };
}
