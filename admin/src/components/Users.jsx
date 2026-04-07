import React, { useEffect, useMemo, useState } from 'react';
import dashboardAPI from '../services/dashboardAPI';
import '../styles/Users.css';

const PAGE_SIZE = 12;

const ROLE_OPTIONS = [
  { label: 'All Roles', value: '' },
  { label: 'Riders', value: 'rider' },
  { label: 'Drivers', value: 'driver' },
  { label: 'Bus Drivers', value: 'bus_driver' },
  { label: 'Admins', value: 'admin' },
];

const ROLE_STYLES = {
  rider: { background: '#ecfeff', color: '#155e75' },
  driver: { background: '#fef3c7', color: '#92400e' },
  bus_driver: { background: '#e0e7ff', color: '#3730a3' },
  admin: { background: '#dcfce7', color: '#166534' },
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    void fetchUsers();
  }, [page, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await dashboardAPI.getUsers({
        page,
        limit: PAGE_SIZE,
        role: roleFilter || '',
      });

      setUsers(response.data);
      setHasMore(response.data.length === PAGE_SIZE);
    } catch (err) {
      setError(err?.message || 'Failed to load users');
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      if (!query) {
        return true;
      }

      return [user.name, user.email, user.phone, user.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [search, users]);

  const handleRoleChange = (event) => {
    setPage(1);
    setRoleFilter(event.target.value);
  };

  if (loading) return <div className="loading">Loading users...</div>;

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="users-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2>User Management</h2>
          <p style={{ maxWidth: '720px', color: 'var(--ink-600)', lineHeight: 1.6 }}>
            Browse the current user directory straight from the backend. Filter by role, search by contact
            details, and page through the latest records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              minWidth: '260px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--gray-300)',
              fontSize: '14px',
            }}
          />

          <select
            value={roleFilter}
            onChange={handleRoleChange}
            style={{
              minWidth: '180px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--gray-300)',
              fontSize: '14px',
              background: 'white',
            }}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div className="insight-card" style={{ minWidth: '180px' }}>
          <p>Page</p>
          <h3>{page}</h3>
          <span>Backend pagination page</span>
        </div>
        <div className="insight-card" style={{ minWidth: '180px' }}>
          <p>Loaded Records</p>
          <h3>{filteredUsers.length}</h3>
          <span>Matching the current filters</span>
        </div>
        <div className="insight-card" style={{ minWidth: '180px' }}>
          <p>Role Filter</p>
          <h3>{roleFilter || 'All'}</h3>
          <span>Active directory segment</span>
        </div>
      </div>

      <div className="search-box">
        <span style={{ color: 'var(--ink-600)', fontSize: '13px' }}>
          {hasMore ? 'More records are available on the next page.' : 'No more records beyond this page.'}
        </span>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Created</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6">No users match the current filters.</td>
              </tr>
            ) : filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.name || '-'}</td>
                <td>{user.email || '-'}</td>
                <td>{user.phone || '-'}</td>
                <td>
                  <span className="status-badge" style={ROLE_STYLES[user.role] || ROLE_STYLES.rider}>
                    {user.role || 'rider'}
                  </span>
                </td>
                <td>{user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}</td>
                <td>{user.updatedAt ? new Date(user.updatedAt).toLocaleString() : '-'}</td>
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
