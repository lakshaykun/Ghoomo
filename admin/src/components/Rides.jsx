import React, { useEffect, useState } from 'react';
import dashboardAPI from '../services/dashboardAPI';
import '../styles/Rides.css';

const PAGE_SIZE = 20;

const FILTERS = [
  'all',
  'pending',
  'matched',
  'assigned',
  'arriving',
  'started',
  'in_progress',
  'completed',
  'cancelled',
];

export default function Rides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    void fetchRides();
  }, [filter, page]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await dashboardAPI.getRides({
        page,
        limit: PAGE_SIZE,
        status: filter !== 'all' ? filter : '',
      });

      setRides(response.data);
      setHasMore(response.data.length === PAGE_SIZE);
    } catch (err) {
      setError(err?.message || 'Failed to fetch rides');
      console.error('Failed to fetch rides:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (value) => {
    setPage(1);
    setFilter(value);
  };

  if (loading) return <div className="loading">Loading rides...</div>;

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="rides-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2>Ride Management</h2>
          <p style={{ maxWidth: '740px', color: 'var(--ink-600)', lineHeight: 1.6 }}>
            Review the latest ride requests straight from the backend. Filter by status and move through the
            records page by page.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'white',
            border: '1px solid var(--gray-200)',
            boxShadow: 'var(--shadow)',
          }}>
            <strong style={{ display: 'block', color: 'var(--ink-900)' }}>{rides.length}</strong>
            <span style={{ color: 'var(--ink-500)', fontSize: '12px' }}>Rows on this page</span>
          </div>
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'white',
            border: '1px solid var(--gray-200)',
            boxShadow: 'var(--shadow)',
          }}>
            <strong style={{ display: 'block', color: 'var(--ink-900)' }}>{filter}</strong>
            <span style={{ color: 'var(--ink-500)', fontSize: '12px' }}>Active status filter</span>
          </div>
        </div>
      </div>

      <div className="filter-box">
        {FILTERS.map((status) => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => handleFilterChange(status)}
          >
            {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Request</th>
              <th>Student</th>
              <th>Driver</th>
              <th>Fare</th>
              <th>Distance</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rides.length === 0 ? (
              <tr>
                <td colSpan="8">No rides found for the selected filter.</td>
              </tr>
            ) : rides.map((ride) => (
              <tr key={ride.id}>
                <td>{ride.id}</td>
                <td>{ride.requestId || '-'}</td>
                <td>{ride.studentId || '-'}</td>
                <td>{ride.driverId || '-'}</td>
                <td>{ride.fare !== null ? `₹${Number(ride.fare).toLocaleString('en-IN')}` : '-'}</td>
                <td>{ride.distance !== null ? `${Number(ride.distance).toFixed(1)} km` : '-'}</td>
                <td><span className={`status-badge ${ride.status}`}>{ride.status}</span></td>
                <td>{ride.createdAt ? new Date(ride.createdAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginTop: '18px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(current - 1, 1))}
          disabled={page === 1 || loading}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--gray-300)',
            background: page === 1 ? 'var(--gray-100)' : 'white',
            color: 'var(--ink-800)',
            fontWeight: 600,
          }}
        >
          Previous
        </button>

        <div style={{ color: 'var(--ink-600)', fontSize: '13px' }}>
          Page {page} {hasMore ? 'with more rows available' : 'is the final page for the current filter'}
        </div>

        <button
          type="button"
          onClick={() => setPage((current) => current + 1)}
          disabled={!hasMore || loading}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: 'none',
            background: hasMore ? 'var(--primary)' : 'var(--gray-300)',
            color: 'white',
            fontWeight: 600,
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
