'use client';

import { useCallback, useState } from 'react';

// ========================================
// TOAST
// ========================================

export function useToast(duration = 2500) {
  const [toast, setToast] = useState('');

  const flash = useCallback(
    message => {
      setToast(message);

      window.setTimeout(() => {
        setToast('');
      }, duration);
    },
    [duration]
  );

  return { toast, flash };
}
