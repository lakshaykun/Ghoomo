import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Polygon, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ArrowDown, ArrowUp, Loader2, MapPin, PencilLine, RotateCcw, Save, ShieldAlert, Trash2 } from 'lucide-react';
import dashboardAPI from '../services/dashboardAPI';
import { isPolygonSelfIntersecting, normalizeBoundaryPoint } from '../utils/geofence';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [30.9712921, 76.4731677];

function MapClickHandler({ editable, onMapClick }) {
  useMapEvents({
    click: (event) => {
      if (!editable) return;
      onMapClick(event.latlng);
    },
  });

  return null;
}

function FitBoundary({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length < 1) {
      map.setView(DEFAULT_CENTER, 15, { animate: false });
      return;
    }

    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2), { animate: true });
    }
  }, [map, points]);

  return null;
}

function DraggableBoundaryMarker({ point, index, editable, onMove }) {
  const markerRef = useRef(null);

  return (
    <Marker
      ref={markerRef}
      position={[point.lat, point.lng]}
      draggable={editable}
      eventHandlers={{
        dragend: () => {
          const marker = markerRef.current;
          const next = marker?.getLatLng();
          if (next) {
            onMove(index, next);
          }
        },
      }}
    >
      <Tooltip permanent direction="top" offset={[0, -8]}>
        {index + 1}
      </Tooltip>
    </Marker>
  );
}

function toDisplayPoint(point, index = 0) {
  const normalized = normalizeBoundaryPoint(point);
  if (!normalized) return null;

  return {
    id: point.id ?? `point-${index}`,
    lat: normalized.lat,
    lng: normalized.lng,
  };
}

export default function CampusBoundary() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [editable, setEditable] = useState(true);
  const lastLoadedRef = useRef(null);

  const loadBoundary = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const response = await dashboardAPI.getCampusBoundary();
      const nextPoints = (response.coordinates || []).map(toDisplayPoint).filter(Boolean);
      setPoints(nextPoints);
      lastLoadedRef.current = new Date();
      setStatusMessage(nextPoints.length > 0 ? `Loaded ${nextPoints.length} boundary points.` : 'No campus boundary defined yet.');
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load campus boundary');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void loadBoundary({ silent: false });
  }, []);

  const polygonPoints = useMemo(() => points.map((point) => [point.lat, point.lng]), [points]);
  const isTooSmall = points.length < 3;
  const isInvalid = !isTooSmall && isPolygonSelfIntersecting(points);
  const validationMessage = isTooSmall
    ? 'Add at least three points to define the boundary.'
    : isInvalid
      ? 'The polygon self-intersects. Reorder or move points to fix it.'
      : '';
  const canSave = editable && points.length >= 3 && !isInvalid;

  const handleAddPoint = (latlng) => {
    const nextPoint = {
      id: `point-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      lat: Number(latlng.lat.toFixed(6)),
      lng: Number(latlng.lng.toFixed(6)),
    };
    setPoints((previous) => [...previous, nextPoint]);
    setStatusMessage('Point added. Reorder or drag points to refine the polygon.');
  };

  const handleMovePoint = (index, latlng) => {
    setPoints((previous) =>
      previous.map((point, currentIndex) =>
        currentIndex === index
          ? { ...point, lat: Number(latlng.lat.toFixed(6)), lng: Number(latlng.lng.toFixed(6)) }
          : point
      )
    );
  };

  const handleDeletePoint = (index) => {
    setPoints((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
    setStatusMessage('Point removed.');
  };

  const movePoint = (index, direction) => {
    setPoints((previous) => {
      const next = [...previous];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) {
        return previous;
      }

      const [moving] = next.splice(index, 1);
      next.splice(targetIndex, 0, moving);
      return next;
    });
  };

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    setError('');
    try {
      const response = await dashboardAPI.saveCampusBoundary(points.map((point, index) => ({
        latitude: point.lat,
        longitude: point.lng,
        sortOrder: index,
      })));
      const nextPoints = (response.coordinates || []).map(toDisplayPoint).filter(Boolean);
      setPoints(nextPoints);
      setStatusMessage(`Campus boundary saved with ${nextPoints.length} points.`);
    } catch (saveError) {
      setError(saveError?.message || 'Failed to save campus boundary');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPoints([]);
    setStatusMessage('Boundary cleared. Add points by clicking on the map.');
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Campus controls</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Campus Boundary Management</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Draw the campus perimeter, reorder the polygon vertices, and keep driver geofencing aligned with the current boundary.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setEditable((previous) => !previous)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${editable ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}
            >
              <PencilLine className="h-4 w-4" />
              {editable ? 'Editing mode' : 'View mode'}
            </button>
            <button
              type="button"
              onClick={() => void loadBoundary({ silent: false })}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reload
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {statusMessage ? (
          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            {statusMessage}
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.9fr)]">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Boundary editor</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Polygon map</h3>
            </div>
            <div className="text-sm text-slate-500">
              {points.length} point{points.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="relative h-[640px]">
            <MapContainer center={DEFAULT_CENTER} zoom={15} className="h-full w-full">
              <TileLayer
                attribution="© OpenStreetMap, © CARTO"
                url="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
              />

              <FitBoundary points={points} />
              <MapClickHandler editable={editable} onMapClick={handleAddPoint} />

              {polygonPoints.length >= 3 ? (
                <Polygon
                  positions={polygonPoints}
                  pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.18, weight: 3 }}
                />
              ) : null}

              {polygonPoints.length >= 2 ? (
                <Polyline
                  positions={polygonPoints}
                  pathOptions={{ color: '#2563eb', weight: 2, opacity: 0.8, dashArray: '8 8' }}
                />
              ) : null}

              {points.map((point, index) => (
                <DraggableBoundaryMarker
                  key={point.id}
                  point={point}
                  index={index}
                  editable={editable}
                  onMove={handleMovePoint}
                />
              ))}
            </MapContainer>

            {!editable ? (
              <div className="pointer-events-none absolute right-4 top-4 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-sm text-slate-600 shadow-lg backdrop-blur">
                View mode is active. Switch to editing mode to move vertices.
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Status</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Boundary health</h3>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isInvalid ? 'bg-rose-100 text-rose-700' : points.length < 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {isInvalid ? 'Invalid' : points.length < 3 ? 'Incomplete' : 'Valid'}
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-slate-500">Points</p>
                <p className="mt-1 font-semibold text-slate-900">{points.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-slate-500">Last loaded</p>
                <p className="mt-1 font-semibold text-slate-900">{lastLoadedRef.current ? lastLoadedRef.current.toLocaleTimeString() : '—'}</p>
              </div>
            </div>

            {validationMessage ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{validationMessage}</span>
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave || saving}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save boundary
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Vertices</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Ordered points</h3>
              </div>
              <MapPin className="h-5 w-5 text-sky-500" />
            </div>

            <div className="mt-4 space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {points.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  Click on the map to start adding campus boundary points.
                </div>
              ) : (
                points.map((point, index) => (
                  <div key={point.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Point {index + 1}</p>
                        <p className="mt-1 font-mono text-xs text-slate-500">{point.lat.toFixed(6)}, {point.lng.toFixed(6)}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => movePoint(index, -1)}
                          disabled={index === 0}
                          className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => movePoint(index, 1)}
                          disabled={index === points.length - 1}
                          className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePoint(index)}
                          className="rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}