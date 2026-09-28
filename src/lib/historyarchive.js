// ========================================
// HISTORY ARCHIVE
//
// Limits and file-export helpers for the
// Incident History.
//
//  - HISTORY_CAP             hard limit on stored closed
//                            records (resolved + declined)
//  - HISTORY_WARN_AT         history page starts warning here
//  - HISTORY_KEEP_AFTER_ARCHIVE
//                            newest records kept in the app
//                            after an automatic archive
//                            (0 = clear everything)
//  - HISTORY_MAX_CHARS       second safety net: browser storage
//                            is only ~5 MB, and uploaded ID
//                            photos can fill it long before
//                            1000 records, so size triggers
//                            an archive too
// ========================================

export const HISTORY_CAP = 1000;
export const HISTORY_WARN_AT = 800;
export const HISTORY_KEEP_AFTER_ARCHIVE = 0;
export const HISTORY_MAX_CHARS = 4_000_000;

// ----------------------------------------
// small formatting helpers
// ----------------------------------------

const pad = n => String(n).padStart(2, '0');

function formatDateTime(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '';

  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

function fileStamp() {
  const d = new Date();

  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_` +
    `${pad(d.getHours())}-${pad(d.getMinutes())}`
  );
}

function slug(text) {
  return String(text || 'dispatch')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function incidentCode(alert) {
  return `ES-${String(alert.id).padStart(4, '0')}`;
}

function getIdImage(alert) {
  return alert.idImage || alert.idPhoto || alert.idCardUrl || null;
}

// ----------------------------------------
// CSV
// ----------------------------------------

function csvCell(value) {
  let s = value == null ? '' : String(value);

  // Stop spreadsheet apps from running caller-typed text as a formula
  // (=, @, or +/- followed by something that isn't a plain number/phone).
  const looksNumeric = /^[+-]?[\d\s().-]+$/.test(s);

  if (/^[=@\t\r]/.test(s) || (/^[+-]/.test(s) && !looksNumeric)) {
    s = `'${s}`;
  }

  if (/[",\n\r]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }

  return s;
}

const CSV_COLUMNS = [
  ['ID', a => incidentCode(a)],
  ['Status', a => a.status],
  ['Caller', a => a.caller],
  ['Phone', a => a.phone],
  ['Location', a => a.barangay],
  ['Distance (km)', a => a.dist],
  ['Description', a => a.description],
  ['Reported', a => formatDateTime(a.reportedAt)],
  ['Accepted', a => formatDateTime(a.acceptedAt)],
  ['Dispatched', a => formatDateTime(a.dispatchedAt)],
  ['Call ended', a => formatDateTime(a.endedAt)],
  ['Resolved', a => formatDateTime(a.resolvedAt)],
  ['Declined', a => formatDateTime(a.declinedAt)],
  [
    'Minutes to resolve',
    a =>
      a.resolvedAt && a.reportedAt
        ? Math.max(0, Math.round((a.resolvedAt - a.reportedAt) / 60000))
        : ''
  ],
  ['Calls', a => a.callCount || (a.acceptedAt ? 1 : 0)],
  ['ID uploaded', a => (getIdImage(a) ? 'Yes' : 'No')],
  ['Message count', a => (a.messages || []).length],
  [
    'Messages',
    a =>
      (a.messages || [])
        .map(
          m =>
            `[${formatDateTime(m.at)}] ` +
            `${m.from === 'dispatcher' ? 'Dispatcher' : 'Caller'}: ${m.text}`
        )
        .join('\n')
  ]
];

export function buildCsv(records) {
  const header = CSV_COLUMNS.map(([name]) => csvCell(name)).join(',');

  const rows = records.map(record =>
    CSV_COLUMNS.map(([, get]) => csvCell(get(record))).join(',')
  );

  // BOM so Excel opens the file as UTF-8 (keeps accents / Filipino names intact).
  return '\uFEFF' + [header, ...rows].join('\r\n');
}

// ----------------------------------------
// JSON (full fidelity: includes messages and ID photos)
// ----------------------------------------

export function buildJson(records, { department, auto = false } = {}) {
  return JSON.stringify(
    {
      app: 'E-Sagip',
      type: 'incident-history-archive',
      department: department || null,
      exportedAt: new Date().toISOString(),
      automatic: auto,
      count: records.length,
      records
    },
    null,
    2
  );
}

// ----------------------------------------
// download
// ----------------------------------------

export function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Saves records to a file on the operator's computer.
 * format: 'csv' (spreadsheet) or 'json' (full backup)
 */
export function exportRecords(
  records,
  { format = 'json', department = 'dispatch', auto = false } = {}
) {
  const base = `esagip-history-${slug(department)}-${fileStamp()}${
    auto ? '-auto' : ''
  }`;

  if (format === 'csv') {
    downloadFile(`${base}.csv`, buildCsv(records), 'text/csv;charset=utf-8');
    return;
  }

  downloadFile(
    `${base}.json`,
    buildJson(records, { department, auto }),
    'application/json'
  );
}
