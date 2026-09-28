import { Clock3, MapPin, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import QueueInfo from './queueInfo';

export default function QueueList({
  alerts = [],
  selectedAlertId,
  setSelectedAlertId,
  theme,
  onAccept,
  onDecline,
  onDispatch,
  onResolve,
  onCallAgain,
  onSendMessage
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return q
      ? alerts.filter(a =>
          [a.caller, a.barangay, a.phone, a.description]
            .some(v => v?.toLowerCase().includes(q))
        )
      : alerts;
  }, [alerts, query]);

  const selected = alerts.find(a => a.id === selectedAlertId);

  if (selected) {
    return (
      <QueueInfo
        selected={selected}
        theme={theme}
        onBack={() => setSelectedAlertId(null)}
        onAccept={onAccept}
        onDecline={onDecline}
        onDispatch={onDispatch}
        onResolve={onResolve}
        onCallAgain={onCallAgain}
        onSendMessage={onSendMessage}
      />
    );
  }

  return (
    <div className="queue-panel">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            type="search"
            placeholder="Search incidents..."
            className="field"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center p-8 text-gray-500 text-sm">
            No incidents match your search.
          </div>
        ) : (
          filtered.map(alert => (
            <button
              type="button"
              key={alert.id}
              onClick={() => setSelectedAlertId(alert.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selectedAlertId === alert.id
                  ? `${theme.border} ${theme.bgLight}`
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-semibold text-gray-900 truncate pr-2">
                  {alert.caller}
                </div>

                <span className={`status-pill ${alert.status}`}>
                  {alert.status}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-500 truncate mb-3">
                <MapPin className="h-3 w-3 shrink-0" />
                {alert.barangay}
              </div>

              <div className="flex items-center justify-between text-[11px] font-medium text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock3 className="w-3.5 h-3.5" />

                  {Math.max(
                    0,
                    Math.floor(
                      (Date.now() - alert.reportedAt) / 60000
                    )
                  )}
                  m ago
                </span>

                <span>{alert.dist} km</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
