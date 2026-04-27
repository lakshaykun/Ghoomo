import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Activity, RefreshCcw, Radar, Route, ShieldCheck, UsersRound } from 'lucide-react';
import dashboardAPI from '../services/dashboardAPI';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import DataTable from '../components/tables/DataTable';
import useInterval from '../hooks/useInterval';
import { buildOperationalAlerts, formatDateTime, formatDuration, formatNumber, getDriverStatusInfo, getRideStatusInfo } from '../utils/dashboard';

export default function LiveMonitoring() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadSnapshot = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError('');
      const data = await dashboardAPI.getMonitoringData({ days: 7, limit: 10 });
      setSnapshot(data);
      setLastUpdated(new Date());
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load live monitoring data');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadSnapshot(false);
  }, []);

  useInterval(() => {
    if (!error) {
      void loadSnapshot(true);
    }
  }, 10000);

  const stats = snapshot?.stats || {};
  const live = snapshot?.live || {};
  const health = snapshot?.health || {};
  const recentRequests = snapshot?.recentRequests || snapshot?.recent?.requests || [];
  const recentCandidates = snapshot?.recentCandidates || snapshot?.recent?.candidates || [];
  const recentBookings = snapshot?.recentBookings || snapshot?.recent?.bookings || [];
  const recentRides = snapshot?.recentRides || snapshot?.recent?.rides || [];
  const topDrivers = snapshot?.topDrivers || [];
  const topRoutes = snapshot?.topRoutes || [];

  const alerts = useMemo(() => buildOperationalAlerts({ stats: { ...stats, availableDrivers: live.availableDrivers, activeRides: live.activeRides, searchingRideRequests: live.pendingRideRequests }, health }), [stats, live, health]);
  const updatedLabel = lastUpdated ? formatDateTime(lastUpdated) : '—';
  const healthTone = health.status === 'healthy' ? 'success' : 'danger';

  if (loading) {
    return <LoadingState title="Loading live monitoring" description="Pulling the current transport control-room snapshot." />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
        <div className="flex items-start gap-3">
          <Activity className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-rose-800">Unable to load live monitoring</p>
            <p className="mt-2 text-sm leading-6 text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => loadSnapshot(false)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              <RefreshCcw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Live control"
        title="Live monitoring"
        description="Watch the transport network in real time with current ride, driver, and request activity."
        actions={
          <button
            type="button"
            onClick={() => loadSnapshot(false)}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        }
      >
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">Last sync {updatedLabel}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">Auto-refresh every 10 seconds</span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">Window {snapshot?.windowDays || 7} days</span>
        </div>
      </PageHeader>

      {alerts.length > 0 ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900">Operational alerts</p>
              <div className="mt-3 grid gap-3">
                {alerts.map((alert) => (
                  <div key={alert.title} className="rounded-2xl border border-amber-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{alert.title}</p>
                      <StatusBadge tone={alert.tone}>{alert.tone}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active rides" value={formatNumber(live.activeRides)} icon={Route} tone="green" detail="Trips currently in motion" />
        <StatCard title="Available drivers" value={formatNumber(live.availableDrivers)} icon={UsersRound} tone="blue" detail="Drivers ready for dispatch" />
        <StatCard title="Pending requests" value={formatNumber(live.pendingRideRequests)} icon={Radar} tone="amber" detail="Ride requests waiting to be matched" />
        <StatCard title="Completed today" value={formatNumber(live.completedRidesToday || stats.completedRidesToday || 0)} icon={Activity} tone="slate" detail="Trips completed during the selected window" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <DataTable title="Recent ride requests" description="Requests that are currently moving through the dispatch pipeline.">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Request</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Candidates</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Expires</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-10">
                      <EmptyState
                        icon={Radar}
                        title="No live requests"
                        description="The dispatch queue is clear at the moment."
                      />
                    </td>
                  </tr>
                ) : (
                  recentRequests.map((request) => {
                    const statusInfo = getRideStatusInfo(request.status);

                    return (
                      <tr key={request.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-900">{request.studentName || 'Unknown student'}</p>
                            <p className="text-xs text-slate-500">{request.pickupLocation || 'Pickup unavailable'} → {request.dropLocation || 'Drop unavailable'}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4"><StatusBadge tone={statusInfo.tone}>{statusInfo.label}</StatusBadge></td>
                        <td className="px-5 py-4 text-sm text-slate-700">{formatNumber(request.candidateCount)}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{formatDateTime(request.expiresAt)}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{formatDateTime(request.createdAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </DataTable>

          <DataTable title="Recent candidate offers" description="Driver offers generated for matching requests.">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Driver</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Request</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentCandidates.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-10">
                      <EmptyState
                        icon={Activity}
                        title="No candidate offers"
                        description="Driver offers will show here when dispatch is actively matching rides."
                      />
                    </td>
                  </tr>
                ) : (
                  recentCandidates.map((candidate) => {
                    const statusInfo = getRideStatusInfo(candidate.status);

                    return (
                      <tr key={candidate.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4 text-sm font-medium text-slate-900">{candidate.driverName || 'Unknown driver'}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{candidate.requestId || '—'}</td>
                        <td className="px-5 py-4"><StatusBadge tone={statusInfo.tone}>{statusInfo.label}</StatusBadge></td>
                        <td className="px-5 py-4 text-sm text-slate-600">{candidate.distanceKm != null ? `${candidate.distanceKm.toFixed(1)} km` : '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </DataTable>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">System health</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">Backend status</h3>
              </div>
              <StatusBadge tone={healthTone}>{health.status || 'unknown'}</StatusBadge>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-slate-500">Environment</p>
                <p className="mt-1 font-semibold text-slate-900">{health.environment || 'unknown'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-slate-500">Database</p>
                <p className="mt-1 font-semibold text-slate-900">{health.database?.status || 'unknown'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-slate-500">Uptime</p>
                <p className="mt-1 font-semibold text-slate-900">{formatDuration(health.uptimeSeconds || 0)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Top drivers</p>
            <div className="mt-4 space-y-3">
              {topDrivers.length === 0 ? (
                <EmptyState icon={UsersRound} title="No driver metrics yet" description="Driver ranking data will appear here once the monitoring window fills up." />
              ) : (
                topDrivers.slice(0, 5).map((driver) => {
                  const statusInfo = getDriverStatusInfo(driver);

                  return (
                    <div key={driver.driverId || driver.userId || driver.name} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{driver.name || 'Driver'}</p>
                        <StatusBadge tone={statusInfo.tone}>{statusInfo.label}</StatusBadge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                        <span>{formatNumber(driver.completedRides)} trips</span>
                        <span>{driver.rating != null ? `${driver.rating.toFixed(1)} / 5` : '—'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Top routes</p>
            <div className="mt-4 space-y-3">
              {topRoutes.length === 0 ? (
                <EmptyState icon={Route} title="No route metrics yet" description="Route popularity and booking load will appear here as data grows." />
              ) : (
                topRoutes.slice(0, 5).map((route) => (
                  <div key={route.routeId || route.name} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{route.name || 'Route'}</p>
                      <span className="text-sm font-semibold text-slate-700">{formatNumber(route.bookings)} bookings</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{formatNumber(route.stopCount)} stops • {formatNumber(route.verifiedBookings)} verified</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Recent bookings</p>
            <div className="mt-4 space-y-3">
              {recentBookings.length === 0 ? (
                <EmptyState icon={Activity} title="No booking activity" description="Bus booking events will appear here as they happen." />
              ) : (
                recentBookings.slice(0, 4).map((booking) => (
                  <div key={booking.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{booking.userName || 'User'}</p>
                      <StatusBadge tone={booking.status === 'verified' ? 'success' : booking.status === 'cancelled' ? 'danger' : 'warning'}>{booking.status}</StatusBadge>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{booking.routeName || 'Route'} • seat {booking.seatNumber || '—'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Recent rides</p>
            <div className="mt-4 space-y-3">
              {recentRides.length === 0 ? (
                <EmptyState icon={Route} title="No recent rides" description="Recent ride history will appear here from the monitoring feed." />
              ) : (
                recentRides.slice(0, 4).map((ride) => {
                  const statusInfo = getRideStatusInfo(ride.status);

                  return (
                    <div key={ride.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{ride.studentName || 'Student'}</p>
                        <StatusBadge tone={statusInfo.tone}>{statusInfo.label}</StatusBadge>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{ride.pickupLocation || 'Pickup'} → {ride.dropLocation || 'Drop'}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
