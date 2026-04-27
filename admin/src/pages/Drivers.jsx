import React, { useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, CarFront, MapPin, Phone, RefreshCcw, Search, ShieldAlert, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listDrivers, updateDriverStatus } from '../services/driverAPI';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import DataTable from '../components/tables/DataTable';
import useInterval from '../hooks/useInterval';
import { formatCoordinates, formatNumber, getDriverStatusInfo } from '../utils/dashboard';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'idle', label: 'Idle' },
  { value: 'pending', label: 'Pending' },
  { value: 'offline', label: 'Offline' },
];

function getDriverBucket(driver) {
  const status = String(driver.status || '').toLowerCase();

  if (status === 'approved' && driver.isAvailable) {
    return 'available';
  }

  if (status === 'approved') {
    return 'idle';
  }

  if (status === 'pending') {
    return 'pending';
  }

  return 'offline';
}

function formatDistance(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return '—';
  }

  return `${parsed.toFixed(1)} km`;
}

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [summary, setSummary] = useState({});
  const [health, setHealth] = useState({});
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDrivers = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError('');
      const data = await listDrivers({ limit: 100 });
      setDrivers(data.drivers || []);
      setSummary(data.summary || {});
      setHealth(data.health || {});
      setNearbyDrivers(data.nearbyDrivers || []);
      setLastUpdated(new Date());
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load drivers');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadDrivers(false);
  }, []);

  useInterval(() => {
    if (!error) {
      void loadDrivers(true);
    }
  }, 15000);

  const visibleDrivers = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return drivers.filter((driver) => {
      const bucket = getDriverBucket(driver);
      const text = [driver.name, driver.email, driver.phone, driver.vehicleNumber, driver.vehicleType].join(' ').toLowerCase();
      const matchesSearch = !needle || text.includes(needle);
      const matchesFilter = filter === 'all' || bucket === filter;
      return matchesSearch && matchesFilter;
    });
  }, [drivers, search, filter]);

  const stats = useMemo(() => {
    const available = drivers.filter((driver) => getDriverBucket(driver) === 'available').length;
    const idle = drivers.filter((driver) => getDriverBucket(driver) === 'idle').length;
    const pending = drivers.filter((driver) => getDriverBucket(driver) === 'pending').length;
    const offline = drivers.filter((driver) => getDriverBucket(driver) === 'offline').length;

    return {
      total: summary.totalDrivers || drivers.length,
      available,
      idle,
      pending,
      offline,
    };
  }, [drivers, summary.totalDrivers]);

  const highlightedNearby = nearbyDrivers.slice(0, 4);
  const updatedLabel = lastUpdated ? lastUpdated.toLocaleString() : '—';

  const handleStatusChange = async (driver) => {
    const nextStatus = driver.status === 'approved' ? 'suspended' : 'approved';

    try {
      setSavingId(driver.id);
      await updateDriverStatus(driver.id, nextStatus);
      await loadDrivers(true);
    } catch (updateError) {
      setError(updateError?.message || 'Failed to update driver status');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <LoadingState title="Loading drivers" description="Pulling the live driver roster and availability state." />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold text-rose-800">Unable to load drivers</p>
              <p className="mt-2 text-sm leading-6 text-rose-700">{error}</p>
              <button
                type="button"
                onClick={() => loadDrivers(false)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                <RefreshCcw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Operations"
        title="Drivers"
        description="Track driver availability, review coverage, and change driver approval status when needed."
        actions={
          <>
            <Link
              to="/live-monitoring"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <CarFront className="h-4 w-4" />
              Live monitoring
            </Link>
            <button
              type="button"
              onClick={() => loadDrivers(false)}
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
          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">Availability uses live online/offline state</span>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total drivers" value={formatNumber(stats.total)} icon={CarFront} tone="blue" detail="Roster synced from backend users and monitoring data" />
        <StatCard title="Available" value={formatNumber(stats.available)} icon={CheckCircle2} tone="green" detail="Approved drivers ready for assignment" />
        <StatCard title="Idle" value={formatNumber(stats.idle)} icon={CarFront} tone="amber" detail="Approved but currently not available" />
        <StatCard title="Offline" value={formatNumber(stats.offline)} icon={Ban} tone="red" detail="Suspended, rejected, or unavailable drivers" />
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, vehicle, email, or phone"
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

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <DataTable
          title="Driver roster"
          description={`Showing ${visibleDrivers.length} of ${drivers.length} drivers`}
        >
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Driver</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live location</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trips</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Rating</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleDrivers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-10">
                    <EmptyState
                      icon={CarFront}
                      title="No drivers match this view"
                      description="Try a different filter or search term to review another slice of the roster."
                    />
                  </td>
                </tr>
              ) : (
                visibleDrivers.map((driver) => {
                  const statusInfo = getDriverStatusInfo(driver);
                  const actionLabel = driver.status === 'approved' ? 'Suspend' : 'Approve';
                  const actionTone = driver.status === 'approved' ? 'danger' : 'success';

                  return (
                    <tr key={driver.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{driver.name || 'Unnamed driver'}</p>
                          <p className="text-sm text-slate-500">{driver.email || 'No email'}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{driver.phone || 'No phone'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2">
                          <StatusBadge tone={statusInfo.tone}>{statusInfo.label}</StatusBadge>
                          <span className="text-xs font-medium text-slate-500">{driver.isAvailable ? 'Online' : 'Offline'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span>{formatCoordinates(driver.currentLatitude, driver.currentLongitude)}</span>
                          </div>
                          <p className="text-xs text-slate-500">Distance {formatDistance(driver.distanceKm)}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">{formatNumber(driver.completedRides)} completed</td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                          <Star className="h-4 w-4 text-amber-500" />
                          {driver.rating != null ? driver.rating.toFixed(1) : '—'}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(driver)}
                          disabled={savingId === driver.id}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${actionTone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                          {savingId === driver.id ? 'Updating...' : actionLabel}
                        </button>
                      </td>
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Nearby coverage</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">Closest live drivers</h3>
              </div>
              <CarFront className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-4 space-y-3">
              {highlightedNearby.length === 0 ? (
                <EmptyState
                  icon={CarFront}
                  title="No nearby drivers"
                  description="The backend has not reported a live driver snapshot yet."
                />
              ) : (
                highlightedNearby.map((driver) => (
                  <div key={driver.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{driver.name || 'Driver'}</p>
                        <p className="text-xs text-slate-500">{driver.vehicleType || 'Vehicle'}</p>
                      </div>
                      <StatusBadge tone={driver.isAvailable ? 'success' : 'neutral'}>{driver.isAvailable ? 'Online' : 'Offline'}</StatusBadge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                      <span>{formatCoordinates(driver.currentLatitude, driver.currentLongitude)}</span>
                      <span>{formatDistance(driver.distanceKm)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Driver health</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Approval and availability are tracked separately so only online, available drivers are eligible for trips.</p>
              <p className="rounded-2xl bg-slate-50 px-4 py-3">Last sync {updatedLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
