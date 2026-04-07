import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import dashboardAPI from '../services/dashboardAPI';
import StatCard from './StatCard';
import '../styles/Monitoring.css';

const SERIES_META = [
  { key: 'users', label: 'New Users', color: '#0f766e' },
  { key: 'rideRequests', label: 'Ride Requests', color: '#f97316' },
  { key: 'rides', label: 'Rides', color: '#2563eb' },
  { key: 'busBookings', label: 'Bus Bookings', color: '#16a34a' },
];

const MONEY_FORMATTER = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

const NUMBER_FORMATTER = new Intl.NumberFormat('en-IN');

function mergeSeries(seriesList) {
  const merged = new Map();

  seriesList.forEach(({ key, rows }) => {
    rows.forEach((row) => {
      const rowKey = row.date || row.label;
      const existing = merged.get(rowKey) || { date: rowKey, label: row.label };
      existing[key] = row.count;
      merged.set(rowKey, existing);
    });
  });

  return Array.from(merged.values()).sort((left, right) => String(left.date).localeCompare(String(right.date)));
}

function ActivityList({ title, rows, renderRow, emptyMessage }) {
  return (
    <div className="monitor-card activity-card">
      <div className="monitor-card-head">
        <div>
          <p className="monitor-card-kicker">Recent</p>
          <h3>{title}</h3>
        </div>
        <span className="monitor-card-count">{rows.length} rows</span>
      </div>
      <div className="activity-list">
        {rows.length === 0 ? (
          <div className="empty-state">{emptyMessage}</div>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="activity-row">
              {renderRow(row)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BreakdownCard({ title, items, accent, emptyMessage }) {
  const total = items.reduce((sum, item) => sum + (item.count || 0), 0);
  const maxValue = Math.max(...items.map((item) => item.count || 0), 1);

  return (
    <div className="monitor-card breakdown-card">
      <div className="monitor-card-head">
        <div>
          <p className="monitor-card-kicker">Status Mix</p>
          <h3>{title}</h3>
        </div>
        <span className="monitor-card-count">{NUMBER_FORMATTER.format(total)} total</span>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">{emptyMessage}</div>
      ) : (
        <div className="breakdown-list">
          {items.map((item) => {
            const count = item.count || 0;
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            const width = count > 0 ? Math.max(Math.round((count / maxValue) * 100), 8) : 0;

            return (
              <div key={item.label} className="breakdown-row">
                <div className="breakdown-labels">
                  <span className="breakdown-label">{item.label || 'Unknown'}</span>
                  <span className="breakdown-value">{NUMBER_FORMATTER.format(count)} ({percent}%)</span>
                </div>
                <div className="breakdown-bar">
                  <span style={{ width: `${width}%`, background: accent }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TrendChart({ data }) {
  return (
    <div className="monitor-card trend-card monitor-card--wide">
      <div className="monitor-card-head">
        <div>
          <p className="monitor-card-kicker">Trend Watch</p>
          <h3>Activity Over Time</h3>
        </div>
        <span className="monitor-card-count">{data.length} days</span>
      </div>
      <div className="chart-shell">
        {data.length === 0 ? (
          <div className="empty-state">No trend data is available yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={330}>
            <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(15, 23, 42, 0.08)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid rgba(15, 23, 42, 0.12)',
                  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
                }}
                cursor={{ stroke: 'rgba(15, 23, 42, 0.12)', strokeWidth: 1 }}
              />
              <Legend />
              {SERIES_META.map((series) => (
                <Line
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.label}
                  stroke={series.color}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default function Monitoring() {
  const [monitoring, setMonitoring] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetchMonitoring();
  }, []);

  const fetchMonitoring = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await dashboardAPI.getMonitoringData({ days: 14, limit: 8 });
      setMonitoring(data);
    } catch (err) {
      setError(err?.message || 'Failed to load monitoring data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const analytics = monitoring || {};
  const summary = analytics.stats || {};
  const live = analytics.live || {};
  const trends = analytics.trends || {};
  const distributions = analytics.distributions || {};
  const topDrivers = analytics.topDrivers || [];
  const topRoutes = analytics.topRoutes || [];
  const recentRides = analytics.recent?.rides || [];
  const recentRequests = analytics.recent?.requests || [];
  const health = analytics.health || {};

  const chartData = useMemo(() => mergeSeries([
    { key: 'users', rows: trends.users || [] },
    { key: 'rideRequests', rows: trends.rideRequests || [] },
    { key: 'rides', rows: trends.rides || [] },
    { key: 'busBookings', rows: trends.busBookings || [] },
  ]), [trends.busBookings, trends.rides, trends.rideRequests, trends.users]);

  const queuePressure = (live.pendingRideRequests || 0) + (live.pendingCandidateOffers || 0);
  const driverAvailability = summary.totalDrivers > 0 ? Math.round((summary.availableDrivers / summary.totalDrivers) * 100) : 0;
  const completionRate = summary.totalRides > 0 ? Math.round((summary.completedRides / summary.totalRides) * 100) : 0;
  const bookingFill = summary.totalBusBookings > 0 ? Math.round((summary.verifiedBusBookings / summary.totalBusBookings) * 100) : 0;

  if (loading) return <div className="loading">Loading monitoring data...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="monitoring-page">
      <section className="monitoring-hero">
        <div>
          <p className="monitoring-eyebrow">Live Operations</p>
          <h2>Monitoring and Analytics</h2>
          <p className="monitoring-subtitle">
            Track demand, service health, queue pressure, and route performance from one operational view.
          </p>
          <div className="monitoring-chips">
            <span className={`monitoring-chip ${health.status === 'healthy' ? 'healthy' : 'warning'}`}>
              {health.status || 'unknown'}
            </span>
            <span className="monitoring-chip">{health.environment || 'unknown'}</span>
            <span className="monitoring-chip">DB {health.database?.status || 'unknown'}</span>
            <span className="monitoring-chip">Updated {health.timestamp ? new Date(health.timestamp).toLocaleString() : '-'}</span>
          </div>
        </div>

        <button onClick={fetchMonitoring} className="monitor-refresh-btn">
          Refresh Data
        </button>
      </section>

      <div className="stats-grid monitoring-stats-grid">
        <StatCard title="Total Users" value={NUMBER_FORMATTER.format(summary.totalUsers || 0)} icon="👥" color="#0f766e" />
        <StatCard title="Active Drivers" value={NUMBER_FORMATTER.format(summary.availableDrivers || 0)} icon="🚘" color="#2563eb" />
        <StatCard title="Active Rides" value={NUMBER_FORMATTER.format(summary.activeRides || 0)} icon="⏱️" color="#d97706" />
        <StatCard title="Pending Requests" value={NUMBER_FORMATTER.format(summary.searchingRideRequests || 0)} icon="📨" color="#f97316" />
        <StatCard title="Completed Today" value={NUMBER_FORMATTER.format(live.completedRidesToday || 0)} icon="✅" color="#16a34a" />
        <StatCard title="Revenue Today" value={`₹${MONEY_FORMATTER.format(live.revenueToday || 0)}`} icon="💰" color="#0f766e" />
        <StatCard title="Bus Bookings" value={NUMBER_FORMATTER.format(summary.totalBusBookings || 0)} icon="🚌" color="#155e75" />
        <StatCard title="Shared Rides" value={NUMBER_FORMATTER.format(summary.openSharedRides || 0)} icon="🔀" color="#7c3aed" />
      </div>

      <div className="monitoring-metrics-grid">
        <div className="monitor-card metric-card">
          <p className="monitor-card-kicker">Queue Pressure</p>
          <h3>{NUMBER_FORMATTER.format(queuePressure)}</h3>
          <span>Open ride requests and candidate offers waiting on action.</span>
        </div>
        <div className="monitor-card metric-card">
          <p className="monitor-card-kicker">Driver Availability</p>
          <h3>{driverAvailability}%</h3>
          <span>{NUMBER_FORMATTER.format(summary.availableDrivers || 0)} available drivers out of {NUMBER_FORMATTER.format(summary.totalDrivers || 0)}</span>
        </div>
        <div className="monitor-card metric-card">
          <p className="monitor-card-kicker">Ride Completion</p>
          <h3>{completionRate}%</h3>
          <span>{NUMBER_FORMATTER.format(summary.completedRides || 0)} completed rides from {NUMBER_FORMATTER.format(summary.totalRides || 0)} tracked rides</span>
        </div>
        <div className="monitor-card metric-card">
          <p className="monitor-card-kicker">Bus Booking Fill</p>
          <h3>{bookingFill}%</h3>
          <span>{NUMBER_FORMATTER.format(summary.verifiedBusBookings || 0)} verified bookings out of {NUMBER_FORMATTER.format(summary.totalBusBookings || 0)} total</span>
        </div>
      </div>

      <div className="monitoring-layout">
        <TrendChart data={chartData} />
        <div className="monitor-card summary-card">
          <div className="monitor-card-head">
            <div>
              <p className="monitor-card-kicker">Live Snapshot</p>
              <h3>Current Platform State</h3>
            </div>
            <span className="monitor-card-count">{analytics.windowDays || 14} day window</span>
          </div>

          <div className="snapshot-grid">
            <div>
              <span>Ride Requests</span>
              <strong>{NUMBER_FORMATTER.format(live.pendingRideRequests || 0)} pending</strong>
            </div>
            <div>
              <span>Candidate Offers</span>
              <strong>{NUMBER_FORMATTER.format(live.pendingCandidateOffers || 0)} pending</strong>
            </div>
            <div>
              <span>Active Rides</span>
              <strong>{NUMBER_FORMATTER.format(live.activeRides || 0)} live</strong>
            </div>
            <div>
              <span>Available Drivers</span>
              <strong>{NUMBER_FORMATTER.format(live.availableDrivers || 0)} online</strong>
            </div>
            <div>
              <span>New Users Today</span>
              <strong>{NUMBER_FORMATTER.format(live.newUsersToday || 0)}</strong>
            </div>
            <div>
              <span>Revenue Today</span>
              <strong>₹{MONEY_FORMATTER.format(live.revenueToday || 0)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="monitoring-breakdowns-grid">
        <BreakdownCard title="Ride Status Mix" items={distributions.rides || []} accent="#0f766e" emptyMessage="No rides are recorded yet." />
        <BreakdownCard title="Request Queue" items={distributions.rideRequests || []} accent="#f97316" emptyMessage="No ride request data yet." />
        <BreakdownCard title="Driver Status" items={distributions.drivers || []} accent="#2563eb" emptyMessage="No driver status data yet." />
        <BreakdownCard title="Bus Booking Status" items={distributions.busBookings || []} accent="#16a34a" emptyMessage="No bus booking data yet." />
      </div>

      <div className="monitoring-table-grid">
        <div className="monitor-card table-card monitor-table-card">
          <div className="monitor-card-head">
            <div>
              <p className="monitor-card-kicker">Leaderboard</p>
              <h3>Top Drivers</h3>
            </div>
            <span className="monitor-card-count">{topDrivers.length} drivers</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Completed</th>
                <th>Revenue</th>
                <th>Rating</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {topDrivers.length === 0 ? (
                <tr>
                  <td colSpan="5">No driver performance data yet.</td>
                </tr>
              ) : topDrivers.map((driver) => (
                <tr key={driver.driverId}>
                  <td>
                    <strong style={{ color: 'var(--ink-900)' }}>{driver.name || '-'}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--ink-500)' }}>{driver.email || '-'}</div>
                  </td>
                  <td>{NUMBER_FORMATTER.format(driver.completedRides || 0)}</td>
                  <td>₹{MONEY_FORMATTER.format(driver.revenue || 0)}</td>
                  <td>{driver.rating !== null && driver.rating !== undefined ? Number(driver.rating).toFixed(1) : '-'}</td>
                  <td>
                    <span className={`status-badge ${driver.status === 'approved' ? 'active' : 'inactive'}`}>
                      {driver.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="monitor-card table-card monitor-table-card">
          <div className="monitor-card-head">
            <div>
              <p className="monitor-card-kicker">Network</p>
              <h3>Top Bus Routes</h3>
            </div>
            <span className="monitor-card-count">{topRoutes.length} routes</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Stops</th>
                <th>Bookings</th>
                <th>Verified</th>
                <th>Pending</th>
              </tr>
            </thead>
            <tbody>
              {topRoutes.length === 0 ? (
                <tr>
                  <td colSpan="5">No route demand data yet.</td>
                </tr>
              ) : topRoutes.map((route) => (
                <tr key={route.routeId}>
                  <td>
                    <strong style={{ color: 'var(--ink-900)' }}>{route.name || '-'}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--ink-500)' }}>
                      {route.departureTime || '-'} to {route.arrivalTime || '-'}
                    </div>
                  </td>
                  <td>{NUMBER_FORMATTER.format(route.stopCount || 0)}</td>
                  <td>{NUMBER_FORMATTER.format(route.bookings || 0)}</td>
                  <td>{NUMBER_FORMATTER.format(route.verifiedBookings || 0)}</td>
                  <td>{NUMBER_FORMATTER.format(route.pendingBookings || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="monitoring-activity-grid">
        <ActivityList
          title="Recent Rides"
          rows={recentRides}
          emptyMessage="No recent rides are available."
          renderRow={(ride) => (
            <>
              <div className="activity-main">
                <strong>{ride.studentName || ride.studentId || 'Unknown rider'}</strong>
                <span>{ride.pickupLocation || '-'} → {ride.dropLocation || '-'}</span>
              </div>
              <div className="activity-side">
                <span className={`status-badge ${ride.status}`}>{ride.status}</span>
                <small>{ride.createdAt ? new Date(ride.createdAt).toLocaleString() : '-'}</small>
              </div>
            </>
          )}
        />

        <ActivityList
          title="Recent Requests"
          rows={recentRequests}
          emptyMessage="No recent ride requests are available."
          renderRow={(request) => (
            <>
              <div className="activity-main">
                <strong>{request.studentName || request.studentId || 'Unknown rider'}</strong>
                <span>{request.pickupLocation || '-'} → {request.dropLocation || '-'}</span>
              </div>
              <div className="activity-side">
                <span className={`status-badge ${request.status}`}>{request.status}</span>
                <small>{request.createdAt ? new Date(request.createdAt).toLocaleString() : '-'}</small>
              </div>
            </>
          )}
        />
      </div>
    </div>
  );
}
