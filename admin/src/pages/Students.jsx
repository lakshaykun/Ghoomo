import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarClock, Search, RefreshCcw, Route, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listStudents } from '../services/studentAPI';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import DataTable from '../components/tables/DataTable';
import useInterval from '../hooks/useInterval';
import { formatDateTime, getRideStatusInfo, formatNumber } from '../utils/dashboard';

const ACTIVE_RIDE_STATUSES = ['assigned', 'arriving', 'started'];

export default function Students() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadStudents = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError('');
      const data = await listStudents({ limit: 100 });
      setStudents(data.students || []);
      setPagination(data.pagination || {});
      setLastUpdated(new Date());
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load students');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadStudents(false);
  }, []);

  useInterval(() => {
    if (!error) {
      void loadStudents(true);
    }
  }, 15000);

  const visibleStudents = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return students.filter((student) => {
      const text = [student.name, student.email, student.phone, student.recentRide?.pickupLocation, student.recentRide?.dropLocation].join(' ').toLowerCase();
      return !needle || text.includes(needle);
    });
  }, [students, search]);

  const stats = useMemo(() => {
    const withRecentRide = students.filter((student) => Boolean(student.recentRide)).length;
    const activeTrips = students.filter((student) => ACTIVE_RIDE_STATUSES.includes(String(student.recentRide?.status || '').toLowerCase())).length;
    const completedTrips = students.filter((student) => String(student.recentRide?.status || '').toLowerCase() === 'completed').length;

    return {
      total: pagination.total || students.length,
      withRecentRide,
      activeTrips,
      completedTrips,
    };
  }, [students, pagination.total]);

  const updatedLabel = lastUpdated ? lastUpdated.toLocaleString() : '—';

  if (loading) {
    return <LoadingState title="Loading students" description="Fetching the rider roster and their latest trip records." />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
        <div className="flex items-start gap-3">
          <UserRound className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-rose-800">Unable to load students</p>
            <p className="mt-2 text-sm leading-6 text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => loadStudents(false)}
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
        kicker="Rider management"
        title="Students"
        description="Review student accounts and the most recent ride tied to each rider."
        actions={
          <>
            <Link
              to="/rides"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Route className="h-4 w-4" />
              View rides
            </Link>
            <button
              type="button"
              onClick={() => loadStudents(false)}
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
          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">Rider records are synced from the backend</span>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total students" value={formatNumber(stats.total)} icon={BookOpen} tone="blue" detail="Registered riders in the college transport system" />
        <StatCard title="With recent rides" value={formatNumber(stats.withRecentRide)} icon={CalendarClock} tone="green" detail="Students with at least one ride record" />
        <StatCard title="Active trips" value={formatNumber(stats.activeTrips)} icon={Route} tone="amber" detail="Students currently tied to an in-flight ride" />
        <StatCard title="Completed trips" value={formatNumber(stats.completedTrips)} icon={UserRound} tone="slate" detail="Students whose latest ride is complete" />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student, contact, pickup, or drop"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <DataTable title="Student roster" description={`Showing ${visibleStudents.length} of ${students.length} students`}>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Student</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recent ride</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Route</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Last ride</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {visibleStudents.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-10">
                  <EmptyState
                    icon={BookOpen}
                    title="No students match this view"
                    description="Try another search term to inspect a different rider group."
                  />
                </td>
              </tr>
            ) : (
              visibleStudents.map((student) => {
                const ride = student.recentRide;
                const rideInfo = getRideStatusInfo(ride?.status);

                return (
                  <tr key={student.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">{student.name || 'Unnamed student'}</p>
                        <p className="text-sm text-slate-500">{student.email || 'No email'}{student.phone ? ` • ${student.phone}` : ''}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">{ride?.pickupLocation || 'No recent ride'}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{ride ? `${ride.pickupLocation || '—'} → ${ride.dropLocation || '—'}` : '—'}</td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={ride ? rideInfo.tone : 'neutral'}>{ride ? rideInfo.label : 'Idle'}</StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatDateTime(ride?.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to="/rides"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <Route className="h-4 w-4" />
                        Open rides
                      </Link>
                    </td>
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
