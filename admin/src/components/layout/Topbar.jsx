import React from 'react';
import { LogOut, Menu, ShieldCheck } from 'lucide-react';

function getInitials(name = '') {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return 'A';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export default function Topbar({ kicker, title, description, user, onMenuClick, onLogout }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="mt-1 rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{kicker}</p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-slate-900 sm:text-[1.8rem]">{title}</h1>
            {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p> : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm sm:flex sm:items-center sm:gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>JWT protected</span>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {getInitials(user?.name || user?.email)}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold text-slate-900">{user?.name || user?.email || 'Admin'}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{String(user?.role || 'admin')}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
