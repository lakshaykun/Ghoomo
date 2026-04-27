import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, BusFront, GraduationCap, LayoutDashboard, Route, ShieldCheck, X } from 'lucide-react';

export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Drivers', path: '/drivers', icon: BusFront },
  { label: 'Students', path: '/students', icon: GraduationCap },
  { label: 'Rides', path: '/rides', icon: Route },
  { label: 'Live Monitoring', path: '/live-monitoring', icon: Activity },
];

export default function Sidebar({ open, onClose }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-800 bg-slate-950 text-white shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Ghoomo Admin</p>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Transport control room</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-800 p-2 text-slate-300 transition hover:bg-slate-900 hover:text-white lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 px-6 py-5">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Operations first</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Readability, live status, and control actions are prioritized over visual noise.
        </p>
      </div>
    </aside>
  );
}
