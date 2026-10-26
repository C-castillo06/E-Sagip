'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Crosshair,
  MapPin,
  Search,
  Loader2,
  Minus,
  Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { THEMES } from '../../lib/themes';
import { STATIONS } from '../../lib/mockData';
import { registerUser } from '../../lib/auth';
import AuthLayout from '../../components/auth/AuthLayout.jsx';
import DepartmentPicker from '../../components/auth/dpt';

const BRAND_COPY = {
  fire: {
    title: 'Join the fire operations team.',
    desc: 'Request operator access to manage fire calls and coordinate response.'
  },
  medical: {
    title: 'Join the medical operations team.',
    desc: 'Request operator access to triage calls and coordinate medical response.'
  },
  rescue: {
    title: 'Join the rescue operations team.',
    desc: 'Request operator access to coordinate rescue and flood response.'
  }
};

const DEFAULT_COPY = {
  title: 'Set up access.',
  desc: 'Create a dispatcher profile and choose the emergency department you are assigned to.'
};

const DEFAULT_COORDINATES = {
  lat: 14.7118,
  lng: 121.0453
};

/*
 * Shows a message in the browser's native validation bubble
 * (same look as "Please fill out this field.") on a given input.
 * The message is cleared as soon as the user edits that field.
 */
function showBubble(el, message) {
  if (!el) return;
  el.setCustomValidity(message);
  el.reportValidity();
}

function getDefaultStation(role) {
  return STATIONS[role] || STATIONS.fire;
}

// Allowed coverage radius range, in km.
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 10;

function clampNumber(value, min, max) {
  return Math.min(Math.max(Number(value), min), max);
}

/**
 * Interactive Leaflet station picker.
 *
 * The dispatcher can:
 * - search an address
 * - move the station pin
 * - zoom the map
 * - adjust the coverage radius
 */
function StationLocationPicker({
  role,
  address,
  setAddress,
  location,
  setLocation,
  radius,
  setRadius
}) {
  const addressInputRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const stationMarkerRef = useRef(null);
  const coverageCircleRef = useRef(null);

  const [searching, setSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const selectedTheme = THEMES[role] || THEMES.fire;

  /*
   * The browser keeps a custom validation message ("Enter the station
   * address first.") on the input until it is cleared. onChange only
   * fires when the user types, so a pin drag or Find on Map that fills
   * the address in code left the old message stuck and blocked submit.
   * Clearing it whenever the address value changes fixes that.
   */
  useEffect(() => {
    if (addressInputRef.current) {
      addressInputRef.current.setCustomValidity('');
    }
  }, [address]);

  /*
   * Create Leaflet map once.
   */
  useEffect(() => {
    let cancelled = false;

    async function setupMap() {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Load Leaflet CSS once.
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');

        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href =
          'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

        document.head.appendChild(link);
      }

      const leaflet = await import('leaflet');
      const L = leaflet.default || leaflet;

      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        zoomControl: false
      }).setView(
        [location.lat, location.lng],
        13
      );

      L.control
        .zoom({
          position: 'bottomright'
        })
        .addTo(map);

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          minZoom: 10,
          attribution: '&copy; OpenStreetMap contributors'
        }
      ).addTo(map);

      mapInstanceRef.current = map;

      setMapReady(true);

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
    }

    setupMap();

    return () => {
      cancelled = true;
    };
  }, []);

/*
   * Create/update station marker and coverage circle.
   */
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    let cancelled = false;

    // Use .then() instead of async/await to prevent race conditions during renders
    import('leaflet').then((leaflet) => {
      if (cancelled || !mapInstanceRef.current) return;
      
      const L = leaflet.default || leaflet;
      const map = mapInstanceRef.current;

      /*
       * 1. SAFELY REMOVE PREVIOUS LAYERS
       * This completely prevents the duplication bug.
       */
      if (stationMarkerRef.current) {
        map.removeLayer(stationMarkerRef.current);
        stationMarkerRef.current = null;
      }
      if (coverageCircleRef.current) {
        map.removeLayer(coverageCircleRef.current);
        coverageCircleRef.current = null;
      }

      /*
       * 2. CREATE STATION MARKER
       */
      const stationHtml = `
        <div
          style="
            width:34px;
            height:34px;
            border-radius:50% 50% 50% 0;
            background:${selectedTheme.hex};
            border:3px solid white;
            box-shadow:0 3px 12px rgba(0,0,0,.3);
            transform:rotate(-45deg);
            display:flex;
            align-items:center;
            justify-content:center;
          "
        >
          <div style="width:12px;height:12px;border-radius:50%;background:white;"></div>
        </div>
      `;

      const marker = L.marker([location.lat, location.lng], {
        draggable: true,
        icon: L.divIcon({
          className: '',
          html: stationHtml,
          iconSize: [34, 34],
          iconAnchor: [17, 34]
        })
      }).addTo(map);

      marker.bindTooltip(`${selectedTheme.short} Station`, {
        direction: 'top',
        offset: [0, -28]
      });

      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        const newLat = Number(position.lat.toFixed(6));
        const newLng = Number(position.lng.toFixed(6));

        setLocation({ lat: newLat, lng: newLng });

        // Dragging the pin is enough to set the station. Show the
        // coordinates in the address bar right away so the field is
        // never empty; the readable address replaces it below.
        setAddress(`${newLat}, ${newLng}`);

        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLng}`;
          const response = await fetch(url);
          if (response.ok) {
            const result = await response.json();
            if (result && result.display_name) {
              setAddress(result.display_name);
            }
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
        }
      });

      stationMarkerRef.current = marker;

      /*
       * 3. CREATE COVERAGE CIRCLE
       * This restores your geofencing radius.
       */
      const circle = L.circle([location.lat, location.lng], {
        radius: radius * 1000,
        color: selectedTheme.hex,
        weight: 2,
        dashArray: '6 6',
        fillColor: selectedTheme.hex,
        fillOpacity: 0.07
      }).addTo(map);

      coverageCircleRef.current = circle;

      /*
       * 4. CENTER THE MAP
       */
      map.setView([location.lat, location.lng], map.getZoom());
    });

    return () => {
      cancelled = true;
      // Strict cleanup: If the component re-renders, wipe the map layers first.
      if (stationMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(stationMarkerRef.current);
        stationMarkerRef.current = null;
      }
      if (coverageCircleRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(coverageCircleRef.current);
        coverageCircleRef.current = null;
      }
    };
  }, [
    mapReady,
    location.lat,
    location.lng,
    radius,
    selectedTheme.hex,
    selectedTheme.short,
    setLocation,
    setAddress
  ]);

  /*
   * Find address using OpenStreetMap Nominatim.
   */
  async function findAddress() {
    const query = address.trim();

if (!query) {
  if (addressInputRef.current) {
    addressInputRef.current.setCustomValidity('Enter the station address first.');
    addressInputRef.current.reportValidity();
  }
  return;
}

    setSearching(true);
    addressInputRef.current?.setCustomValidity('');

    try {
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?format=jsonv2&limit=1&countrycodes=ph&q=${encodeURIComponent(query)}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Unable to search for that address.');
      }

      const results = await response.json();

if (!results.length) {
  if (addressInputRef.current) {
    addressInputRef.current.setCustomValidity(
      'Address not found. Try adding the barangay, city, or province.'
    );
    addressInputRef.current.reportValidity();
  }
  return;
}
      const result = results[0];

      const lat = Number(result.lat);
      const lng = Number(result.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        showBubble(
          addressInputRef.current,
          'The map service returned an invalid location.'
        );
        return;
      }

      setLocation({
        lat,
        lng
      });

      /*
       * Use the returned formatted address when available.
       */
      if (result.display_name) {
        setAddress(result.display_name);
      }

      /*
       * Move the map immediately.
       */
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(
          [lat, lng],
          16,
          {
            duration: 0.8
          }
        );
      }
    } catch (err) {
      showBubble(
        addressInputRef.current,
        err.message ||
        'Unable to find that address. Please try again.'
      );
    } finally {
      setSearching(false);
    }
  }

  /*
   * Allow Enter inside the address field to search.
   */
  function handleAddressKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      findAddress();
    }
  }

  const radiusKm = Number(radius);

  // Color of the slider's filled part and thumb: always the department theme color.
  const sliderColor = selectedTheme.hex;

  // How far along the radius range the thumb is, used to paint the fill.
  const fillPercent =
    ((radiusKm - MIN_RADIUS_KM) / (MAX_RADIUS_KM - MIN_RADIUS_KM)) * 100;

  return (
    <div className="space-y-4">

      {/* ADDRESS */}
      <div>
        <label className="field-label">
          Station address
        </label>

        <div className="flex gap-2">
<input
  ref={addressInputRef}
  className="field station-field flex-1"
  name="stationAddress"
  value={address}
  onChange={e => {
    e.target.setCustomValidity(""); // Clear browser error on edit
    setAddress(e.target.value);
  }}
  onKeyDown={handleAddressKeyDown}
  placeholder="e.g. Quezon City Fire Station, Quezon City"
  autoComplete="street-address"
/>

          <button
            type="button"
            onClick={findAddress}
            disabled={searching}
            className="secondary-btn shrink-0"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}

            <span className="hidden sm:inline">
              {searching ? 'Finding...' : 'Find on Map'}
            </span>
          </button>
        </div>

        <p className="mt-1.5 text-xs text-gray-500">
          Enter the station address, then drag the pin to the exact
          station location if necessary.
        </p>
      </div>

      {/* MAP */}
      <div
        className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
        style={{ height: 220 }}
      >
        <div
          ref={mapRef}
          className="h-full w-full"
        />

        {!mapReady && (
          <div className="absolute inset-0 grid place-items-center bg-gray-100/90">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading map...
            </div>
          </div>
        )}

        <div className="absolute left-3 top-3 z-[500] rounded-lg border border-gray-200 bg-white/95 px-3 py-2 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
            <MapPin
              className="h-4 w-4"
              style={{ color: selectedTheme.hex }}
            />
            Station location
          </div>

          <div className="mt-1 text-[10px] text-gray-500">
            Drag the pin to fine-tune
          </div>
        </div>

        <div className="absolute bottom-3 left-3 z-[500] rounded-lg border border-gray-200 bg-white/95 px-3 py-2 shadow-sm">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Coordinates
          </div>

          <div className="mt-0.5 font-mono text-xs text-gray-700">
            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </div>
        </div>
      </div>

      {/* RADIUS */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-gray-800">Coverage radius</div>

            <div className="mt-0.5 text-xs text-gray-500">
              Incidents inside this area are within the station's
              configured coverage range.
            </div>
          </div>

          <div
            className="rounded-lg px-3 py-2 text-sm font-bold"
            style={{
              backgroundColor: selectedTheme.softHex,
              color: selectedTheme.hex
            }}
          >
            {radiusKm.toFixed(1)} km
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <Minus className="h-4 w-4 shrink-0 text-gray-400" />

          <input
            type="range"
            min="1"
            max={MAX_RADIUS_KM}
            step="0.5"
            value={radiusKm}
            onChange={e =>setRadius(clampNumber(e.target.value, MIN_RADIUS_KM, MAX_RADIUS_KM))}
            className="radius-slider w-full"
            style={{
              '--slider-color': sliderColor,
              '--fill': `${fillPercent}%`
            }}/>
          <Plus className="h-4 w-4 shrink-0 text-gray-400" />
        </div>

        <div className="mt-1 flex justify-between text-[10px] text-gray-400">
          <span>1 km</span>
          <span>{MAX_RADIUS_KM} km</span>
        </div>
      </div>

    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState('fire');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: ''
  });

  const [stationAddress, setStationAddress] = useState('');

  const initialStation = getDefaultStation('fire');

  const [stationLocation, setStationLocation] = useState({
    lat: initialStation.lat || DEFAULT_COORDINATES.lat,
    lng: initialStation.lng || DEFAULT_COORDINATES.lng
  });

  const [radius, setRadius] = useState(
    clampNumber((initialStation.radius || 10000) / 1000, MIN_RADIUS_KM, MAX_RADIUS_KM)
  );

  const selectedTheme = THEMES[role] || THEMES.fire;
  const copy = BRAND_COPY[role] || DEFAULT_COPY;

  /*
   * Generic form update.
   */
  const update = e => {
    // Clear any leftover validation bubble on the edited field.
    // Changing the password also clears the confirm field's bubble.
    e.target.setCustomValidity('');

    if (e.target.name === 'password' && e.target.form?.elements.confirm) {
      e.target.form.elements.confirm.setCustomValidity('');
    }

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  /*
   * When changing department, use that department's
   * default station as the initial map location/radius.
   *
   * The dispatcher can then search their real station
   * and drag the pin.
   */
  useEffect(() => {
    const station = getDefaultStation(role);

    setStationLocation({
      lat: station.lat || DEFAULT_COORDINATES.lat,
      lng: station.lng || DEFAULT_COORDINATES.lng
    });

    setRadius(
      clampNumber((station.radius || 10000) / 1000, MIN_RADIUS_KM, MAX_RADIUS_KM)
    );
  }, [role]);

  async function submit(e) {
    e.preventDefault();

    const elements = e.currentTarget.elements;

    if (!stationAddress.trim()) {
      showBubble(elements.stationAddress, 'Enter the station address.');
      return;
    }

    if (
      !Number.isFinite(stationLocation.lat) ||
      !Number.isFinite(stationLocation.lng)
    ) {
      showBubble(
        elements.stationAddress,
        'Set a valid station location on the map.'
      );
      return;
    }

    if (form.password.length < 6) {
      showBubble(
        elements.password,
        'Password must be at least 6 characters.'
      );
      return;
    }

    if (form.password !== form.confirm) {
      showBubble(elements.confirm, 'Passwords do not match.');
      return;
    }

    const result = await registerUser({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      role,

      station: {
        name: `${selectedTheme.short} Station`,
        address: stationAddress.trim(),
        lat: stationLocation.lat,
        lng: stationLocation.lng,
        radius: Math.round(Number(radius) * 1000)
      }
    });

    if (result.error) {
      // Show the Firebase error on the field it belongs to.
      const target = /password/i.test(result.error)
        ? elements.password
        : elements.email;

      showBubble(target, result.error);
      return;
    }

    router.push(
      `/login?registered=1&department=${role}`
    );
  }

return (
    <AuthLayout
      theme={selectedTheme}
      eyebrow="Operator registration"
      copy={copy}
      shellClassName="auth-register-shell"
      formWrapClassName="auth-register-wrap"
      maxWidthClassName="max-w-5xl"
      badgeOpacity={0.22}
    >
      <div
        className="eyebrow"
        style={{
          color: 'var(--theme-accent)'
        }}
      >
        Create account
      </div>

      <h2 className="mt-2 text-5xl font-bold">
        Register dispatcher
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Create your dispatcher account and configure the
        station location used by the tactical map.
      </p>

      <form onSubmit={submit} className="mt-7 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* LEFT COLUMN: Credentials */}
          <div className="space-y-4">
            {/* DEPARTMENT */}
            <div>
              <label className="field-label">Dispatch department</label>
              <DepartmentPicker value={role} onChange={setRole} variant="rows" />
            </div>

            {/* NAME */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">First name</label>
                <input
                  className="field"
                  name="firstName"
                  required
                  value={form.firstName}
                  onChange={update}
                  placeholder="Juan"
                />
              </div>

              <div>
                <label className="field-label">Last name</label>
                <input
                  className="field"
                  name="lastName"
                  required
                  value={form.lastName}
                  onChange={update}
                  placeholder="Dela Cruz"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="field-label">Email address</label>
              <input
                className="field"
                name="email"
                type="email"
                required
                pattern="[^\s@]+@[^\s@]+\.[^\s@]{2,}"
                title="Enter a full email address, like name@gmail.com"
                value={form.email}
                onChange={update}
                placeholder="dispatcher@city.gov.ph"
              />
            </div>

            {/* PASSWORD */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Password</label>
                <input
                  className="field"
                  name="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={update}
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="field-label">Confirm password</label>
                <input
                  className="field"
                  name="confirm"
                  type="password"
                  required
                  value={form.confirm}
                  onChange={update}
                  placeholder="Repeat password"
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Station Map & Submit */}
          <div className="space-y-4">
            <div>
              <div className="text-sm font-bold text-gray-800">
                Station configuration
              </div>
              <div className="mt-0.5 text-xs text-gray-500">
                Set physical location and emergency coverage area for this {selectedTheme.short.toLowerCase()} department.
              </div>
            </div>

            <StationLocationPicker
              role={role}
              address={stationAddress}
              setAddress={setStationAddress}
              location={stationLocation}
              setLocation={setStationLocation}
              radius={radius}
              setRadius={setRadius}
            />

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="primary-btn register-submit w-full"
              style={{
                backgroundColor: selectedTheme.hex,
                boxShadow: `0 6px 18px ${selectedTheme.hex}33`,
                color: '#fff'
              }}
            >
              Create Account
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      </form>

      <p className="mt-5 pb-2 text-center text-sm text-gray-500">
        Already registered?{' '}
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="font-semibold text-gray-900 hover:underline"
        >
          Sign in
        </button>
      </p>
    </AuthLayout>
  );
}