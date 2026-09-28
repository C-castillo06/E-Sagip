'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';

// ========================================
// MESSAGE PANE
//
// Chat view for one incident (Grab-style):
// caller bubbles on the left, dispatcher
// bubbles on the right in the theme color.
//
// Replaces the Caller Details view in the left
// pane; the back arrow returns to the details.
// Messages live on the incident itself
// (alert.messages) so they persist with it.
// ========================================

function formatTime(ms) {
  return new Date(ms).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

export default function MessagePane({ alert, theme, onBack, onSend }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  const messages = alert.messages || [];
  const isCallEnded = alert.callStatus === 'ended';

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  function send() {
    const body = text.trim();
    if (!body) return;

    onSend(body);
    setText('');
  }

  function handleKeyDown(e) {
    // Enter sends, Shift+Enter adds a new line.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="queue-panel flex flex-col h-full bg-white">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
          aria-label="Back to caller details"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${theme.bgLight} ${theme.text}`}
        >
          {(alert.caller || '?')[0].toUpperCase()}
        </div>

        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">
            {alert.caller}
          </div>

          <div className="text-xs text-gray-500 truncate">
            {isCallEnded ? 'Call ended' : 'On call'}
            {alert.phone ? ` · ${alert.phone}` : ''}
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
        {/* The caller's original report is always the first bubble. */}
        {alert.description && (
          <div className="flex justify-start">
            <div className="max-w-[80%]">
              <div className="rounded-2xl rounded-bl-sm bg-white border border-gray-100 px-3.5 py-2.5 text-sm text-gray-800 shadow-sm break-words whitespace-pre-wrap">
                {alert.description}
              </div>

              <div className="mt-1 px-1 text-[10px] text-gray-400">
                Initial report · {formatTime(alert.reportedAt)}
              </div>
            </div>
          </div>
        )}

        {messages.length === 0 && (
          <div className="text-center text-xs text-gray-400 pt-6">
            No messages yet. Send the caller a message below.
          </div>
        )}

        {messages.map(message => {
          const mine = message.from === 'dispatcher';

          return (
            <div
              key={message.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[80%]">
                <div
                  className={`px-3.5 py-2.5 text-sm shadow-sm break-words whitespace-pre-wrap ${
                    mine
                      ? `rounded-2xl rounded-br-sm text-white ${theme.bg}`
                      : 'rounded-2xl rounded-bl-sm bg-white border border-gray-100 text-gray-800'
                  }`}
                >
                  {message.text}
                </div>

                <div
                  className={`mt-1 px-1 text-[10px] text-gray-400 ${
                    mine ? 'text-right' : ''
                  }`}
                >
                  {formatTime(message.at)}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="p-3 border-t border-gray-100 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message..."
            className="field flex-1 resize-none max-h-28"
          />

          <button
            type="button"
            onClick={send}
            disabled={!text.trim()}
            aria-label="Send message"
            className={`h-11 w-11 shrink-0 rounded-xl grid place-items-center text-white transition ${
              text.trim() ? theme.bg : 'bg-gray-200 cursor-not-allowed'
            }`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
