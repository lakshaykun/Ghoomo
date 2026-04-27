import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, Filter, RefreshCcw, Route, Search, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listRides } from '../services/rideAPI';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import DataTable from '../components/tables/DataTable';
import useInterval from '../hooks/useInterval';
import { formatDateTime, formatNumber, getRideStatusInfo } from '../utils/dashboard';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'arriving', label: 'Arriving' },
  { value: 'started', label: 'Started' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function Rides() {
  const [rides, setRides] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadRides = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError('');
      const data = await listRides({ limit: 100 });
      setRides(data.data || []);
      setPagination(data.pagination || {});
      setLastUpdated(new Date());
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load rides');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadRides(false);
  }, []);

  useInterval(() => {
    if (!error) {
      void loadRides(true);
    }
  }, 15000);

  const visibleRides = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return rides.filter((ride) => {
      const status = String(ride.status || '').toLowerCase();
      const matchesFilter = filter === 'all' || status === filter;
      const text = [ride.studentName, ride.driverName, ride.pickupLocation, ride.dropLocation].join(' ').toLowerCase();
      const matchesSearch = !needle || text.includes(needle);
      return matchesFilter && matchesSearch;
    });
  }, [rides, search, filter]);

  const stats = useMemo(() => {
    const active = rides.filter((ride) => ['assigned', 'arriving', 'started'].includes(String(ride.status || '').toLowerCase())).length;
    const completed = rides.filter((ride) => String(ride.status || '').toLowerCase() === 'completed').length;
    const cancelled = rides.filter((ride) => String(ride.status || '').toLowerCase() === 'cancelled').length;

    return {
      total: pagination.total || rides.length,
      active,
      completed,
      cancelled,
    };
  }, [rides, pagination.total]);

  const updatedLabel = lastUpdated ? lastUpdated.toLocaleString() : '—';

  if (loading) {
    return <LoadingState title="Loading rides" description="Synchronizing the latest ride records from the backend." />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
        <div className="flex items-start gap-3">
          <Ticket className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-rose-800">Unable to load rides</p>
            <p className="mt-2 text-sm leading-6 text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => loadRides(false)}
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
        kicker="Trip control"
        title="Rides"
        description="Review ride assignment status, fare totals, and live trip progress."
        actions={
          <>
            <Link
              to="/live-monitoring"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Route className="h-4 w-4" />
              Live monitoring
            </Link>
            <button
              type="button"
              onClick={() => loadRides(false)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </>
        }
      >
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">Last sync {updatedLabel}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">Trips are ordered by backend response</span>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total rides" value={formatNumber(stats.total)} icon={Ticket} tone="blue" detail="All ride records returned by the backend" />
        <StatCard title="Active rides" value={formatNumber(stats.active)} icon={Route} tone="green" detail="Assigned, arriving, or started rides" />
        <StatCard title="Completed" value={formatNumber(stats.completed)} icon={Clock3} tone="amber" detail="Trips already finished" />
        <StatCard title="Cancelled" value={formatNumber(stats.cancelled)} icon={Filter} tone="red" detail="Trips that did not complete" />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student, driver, pickup, or drop"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === item.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable title="Ride records" description={`Showing ${visibleRides.length} of ${rides.length} rides`}>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Student</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Driver</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Route</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Distance</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {visibleRides.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-10">
                  <EmptyState
                    icon={Ticket}
                    title="No rides match this view"
                    description="Try another filter or search term to inspect a different ride slice."
                  />
                </td>
              </tr>
            ) : (
              visibleRides.map((ride) => {
                const statusInfo = getRideStatusInfo(ride.status);

                return (
                  <tr key={ride.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">{ride.studentName || 'Unknown student'}</p>
                        <p className="text-xs text-slate-500">{ride.studentId || 'No student ID'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-800">{ride.driverName || 'Unassigned'}</p>
                        <p className="text-xs text-slate-500">{ride.driverId || 'No driver ID'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      <div className="space-y-1">
                        <p>{ride.pickupLocation || '—'}</p>
                        <p className="text-xs text-slate-500">{ride.dropLocation || '—'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={statusInfo.tone}>{statusInfo.label}</StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">{ride.distance != null ? `${Number(ride.distance).toFixed(1)} km` : '—'}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatDateTime(ride.createdAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
