import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, BusFront, RadioTower, ShieldCheck, UsersRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/common/LoadingState';

const HIGHLIGHTS = [
  { icon: BusFront, label: 'Drivers' },
  { icon: UsersRound, label: 'Students' },
  { icon: RadioTower, label: 'Live monitoring' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <LoadingState title="Checking secure session" description="Preparing the college transport control room." fullScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError?.message || 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              College Transport Administration
            </div>

            <h1 className="mt-8 max-w-xl font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Monitoring, control, and safety in one calm dashboard.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              Sign in to manage transport operations, watch live driver coverage, review student travel, and respond to alerts without extra navigation.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {HIGHLIGHTS.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <Icon className="h-5 w-5 text-sky-300" />
                    <p className="mt-3 text-sm font-semibold text-white">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Operator ready</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Admin and operator roles can access the same secure workspace with JWT-protected routes.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Secure sign in</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-slate-900">Control room access</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use your admin or operator credentials to enter the transport dashboard.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@college.edu"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  required
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Enter dashboard'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              The dashboard is optimized for operational visibility and quick response during peak movement.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
