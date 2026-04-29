import React, { useEffect, useMemo } from 'react';
import { MapContainer, Polygon, CircleMarker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const DEFAULT_CENTER = [30.9712921, 76.4731677];
const DEFAULT_ZOOM = 15;

function normalizePoint(point) {
  if (!point) return null;

  const lat = Number(point.lat ?? point.latitude ?? point.currentLatitude ?? point.current_latitude);
  const lng = Number(point.lng ?? point.longitude ?? point.currentLongitude ?? point.current_longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

function FitToGeometry({ boundary, drivers }) {
  const map = useMap();

  const hash = useMemo(() => JSON.stringify({ boundary, drivers }), [boundary, drivers]);

  useEffect(() => {
    if (!boundary.length && !drivers.length) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: false });
      return;
    }

    const driverCoords = drivers
      .map((driver) => [driver.lat, driver.lng])
      .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
    const coords = [...boundary, ...driverCoords];
    if (coords.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: false });
      return;
    }

    const bounds = L.latLngBounds(coords);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], animate: true });
    }
  }, [hash, map, boundary, drivers]);

  return null;
}

export default function MonitoringMap({ boundary = [], drivers = [], loading = false, className = '' }) {
  const boundaryPath = useMemo(
    () => boundary.map(normalizePoint).filter(Boolean).map((point) => [point.lat, point.lng]),
    [boundary]
  );

  const normalizedDrivers = useMemo(
    () => drivers.map((driver) => ({ ...driver, point: normalizePoint(driver) })).filter((driver) => driver.point),
    [drivers]
  );

  const hasBoundary = boundaryPath.length >= 3;

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`} style={{ minHeight: 460 }}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution="© OpenStreetMap, © CARTO"
          url="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
        />

        <FitToGeometry boundary={boundaryPath} drivers={normalizedDrivers} />

        {hasBoundary ? (
          <Polygon
            positions={boundaryPath}
            pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.18, weight: 3 }}
          />
        ) : null}

        {normalizedDrivers.map((driver) => (
          <CircleMarker
            key={driver.id}
            center={[driver.point.lat, driver.point.lng]}
            radius={8}
            pathOptions={{
              color: driver.isInsideCampus ? '#15803d' : '#dc2626',
              fillColor: driver.isInsideCampus ? '#22c55e' : '#ef4444',
              fillOpacity: 0.95,
              weight: 2,
            }}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold text-slate-900">{driver.name || 'Driver'}</div>
                <div className="text-sm text-slate-600">
                  {driver.isInsideCampus ? 'Inside campus' : 'Outside campus'}
                </div>
                <div className="text-xs text-slate-500">
                  {driver.lat?.toFixed?.(5) || driver.point.lat.toFixed(5)}, {driver.lng?.toFixed?.(5) || driver.point.lng.toFixed(5)}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Campus monitoring</p>
        <div className="mt-2 flex items-center gap-3 text-sm font-medium text-slate-700">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" /> Inside
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500" /> Outside
          </span>
        </div>
      </div>

      {loading ? (
        <div className="absolute inset-0 z-[600] flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
          <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            Loading live drivers…
          </div>
        </div>
      ) : null}

      {!hasBoundary ? (
        <div className="pointer-events-none absolute bottom-4 left-4 z-[500] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-lg">
          No campus boundary defined yet.
        </div>
      ) : null}
    </div>
  );
}