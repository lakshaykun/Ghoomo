import React, { useEffect, useMemo, useState } from 'react';
import dashboardAPI from '../services/dashboardAPI';
import '../styles/Drivers.css';

const DEFAULT_CENTER = {
  latitude: '30.900965',
  longitude: '75.857277',
  limit: '10',
};

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [coordinates, setCoordinates] = useState(DEFAULT_CENTER);
  const [actionLoadingId, setActionLoadingId] = useState('');

  useEffect(() => {
    void fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError('');

      const [driverResponse, nearbyResponse] = await Promise.all([
        dashboardAPI.getUsers({ page: 1, limit: 50, role: 'driver' }),
        dashboardAPI.getNearbyDrivers({
          latitude: Number(coordinates.latitude),
          longitude: Number(coordinates.longitude),
          limit: Number(coordinates.limit),
        }),
      ]);

      setDrivers(driverResponse.data);
      setNearbyDrivers(nearbyResponse.data);
    } catch (err) {
      setError(err?.message || 'Failed to fetch drivers');
      console.error('Failed to fetch drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCoordinatesChange = (event) => {
    const { name, value } = event.target;
    setCoordinates((current) => ({ ...current, [name]: value }));
  };

  const handleSearchNearby = async (event) => {
    event.preventDefault();
    await fetchDrivers();
  };

  const handleDriverStatusChange = async (driverId, status) => {
    try {
      setActionLoadingId(driverId);
      await dashboardAPI.updateDriverStatus(driverId, status);
      await fetchDrivers();
    } catch (err) {
      console.error('Failed to update driver status:', err);
    } finally {
      setActionLoadingId('');
    }
  };

  const filteredDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return drivers.filter((driver) => {
      if (!query) {
        return true;
      }

      return [driver.name, driver.email, driver.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [drivers, search]);

  const filteredNearbyDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return nearbyDrivers.filter((driver) => {
      if (!query) {
        return true;
      }

      return [driver.name, driver.email, driver.phone, driver.vehicleNumber, driver.vehicleType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [nearbyDrivers, search]);

  if (loading) return <div className="loading">Loading drivers...</div>;

  if (error) return <div className="error">{error}</div>;

  const cardStyle = {
    background: 'white',
    borderRadius: '12px',
    boxShadow: 'var(--shadow)',
    border: '1px solid var(--gray-200)',
    padding: '16px',
    minWidth: '180px',
    flex: '1 1 180px',
  };

  return (
    <div className="drivers-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2>Driver Management</h2>
          <p style={{ maxWidth: '760px', color: 'var(--ink-600)', lineHeight: 1.6 }}>
            Track driver accounts and live nearby drivers from the backend. Use the coordinate search to
            inspect which approved drivers are currently closest to the selected point.
          </p>
        </div>

        <form onSubmit={handleSearchNearby} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            name="latitude"
            value={coordinates.latitude}
            onChange={handleCoordinatesChange}
            placeholder="Latitude"
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gray-300)', minWidth: '160px' }}
          />
          <input
            type="text"
            name="longitude"
            value={coordinates.longitude}
            onChange={handleCoordinatesChange}
            placeholder="Longitude"
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gray-300)', minWidth: '160px' }}
          />
          <input
            type="number"
            min="1"
            name="limit"
            value={coordinates.limit}
            onChange={handleCoordinatesChange}
            placeholder="Limit"
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--gray-300)', width: '100px' }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--primary)',
              color: 'white',
              fontWeight: 700,
            }}
          >
            Refresh Nearby
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div style={cardStyle}>
          <p style={{ color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px', fontWeight: 800, marginBottom: '6px' }}>Driver Accounts</p>
          <h3 style={{ fontSize: '30px', margin: 0, color: 'var(--ink-900)' }}>{filteredDrivers.length}</h3>
          <span style={{ color: 'var(--ink-600)', fontSize: '13px' }}>Drivers returned by the user directory</span>
        </div>

        <div style={cardStyle}>
          <p style={{ color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px', fontWeight: 800, marginBottom: '6px' }}>Nearby Drivers</p>
          <h3 style={{ fontSize: '30px', margin: 0, color: 'var(--ink-900)' }}>{filteredNearbyDrivers.length}</h3>
          <span style={{ color: 'var(--ink-600)', fontSize: '13px' }}>Approved live drivers around the selected coordinates</span>
        </div>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search by name, email, vehicle, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-card">
        <h3 style={{ marginBottom: '16px' }}>Driver Accounts</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrivers.length === 0 ? (
              <tr>
                <td colSpan="5">No driver accounts match the current filters.</td>
              </tr>
            ) : filteredDrivers.map((driver) => (
              <tr key={driver.id}>
                <td>{driver.name || '-'}</td>
                <td>{driver.email || '-'}</td>
                <td>{driver.phone || '-'}</td>
                <td>{driver.role || 'driver'}</td>
                <td>{driver.createdAt ? new Date(driver.createdAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-card" style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Nearby Live Drivers</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Vehicle</th>
              <th>Distance</th>
              <th>Rating</th>
              <th>Availability</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredNearbyDrivers.length === 0 ? (
              <tr>
                <td colSpan="7">No nearby drivers found for the selected coordinates.</td>
              </tr>
            ) : filteredNearbyDrivers.map((driver) => {
              const nextStatus = driver.status === 'suspended' ? 'approved' : 'suspended';

              return (
                <tr key={driver.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <strong style={{ color: 'var(--ink-900)' }}>{driver.name || '-'}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--ink-500)' }}>{driver.phone || '-'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span>{driver.vehicleType || '-'}</span>
                      <span style={{ fontSize: '12px', color: 'var(--ink-500)' }}>{driver.vehicleNumber || '-'}</span>
                    </div>
                  </td>
                  <td>{driver.distanceKm !== null ? `${driver.distanceKm.toFixed(2)} km` : '-'}</td>
                  <td>{driver.rating !== null ? driver.rating.toFixed(1) : '-'}</td>
                  <td>
                    <span className={`status-badge ${driver.isAvailable ? 'active' : 'inactive'}`}>
                      {driver.isAvailable ? 'available' : 'offline'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${driver.status === 'approved' ? 'active' : 'inactive'}`}>
                      {driver.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleDriverStatusChange(driver.id, nextStatus)}
                      disabled={actionLoadingId === driver.id}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: nextStatus === 'approved' ? '#16a34a' : '#dc2626',
                        color: 'white',
                        fontWeight: 700,
                      }}
                    >
                      {actionLoadingId === driver.id ? 'Updating...' : nextStatus === 'approved' ? 'Approve' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
