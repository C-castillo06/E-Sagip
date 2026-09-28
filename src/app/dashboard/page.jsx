'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, Siren } from 'lucide-react';

import Sidebar from '../../components/dashboard/Sidebar';
import QueueList from '../../components/dashboard/QueueList';
import IncidentMap from '../../components/dashboard/IncidentMap';

import { THEMES } from '../../lib/themes';

import { useSession } from '../../hooks/useSession';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../hooks/useToast';
import { useClock } from '../../hooks/useClock';
import { useIncidents } from '../../hooks/useIncidents';

import {
  HistoryView,
  IncidentCard,
  MapCallersCard,
  SettingsView
} from '../../components/dashboard/DashboardViews';

export default function DashboardPage() {
  // ========================================
  // HOOKS
  // ========================================

  const { session, logout } = useSession();
  const { settings, toggle } = useSettings();
  const { toast, flash } = useToast();
  const now = useClock();

  const [activeTab, setActiveTab] = useState('queue');
  const [profileOpen, setProfileOpen] = useState(false);

  const role = session?.role;
  const theme = role ? THEMES[role] : THEMES.fire;

  const {
    departmentAlerts,
    activeAlerts,
    activeCount,
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
    exportHistory,
    clearHistory,
    resetData,
    simulate
  } = useIncidents({ role, theme, soundEnabled: settings.sound, flash });

  // ========================================
  // LOADING
  // ========================================

  if (!session) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#FAF7F2] text-sm text-gray-500">
        Loading E-Sagip console...
      </div>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div
      className="h-screen flex bg-[#FAF7F2] overflow-hidden"
      style={{
        '--theme-accent': theme.hex,
        '--theme-accent-dark': theme.darkHex,
        '--theme-accent-soft': theme.softHex
      }}
    >
      <Sidebar theme={theme} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* ========================================
            HEADER
        ======================================== */}

        <header className="h-[70px] bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-['Space_Grotesk'] font-bold text-xl">
                {activeTab === 'queue'
                  ? 'Live Queue'
                  : activeTab === 'map'
                    ? 'Tactical Map'
                    : activeTab === 'history'
                      ? 'Incident History'
                      : 'Settings'}
              </h1>

              <span
                className="live-badge"
                style={{
                  backgroundColor: theme.softHex,
                  color: theme.hex
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{
                    backgroundColor: theme.hex
                  }}
                />
                Live
              </span>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              {theme.label} · {activeCount} active incident
              {activeCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={simulate} className="secondary-btn hidden sm:flex">
              <Siren className="h-4 w-4" />
              Run Drill Alert
            </button>

            <div className="relative">
              <button onClick={() => setProfileOpen(v => !v)} className="profile-btn">
                <span
                  className="h-7 w-7 rounded-full grid place-items-center"
                  style={{
                    backgroundColor: theme.softHex,
                    color: theme.hex
                  }}
                >
                  <span className="text-xs font-bold">
                    {(session.name || session.email)[0].toUpperCase()}
                  </span>
                </span>

                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {profileOpen && (
                <div className="profile-menu">
                  <div className="px-3 py-2 border-b">
                    <div className="font-semibold text-sm truncate">
                      {session.name || 'Dispatcher'}
                    </div>

                    <div className="text-xs text-gray-500 truncate">
                      {session.email}
                    </div>

                    <div
                      className="text-xs font-semibold mt-1"
                      style={{
                        color: theme.hex
                      }}
                    >
                      {theme.label}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setProfileOpen(false);
                    }}
                    className="menu-item"
                  >
                    Settings
                  </button>

                  <button onClick={logout} className="menu-item text-red-600">
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ========================================
            QUEUE
        ======================================== */}

        {activeTab === 'queue' && (
          <>
            <div
              className="h-12 bg-white border-b border-gray-200 flex items-center px-6 shrink-0 text-sm font-semibold"
              style={{
                color: theme.hex
              }}
            >
              Active caller alerts ({activeCount})
            </div>

            <div className="flex-1 overflow-hidden flex relative">
              {/* LEFT PANE: QueueList -> QueueInfo */}
              <QueueList
                alerts={activeAlerts}
                selectedAlertId={selectedId}
                setSelectedAlertId={setSelectedId}
                theme={theme}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onDispatch={handleDispatch}
                onResolve={handleMoveToHistory}
                onCallAgain={handleCallAgain}
                onSendMessage={handleSendMessage}
              />

              {/* MAP */}
              <div className="flex-1 relative min-w-0 map-pane">
                <IncidentMap
                  alerts={activeAlerts}
                  theme={theme}
                  selectedId={selectedId}
                  onSelectAlert={setSelectedId}
                  station={session.station}
                />
              </div>

              {/* RIGHT PANE: IncidentCard */}
              {selected && (
                <IncidentCard
                  key={`${selected.id}-${selected.status}-${selected.callStatus}-${selected.dispatchStatus}`}
                  alert={selected}
                  theme={theme}
                  now={now}
                  UpdateStatus={UpdateStatus}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onDispatch={handleDispatch}
                  onEndCall={handleEndCall}
                  onResolve={handleMoveToHistory}
                  onSelect={() => handleSelectIncident(selected.id)}
                />
              )}
            </div>
          </>
        )}

        {/* ========================================
            TACTICAL MAP
        ======================================== */}

        {activeTab === 'map' &&
          (() => {
            const activeOnMap = departmentAlerts.filter(
              alert => alert.status !== 'resolved' && alert.status !== 'declined'
            );

            const goToCaller = id => {
              setSelectedId(id);
              setActiveTab('queue');
            };

            return (
              <div className="flex-1 relative">
                <IncidentMap
                  alerts={activeOnMap}
                  theme={theme}
                  selectedId={null}
                  onSelectAlert={goToCaller}
                  station={session.station}
                />

                <MapCallersCard
                  alerts={activeOnMap}
                  theme={theme}
                  onSelectAlert={goToCaller}
                />
              </div>
            );
          })()}

        {/* ========================================
            HISTORY

            Closed = resolved OR declined. Export and
            Delete all come from useIncidents.
        ======================================== */}

        {activeTab === 'history' && (
          <HistoryView
            alerts={departmentAlerts.filter(
              alert => alert.status === 'resolved' || alert.status === 'declined'
            )}
            theme={theme}
            onExport={exportHistory}
            onDeleteAll={clearHistory}
          />
        )}

        {/* ========================================
            SETTINGS
        ======================================== */}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            toggle={toggle}
            theme={theme}
            session={session}
            resetData={resetData}
          />
        )}

        {/* ========================================
            TOAST
        ======================================== */}

        {toast && (
          <div className="toast">
            <CheckCircle2 className="h-4 w-4" style={{ color: theme.hex }} />
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}
