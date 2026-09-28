// ========================================
// DRILL ALERT
//
// Data + generator for the "Run Drill Alert"
// button. Pure function, no state — the caller
// (useIncidents) decides what to do with the
// result.
// ========================================

const DRILL_COORDS = [
  {
    lat: 14.697,
    lng: 121.061,
    barangay: 'Commonwealth'
  },
  {
    lat: 14.718,
    lng: 121.029,
    barangay: 'Bagbag'
  },
  {
    lat: 14.681,
    lng: 121.073,
    barangay: 'Payatas'
  }
];

const DRILL_CALLER_NAMES = {
  fire: 'Emergency Caller',
  medical: 'Mobile Caller',
  rescue: 'Stranded Resident'
};

export function createDrillIncident(role, theme) {
  if (!role) return null;

  const c =
    DRILL_COORDS[Math.floor(Math.random() * DRILL_COORDS.length)];

  return {
    id: Date.now(),

    type: role,

    caller: DRILL_CALLER_NAMES[role],

    phone: '0917-000-0000',

    barangay: c.barangay,

    lat: c.lat,
    lng: c.lng,

    // New request starts here
    status: 'pending',
    callStatus: null,
    dispatchStatus: 'pending',

    reportedAt: Date.now(),

    description: `Drill alert for ${theme.label.toLowerCase()} used to verify the dispatch workflow.`
  };
}
