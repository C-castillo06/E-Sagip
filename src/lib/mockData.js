export const STATIONS = {
  fire: {
    name: 'Fire Station HQ',
    lat: 14.7118,
    lng: 121.0453,
    radius: 10000
  },

  medical: {
    name: 'Medical Dispatch Center',
    lat: 14.7118,
    lng: 121.0453,
    radius: 8000
  },

  rescue: {
    name: 'Flood Rescue Command Center',
    lat: 14.7118,
    lng: 121.0453,
    radius: 12000
  }
};

// Default station.
// Used by calculations that don't care about the department.
export const STATION = STATIONS.fire;

// Default incidents.
export const INITIAL_INCIDENTS = [
  {
    id: 1,
    type: 'fire',
    caller: 'Renato Dizon',
    phone: '0917-234-5567',
    barangay: 'Purok 3, San Bartolome',
    lat: 14.7095,
    lng: 121.0512,
    status: 'pending',
    reportedAgoMin: 2,
    description:
      'Smoke reported from a neighboring sari-sari store, occupants evacuating.'
  },

  {
    id: 2,
    type: 'medical',
    caller: 'Liza Mendoza',
    phone: '0928-771-2290',
    barangay: 'Batasan Hills',
    lat: 14.6889,
    lng: 121.0836,
    status: 'pending',
    reportedAgoMin: 5,
    description:
      'Elderly male, chest pains, conscious and seated.'
  },

  {
    id: 3,
    type: 'rescue',
    caller: 'Mark Villanueva',
    phone: '0917-556-1123',
    barangay: 'San Francisco Del Monte',
    lat: 14.6392,
    lng: 121.0233,
    status: 'accepted',
    reportedAgoMin: 9,
    description:
      'Rising floodwater in the neighborhood, family stranded on the second floor.'
  },

  {
    id: 4,
    type: 'fire',
    caller: 'Aida Ramos',
    phone: '0918-402-7734',
    barangay: 'Novaliches Proper',
    lat: 14.7256,
    lng: 121.0356,
    status: 'accepted',
    reportedAgoMin: 14,
    description:
      'Grass fire near a residential compound, spreading slowly.'
  },

  {
    id: 5,
    type: 'medical',
    caller: 'Jun Castillo',
    phone: '0915-330-8891',
    barangay: 'Fairview',
    lat: 14.7339,
    lng: 121.0559,
    status: 'resolved',
    reportedAgoMin: 38,
    resolvedAgoMin: 3,
    description: 'Minor fall injury.'
  },

  {
    id: 6,
    type: 'rescue',
    caller: 'Grace Aquino',
    phone: '0921-664-0987',
    barangay: 'Talipapa',
    lat: 14.6997,
    lng: 121.0201,
    status: 'resolved',
    reportedAgoMin: 55,
    resolvedAgoMin: 8,
    description:
      'Elderly resident trapped by waist-deep floodwater, needs boat evacuation.'
  }
];

// Calculate distance between an incident and a station.
export function calculateDistanceKm(a, b = STATION) {
  const R = 6371;

  const dLat =
    (a.lat - b.lat) * Math.PI / 180;

  const dLng =
    (a.lng - b.lng) * Math.PI / 180;

  const lat1 =
    b.lat * Math.PI / 180;

  const lat2 =
    a.lat * Math.PI / 180;

  const x =
    dLng * Math.cos((lat1 + lat2) / 2);

  return Math.round(
    Math.sqrt(dLat * dLat + x * x) *
      R *
      10
  ) / 10;
}

// Builds a ready-to-use incident list with real timestamps
// and calculated distances.
export function hydrateIncidents(items) {
  const now = Date.now();

  return items.map((item) => {
    const reportedAt =
      item.reportedAt ??
      now - (item.reportedAgoMin ?? 0) * 60000;

    const resolvedAt =
      item.status === 'resolved'
        ? (
            item.resolvedAt ??
            now - (item.resolvedAgoMin ?? 0) * 60000
          )
        : undefined;

    const hydrated = {
      ...item,
      reportedAt,
      resolvedAt
    };

    delete hydrated.reportedAgoMin;
    delete hydrated.resolvedAgoMin;

    hydrated.dist =
      item.dist ??
      calculateDistanceKm(hydrated);

    return hydrated;
  });
}