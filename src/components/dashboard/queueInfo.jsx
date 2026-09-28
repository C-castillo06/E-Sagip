'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  IdCard,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
  PhoneCall,
  User,
  X
} from 'lucide-react';

import MessagePane from './MessagePane';

// ========================================
// ID CARD PREVIEW
//
// Shows the physical ID the caller uploaded
// (a photo of the card) as a thumbnail.
// Click it to open a full-size viewer; Esc,
// the X button, or clicking the dark backdrop
// closes it.
//
// `src` can be an image URL or a data: URL.
// With no `src`, a "No ID uploaded" placeholder
// is shown instead.
// ========================================

export function IdCardPreview({ src, name, theme }) {
  const [open, setOpen] = useState(false);

  // Close the viewer with the Escape key.
  useEffect(() => {
    if (!open) return;

    const onKey = e => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
        Submitted ID
      </div>

      {src ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative block w-full overflow-hidden rounded-xl border-2 border-gray-100 bg-gray-50 hover:border-gray-200 transition"
          aria-label="View ID card full size"
        >
          <img
            src={src}
            alt={name ? `ID card of ${name}` : 'Uploaded ID card'}
            className="w-full h-40 object-contain"
          />

          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-semibold text-white opacity-90 group-hover:opacity-100">
            <Maximize2 className="h-3 w-3" />
            Enlarge
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${theme.bgLight}`}
          >
            <IdCard className={`h-5 w-5 ${theme.text}`} />
          </span>
          No ID uploaded
        </div>
      )}

      {/* FULL-SIZE VIEWER (portal keeps it above the map and panes) */}
      {open &&
        src &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 p-6"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Uploaded ID card"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <img
              src={src}
              alt={name ? `ID card of ${name}` : 'Uploaded ID card'}
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          </div>,
          document.body
        )}
    </div>
  );
}


export default function QueueInfo({
  selected,
  theme,
  onBack,
  onAccept,
  onDecline,
  onDispatch,
  onResolve,
  onCallAgain,
  onSendMessage
}) {
  // ========================================
  // INCIDENT STATE
  // ========================================

  const isPending = selected.status === 'pending';

  const isAccepted = selected.status === 'accepted';

  // Once accepted, the call is active until
  // the End Call button on the RIGHT pane is clicked.
  const isCallEnded = selected.callStatus === 'ended';

  const isCallActive = isAccepted && !isCallEnded;

  const isDispatched =
    selected.dispatchStatus === 'dispatched';

  // Photo of the physical ID card the caller uploaded, if any.
  // (Image URL or data: URL.)
  const idImage =
    selected.idImage || selected.idPhoto || selected.idCardUrl || null;

  // Message pane (chat) replaces the details view while open.
  const [showMessages, setShowMessages] = useState(false);

  const messageCount = (selected.messages || []).length;

  if (showMessages && isAccepted) {
    return (
      <MessagePane
        alert={selected}
        theme={theme}
        onBack={() => setShowMessages(false)}
        onSend={onSendMessage}
      />
    );
  }


  // ========================================
  // UI
  // ========================================

  return (
    <div className="queue-panel flex flex-col h-full bg-white">

      {/* ==================================
          HEADER
      ================================== */}

      <div className="p-4 border-b border-gray-100 flex items-center gap-3 shrink-0">

        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div>
          <div className="text-sm font-bold text-gray-900">
            Caller Details
          </div>

          <div className={`text-xs font-semibold ${theme.text}`}>
            {theme.label}
          </div>
        </div>

      </div>


      {/* ==================================
          INCIDENT INFORMATION
      ================================== */}

      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* STATUS / TIME */}

        <div className="flex justify-between items-center">

          <span
            className={`status-pill ${
              isPending ? 'pending' : 'accepted'
            }`}
          >
            {isPending
              ? 'Pending'
              : isCallEnded
                ? 'Call Ended'
                : 'On Call'}
          </span>

          <span className="text-sm font-medium text-gray-500">
            {Math.max(
              0,
              Math.floor(
                (Date.now() - selected.reportedAt) / 60000
              )
            )}
            m ago
          </span>

        </div>


        {/* CALLER INFORMATION */}

        <div className="bg-gray-50 rounded-xl p-4 space-y-3">

          <div className="flex items-center gap-3">

            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${theme.bgLight}`}
            >
              <User
                className={`w-5 h-5 ${theme.text}`}
              />
            </div>

            <div>

              <div className="font-semibold text-gray-900">
                {selected.caller}
              </div>

              <div className="text-xs text-gray-500">
                Mobile Caller
              </div>

            </div>

          </div>


          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone className="w-4 h-4 text-gray-400" />
            {selected.phone || 'No phone provided'}
          </div>


          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-gray-400" />
            {selected.barangay}
          </div>

        </div>


        {/* SUBMITTED ID CARD */}

        <IdCardPreview
          src={idImage}
          name={selected.caller}
          theme={theme}
        />


        {/* DESCRIPTION */}

        {selected.description && (
          <div>

            <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Description
            </div>

            <p className="text-sm text-gray-700 leading-relaxed">
              {selected.description}
            </p>

          </div>
        )}


        {/* DISTANCE */}

        <div className="text-sm text-gray-500">

          Distance:{' '}

          <span className="font-semibold text-gray-800">
            {selected.dist} km
          </span>

        </div>

      </div>


      {/* ==================================
          LEFT PANE ACTIONS
      ================================== */}

      <div className="p-4 border-t border-gray-100 space-y-2 shrink-0">


        {/* ==================================
            PENDING
            LEFT = ACCEPT + DECLINE
        ================================== */}

        {isPending && (
          <>
            <button
              onClick={onAccept}
              className={`w-full py-3 rounded-xl font-semibold text-white ${theme.bg}`}
            >
              Accept Request
            </button>

            <button
              onClick={onDecline}
              className="w-full py-3 rounded-xl font-semibold bg-gray-900 text-white hover:bg-gray-800 transition">
              Decline Request
            </button>
          </>
        )}


        {/* ==================================
            ACCEPTED (on call OR call ended)
            LEFT = MESSAGE + CALL AGAIN

            Call Again stays greyed out while a call
            is ongoing and lights up in the theme
            color once End Call has been pressed.
        ================================== */}

        {isAccepted && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowMessages(true)}
              className="relative py-3 rounded-xl font-semibold text-sm border-2 border-gray-100 bg-white text-gray-800 hover:border-gray-200 transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Message

              {messageCount > 0 && (
                <span
                  className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold text-white grid place-items-center ${theme.bg}`}
                >
                  {messageCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onCallAgain}
              disabled={!isCallEnded}
              className={`py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition ${
                isCallEnded
                  ? `text-white ${theme.bg} hover:opacity-90`
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              Call Again
            </button>
          </div>
        )}


        {/* ==================================
            ACCEPTED / ON CALL
            LEFT = DISPATCH ONLY
        ================================== */}

        {isAccepted && isCallActive && (
          <button
            onClick={onDispatch}
            disabled={isDispatched}
            className={`w-full py-3 rounded-xl font-semibold ${
              isDispatched
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : `text-white ${theme.bg}`
            }`}
          >
            {isDispatched
              ? 'Unit Dispatched'
              : 'Dispatch a Unit'}
          </button>
        )}


        {/* ==================================
            CALL ENDED
            LEFT = MOVE TO HISTORY
        ================================== */}

        {isAccepted && isCallEnded && (
          <button
            onClick={onResolve}
            className={`w-full py-3 rounded-xl font-semibold text-white ${theme.bg}`}
          >
            Move this Request to History
          </button>
        )}

      </div>

    </div>
  );
}
