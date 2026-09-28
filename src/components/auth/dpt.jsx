'use client';

import { CheckCircle } from 'lucide-react';
import { THEMES } from '../../lib/themes';

// ========================================
// DEPARTMENT PICKER
//
// Same selection concept on both auth pages —
// click a theme tile to pick a department —
// just styled differently: "grid" (login, small
// square tiles) vs "rows" (register, full-width
// rows with descriptions).
// ========================================

export default function DepartmentPicker({ value, onChange, variant = 'grid' }) {
  if (variant === 'rows') {
    return (
      <div className="grid gap-3">
        {Object.values(THEMES).map(theme => {
          const Icon = theme.icon;
          const selected = value === theme.id;

          return (
            <button
              type="button"
              key={theme.id}
              onClick={() => onChange(theme.id)}
              className={`relative flex items-center gap-4 rounded-xl border-2 p-4 text-left transition ${
                selected ? 'shadow-sm' : 'border-gray-100 hover:border-gray-200'
              }`}
              style={selected ? { borderColor: theme.hex, backgroundColor: theme.softHex } : undefined}
            >
              <span
                className="icon-box h-10 w-10"
                style={selected ? { backgroundColor: theme.hex } : { backgroundColor: '#F3F4F6' }}
              >
                <Icon className="h-5 w-5" style={{ color: selected ? '#fff' : '#6B7280' }} />
              </span>

              <span>
                <strong className="block text-sm" style={selected ? { color: theme.hex } : undefined}>
                  {theme.label}
                </strong>
                <small className="text-xs text-gray-500">
                  Manage {theme.short.toLowerCase()} incidents
                </small>
              </span>

              {selected && <CheckCircle className="ml-auto h-5 w-5" style={{ color: theme.hex }} />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.values(THEMES).map(theme => {
        const Icon = theme.icon;
        const selected = value === theme.id;

        return (
          <button
            type="button"
            key={theme.id}
            onClick={() => onChange(theme.id)}
            className={`role-card ${selected ? 'shadow-sm' : ''}`}
            style={selected ? { borderColor: theme.hex, backgroundColor: theme.softHex } : undefined}
          >
            <span
              className="icon-box"
              style={selected ? { backgroundColor: theme.hex } : { backgroundColor: '#F3F4F6' }}
            >
              <Icon className="h-4 w-4" style={{ color: selected ? '#fff' : '#6B7280' }} />
            </span>

            <span className="text-xs font-semibold" style={selected ? { color: theme.hex } : undefined}>
              {theme.short}
            </span>

            {selected && (
              <CheckCircle className="absolute right-2 top-2 h-4 w-4" style={{ color: theme.hex }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
