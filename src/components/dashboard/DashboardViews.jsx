'use client';

import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Phone,
  Timer,
  Trash2,
  Users,
  X,
  XCircle
} from 'lucide-react';
import { useEffect, useMemo, useState, useRef } from 'react';

import { IdCardPreview } from './queueInfo';

// ============================================================
// MAP CALLERS CARD
// ============================================================

export function MapCallersCard({ alerts, theme, onSelectAlert }) {
  const sorted = [...alerts].sort((a, b) => a.dist - b.dist);

  return (
    <div className="absolute top-5 left-5 z-[500] w-[300px] max-w-[calc(100%-40px)] max-h-[calc(100%-40px)] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Users className="h-4 w-4" style={{ color: theme.hex }} />
          {theme.label} callers
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {alerts.length} active incident{alerts.length !== 1 ? 's' : ''} on this map
        </p>
      </div>

      <div className="overflow-y-auto divide-y divide-gray-100">
        {sorted.length === 0 ? (
          <div className="p-5 text-sm text-gray-500">
            No active callers at the moment.
          </div>
        ) : (
          sorted.map(alert => (
            <button
              type="button"
              key={alert.id}
              onClick={() => onSelectAlert(alert.id)}
              className="w-full text-left p-3 flex items-center gap-3 hover:bg-gray-50 transition"
            >
              <span
                className="h-8 w-8 rounded-full grid place-items-center shrink-0 text-white text-xs font-bold font-mono"
                style={{ backgroundColor: theme.hex }}
              >
                {alert.type[0].toUpperCase()}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold truncate">
                  {alert.caller}
                </span>
                <span className="block text-xs text-gray-500 truncate">
                  {alert.barangay} · {alert.dist} km
                </span>
              </span>

              <span className={`status-pill ${alert.status}`}>
                {alert.status}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}


// ============================================================
// INCIDENT CARD
// ============================================================

export function IncidentCard({
  alert,
  theme,
  now,
  UpdateStatus,
  onSelect
}) {
  const isPending = alert.status === 'pending';
  const isAccepted = alert.status === 'accepted';
  const isCallEnded = alert.callStatus === 'ended';
  const isCallActive = isAccepted && !isCallEnded;
  const cardRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;
    cardRef.current.animate(
      [
        { opacity: 0, transform: 'translateX(45px) scale(0.98)' },
        { opacity: 1, transform: 'translateX(0) scale(1)' }
      ],
      { duration: 350, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' }
    );
  }, []);

  const handleEndCall = event => { event.stopPropagation(); UpdateStatus(alert.id, { callStatus: 'ended', endedAt: Date.now() }); };

  return (
    <div
      ref={cardRef}
      onClick={isPending ? onSelect : undefined}
      className={`incident-card absolute top-5 right-5 w-[350px] max-w-[calc(100%-40px)] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[500] ${
        isPending ? 'cursor-pointer hover:border-gray-200' : ''
      }`}
    >
      {/* HEADER */}
      <div
        className="p-4 border-b flex items-start justify-between"
        style={{ backgroundColor: theme.softHex }}
      >
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: theme.hex }}
          >
            {theme.label} · ES-{String(alert.id).padStart(4, '0')}
          </div>

          <h2 className="font-bold text-xl mt-1">
            {alert.caller}
          </h2>
        </div>

        <span className={`status-pill ${isPending ? 'pending' : 'accepted'}`}>
          {isPending
            ? 'Pending'
            : isCallEnded
              ? 'Call Ended'
              : 'On Call'}
        </span>
      </div>


      {/* INFORMATION */}
      <div className="p-5 space-y-4">

        <Info label="Location">
          <span className="font-semibold">{alert.barangay}</span>
          <span className="text-gray-400"> ({alert.dist} km)</span>
        </Info>


        <Info label="Contact">
          <a
            className="font-semibold text-gray-900 hover:underline"
            href={`tel:${alert.phone}`}
            onClick={event => event.stopPropagation()}
          >
            <Phone className="inline h-3.5 w-3.5 mr-1" />
            {alert.phone}
          </a>
        </Info>


        <Info label="Situation report">
          <div className="bg-gray-50 rounded-lg border p-3 text-sm leading-6">
            {alert.description}
          </div>
        </Info>


        <div className="text-xs text-gray-400">
          Reported {Math.max(0, Math.floor((now - alert.reportedAt) / 60000))} minutes ago
        </div>


        {/* REST / PENDING */}
        {isPending && (
          <div className="pt-4 border-t">
            <div className="text-xs text-gray-400 text-center">
              Click this request to view caller details.
            </div>
          </div>
        )}


        {/* ON CALL / RIGHT = END CALL */}
        {isAccepted && isCallActive && (
          <div className="pt-4 border-t">
            <button
              type="button"
              onClick={handleEndCall}
              className="w-full py-3 rounded-xl font-semibold bg-gray-900 text-white hover:bg-gray-800 transition"
            >
              End Call
            </button>
          </div>
        )}


        {/* CALL ENDED / RIGHT = APPROVED MESSAGE */}
        {isAccepted && isCallEnded && (
          <div className="pt-4 border-t">
            <div className="rounded-xl border bg-gray-50 p-4 text-center">
              <div className="text-sm font-semibold text-gray-900">
                REQUEST HAS BEEN APPROVED
              </div>

              <div className="text-xs text-gray-500 mt-1">
                The operator has ended the call.
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


// ============================================================
// HISTORY VIEW
// ============================================================

const HISTORY_PAGE_SIZE = 10;

// resolved and declined records both count as "closed"
const closedTime = a => a.resolvedAt || a.declinedAt || a.reportedAt || 0;

function formatDuration(min) {
  if (min == null) return '—';
  if (min < 1) return '< 1 min';
  if (min < 60) return `${Math.round(min)} min`;
  if (min < 1440) {
    return `${Math.floor(min / 60)} h ${Math.round(min % 60)} min`;
  }
  return `${Math.floor(min / 1440)} d ${Math.round((min % 1440) / 60)} h`;
}

function computeStats(alerts) {
  const resolved = alerts.filter(a => a.status === 'resolved');
  const declined = alerts.length - resolved.length;

  const durations = resolved
    .filter(a => a.resolvedAt && a.reportedAt)
    .map(a => Math.max(0, (a.resolvedAt - a.reportedAt) / 60000));

  const sortedDur = [...durations].sort((a, b) => a - b);
  const mid = Math.floor(sortedDur.length / 2);
  const medianMin = sortedDur.length
    ? sortedDur.length % 2
      ? sortedDur[mid]
      : (sortedDur[mid - 1] + sortedDur[mid]) / 2
    : null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // last 7 days, oldest first, today last
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - (6 - i));
    return {
      key: d.toDateString(),
      start: d.getTime(),
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      full: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count: 0
    };
  });

  const places = new Map();

  alerts.forEach(a => {
    const t = closedTime(a);

    for (let i = days.length - 1; i >= 0; i--) {
      if (t >= days[i].start) {
        days[i].count += 1;
        break;
      }
    }

    const name = a.barangay || 'Unknown';
    places.set(name, (places.get(name) || 0) + 1);
  });

  return {
    total: alerts.length,
    resolved: resolved.length,
    declined,
    medianMin,
    today: days[days.length - 1].count,
    week: days.reduce((sum, d) => sum + d.count, 0),
    days,
    locations: [...places.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  };
}

// Counts smoothly to a new value whenever it changes.
function CountUp({ value }) {
  const [shown, setShown] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      fromRef.current = value;
      setShown(value);
      return;
    }

    const from = fromRef.current;
    const startedAt = performance.now();
    let raf;

    const tick = now => {
      const p = Math.min(1, (now - startedAt) / 600);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = Math.round(from + (value - from) * eased);

      fromRef.current = next;
      setShown(next);

      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{shown}</>;
}

function Metric({ icon: Icon, label, accent, theme, children }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
          accent ? '' : 'bg-gray-100 text-gray-500'
        }`}
        style={
          accent
            ? { backgroundColor: theme.softHex, color: theme.hex }
            : undefined
        }
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0">
        <div className="text-lg font-semibold leading-none tabular-nums text-gray-900">
          {children}
        </div>
        <div className="mt-1 truncate text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

// Live statistics: recalculated from the records on every render,
// so it changes the moment an incident is resolved, declined or deleted.
function HistoryStats({ alerts, theme }) {
  const s = useMemo(() => computeStats(alerts), [alerts]);

  const maxDay = Math.max(1, ...s.days.map(d => d.count));
  const rate = s.total ? s.resolved / s.total : 0;

  const R = 26;
  const C = 2 * Math.PI * R;

  return (
    <section
      aria-label="Live statistics"
      className="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
    >
      <div className="grid gap-6 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
        {/* TOTAL + RESOLUTION RING */}
        <div className="flex items-center gap-4">
          <div className="relative h-[72px] w-[72px] shrink-0">
            <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={R}
                fill="none"
                strokeWidth="7"
                stroke={s.total ? theme.borderHex : '#F3F4F6'}
              />

              {s.resolved > 0 && (
                <circle
                  cx="32"
                  cy="32"
                  r={R}
                  fill="none"
                  strokeWidth="7"
                  strokeLinecap="round"
                  stroke={theme.hex}
                  strokeDasharray={`${rate * C} ${C}`}
                  className="transition-all duration-700"
                />
              )}
            </svg>

            <div className="absolute inset-0 grid place-items-center text-sm font-semibold tabular-nums text-gray-900">
              {s.total ? `${Math.round(rate * 100)}%` : '—'}
            </div>
          </div>

          <div>
            <div className="text-3xl font-semibold leading-none tabular-nums text-gray-900">
              <CountUp value={s.total} />
            </div>
            <div className="mt-1.5 text-xs text-gray-500">closed incidents</div>
          </div>
        </div>

        {/* KEY FIGURES */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <Metric icon={CheckCircle2} label="Resolved" accent theme={theme}>
            <CountUp value={s.resolved} />
          </Metric>

          <Metric icon={XCircle} label="Declined" theme={theme}>
            <CountUp value={s.declined} />
          </Metric>

          <Metric icon={CalendarDays} label="Closed today" accent theme={theme}>
            <CountUp value={s.today} />
          </Metric>

          <Metric icon={Timer} label="Median to resolve" theme={theme}>
            {formatDuration(s.medianMin)}
          </Metric>
        </div>

        {/* LAST 7 DAYS */}
        <div>
          <div className="mb-2 text-[11px] text-gray-400">Last 7 days</div>

          <div
            className="flex items-end gap-2.5"
            aria-label="Closed per day, last 7 days"
          >
            {s.days.map((d, i) => {
              const isToday = i === s.days.length - 1;
              const height = d.count
                ? Math.max(8, Math.round((d.count / maxDay) * 44))
                : 6;

              return (
                <div
                  key={d.key}
                  title={`${d.count} closed on ${d.full}`}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="flex h-11 items-end">
                    <div
                      className="w-3 rounded-full transition-all duration-700"
                      style={{
                        height,
                        backgroundColor: d.count ? theme.hex : '#E5E7EB',
                        opacity: d.count && !isToday ? 0.35 : 1
                      }}
                    />
                  </div>

                  <span
                    className={`text-[10px] ${
                      isToday ? 'font-semibold text-gray-800' : 'text-gray-400'
                    }`}
                  >
                    {d.label.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BUSIEST LOCATIONS + LIVE */}
      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-3 text-xs text-gray-500">
        {s.locations.length > 0 && <span className="mr-1">Busiest</span>}

        {s.locations.slice(0, 4).map(place => (
          <span
            key={place.name}
            className="inline-flex items-center gap-1.5 rounded-full bg-white py-1 pl-3 pr-1.5 text-gray-700 ring-1 ring-gray-200"
          >
            {place.name}
            <span
              className="grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-semibold tabular-nums"
              style={{ backgroundColor: theme.softHex, color: theme.hex }}
            >
              {place.count}
            </span>
          </span>
        ))}

        <span className="ml-auto flex items-center gap-1.5 text-gray-400">
          <span className="relative flex h-1.5 w-1.5">
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping"
              style={{ backgroundColor: theme.hex }}
            />
            <span
              className="relative inline-flex h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: theme.hex }}
            />
          </span>
          Live
        </span>
      </div>
    </section>
  );
}

function pageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);

  if (from > 2) items.push('…');
  for (let n = from; n <= to; n++) items.push(n);
  if (to < total - 1) items.push('…');

  items.push(total);
  return items;
}

function Pagination({ page, totalPages, total, pageSize, onChange, theme }) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const nav =
    'grid h-8 min-w-8 place-items-center rounded-lg px-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
      <span className="text-xs text-gray-500">
        Showing {from}–{to} of {total}
      </span>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className={`${nav} text-gray-600 hover:bg-gray-100`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pageItems(page, totalPages).map((item, i) =>
          item === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-gray-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              aria-current={item === page ? 'page' : undefined}
              className={`${nav} ${
                item === page ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={item === page ? { backgroundColor: theme.hex } : undefined}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          aria-label="Next page"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className={`${nav} text-gray-600 hover:bg-gray-100`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}

// alerts = every closed record (resolved + declined) for this department
export function HistoryView({ alerts, theme, onExport, onDeleteAll }) {
  const [openId, setOpenId] = useState(null);
  const [page, setPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const total = alerts.length;
  const hasRecords = total > 0;

  const sorted = useMemo(
    () => [...alerts].sort((a, b) => closedTime(b) - closedTime(a)),
    [alerts]
  );

  // 10 rows per page. The page number is clamped so deleting
  // records can never leave you on a page that no longer exists.
  const totalPages = Math.max(1, Math.ceil(sorted.length / HISTORY_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const shown = sorted.slice(
    (currentPage - 1) * HISTORY_PAGE_SIZE,
    currentPage * HISTORY_PAGE_SIZE
  );

  const openAlert = sorted.find(alert => alert.id === openId);

  const handleConfirmDelete = saveBackup => {
    // JSON keeps messages and ID photos, so it is the full backup.
    if (saveBackup && onExport) onExport('json');
    if (onDeleteAll) onDeleteAll();

    setConfirmOpen(false);
    setOpenId(null);
    setPage(1);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Incident History</h2>
            <p className="text-sm text-gray-500 mt-1">
              Resolved and declined incidents for this department. Select a record to view its full details.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onExport && onExport('csv')}
              disabled={!hasRecords}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: theme.hex }}
              title="Export all records as a spreadsheet (CSV)"
            >
              <Download className="h-4 w-4" />
              Export
            </button>

            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={!hasRecords}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              Delete all
            </button>
          </div>
        </div>

        <HistoryStats alerts={alerts} theme={theme} />

        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">

          {!sorted.length ? (
            <div className="p-16 text-center text-gray-500">
              No closed incidents yet. Resolved and declined requests will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Caller</th>
                    <th className="px-5 py-4">Location</th>
                    <th className="px-5 py-4">Reported</th>
                    <th className="px-5 py-4">Closed</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4" />
                  </tr>
                </thead>

                <tbody className="divide-y">

                  {shown.map(alert => (
                    <tr
                      key={alert.id}
                      onClick={() => setOpenId(alert.id)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-5 py-4 font-mono text-gray-500">
                        ES-{String(alert.id).padStart(4, '0')}
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {alert.caller}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {alert.barangay}
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {new Date(alert.reportedAt).toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {new Date(closedTime(alert)).toLocaleString()}
                      </td>

                      <td className="px-5 py-4">
                        {alert.status === 'declined' ? (
                          <span className="inline-flex rounded-md bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red-700">
                            Declined
                          </span>
                        ) : (
                          <span className="status-pill resolved">
                            Resolved
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-gray-400">
                        <ChevronRight className="h-4 w-4" />
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          )}

          {sorted.length > HISTORY_PAGE_SIZE && (
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              total={sorted.length}
              pageSize={HISTORY_PAGE_SIZE}
              onChange={setPage}
              theme={theme}
            />
          )}
        </div>
      </div>

      {openAlert && (
        <HistoryDetailModal
          alert={openAlert}
          theme={theme}
          onClose={() => setOpenId(null)}
        />
      )}

      {confirmOpen && (
        <DeleteAllModal
          count={total}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}


// ============================================================
// DELETE ALL CONFIRMATION
// ============================================================

function DeleteAllModal({ count, onCancel, onConfirm }) {
  const [saveBackup, setSaveBackup] = useState(true);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal-panel"
        onClick={event => event.stopPropagation()}
      >
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
              <Trash2 className="h-5 w-5" />
            </span>

            <div>
              <h2 className="text-lg font-bold">Delete all history?</h2>

              <p className="mt-1 text-sm text-gray-500">
                This permanently removes {count} record{count !== 1 ? 's' : ''} for
                this department, including their message logs and uploaded ID
                photos. This cannot be undone.
              </p>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-gray-50 p-3">
            <input
              type="checkbox"
              checked={saveBackup}
              onChange={event => setSaveBackup(event.target.checked)}
              className="mt-0.5 h-4 w-4"
            />

            <span className="text-sm">
              <span className="block font-semibold text-gray-900">
                Save a backup file first
              </span>
              <span className="block text-xs text-gray-500">
                Downloads a JSON copy of every record before deleting.
              </span>
            </span>
          </label>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border-2 border-gray-100 py-3 text-sm font-semibold text-gray-800 hover:border-gray-200 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => onConfirm(saveBackup)}
              className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 transition"
            >
              {saveBackup ? 'Save & delete all' : 'Delete all'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// HISTORY DETAIL MODAL
// ============================================================

function HistoryDetailModal({ alert, theme, onClose }) {
  // Photo of the physical ID the caller uploaded, if any.
  const idImage = alert.idImage || alert.idPhoto || alert.idCardUrl || null;

  const isDeclined = alert.status === 'declined';
  const closedAt = alert.resolvedAt || alert.declinedAt || alert.reportedAt;

  const durationMin = Math.max(0, Math.round((closedAt - alert.reportedAt) / 60000));

  return (
    <div className="modal-backdrop" onClick={onClose}>

      <div
        className="modal-panel"
        onClick={event => event.stopPropagation()}
      >

        <div
          className="p-4 border-b flex items-start justify-between"
          style={{ backgroundColor: theme.softHex }}
        >

          <div>

            <div
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: theme.hex }}
            >
              {theme.label} · ES-{String(alert.id).padStart(4, '0')}
            </div>

            <h2 className="font-bold text-xl mt-1">
              {alert.caller}
            </h2>

          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg grid place-items-center hover:bg-white/70 text-gray-500"
            aria-label="Close details"
          >
            <X className="h-4 w-4" />
          </button>

        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

          <Info label="Location">
            <span className="font-semibold">
              {alert.barangay}
            </span>

            <span className="text-gray-400">
              ({alert.dist} km)
            </span>
          </Info>

          <Info label="Contact">
            <a
              className="font-semibold text-gray-900 hover:underline"
              href={`tel:${alert.phone}`}
            >
              <Phone className="inline h-3.5 w-3.5 mr-1" />
              {alert.phone}
            </a>
          </Info>

          <Info label="Situation report">
            <div className="bg-gray-50 rounded-lg border p-3 text-sm leading-6">
              {alert.description}
            </div>
          </Info>

          <div className="grid grid-cols-2 gap-4">

            <Info label="Reported">
              <span className="text-sm">
                {new Date(alert.reportedAt).toLocaleString()}
              </span>
            </Info>

            <Info label={isDeclined ? 'Declined' : 'Resolved'}>
              <span className="text-sm">
                {new Date(closedAt).toLocaleString()}
              </span>
            </Info>

          </div>

          <Info label={isDeclined ? 'Time to decline' : 'Time to resolve'}>
            <span className="text-sm font-semibold">
              {durationMin} minute{durationMin !== 1 ? 's' : ''}
            </span>
          </Info>

          {idImage && (
            <IdCardPreview
              src={idImage}
              name={alert.caller}
              theme={theme}
            />
          )}

          <MessageLog messages={alert.messages} theme={theme} />

          <div className="pt-4 border-t">
            {isDeclined ? (
              <span className="inline-flex rounded-md bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red-700">
                Declined
              </span>
            ) : (
              <span className="status-pill resolved">
                Resolved
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}


// ============================================================
// SETTINGS VIEW
// ============================================================

export function SettingsView({ settings, toggle, theme, session }) {
  return (
    <div className="flex-1 overflow-y-auto p-8">

      <div className="max-w-5xl mx-auto">

        <h2 className="text-2xl font-bold">
          Console Settings
        </h2>

        <p className="text-sm text-gray-500 mt-1 mb-7">
          Manage dispatcher preferences and notification behavior.
        </p>

        <div className="grid md:grid-cols-2 gap-6">

          <SettingsCard
            title="Responder station"
            desc="Current station configuration."
          >
            <Row label="Station" value="E-Sagip Main Dispatch" />
            <Row label="Coverage" value="10 km response radius" />
          </SettingsCard>

          <SettingsCard
            title="Dispatch preferences"
            desc="Control how this console behaves."
          >
            <Toggle
              label="Alert sound"
              desc="Play a sound for new caller alerts"
              value={settings.sound}
              onClick={() => toggle('sound')}
              theme={theme}
            />

            <Toggle
              label="Auto refresh"
              desc="Refresh incident data automatically"
              value={settings.refresh}
              onClick={() => toggle('refresh')}
              theme={theme}
            />
          </SettingsCard>

          <SettingsCard
            title="Notifications"
            desc="Operational notices shown in the console."
          >
            <Toggle
              label="Status updates"
              desc="Show accepted and resolved activity"
              value={settings.status}
              onClick={() => toggle('status')}
              theme={theme}
            />

            <Toggle
              label="System notices"
              desc="Connection and service messages"
              value={settings.system}
              onClick={() => toggle('system')}
              theme={theme}
            />
          </SettingsCard>

          <SettingsCard
            title="Session"
            desc="Current responder account."
          >
            <Row
              label="Dispatcher"
              value={session.name || session.email}
            />

            <Row
              label="Department"
              value={theme.label}
            />

            <Row
              label="Connection"
              value="Live / Connected"
              green
            />
          </SettingsCard>

        </div>
      </div>
    </div>
  );
}


// ============================================================
// SHARED HELPERS
// ============================================================

// Read-only copy of the chat that happened during the incident.
function MessageLog({ messages, theme }) {
  const list = messages || [];

  return (
    <Info label={`Message log (${list.length})`}>
      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed p-3 text-center text-sm text-gray-400">
          No messages were sent for this incident.
        </div>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border bg-gray-50 p-3">
          {list.map(message => {
            const mine = message.from === 'dispatcher';

            return (
              <div
                key={message.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[85%]">
                  <div
                    className={`px-3 py-2 text-sm break-words whitespace-pre-wrap ${
                      mine
                        ? 'rounded-2xl rounded-br-sm text-white'
                        : 'rounded-2xl rounded-bl-sm border bg-white text-gray-800'
                    }`}
                    style={mine ? { backgroundColor: theme.hex } : undefined}
                  >
                    {message.text}
                  </div>

                  <div
                    className={`mt-0.5 px-1 text-[10px] text-gray-400 ${
                      mine ? 'text-right' : ''
                    }`}
                  >
                    {mine ? 'Dispatcher' : 'Caller'} ·{' '}
                    {new Date(message.at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Info>
  );
}


function Info({ label, children }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-gray-500 mb-1">
        {label}
      </div>

      {children}
    </div>
  );
}

function SettingsCard({ title, desc, children }) {
  return (
    <section className="bg-white rounded-xl border p-6 shadow-sm">

      <h3 className="font-bold text-lg">
        {title}
      </h3>

      <p className="text-sm text-gray-500 mt-1 mb-5">
        {desc}
      </p>

      <div className="divide-y">
        {children}
      </div>

    </section>
  );
}

function Row({ label, value, green }) {
  return (
    <div className="py-3 flex items-center justify-between gap-5">

      <div className="text-sm font-semibold">
        {label}
      </div>

      <div
        className={`text-sm ${
          green
            ? 'text-green-600 font-medium'
            : 'text-gray-500'
        } text-right`}
      >
        {value}
      </div>

    </div>
  );
}

function Toggle({ label, desc, value, onClick, theme }) {
  return (
    <div className="py-3 flex items-center justify-between gap-5">

      <div>

        <div className="text-sm font-semibold">
          {label}
        </div>

        <div className="text-xs text-gray-500 mt-1">
          {desc}
        </div>

      </div>

      <button
        onClick={onClick}
        aria-label={`Toggle ${label}`}
        className="h-6 w-10 rounded-full p-1 transition"
        style={{
          backgroundColor: value ? theme.hex : '#E5E7EB'
        }}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white shadow transition ${
            value ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>

    </div>
  );
}