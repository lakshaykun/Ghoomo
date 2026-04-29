import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { toast } from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import dashboardAPI from '../services/dashboardAPI';

function uid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_STOPS = [
  { id: uid(), name: '', latitude: '', longitude: '', arrivalTime: '', type: 'pickup', order: 1 },
  { id: uid(), name: '', latitude: '', longitude: '', arrivalTime: '', type: 'dropoff', order: 2 },
];

function newStop(order) {
  return {
    id: uid(),
    name: '',
    latitude: '',
    longitude: '',
    arrivalTime: '',
    type: 'both',
    order,
  };
}

function getApiErrorMessage(err, fallback) {
  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

function LocationPickerModal({ visible, initialPosition, onClose, onSelect }) {
  const [picked, setPicked] = useState(initialPosition || null);
  const [mapCenter, setMapCenter] = useState(initialPosition || [30.7333, 76.7794]);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setPicked(initialPosition || null);
    setMapCenter(initialPosition || [30.7333, 76.7794]);
  }, [initialPosition, visible]);

  if (!visible) return null;

  function PickerMarker() {
    useMapEvents({
      click(event) {
        const { lat, lng } = event.latlng;
        setPicked([lat, lng]);
      },
    });
    return picked ? <Marker position={picked} /> : null;
  }

  async function handleSearch(event) {
    event.preventDefault();
    const text = query.trim();
    if (!text) return;

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=1`
      );
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = Number(data[0].lat);
        const lng = Number(data[0].lon);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setMapCenter([lat, lng]);
          setPicked([lat, lng]);
        }
      } else {
        toast.error('Location not found');
      }
    } catch {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Pick Stop Location</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">Close</button>
        </div>
        <div className="px-4 pt-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search location"
              className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-3 py-2 rounded-md bg-slate-900 text-white text-sm disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
        <div className="h-[420px] mt-3">
          <MapContainer
            key={mapCenter.join(',')}
            center={mapCenter}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <PickerMarker />
          </MapContainer>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">Click on map to place marker.</p>
          <button
            onClick={() => {
              if (!picked) return;
              onSelect({ latitude: picked[0], longitude: picked[1] });
            }}
            disabled={!picked}
            className="px-3 py-1.5 rounded-md bg-blue-600 text-white disabled:opacity-50"
          >
            Use This Location
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BusManagement() {
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [pickingStopId, setPickingStopId] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    departureTime: '',
    arrivalTime: '',
    totalSeats: 40,
    farePerSeat: 0,
    driverUserId: '',
  });
  const [stops, setStops] = useState(DEFAULT_STOPS);

  const stopCount = useMemo(() => stops.length, [stops.length]);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    await Promise.all([loadRoutes(), loadDrivers()]);
  }

  async function loadRoutes() {
    setLoadingRoutes(true);
    try {
      const response = await dashboardAPI.getRoutes();
      setRoutes(response.data || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load routes'));
    } finally {
      setLoadingRoutes(false);
    }
  }

  async function loadDrivers() {
    try {
      const data = await dashboardAPI.getApprovedBusDrivers();
      setDrivers(Array.isArray(data) ? data : []);
    } catch {
      setDrivers([]);
    }
  }

  function updateStop(id, key, value) {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  }

  function addStop() {
    setStops((prev) => [...prev, newStop(prev.length + 1)]);
  }

  function removeStop(id) {
    setStops((prev) => {
      if (prev.length <= 2) return prev;
      const next = prev.filter((s) => s.id !== id);
      return next.map((s, index) => ({ ...s, order: index + 1 }));
    });
  }

  function validate() {
    if (!form.name.trim() || !form.departureTime || !form.arrivalTime) {
      return 'Route name, departure time, and arrival time are required.';
    }
    if (!Number.isInteger(Number(form.totalSeats)) || Number(form.totalSeats) <= 0) {
      return 'Total seats must be a positive integer.';
    }
    if (!Array.isArray(stops) || stops.length < 2) {
      return 'At least 2 stops are required.';
    }

    for (let i = 0; i < stops.length; i += 1) {
      const stop = stops[i];
      const lat = Number(stop.latitude);
      const lng = Number(stop.longitude);
      if (!String(stop.name || '').trim()) return `Stop ${i + 1}: name is required.`;
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) return `Stop ${i + 1}: invalid latitude.`;
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) return `Stop ${i + 1}: invalid longitude.`;
      if (!stop.arrivalTime) return `Stop ${i + 1}: arrival time is required.`;
      if (!['pickup', 'dropoff', 'both'].includes(stop.type)) return `Stop ${i + 1}: invalid stop type.`;
    }

    return '';
  }

  async function handleCreateRoute() {
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        totalSeats: Number(form.totalSeats),
        farePerSeat: Number(form.farePerSeat) || 0,
        driverUserId: form.driverUserId || null,
        stops: stops.map((s, index) => ({
          name: String(s.name).trim(),
          latitude: Number(s.latitude),
          longitude: Number(s.longitude),
          arrivalTime: s.arrivalTime,
          type: s.type,
          order: index + 1,
        })),
      };

      await dashboardAPI.createRoute(payload);
      toast.success('Route created');
      setForm({
        name: '',
        departureTime: '',
        arrivalTime: '',
        totalSeats: 40,
        farePerSeat: 0,
        driverUserId: '',
      });
      setStops(DEFAULT_STOPS.map((s, idx) => ({ ...newStop(idx + 1), type: s.type })));
      await loadRoutes();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create route.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRoute(routeId) {
    if (!window.confirm('Delete this route?')) return;

    setDeletingId(routeId);
    try {
      await dashboardAPI.deleteRoute(routeId);
      toast.success('Route deleted');
      await loadRoutes();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete route'));
    } finally {
      setDeletingId('');
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bus Management</h1>
        <p className="text-sm text-slate-500">Create and delete bus routes backed by database APIs.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Create Route</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Route name"
            className="border border-slate-300 rounded-lg px-3 py-2"
          />
          <select
            value={form.driverUserId}
            onChange={(e) => setForm((p) => ({ ...p, driverUserId: e.target.value }))}
            className="border border-slate-300 rounded-lg px-3 py-2"
          >
            <option value="">No driver assigned</option>
            {drivers.map((d) => (
              <option key={d.user_id} value={d.user_id}>{d.name}</option>
            ))}
          </select>

          <input
            type="time"
            value={form.departureTime}
            onChange={(e) => setForm((p) => ({ ...p, departureTime: e.target.value }))}
            className="border border-slate-300 rounded-lg px-3 py-2"
          />
          <input
            type="time"
            value={form.arrivalTime}
            onChange={(e) => setForm((p) => ({ ...p, arrivalTime: e.target.value }))}
            className="border border-slate-300 rounded-lg px-3 py-2"
          />

          <input
            type="number"
            min="1"
            value={form.totalSeats}
            onChange={(e) => setForm((p) => ({ ...p, totalSeats: e.target.value }))}
            placeholder="Total seats"
            className="border border-slate-300 rounded-lg px-3 py-2"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.farePerSeat}
            onChange={(e) => setForm((p) => ({ ...p, farePerSeat: e.target.value }))}
            placeholder="Fare per seat"
            className="border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-slate-900">Stops ({stopCount})</h3>
            <button onClick={addStop} className="text-sm px-3 py-1.5 rounded-lg bg-slate-900 text-white">Add Stop</button>
          </div>

          {stops.map((stop, idx) => (
            <div key={stop.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 border border-slate-200 rounded-lg">
              <input
                value={stop.name}
                onChange={(e) => updateStop(stop.id, 'name', e.target.value)}
                placeholder={`Stop ${idx + 1} name`}
                className="border border-slate-300 rounded-md px-2 py-2 md:col-span-2"
              />
              <input
                value={stop.latitude}
                onChange={(e) => updateStop(stop.id, 'latitude', e.target.value)}
                placeholder="Latitude"
                className="border border-slate-300 rounded-md px-2 py-2"
              />
              <input
                value={stop.longitude}
                onChange={(e) => updateStop(stop.id, 'longitude', e.target.value)}
                placeholder="Longitude"
                className="border border-slate-300 rounded-md px-2 py-2"
              />
              <input
                type="time"
                value={stop.arrivalTime}
                onChange={(e) => updateStop(stop.id, 'arrivalTime', e.target.value)}
                className="border border-slate-300 rounded-md px-2 py-2"
              />
              <div className="flex gap-2">
                <select
                  value={stop.type}
                  onChange={(e) => updateStop(stop.id, 'type', e.target.value)}
                  className="border border-slate-300 rounded-md px-2 py-2 flex-1"
                >
                  <option value="pickup">Pickup</option>
                  <option value="dropoff">Dropoff</option>
                  <option value="both">Both</option>
                </select>
                <button
                  type="button"
                  onClick={() => setPickingStopId(stop.id)}
                  className="px-2 py-2 rounded-md border border-blue-300 text-blue-700"
                >
                  Pick
                </button>
                <button
                  onClick={() => removeStop(stop.id)}
                  className="px-2 py-2 rounded-md border border-red-300 text-red-600"
                  disabled={stops.length <= 2}
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          onClick={handleCreateRoute}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Create Route'}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Existing Routes</h2>

        {loadingRoutes ? (
          <p className="text-sm text-slate-500">Loading routes...</p>
        ) : routes.length === 0 ? (
          <p className="text-sm text-slate-500">No routes found.</p>
        ) : (
          <div className="space-y-2">
            {routes.map((route) => (
              <div key={route.id} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{route.name}</p>
                  <p className="text-xs text-slate-500">
                    {route.departureTime} - {route.arrivalTime} | Seats: {route.totalSeats} | Stops: {Array.isArray(route.stops) ? route.stops.length : 0}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteRoute(route.id)}
                  disabled={deletingId === route.id}
                  className="px-3 py-1.5 rounded-md border border-red-300 text-red-600 disabled:opacity-50"
                >
                  {deletingId === route.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <LocationPickerModal
        visible={Boolean(pickingStopId)}
        initialPosition={
          (() => {
            const current = stops.find((s) => s.id === pickingStopId);
            const lat = Number(current?.latitude);
            const lng = Number(current?.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
          })()
        }
        onClose={() => setPickingStopId('')}
        onSelect={({ latitude, longitude }) => {
          updateStop(pickingStopId, 'latitude', latitude.toFixed(8));
          updateStop(pickingStopId, 'longitude', longitude.toFixed(8));
          setPickingStopId('');
        }}
      />
    </div>
  );
}
