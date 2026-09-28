'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { INITIAL_INCIDENTS, hydrateIncidents } from '../lib/mockData';
import { STORAGE_KEYS, readStorage, writeStorage } from '../lib/storage';
import { playIncomingAlert } from '../lib/alertSound';
import { createDrillIncident } from '../lib/drillAlert';
import {
  HISTORY_CAP,
  HISTORY_KEEP_AFTER_ARCHIVE,
  HISTORY_MAX_CHARS,
  exportRecords
} from '../lib/historyArchive';

const STATUS_ORDER = {
  pending: 0,
  accepted: 1,
  resolved: 2,
  declined: 3
};

// ========================================
// INCIDENTS
//
// Owns all incident state + persistence, and
// every action that can happen to an incident
// (accept / decline / dispatch / end call /
// resolve / reset / drill).
//
// role/theme are needed for filtering incidents
// by department and for the drill generator.
// soundEnabled + flash let this hook trigger
// side effects (sound, toast) on new alerts.
// ========================================

export function useIncidents({ role, theme, soundEnabled, flash }) {
  const [alerts, setAlerts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // ----------------------------------------
  // LOAD
  // ----------------------------------------

  useEffect(() => {
    const stored = readStorage(STORAGE_KEYS.incidents, null);

    if (Array.isArray(stored)) {
      setAlerts(hydrateIncidents(stored));
    } else {
      const initial = hydrateIncidents(INITIAL_INCIDENTS);

      setAlerts(initial);
      writeStorage(STORAGE_KEYS.incidents, initial);
    }
  }, []);

  // ----------------------------------------
  // SAVE
  // ----------------------------------------

  const saveAlerts = useCallback(next => {
    setAlerts(next);
    writeStorage(STORAGE_KEYS.incidents, next);
  }, []);

  // ----------------------------------------
  // DEPARTMENT FILTER
  // ----------------------------------------

  const departmentAlerts = useMemo(
    () => alerts.filter(alert => alert.type === role),
    [alerts, role]
  );

  // ----------------------------------------
  // ACTIVE INCIDENTS
  // ----------------------------------------

  const activeAlerts = useMemo(() => {
    const list = departmentAlerts.filter(
      alert => alert.status !== 'resolved' && alert.status !== 'declined'
    );

    return [...list].sort(
      (a, b) =>
        (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99) ||
        b.reportedAt - a.reportedAt
    );
  }, [departmentAlerts]);

  const activeCount = useMemo(
    () =>
      departmentAlerts.filter(
        alert => alert.status !== 'resolved' && alert.status !== 'declined'
      ).length,
    [departmentAlerts]
  );

  // ----------------------------------------
  // KEEP SELECTED INCIDENT VALID
  // ----------------------------------------

  useEffect(() => {
    if (selectedId === null) return;

    if (
      activeAlerts.length &&
      !activeAlerts.some(alert => alert.id === selectedId)
    ) {
      setSelectedId(activeAlerts[0].id);
    }

    if (!activeAlerts.length) {
      setSelectedId(null);
    }
  }, [activeAlerts, selectedId]);

  const selected =
    activeAlerts.find(alert => alert.id === selectedId) || activeAlerts[0];

  // ----------------------------------------
  // HISTORY (closed = resolved or declined)
  //
  // Only this department's records are ever exported
  // or deleted; other departments share the same
  // storage and are never touched.
  // ----------------------------------------

  const closedAlerts = useMemo(
    () =>
      departmentAlerts.filter(
        alert => alert.status === 'resolved' || alert.status === 'declined'
      ),
    [departmentAlerts]
  );

  const closedCount = closedAlerts.length;

  // Operator-triggered save to a file ('csv' or 'json').
  const exportHistory = useCallback(
    (format = 'json') => {
      if (!closedAlerts.length) return;

      exportRecords(closedAlerts, {
        format,
        department: theme?.label || role
      });

      flash(
        `Saved ${closedAlerts.length} record${
          closedAlerts.length !== 1 ? 's' : ''
        } as ${format.toUpperCase()}.`
      );
    },
    [closedAlerts, theme, role, flash]
  );

  // Deletes every closed record of this department.
  const clearHistory = useCallback(() => {
    const next = alerts.filter(
      alert =>
        !(
          alert.type === role &&
          (alert.status === 'resolved' || alert.status === 'declined')
        )
    );

    const removed = alerts.length - next.length;
    if (!removed) return;

    saveAlerts(next);
    flash(`Deleted ${removed} history record${removed !== 1 ? 's' : ''}.`);
  }, [alerts, role, saveAlerts, flash]);

  // ----------------------------------------
  // AUTO-ARCHIVE SAFETY NET
  //
  // When closed records reach HISTORY_CAP (or the stored
  // data gets close to the browser storage limit), save
  // them to a JSON file first, then remove them from the
  // app. The lock stops React StrictMode (dev) from
  // running this twice and downloading two files.
  // ----------------------------------------

  const archiveLockRef = useRef(false);

  useEffect(() => {
    if (!role || !alerts.length) return;

    const overCap = closedCount >= HISTORY_CAP;

    let overSize = false;

    if (!overCap) {
      try {
        overSize = JSON.stringify(alerts).length >= HISTORY_MAX_CHARS;
      } catch {
        overSize = false;
      }
    }

    if (!overCap && !overSize) {
      archiveLockRef.current = false;
      return;
    }

    if (archiveLockRef.current) return;
    archiveLockRef.current = true;

    // Oldest first, so the newest ones can be kept if configured.
    const oldestFirst = [...closedAlerts].sort(
      (a, b) =>
        (a.resolvedAt || a.declinedAt || a.reportedAt || 0) -
        (b.resolvedAt || b.declinedAt || b.reportedAt || 0)
    );

    const toArchive = oldestFirst.slice(
      0,
      Math.max(0, oldestFirst.length - HISTORY_KEEP_AFTER_ARCHIVE)
    );

    if (!toArchive.length) return;

    exportRecords(toArchive, {
      format: 'json',
      department: theme?.label || role,
      auto: true
    });

    const archivedIds = new Set(toArchive.map(alert => alert.id));

    saveAlerts(alerts.filter(alert => !archivedIds.has(alert.id)));

    flash(
      `History full: ${toArchive.length} records saved to a file and cleared.`
    );
  }, [alerts, role, theme, closedAlerts, closedCount, saveAlerts, flash]);

  // ----------------------------------------
  // CENTRAL INCIDENT UPDATE
  //
  // All action buttons go through this.
  // ----------------------------------------

  const UpdateStatus = useCallback(
    (id, updates) => {
      const current = alerts.find(alert => alert.id === id);

      if (!current) return;
      if (current.type !== role) return;

      const next = alerts.map(alert =>
        alert.id === id
          ? {
              ...alert,
              ...updates
            }
          : alert
      );

      saveAlerts(next);

      if (updates.status === 'accepted') {
        flash('Request accepted. Call is now active.');
      }

      if (updates.status === 'declined') {
        setSelectedId(null);
        flash('Request declined.');
      }

      if (updates.dispatchStatus === 'dispatched') {
        flash('Unit dispatched.');
      }

      if (updates.callStatus === 'ended') {
        flash('Call ended.');
      }

      // Call Again: same incident, call goes back to active (no status change).
      if (updates.callStatus === 'active' && !updates.status) {
        flash('Calling again. Call is now active.');
      }

      if (updates.status === 'resolved') {
        setSelectedId(null);
        flash('Request moved to Incident History.');
      }
    },
    [alerts, role, saveAlerts, flash]
  );

  // ----------------------------------------
  // INCIDENT ACTIONS
  // ----------------------------------------

  const handleAccept = () => {
    if (!selected) return;
    UpdateStatus(selected.id, {
      status: 'accepted',
      callStatus: 'active',
      dispatchStatus: 'pending',
      acceptedAt: Date.now()
    });
  };

  const handleDecline = () => {
    if (!selected) return;
    UpdateStatus(selected.id, { status: 'declined', declinedAt: Date.now() });
  };

  const handleDispatch = () => {
    if (!selected) return;
    UpdateStatus(selected.id, {
      dispatchStatus: 'dispatched',
      dispatchedAt: Date.now()
    });
  };

  const handleEndCall = () => {
    if (!selected) return;
    UpdateStatus(selected.id, { callStatus: 'ended', endedAt: Date.now() });
  };

  // Only possible once the call has ended.
  const handleCallAgain = () => {
    if (!selected || selected.callStatus !== 'ended') return;
    UpdateStatus(selected.id, {
      callStatus: 'active',
      endedAt: null,
      callCount: (selected.callCount || 1) + 1,
      lastCalledAt: Date.now()
    });
  };

  // Appends a dispatcher message to the selected incident's chat.
  const handleSendMessage = text => {
    const body = String(text || '').trim();
    if (!selected || !body) return;

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      from: 'dispatcher',
      text: body,
      at: Date.now()
    };

    UpdateStatus(selected.id, {
      messages: [...(selected.messages || []), message]
    });
  };

  const handleMoveToHistory = () => {
    if (!selected) return;
    UpdateStatus(selected.id, { status: 'resolved', resolvedAt: Date.now() });
  };

  const handleSelectIncident = id => {
    setSelectedId(id);
  };

  // ----------------------------------------
  // RESET DATA
  // ----------------------------------------

  const resetData = useCallback(() => {
    const initial = hydrateIncidents(INITIAL_INCIDENTS);

    saveAlerts(initial);
    setSelectedId(null);

    flash('Incident records reset.');
  }, [saveAlerts, flash]);

  // ----------------------------------------
  // DRILL ALERT
  // ----------------------------------------

  const simulate = useCallback(() => {
    const next = createDrillIncident(role, theme);
    if (!next) return;

    saveAlerts([next, ...alerts]);
    setSelectedId(next.id);

    if (soundEnabled) {
      playIncomingAlert();
    }

    flash('New alert received.');
  }, [role, theme, alerts, saveAlerts, soundEnabled, flash]);

  return {
    alerts,
    departmentAlerts,
    activeAlerts,
    activeCount,
    closedCount,
    exportHistory,
    clearHistory,
    selectedId,
    setSelectedId,
    selected,
    UpdateStatus,
    handleAccept,
    handleDecline,
    handleDispatch,
    handleEndCall,
    handleCallAgain,
    handleSendMessage,
    handleMoveToHistory,
    handleSelectIncident,
    resetData,
    simulate
  };
}
