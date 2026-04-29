import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  Users, 
  UserSquare2, 
  Car, 
  Bus, 
  Navigation2, 
  Settings, 
  ChevronRight,
  LogOut,
  MapPin,
  Star
} from 'lucide-react';

const MENU_ITEMS = [
  { 
    id: 'dashboard',
    label: 'Dashboard', 
    path: '/dashboard', 
    icon: LayoutDashboard,
    description: 'Overview & Stats'
  },
  { 
    id: 'monitoring',
    label: 'Live Monitoring', 
    path: '/live-monitoring', 
    icon: Map,
    description: 'Real-time tracking'
  },
  { 
    id: 'bus-management',
    label: 'Bus Management', 
    path: '/bus-management', 
    icon: Bus,
    description: 'Routes & Fleet'
  },
  { 
    id: 'routes',
    label: 'Route Manager', 
    path: '/routes', 
    icon: Navigation2,
    description: 'Legacy configuration'
  },
  { 
    id: 'drivers',
    label: 'Drivers', 
    path: '/drivers', 
    icon: UserSquare2,
    description: 'Management'
  },
  { 
    id: 'students',
    label: 'Students', 
    path: '/students', 
    icon: Users,
    description: 'Rider directory'
  },
  { 
    id: 'rides',
    label: 'Ride History', 
    path: '/rides', 
    icon: Car,
    description: 'Trip logs'
  },
  { 
    id: 'campus',
    label: 'Campus Map', 
    path: '/campus-boundary', 
    icon: MapPin,
    description: 'Geofencing'
  },
  { 
    id: 'places',
    label: 'Popular Places', 
    path: '/popular-places', 
    icon: Star,
    description: 'Hotspots'
  }
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 transition-transform duration-300 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-full flex-col px-4 py-6">
        {/* Logo */}
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-900/20">
            <Bus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Ghoomo</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Admin Control</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
          {MENU_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all ${
                  active 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`h-5 w-5 transition-colors ${active ? 'text-white' : 'group-hover:text-white'}`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{item.label}</p>
                </div>
                {active && <ChevronRight className="h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-6 border-t border-slate-800 pt-6 px-2">
          <div className="rounded-2xl bg-slate-800/50 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">System Status</p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-xs font-bold text-white">All Systems Operational</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
