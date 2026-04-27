import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, ArrowRight, CarFront, RefreshCcw, ShieldCheck, TimerReset, UsersRound } from 'lucide-react';
import dashboardAPI from '../services/dashboardAPI';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import DataTable from '../components/tables/DataTable';
import useInterval from '../hooks/useInterval';
import { buildOperationalAlerts, formatDateTime, formatDuration, getRideStatusInfo } from '../utils/dashboard';

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold text-rose-800">Unable to load dashboard data</p>
          <p className="mt-2 text-sm leading-6 text-rose-700">{message}</p>
          <button
            type="button"
            onClick={onRetry}
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

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadOverview = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError('');
      const data = await dashboardAPI.getOverviewData();
      setOverview(data);
      setLastUpdated(new Date());
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load dashboard data');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadOverview(false);
  }, []);

  useInterval(() => {
    if (!error) {
      void loadOverview(true);
    }
  }, 10000);

  const stats = overview?.stats || {};
  const health = overview?.health || {};
  const recentRides = overview?.recentRides || [];
  const alerts = useMemo(() => buildOperationalAlerts({ stats, health }), [stats, health]);
  const activeDrivers = Number(stats.availableDrivers || 0);
  const activeRides = Number(stats.activeRides || 0);
  const idleDrivers = Math.max(activeDrivers - activeRides, 0);
  const alertCount = alerts.length;
  const healthTone = health.status === 'healthy' ? 'success' : 'danger';

  if (loading) {
    return <LoadingState title="Loading dashboard" description="Collecting transport control room metrics and live events." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => loadOverview(false)} />;
  }

  const updatedLabel = lastUpdated ? formatDateTime(lastUpdated) : '—';

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Control room overview"
        title="Dashboard"
        description="Monitor active drivers, ongoing rides, and operational health from one quick screen."
        actions={
          <>
            <StatusBadge tone={healthTone}>{health.status || 'unknown'}</StatusBadge>
            <button
              type="button"
              onClick={() => loadOverview(false)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </>
        }
      >
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Last sync {updatedLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">
            <TimerReset className="h-4 w-4 text-blue-600" />
            Auto-refresh every 10 seconds
          </span>
        </div>
      </PageHeader>

      {alertCount > 0 ? (
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
        <StatCard title="Total active drivers" value={activeDrivers} icon={CarFront} tone="green" detail="Drivers currently available for dispatch" />
        <StatCard title="Active rides" value={activeRides} icon={UsersRound} tone="blue" detail="Trips in progress or awaiting completion" />
        <StatCard title="Idle drivers" value={idleDrivers} icon={ArrowRight} tone="amber" detail="Available drivers not tied to a live ride" />
        <StatCard title="Alerts" value={alertCount} icon={AlertCircle} tone={alertCount > 0 ? 'red' : 'slate'} detail="Health or coverage issues needing attention" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <DataTable title="Recent rides" description="Latest trip records pulled from the backend.">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Student</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Driver</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pickup</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {recentRides.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10">
                    <EmptyState
                      icon={UsersRound}
                      title="No recent rides"
                      description="Ride activity will appear here once trips start flowing through the system."
                    />
                  </td>
                </tr>
              ) : (
                recentRides.map((ride) => {
                  const statusInfo = getRideStatusInfo(ride.status);

                  return (
                    <tr key={ride.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 text-sm font-medium text-slate-900">{ride.studentName || ride.studentId || '—'}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{ride.driverName || ride.driverId || 'Unassigned'}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{ride.pickupLocation || '—'}</td>
                      <td className="px-5 py-4"><StatusBadge tone={statusInfo.tone}>{statusInfo.label}</StatusBadge></td>
                      <td className="px-5 py-4 text-sm text-slate-600">{formatDateTime(ride.createdAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </DataTable>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Health</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">System status</h3>
              </div>
              <StatusBadge tone={healthTone}>{health.status || 'unknown'}</StatusBadge>
            </div>

            <div className="mt-4 grid gap-3 text-sm">
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Daily throughput</p>
            <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">Operational snapshot</h3>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-slate-500">Ride requests today</p>
                <p className="mt-1 font-display text-2xl font-semibold text-slate-900">{stats.rideRequestsToday || 0}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-slate-500">Rides completed today</p>
                <p className="mt-1 font-display text-2xl font-semibold text-slate-900">{stats.completedRidesToday || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
