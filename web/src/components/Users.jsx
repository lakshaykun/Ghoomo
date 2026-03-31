import React, { useState, useEffect } from 'react';
import dashboardAPI from '../services/dashboardAPI';
import '../styles/Users.css';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getUsers();
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId) => {
    try {
      await dashboardAPI.suspendUser(userId);
      fetchUsers();
    } catch (err) {
      console.error('Failed to suspend user:', err);
    }
  };

  const handleActivate = async (userId) => {
    try {
      await dashboardAPI.activateUser(userId);
      fetchUsers();
    } catch (err) {
      console.error('Failed to activate user:', err);
    }
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="users-page">
      <h2>User Management</h2>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone || '-'}</td>
                <td>{user.role || '-'}</td>
                <td><span className={`status-badge ${user.isActive === false ? 'suspended' : 'active'}`}>{user.isActive === false ? 'suspended' : 'active'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
