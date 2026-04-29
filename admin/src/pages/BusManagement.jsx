import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Users, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Map as MapIcon,
  Edit2,
  Calendar,
  X,
  Navigation,
  Search,
  Maximize2
} from 'lucide-react';
import dashboardAPI from '../services/dashboardAPI';
import L from 'leaflet';
import { toast } from 'react-hot-toast';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const STOP_TYPES = [
  { value: 'pickup', label: 'Pickup' },
  { value: 'dropoff', label: 'Dropoff' },
  { value: 'both', label: 'Both' },
];

const CAMPUS_CENTER = [30.7673, 76.7860]; // PEC Chandigarh

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

function MapPicker({ onLocationSelect, currentPos }) {
  const [position, setPosition] = useState(currentPos || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState(currentPos || CAMPUS_CENTER);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setMapCenter([lat, lon]);
        setPosition([lat, lon]);
        onLocationSelect(lat, lon);
        toast.success(`Found: ${data[0].display_name.split(',')[0]}`);
      } else {
        toast.error('Location not found');
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  function LocationMarker() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        onLocationSelect(lat, lng);
      },
    });

    return position === null ? null : (
      <Marker position={position}>
        <Popup>Selected Location</Popup>
      </Marker>
    );
  }

  return (
    <div className="relative h-[380px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-50">
      {/* Search Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2 bg-white/95 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200 shadow-xl">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campus location..."
            className="flex-1 bg-transparent border-none text-sm px-3 focus:outline-none"
          />
          <button 
            type="submit"
            disabled={searching}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </form>
      </div>

      <MapContainer center={mapCenter} zoom={16} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapController center={mapCenter} />
        <LocationMarker />
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
        <MapPin size={12} className="text-blue-600" />
        <span className="text-[10px] font-bold text-slate-600">Click map to refine pin location</span>
      </div>
    </div>
  );
}

export default function BusManagement() {
  const [step, setStep] = useState(0); // 0: List, 1: Form
  const [routes, setRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);
  const [editingRouteId, setEditingRouteId] = useState(null);

  // Form State
  const [routeInfo, setRouteInfo] = useState({
    name: '',
    departureTime: '',
    arrivalTime: '',
    totalSeats: 40,
    driverUserId: ''
  });

  const [stops, setStops] = useState([
    { id: '1', name: 'Start Location', lat: '', lng: '', arrivalTime: '', type: 'pickup', order: 1 },
    { id: '2', name: 'End Location', lat: '', lng: '', arrivalTime: '', type: 'dropoff', order: 2 }
  ]);

  const [pickingStopId, setPickingStopId] = useState(null);

  useEffect(() => {
    fetchDrivers();
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    setLoadingRoutes(true);
    try {
      const response = await dashboardAPI.getRoutes();
      setRoutes(response.data || []);
    } catch (err) {
      toast.error('Failed to sync routes');
    } finally {
      setLoadingRoutes(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const data = await dashboardAPI.getApprovedBusDrivers();
      setDrivers(data);
    } catch (err) {
      console.error('Driver fetch error', err);
    }
  };

  const handleRouteInfoChange = (e) => {
    const { name, value } = e.target;
    setRouteInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleStopChange = (id, field, value) => {
    setStops(prev => prev.map(stop => stop.id === id ? { ...stop, [field]: value } : stop));
  };

  const addStop = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setStops(prev => [
      ...prev,
      { 
        id: newId, 
        name: '', 
        lat: '', 
        lng: '', 
        arrivalTime: '', 
        type: 'both', 
        order: prev.length + 1 
      }
    ]);
  };

  const removeStop = (id) => {
    if (stops.length <= 2) return;
    setStops(prev => {
      const filtered = prev.filter(stop => stop.id !== id);
      return filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
    });
  };

  const moveStop = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stops.length - 1) return;
    const newStops = [...stops];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newStops[index], newStops[targetIndex]] = [newStops[targetIndex], newStops[index]];
    setStops(newStops.map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  const validateForm = () => {
    setError(null);
    if (!routeInfo.name || !routeInfo.departureTime || !routeInfo.arrivalTime) {
      setError('Route identity and schedule are required');
      return false;
    }
    const invalidStop = stops.find(s => !s.name || !s.lat || !s.lng || !s.arrivalTime);
    if (invalidStop) {
      setError(`Waypoint incomplete: ${invalidStop.name || 'Unnamed stop'}`);
      return false;
    }
    return true;
  };

  const handleEdit = (route) => {
    setEditingRouteId(route.id);
    setRouteInfo({
      name: route.name,
      departureTime: route.departureTime,
      arrivalTime: route.arrivalTime,
      totalSeats: route.totalSeats,
      driverUserId: route.driverUserId || ''
    });
    
    // Ensure we handle stops correctly even if they come back as an array of strings or objects
    const normalizedStops = (route.stops || []).map(s => ({
      id: s.id || Math.random().toString(36).substr(2, 9),
      name: s.stopName || s.name,
      lat: s.latitude,
      lng: s.longitude,
      arrivalTime: s.arrivalTime,
      type: s.stopType || s.type || 'both',
      order: s.stopOrder || s.order
    }));

    setStops(normalizedStops.length >= 2 ? normalizedStops : [
      { id: '1', name: 'Start Location', lat: '', lng: '', arrivalTime: '', type: 'pickup', order: 1 },
      { id: '2', name: 'End Location', lat: '', lng: '', arrivalTime: '', type: 'dropoff', order: 2 }
    ]);
    setStep(1);
  };

  const handleDelete = async (routeId) => {
    if (!window.confirm('Archive this route? This will disconnect all passenger bookings.')) return;
    try {
      await dashboardAPI.deleteRoute(routeId);
      toast.success('Route archived');
      fetchRoutes();
    } catch (err) {
      toast.error('Decommission failed');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = {
        ...routeInfo,
        farePerSeat: 0,
        stops: stops.map(s => ({
          name: s.name,
          latitude: parseFloat(s.lat),
          longitude: parseFloat(s.lng),
          order: s.order,
          type: s.type,
          arrivalTime: s.arrivalTime
        }))
      };

      if (editingRouteId) {
        await dashboardAPI.updateRoute(editingRouteId, payload);
        toast.success('Route updated');
      } else {
        await dashboardAPI.createRoute(payload);
        toast.success('Route deployed');
      }
      resetAndClose();
      fetchRoutes();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(0);
    setEditingRouteId(null);
    setRouteInfo({ name: '', departureTime: '', arrivalTime: '', totalSeats: 40, driverUserId: '' });
    setStops([
      { id: '1', name: 'Start Location', lat: '', lng: '', arrivalTime: '', type: 'pickup', order: 1 },
      { id: '2', name: 'End Location', lat: '', lng: '', arrivalTime: '', type: 'dropoff', order: 2 }
    ]);
    setPickingStopId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 min-h-screen bg-slate-50/30 text-slate-900 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Bus className="text-blue-600" size={32} />
            Fleet Orchestration
          </h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">Manage network nodes, spatial waypoints, and pilot assignments.</p>
        </div>
        {step === 0 && (
          <button 
            onClick={() => setStep(1)} 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-2xl flex items-center gap-2.5 transition-all shadow-xl shadow-blue-200 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> Launch New Route
          </button>
        )}
      </div>

      {step === 0 ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          {loadingRoutes ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-sm font-bold uppercase tracking-widest">Synchronizing Fleet Data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {routes.map((route) => (
                <div key={route.id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-2xl hover:border-blue-200 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                        <Navigation size={24} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(route)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(route.id)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                    </div>

                    <h3 className="font-black text-slate-900 text-lg mb-2">{route.name}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-slate-500 text-xs font-bold mb-6">
                      <div className="flex items-center gap-1.5"><Clock size={14} className="text-blue-600" /> {route.departureTime} — {route.arrivalTime}</div>
                      <div className="flex items-center gap-1.5"><Users size={14} className="text-blue-600" /> {route.totalSeats} Seats</div>
                    </div>

                    <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white"><ShieldCheck size={14} /></div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Pilot</p>
                          <p className="text-[11px] font-bold text-slate-900 truncate max-w-[100px]">{route.driverName || 'UNASSIGNED'}</p>
                        </div>
                      </div>
                      <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {/* FIX: Ensure we show correct stop count */}
                        {Array.isArray(route.stops) ? route.stops.length : 0} Waypoints
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {routes.length === 0 && (
                <div className="col-span-full text-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
                  <Bus size={48} className="mx-auto text-slate-200 mb-4" />
                  <h3 className="text-lg font-black text-slate-900">No Network Nodes</h3>
                  <p className="text-slate-400 text-sm font-medium mt-1">Initialize your first bus route to begin tracking.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl max-w-6xl mx-auto animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between px-10 py-6 border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white"><MapIcon size={20} /></div>
              <h2 className="font-black text-slate-900 text-lg uppercase tracking-tight">{editingRouteId ? 'Update Network Node' : 'Initialize Network Node'}</h2>
            </div>
            <button onClick={resetAndClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all"><X size={24} /></button>
          </div>

          <div className="p-10">
            {error && <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-4 text-red-700 text-sm font-bold animate-in slide-in-from-top-4"><AlertCircle size={20} />{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-7 space-y-10">
                {/* Basic Configuration */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Route Identifier</label>
                    <input type="text" name="name" value={routeInfo.name} onChange={handleRouteInfoChange} placeholder="e.g. Campus Connector North" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Initial Launch</label>
                    <input type="time" name="departureTime" value={routeInfo.departureTime} onChange={handleRouteInfoChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-blue-500 focus:bg-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Final Terminus</label>
                    <input type="time" name="arrivalTime" value={routeInfo.arrivalTime} onChange={handleRouteInfoChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-blue-500 focus:bg-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Load Limit</label>
                    <input type="number" name="totalSeats" value={routeInfo.totalSeats} onChange={handleRouteInfoChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-blue-500 focus:bg-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Network Pilot</label>
                    <select name="driverUserId" value={routeInfo.driverUserId} onChange={handleRouteInfoChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-blue-500 focus:bg-white appearance-none">
                      <option value="">Awaiting Assignment</option>
                      {drivers.map(d => <option key={d.user_id} value={d.user_id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Spatial Waypoints */}
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Spatial Waypoints</h3>
                    <button onClick={addStop} className="text-blue-600 hover:text-blue-800 text-[10px] font-black flex items-center gap-1.5 uppercase bg-blue-50 px-3 py-1.5 rounded-lg transition-all"><Plus size={14} strokeWidth={3} /> Append Stop</button>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                    {stops.map((stop, index) => (
                      <div key={stop.id} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4 group relative">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="w-8 h-8 bg-slate-950 rounded-xl flex items-center justify-center text-[10px] font-black text-white">{index + 1}</span>
                            <input type="text" value={stop.name} onChange={(e) => handleStopChange(stop.id, 'name', e.target.value)} placeholder="Stop Label" className="bg-transparent border-none text-base font-black text-slate-900 focus:outline-none placeholder:text-slate-300 w-full" />
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => moveStop(index, 'up')} className="p-2 text-slate-400 hover:text-slate-900"><ArrowUp size={16} /></button>
                            <button onClick={() => moveStop(index, 'down')} className="p-2 text-slate-400 hover:text-slate-900"><ArrowDown size={16} /></button>
                            <button onClick={() => removeStop(stop.id)} className="p-2 text-red-300 hover:text-red-600"><Trash2 size={16} /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Est. Arrival</p>
                            <input type="time" value={stop.arrivalTime} onChange={(e) => handleStopChange(stop.id, 'arrivalTime', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase">GPS Anchor</p>
                            <button 
                              onClick={() => setPickingStopId(stop.id)} 
                              className={`w-full py-2.5 px-4 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-2 ${
                                stop.lat ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-100' : 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                              }`}
                            >
                              <MapPin size={14} /> {stop.lat ? 'Coordinates Locked' : 'Select Location'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Spatial Interface */}
              <div className="lg:col-span-5">
                <div className="sticky top-10 space-y-6">
                  <div className="bg-slate-950 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md"><Navigation className="text-blue-400" size={24} /></div>
                      <h4 className="text-lg font-black tracking-tight">Spatial Context</h4>
                    </div>
                    <p className="text-slate-400 text-xs font-medium leading-relaxed mb-8 relative z-10">
                      Synchronize network waypoints with precision geolocation. Searched locations will center the map for accurate pin placement.
                    </p>
                    
                    {pickingStopId ? (
                      <div className="space-y-4 animate-in slide-in-from-right-10 duration-500">
                        <MapPicker 
                          currentPos={stops.find(s => s.id === pickingStopId)?.lat ? [stops.find(s => s.id === pickingStopId).lat, stops.find(s => s.id === pickingStopId).lng] : null}
                          onLocationSelect={(lat, lng) => {
                            handleStopChange(pickingStopId, 'lat', lat);
                            handleStopChange(pickingStopId, 'lng', lng);
                          }}
                        />
                        <button onClick={() => setPickingStopId(null)} className="w-full py-4 bg-blue-600 text-white text-xs font-black rounded-2xl transition-all hover:bg-blue-500 shadow-xl shadow-blue-900/40 uppercase tracking-widest">Confirm Waypoint Location</button>
                      </div>
                    ) : (
                      <div className="h-[380px] bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center justify-center text-center p-12 backdrop-blur-sm">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6"><Maximize2 className="text-slate-600" size={32} /></div>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Awaiting Waypoint Selection</p>
                        <p className="text-[10px] text-slate-600 mt-2 font-medium">Select a waypoint from the logistics list to activate GPS anchoring.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 pt-10 border-t border-slate-100 flex items-center justify-between">
              <button onClick={resetAndClose} className="px-8 py-3 text-sm font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest">Cancel Deployment</button>
              <button 
                onClick={handleSubmit} 
                disabled={loading} 
                className="px-12 py-4 bg-slate-950 hover:bg-slate-900 text-white text-sm font-black rounded-[2rem] flex items-center gap-3 transition-all shadow-2xl shadow-slate-200 disabled:opacity-50 hover:-translate-y-1 active:translate-y-0"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : editingRouteId ? 'Synchronize Updates' : 'Authorize Deployment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
