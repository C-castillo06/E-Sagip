'use client';

import { useEffect, useRef } from 'react';
import { STATIONS } from '../../lib/mockData';

export default function IncidentMap({
  alerts,
  theme,
  selectedId,
  onSelectAlert,
  station: stationProp
}) {
  // ----------------------------------------
  // MAP REFS
  // ----------------------------------------

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const markersRef = useRef({});
  const stationLayerRef = useRef(null);

  // ----------------------------------------
  // STATION
  // ----------------------------------------
  //
  // New registered accounts use their saved
  // station information.
  //
  // Older accounts without station data fall
  // back to the original mock station.
  // ----------------------------------------

  const fallbackStation =
    STATIONS[theme.id] ||
    STATIONS.fire;

  const station =
    stationProp &&
    Number.isFinite(Number(stationProp.lat)) &&
    Number.isFinite(Number(stationProp.lng))
      ? {
          name:
            stationProp.name ||
            `${theme.short} Station`,

          address:
            stationProp.address || '',

          lat: Number(stationProp.lat),
          lng: Number(stationProp.lng),

          radius:
            Number.isFinite(
              Number(stationProp.radius)
            )
              ? Number(stationProp.radius)
              : fallbackStation.radius
        }
      : fallbackStation;

  // ----------------------------------------
  // MAP SETUP
  // ----------------------------------------

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      // Load Leaflet CSS once.
      if (
        !document.getElementById(
          'leaflet-css'
        )
      ) {
        const link =
          document.createElement('link');

        link.id = 'leaflet-css';
        link.rel = 'stylesheet';

        link.href =
          'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

        document.head.appendChild(link);
      }

      // Leaflet touches window/document,
      // so import it client-side.
      const leaflet =
        await import('leaflet');

      const L =
        leaflet.default || leaflet;

      if (
        cancelled ||
        !mapRef.current
      ) {
        return;
      }

      // ------------------------------------
      // CREATE MAP ONCE
      // ------------------------------------

      if (!mapInstanceRef.current) {
        const map = L.map(
          mapRef.current,
          {
            zoomControl: false
          }
        ).setView(
          [
            station.lat,
            station.lng
          ],
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

            attribution:
              '&copy; OpenStreetMap contributors'
          }
        ).addTo(map);

        mapInstanceRef.current =
          map;
      }

      const map =
        mapInstanceRef.current;

      // ------------------------------------
      // STATION MARKER + COVERAGE
      // ------------------------------------

      if (
        stationLayerRef.current
      ) {
        map.removeLayer(
          stationLayerRef.current
        );
      }

      const stationGroup =
        L.layerGroup().addTo(map);

      // Coverage radius.
      L.circle(
        [
          station.lat,
          station.lng
        ],
        {
          radius:
            station.radius,

          color:
            theme.hex,

          weight: 2,

          dashArray:
            '5 5',

          fillColor:
            theme.hex,

          fillOpacity:
            0.05
        }
      ).addTo(stationGroup);

      // ------------------------------------
      // STATION PIN
      // ------------------------------------

      const stationHtml = `
        <div
          style="
            width:24px;
            height:24px;
            border-radius:50% 50% 50% 0;
            background:${theme.hex};
            border:3px solid white;
            box-shadow:0 3px 10px rgba(0,0,0,.3);
            transform:rotate(-45deg);
            position:relative;
          "
        >
          <div
            style="
              position:absolute;
              width:8px;
              height:8px;
              border-radius:50%;
              background:white;
              left:5px;
              top:5px;
            "
          ></div>
        </div>
      `;

      const stationMarker =
        L.marker(
          [
            station.lat,
            station.lng
          ],
          {
            icon:
              L.divIcon({
                className: '',
                html:
                  stationHtml,

                iconSize: [
                  24,
                  24
                ],

                iconAnchor: [
                  12,
                  24
                ]
              })
          }
        )
          .addTo(
            stationGroup
          )
          .bindTooltip(
            station.name,
            {
              direction: 'top',
              offset: [
                0,
                -18
              ]
            }
          );

      // If an address exists, show it in
      // the tooltip as well.
      if (station.address) {
        stationMarker.bindTooltip(
          `<strong>${station.name}</strong><br/>${station.address}`,
          {
            direction: 'top',
            offset: [0, -18]
          }
        );
      }

      stationLayerRef.current =
        stationGroup;

      // ------------------------------------
      // CENTER ON STATION
      // ------------------------------------

      map.setView(
        [
          station.lat,
          station.lng
        ],
        map.getZoom()
      );

      // ------------------------------------
      // INCIDENT MARKERS
      // ------------------------------------

      Object.values(
        markersRef.current
      ).forEach(marker => {
        map.removeLayer(
          marker
        );
      });

      markersRef.current = {};

      alerts.forEach(a => {
        const selected =
          a.id === selectedId;

        const size =
          selected
            ? 34
            : 26;

        const bg =
          a.status ===
          'resolved'
            ? '#9CA3AF'
            : theme.hex;

        const html = `
          <div
            style="
              width:${size}px;
              height:${size}px;
              background:${bg};
              color:white;
              border-radius:50%;
              border:2px solid white;
              display:flex;
              align-items:center;
              justify-content:center;
              font-weight:700;
              font-family:monospace;
              box-shadow:${
                selected
                  ? `0 0 0 5px ${theme.hex}44,`
                  : ''
              }0 3px 10px #0003;
            "
          >
            ${a.type[0].toUpperCase()}
          </div>
        `;

        const marker =
          L.marker(
            [
              a.lat,
              a.lng
            ],
            {
              icon:
                L.divIcon({
                  className: '',
                  html,

                  iconSize: [
                    size,
                    size
                  ],

                  iconAnchor: [
                    size / 2,
                    size / 2
                  ]
                }),

              zIndexOffset:
                selected
                  ? 1000
                  : 0
            }
          ).addTo(map);

        marker.bindTooltip(
          `${a.caller}<br/>${a.barangay}<br/>${a.dist} km`
        );

        marker.on(
          'click',
          () => {
            onSelectAlert(
              a.id
            );
          }
        );

        markersRef.current[
          a.id
        ] = marker;
      });

      // ------------------------------------
      // FLY TO SELECTED INCIDENT
      // ------------------------------------

      if (selectedId) {
        const selectedAlert =
          alerts.find(
            x =>
              x.id ===
              selectedId
          );

        if (selectedAlert) {
          map.flyTo(
            [
              selectedAlert.lat,
              selectedAlert.lng
            ],
            14,
            {
              duration:
                0.35
            }
          );
        }
      }

      // ------------------------------------
      // INVALIDATE MAP SIZE
      // ------------------------------------

      setTimeout(() => {
        if (
          !cancelled &&
          mapInstanceRef.current
        ) {
          mapInstanceRef.current
            .invalidateSize();
        }
      }, 50);
    };

    setup();

    return () => {
      cancelled = true;
    };
  }, [
    alerts,
    theme,
    selectedId,
    onSelectAlert,
    station
  ]);

  // ----------------------------------------
  // CLEANUP
  // ----------------------------------------

  useEffect(() => {
    return () => {
      if (
        mapInstanceRef.current
      ) {
        mapInstanceRef.current.remove();

        mapInstanceRef.current =
          null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full h-full bg-gray-100"
    />
  );
}