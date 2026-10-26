'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { arrayUnion, collection, onSnapshot, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { exportRecords } from '../lib/historyarchive';

const TERMINAL = new Set(['resolved', 'canceled', 'cancelled', 'declined']);
const STATUS_ORDER = { pending: 0, accepted: 1, resolved: 2, declined: 3 };

function millis(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  return 0;
}

function departmentKey(value) {
  const v = String(value || '').trim().toUpperCase();
  if (v === 'FIRE' || v.includes('FIRE')) return 'fire';
  if (v === 'MEDICAL' || v.includes('MEDICAL') || v === 'EMS') return 'medical';
  if (v === 'RESCUE' || v.includes('RESCUE') || v.includes('FLOOD')) return 'rescue';
  return String(value || '').trim().toLowerCase();
}

function internalStatus(rawStatus, operatorStatus) {
  const raw = String(rawStatus || '').trim().toLowerCase();
  // Mobile responder completion/cancellation is authoritative and must not be hidden by operator fields.
  if (['resolved', 'canceled', 'cancelled'].includes(raw)) return raw === 'resolved' ? 'resolved' : 'declined';
  const operator = String(operatorStatus || '').trim().toLowerCase();
  if (['accepted', 'declined', 'resolved'].includes(operator)) return operator;
  if (raw === 'responder found' || raw === 'responder confirmed' || raw === 'responder arrived' || raw === 'accepted') return 'accepted';
  return 'pending';
}

function toIncident(snapshot) {
  const data = snapshot.data() || {};
  const type = departmentKey(data.requiredResponderRole || data.type);
  const createdAt = millis(data.createdAt) || millis(data.updatedAt) || Date.now();
  const operatorMessages = Array.isArray(data.operatorMessages) ? data.operatorMessages : [];
  return {
    ...data,
    id: snapshot.id,
    firestoreId: snapshot.id,
    requestId: data.requestId || snapshot.id,
    type,
    caller: data.callerName || data.userName || data.name || 'Emergency caller',
    phone: data.callbackNumber || data.phoneNumber || '',
    barangay: data.address || 'Location not available',
    lat: typeof data.latitude === 'number' ? data.latitude : null,
    lng: typeof data.longitude === 'number' ? data.longitude : null,
    description: data.details || data.description || '',
    reportedAt: createdAt,
    status: internalStatus(data.status, data.operatorStatus),
    callStatus: data.operatorCallStatus || 'active',
    dispatchStatus: data.operatorDispatchStatus || 'pending',
    acceptedAt: millis(data.operatorAcceptedAt) || millis(data.acceptedAt) || null,
    resolvedAt: millis(data.operatorResolvedAt) || millis(data.resolvedAt) || null,
    declinedAt: millis(data.operatorDeclinedAt) || null,
    dispatchedAt: millis(data.operatorDispatchedAt) || null,
    endedAt: millis(data.operatorEndedAt) || null,
    callCount: Number(data.operatorCallCount || 1),
    lastCalledAt: millis(data.operatorLastCalledAt) || null,
    messages: operatorMessages.map((m, i) => ({ ...m, id: m.id || `${snapshot.id}-msg-${i}`, at: millis(m.at) || Date.now() }))
  };
}

function firestorePatch(updates) {
  const patch = { updatedAt: serverTimestamp() };
  if (updates.status === 'accepted') { patch.operatorStatus = 'accepted'; patch.operatorAcceptedAt = updates.acceptedAt || serverTimestamp(); }
  if (updates.status === 'declined') { patch.operatorStatus = 'declined'; patch.operatorDeclinedAt = updates.declinedAt || serverTimestamp(); }
  if (updates.status === 'resolved') { patch.operatorStatus = 'resolved'; patch.operatorResolvedAt = updates.resolvedAt || serverTimestamp(); }
  if (updates.callStatus !== undefined) { patch.operatorCallStatus = updates.callStatus; if (updates.endedAt !== undefined) patch.operatorEndedAt = updates.endedAt || null; }
  if (updates.dispatchStatus !== undefined) { patch.operatorDispatchStatus = updates.dispatchStatus; if (updates.dispatchedAt !== undefined) patch.operatorDispatchedAt = updates.dispatchedAt || serverTimestamp(); }
  if (updates.callCount !== undefined) patch.operatorCallCount = updates.callCount;
  if (updates.lastCalledAt !== undefined) patch.operatorLastCalledAt = updates.lastCalledAt || serverTimestamp();
  return patch;
}

export function useIncidents({ role, theme, soundEnabled, flash }) {
  const [alerts, setAlerts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'emergencyRequests'),
      snapshot => {
        setAlerts(snapshot.docs.map(toIncident).sort((a, b) => b.reportedAt - a.reportedAt));
        setFeedError('');
        setLoading(false);
      },
      error => {
        console.error('Live emergency feed error:', error);
        setFeedError(error?.message || 'Unable to load live emergency requests.');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const departmentAlerts = useMemo(() => alerts.filter(a => a.type === role), [alerts, role]);
  const activeAlerts = useMemo(() => departmentAlerts.filter(a => !TERMINAL.has(String(a.status).toLowerCase())).sort((a,b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99) || b.reportedAt - a.reportedAt), [departmentAlerts]);
  const closedAlerts = useMemo(() => departmentAlerts.filter(a => TERMINAL.has(String(a.status).toLowerCase())), [departmentAlerts]);
  const activeCount = activeAlerts.length;
  const closedCount = closedAlerts.length;

  useEffect(() => {
    if (selectedId != null && !activeAlerts.some(a => a.id === selectedId)) setSelectedId(activeAlerts[0]?.id ?? null);
    if (selectedId == null && activeAlerts.length) setSelectedId(activeAlerts[0].id);
  }, [activeAlerts, selectedId]);

  const selected = activeAlerts.find(a => a.id === selectedId) || activeAlerts[0] || null;

  const UpdateStatus = useCallback(async (id, updates) => {
    const current = alerts.find(a => a.id === id);
    if (!current || current.type !== role) return;
    try {
      const patch = firestorePatch(updates);
      if (Array.isArray(updates.messages) && updates.messages.length) {
        const latest = updates.messages[updates.messages.length - 1];
        patch.operatorMessages = arrayUnion({ ...latest, at: latest.at || Date.now() });
      }
      await updateDoc(doc(db, 'emergencyRequests', current.firestoreId), patch);
      if (updates.status === 'accepted') flash('Call accepted by the operator.');
      if (updates.status === 'declined') { setSelectedId(null); flash('Call declined by the operator. The mobile emergency remains unchanged.'); }
      if (updates.dispatchStatus === 'dispatched') flash('Operator dispatch recorded. Responder assignment is managed by the responder app.');
      if (updates.callStatus === 'ended') flash('Operator call ended.');
      if (updates.callStatus === 'active' && !updates.status) flash('Call marked active again.');
      if (updates.status === 'resolved') { setSelectedId(null); flash('Moved to operator incident history. The responder request status was not overwritten.'); }
    } catch (error) {
      console.error('Unable to update emergency request:', error);
      flash(error?.message || 'Unable to save the operator update. Check Firestore Rules.');
    }
  }, [alerts, role, flash]);

  const handleAccept = () => selected && UpdateStatus(selected.id, { status: 'accepted', callStatus: 'active', acceptedAt: Date.now() });
  const handleDecline = () => selected && UpdateStatus(selected.id, { status: 'declined', declinedAt: Date.now() });
  const handleDispatch = () => selected && UpdateStatus(selected.id, { dispatchStatus: 'dispatched', dispatchedAt: Date.now() });
  const handleEndCall = () => selected && UpdateStatus(selected.id, { callStatus: 'ended', endedAt: Date.now() });
  const handleCallAgain = () => selected && selected.callStatus === 'ended' && UpdateStatus(selected.id, { callStatus: 'active', endedAt: null, callCount: (selected.callCount || 1) + 1, lastCalledAt: Date.now() });
  const handleSendMessage = async text => {
    const body = String(text || '').trim();
    if (!selected || !body) return;
    const message = { id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, from: 'operator', text: body, at: Date.now() };
    try { await updateDoc(doc(db, 'emergencyRequests', selected.firestoreId), { operatorMessages: arrayUnion(message), updatedAt: serverTimestamp() }); }
    catch (error) { flash(error?.message || 'Unable to send the operator message.'); }
  };
  const handleMoveToHistory = () => selected && UpdateStatus(selected.id, { status: 'resolved', resolvedAt: Date.now() });
  const handleSelectIncident = id => setSelectedId(id);

  const exportHistory = (format = 'json') => {
    if (!closedAlerts.length) return;
    exportRecords(closedAlerts, { format, department: theme?.label || role });
    flash(`Exported ${closedAlerts.length} operator history record(s).`);
  };
  const clearHistory = () => flash('Shared emergency records are retained in Firestore. Export the history if you need an offline copy.');
  return { alerts, departmentAlerts, activeAlerts, activeCount, closedCount, exportHistory, clearHistory, selectedId, setSelectedId, selected, UpdateStatus, handleAccept, handleDecline, handleDispatch, handleEndCall, handleCallAgain, handleSendMessage, handleMoveToHistory, handleSelectIncident, loading, feedError };
}
