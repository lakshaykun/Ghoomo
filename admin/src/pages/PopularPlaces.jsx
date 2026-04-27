import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  createPopularPlace,
  deletePopularPlace,
  getPopularPlaces,
  updatePopularPlace,
} from '../services/popularPlacesAPI';

// Fix default leaflet icon path (bundler issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Map click handler sub-component ─────────────────────────────────────────
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

// ── Nominatim reverse geocode ─────────────────────────────────────────────────
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      { headers: { 'User-Agent': 'GhoomoAdmin/1.0' } }
    );
    const json = await res.json();
    return json.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }
}

// ── Default form state ────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', address: '', latitude: '', longitude: '', sort_order: '0' };

// ─────────────────────────────────────────────────────────────────────────────
export default function PopularPlaces() {
  const [places, setPlaces]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [editTarget, setEditTarget] = useState(null); // place being edited, or null for create
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState(null);
  const [deleting, setDeleting]     = useState(null); // id being deleted
  const [mapCenter, setMapCenter]   = useState([20.5937, 78.9629]); // India default
  const [markerPos, setMarkerPos]   = useState(null);
  const geocodeTimer                = useRef(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPopularPlaces();
      setPlaces(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load popular places');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Open modal ────────────────────────────────────────────────────────────
  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setMarkerPos(null);
    setMapCenter([20.5937, 78.9629]);
    setFormError(null);
    setShowModal(true);
  }

  function openEdit(place) {
    setEditTarget(place);
    setForm({
      name:       place.name,
      address:    place.address,
      latitude:   String(place.latitude),
      longitude:  String(place.longitude),
      sort_order: String(place.sort_order ?? 0),
    });
    setMarkerPos([place.latitude, place.longitude]);
    setMapCenter([place.latitude, place.longitude]);
    setFormError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setMarkerPos(null);
    setFormError(null);
  }

  // ── Map click → fill lat/lon + reverse geocode address ───────────────────
  function handleMapClick({ lat, lng }) {
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLng = parseFloat(lng.toFixed(6));
    setMarkerPos([roundedLat, roundedLng]);
    setForm((prev) => ({
      ...prev,
      latitude:  String(roundedLat),
      longitude: String(roundedLng),
    }));

    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      const address = await reverseGeocode(roundedLat, roundedLng);
      setForm((prev) => ({ ...prev, address }));
    }, 400);
  }

  // ── Manual lat/lon field change → sync marker ─────────────────────────────
  function handleLatLonChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    const lat = field === 'latitude'  ? parseFloat(value) : parseFloat(form.latitude);
    const lon = field === 'longitude' ? parseFloat(value) : parseFloat(form.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      setMarkerPos([lat, lon]);
      setMapCenter([lat, lon]);
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const payload = {
        name:       form.name.trim(),
        address:    form.address.trim(),
        latitude:   parseFloat(form.latitude),
        longitude:  parseFloat(form.longitude),
        sort_order: parseInt(form.sort_order, 10) || 0,
      };
      if (editTarget) {
        await updatePopularPlace(editTarget.id, payload);
      } else {
        await createPopularPlace(payload);
      }
      await load();
      closeModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Save failed. Check all fields.');
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id) {
    if (!window.confirm('Delete this place? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deletePopularPlace(id);
      setPlaces((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Popular Places</h1>
          <p style={styles.subheading}>
            Campus landmarks users can quickly select while booking rides.
          </p>
        </div>
        <button style={styles.primaryBtn} onClick={openCreate}>
          + Add Place
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div style={styles.errorBanner}>
          {error}
          <button style={styles.retryBtn} onClick={load}>Retry</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={styles.emptyState}>Loading…</div>
      ) : places.length === 0 ? (
        <div style={styles.emptyState}>
          No popular places yet. Click <strong>+ Add Place</strong> to create one.
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['#', 'Name', 'Address', 'Latitude', 'Longitude', 'Order', 'Actions'].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {places.map((place, idx) => (
                <tr key={place.id} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                  <td style={styles.td}>{idx + 1}</td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{place.name}</td>
                  <td style={{ ...styles.td, maxWidth: 280, wordBreak: 'break-word' }}>{place.address}</td>
                  <td style={styles.tdMono}>{Number(place.latitude).toFixed(5)}</td>
                  <td style={styles.tdMono}>{Number(place.longitude).toFixed(5)}</td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>{place.sort_order}</td>
                  <td style={styles.td}>
                    <div style={styles.actionRow}>
                      <button style={styles.editBtn} onClick={() => openEdit(place)}>Edit</button>
                      <button
                        style={{ ...styles.deleteBtn, opacity: deleting === place.id ? 0.5 : 1 }}
                        disabled={deleting === place.id}
                        onClick={() => handleDelete(place.id)}
                      >
                        {deleting === place.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editTarget ? 'Edit Place' : 'Add Popular Place'}</h2>
              <button style={styles.closeBtn} onClick={closeModal}>✕</button>
            </div>

            {formError && <div style={styles.formError}>{formError}</div>}

            <form onSubmit={handleSave}>
              <div style={styles.formGrid}>
                {/* Name */}
                <div style={styles.fieldFull}>
                  <label style={styles.label}>Name *</label>
                  <input
                    style={styles.input}
                    required
                    placeholder="e.g. Main Gate"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>

                {/* Address */}
                <div style={styles.fieldFull}>
                  <label style={styles.label}>Address *</label>
                  <input
                    style={styles.input}
                    required
                    placeholder="e.g. College Main Entrance, Campus"
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  />
                </div>

                {/* Coords */}
                <div style={styles.fieldHalf}>
                  <label style={styles.label}>Latitude *</label>
                  <input
                    style={styles.input}
                    required
                    type="number"
                    step="any"
                    placeholder="28.6145"
                    value={form.latitude}
                    onChange={(e) => handleLatLonChange('latitude', e.target.value)}
                  />
                </div>
                <div style={styles.fieldHalf}>
                  <label style={styles.label}>Longitude *</label>
                  <input
                    style={styles.input}
                    required
                    type="number"
                    step="any"
                    placeholder="77.2102"
                    value={form.longitude}
                    onChange={(e) => handleLatLonChange('longitude', e.target.value)}
                  />
                </div>

                {/* Sort order */}
                <div style={styles.fieldHalf}>
                  <label style={styles.label}>Sort Order</label>
                  <input
                    style={styles.input}
                    type="number"
                    min="0"
                    value={form.sort_order}
                    onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
                  />
                </div>
              </div>

              {/* Map picker */}
              <div style={styles.mapLabel}>
                📍 Click map to set location — address auto-fills
              </div>
              <div style={styles.mapContainer}>
                <MapContainer
                  key={`${mapCenter[0]}-${mapCenter[1]}`}
                  center={mapCenter}
                  zoom={14}
                  style={{ height: '100%', width: '100%', borderRadius: 8 }}
                >
                  <TileLayer
                    url="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
                    attribution="© OpenStreetMap, © CARTO"
                  />
                  <MapClickHandler onMapClick={handleMapClick} />
                  {markerPos && <Marker position={markerPos} />}
                </MapContainer>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" style={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                <button type="submit" style={styles.saveBtn} disabled={saving}>
                  {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Place'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline styles (no TailwindCSS dependency) ─────────────────────────────────
const C = {
  blue: '#2563eb', blueHover: '#1d4ed8',
  red: '#dc2626', redHover: '#b91c1c',
  green: '#16a34a',
  surface: '#ffffff', bg: '#f8fafc',
  border: '#e2e8f0', borderStrong: '#cbd5e1',
  text: '#0f172a', textSec: '#475569',
  error: '#fef2f2', errorBorder: '#fca5a5', errorText: '#991b1b',
};

const styles = {
  page:         { padding: 24, maxWidth: 1100, margin: '0 auto' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  heading:      { fontSize: 24, fontWeight: 700, color: C.text, margin: 0 },
  subheading:   { fontSize: 14, color: C.textSec, marginTop: 4 },
  primaryBtn:   { background: C.blue, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  errorBanner:  { background: C.error, border: `1px solid ${C.errorBorder}`, color: C.errorText, padding: '12px 16px', borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  retryBtn:     { background: 'transparent', border: `1px solid ${C.errorBorder}`, borderRadius: 6, padding: '4px 12px', cursor: 'pointer', color: C.errorText },
  emptyState:   { textAlign: 'center', padding: 48, color: C.textSec },
  tableWrap:    { overflowX: 'auto', borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th:           { padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: C.textSec, borderBottom: `1px solid ${C.border}`, background: C.bg },
  td:           { padding: '12px 16px', color: C.text },
  tdMono:       { padding: '12px 16px', color: C.text, fontFamily: 'monospace', fontSize: 13 },
  trEven:       { background: C.surface },
  trOdd:        { background: C.bg },
  actionRow:    { display: 'flex', gap: 8 },
  editBtn:      { background: 'transparent', border: `1px solid ${C.blue}`, color: C.blue, borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 500 },
  deleteBtn:    { background: 'transparent', border: `1px solid ${C.red}`, color: C.red, borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 500 },
  // Modal
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  modal:        { background: C.surface, borderRadius: 16, padding: 28, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:   { fontSize: 18, fontWeight: 700, color: C.text, margin: 0 },
  closeBtn:     { background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: C.textSec, padding: 4 },
  formError:    { background: C.error, border: `1px solid ${C.errorBorder}`, color: C.errorText, padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  formGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px', marginBottom: 16 },
  fieldFull:    { gridColumn: '1 / -1' },
  fieldHalf:    {},
  label:        { display: 'block', fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 4 },
  input:        { width: '100%', border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' },
  mapLabel:     { fontSize: 13, color: C.textSec, marginBottom: 8, fontWeight: 500 },
  mapContainer: { height: 280, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}`, marginBottom: 20 },
  modalFooter:  { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  cancelBtn:    { background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 20px', cursor: 'pointer', color: C.textSec, fontWeight: 500 },
  saveBtn:      { background: C.blue, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 24px', fontWeight: 600, cursor: 'pointer' },
};
