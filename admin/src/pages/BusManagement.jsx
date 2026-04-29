import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
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
  Navigation
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

function MapPicker({ onLocationSelect, currentPos }) {
  const [position, setPosition] = useState(currentPos || null);

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
        <Popup>Stop Location</Popup>
      </Marker>
    );
  }

  return (
    <div className="h-[350px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
      <MapContainer center={position || CAMPUS_CENTER} zoom={16} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker />
      </MapContainer>
    </div>
  );
}

export default function BusManagement() {
  const [step, setStep] = useState(0); // 0: List, 1: Form, 2: Review
  const [routes, setRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
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
    { id: '1', name: 'Starting Point', lat: '', lng: '', arrivalTime: '', type: 'pickup', order: 1 },
    { id: '2', name: 'End Point', lat: '', lng: '', arrivalTime: '', type: 'dropoff', order: 2 }
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
      toast.error('Could not load routes');
    } finally {
      setLoadingRoutes(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const data = await dashboardAPI.getApprovedBusDrivers();
      setDrivers(data);
    } catch (err) {
      console.error('Failed to fetch drivers', err);
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
      setError('Please fill in basic route info');
      return false;
    }
    const invalidStop = stops.find(s => !s.name || !s.lat || !s.lng || !s.arrivalTime);
    if (invalidStop) {
      setError(`Complete all details for: ${invalidStop.name || 'Untitled stop'}`);
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
    setStops(route.stops.map(s => ({
      id: s.id || Math.random().toString(36).substr(2, 9),
      name: s.stopName || s.name,
      lat: s.latitude,
      lng: s.longitude,
      arrivalTime: s.arrivalTime,
      type: s.stopType || s.type || 'both',
      order: s.stopOrder || s.order
    })));
    setStep(1);
    setSuccess(false);
  };

  const handleDelete = async (routeId) => {
    if (!window.confirm('Delete this route?')) return;
    try {
      await dashboardAPI.deleteRoute(routeId);
      toast.success('Route deleted');
      fetchRoutes();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = {
        ...routeInfo,
        farePerSeat: 0, // Force zero fare
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
        toast.success('Route created');
      }
      setStep(0);
      setEditingRouteId(null);
      fetchRoutes();
    } catch (err) {
      setError(err.message || 'Processing error');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(0);
    setEditingRouteId(null);
    setRouteInfo({ name: '', departureTime: '', arrivalTime: '', totalSeats: 40, driverUserId: '' });
    setStops([
      { id: '1', name: 'Starting Point', lat: '', lng: '', arrivalTime: '', type: 'pickup', order: 1 },
      { id: '2', name: 'End Point', lat: '', lng: '', arrivalTime: '', type: 'dropoff', order: 2 }
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 bg-white min-h-screen text-slate-800 font-sans">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bus Management</h1>
          <p className="text-sm text-slate-500 font-medium">Manage routes, schedules, and fleet assignments</p>
        </div>
        {step === 0 && (
          <button 
            onClick={() => setStep(1)} 
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus size={18} /> Add Route
          </button>
        )}
      </div>

      {step === 0 ? (
        <div className="space-y-6">
          {loadingRoutes ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {routes.map((route) => (
                <div key={route.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                      <Bus size={22} />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(route)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(route.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={15} /></button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 mb-1">{route.name}</h3>
                  <div className="flex items-center gap-3 text-slate-500 text-xs mb-4">
                    <div className="flex items-center gap-1"><Clock size={13} /> {route.departureTime} - {route.arrivalTime}</div>
                    <div className="flex items-center gap-1"><Users size={13} /> {route.totalSeats}</div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><ShieldCheck size={12} /></div>
                      <span className="text-[11px] font-bold text-slate-600 truncate max-w-[120px]">{route.driverName || 'No Driver'}</span>
                    </div>
                    <div className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">{route.stops?.length || 0} Stops</div>
                  </div>
                </div>
              ))}
              {routes.length === 0 && (
                <div className="col-span-full text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                  <Bus size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 text-sm font-medium">No routes found. Start by creating one.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-bold text-slate-900">{editingRouteId ? 'Edit Route' : 'Create New Route'}</h2>
            <button onClick={resetAndClose} className="p-2 text-slate-400 hover:text-slate-600 transition-all"><X size={20} /></button>
          </div>

          <div className="p-6">
            {error && <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm font-medium"><AlertCircle size={16} />{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Route Name</label>
                    <input type="text" name="name" value={routeInfo.name} onChange={handleRouteInfoChange} placeholder="e.g., Campus Express" className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Departure</label>
                    <input type="time" name="departureTime" value={routeInfo.departureTime} onChange={handleRouteInfoChange} className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Arrival</label>
                    <input type="time" name="arrivalTime" value={routeInfo.arrivalTime} onChange={handleRouteInfoChange} className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Capacity</label>
                    <input type="number" name="totalSeats" value={routeInfo.totalSeats} onChange={handleRouteInfoChange} className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Driver</label>
                    <select name="driverUserId" value={routeInfo.driverUserId} onChange={handleRouteInfoChange} className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500 appearance-none">
                      <option value="">Unassigned</option>
                      {drivers.map(d => <option key={d.user_id} value={d.user_id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Stops List */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Route Stops</h3>
                    <button onClick={addStop} className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1"><Plus size={14} /> Add Stop</button>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {stops.map((stop, index) => (
                      <div key={stop.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-white border border-slate-200 rounded-md flex items-center justify-center text-[10px] font-bold text-slate-500">{index + 1}</span>
                            <input type="text" value={stop.name} onChange={(e) => handleStopChange(stop.id, 'name', e.target.value)} placeholder="Stop Name" className="bg-transparent border-none text-sm font-bold text-slate-900 focus:outline-none placeholder:text-slate-400" />
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => moveStop(index, 'up')} className="p-1 text-slate-400 hover:text-slate-600"><ArrowUp size={14} /></button>
                            <button onClick={() => moveStop(index, 'down')} className="p-1 text-slate-400 hover:text-slate-600"><ArrowDown size={14} /></button>
                            <button onClick={() => removeStop(stop.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input type="time" value={stop.arrivalTime} onChange={(e) => handleStopChange(stop.id, 'arrivalTime', e.target.value)} className="bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-medium" />
                          <button 
                            onClick={() => setPickingStopId(stop.id)} 
                            className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                              stop.lat ? 'bg-green-50 border-green-200 text-green-600' : 'bg-blue-50 border-blue-100 text-blue-600'
                            }`}
                          >
                            <MapPin size={12} /> {stop.lat ? 'Picked' : 'Pick on Map'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Map/Picker Column */}
              <div className="space-y-4">
                <div className="sticky top-6">
                  <div className="mb-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3 mb-2">
                      <Navigation className="text-blue-600" size={18} />
                      <h4 className="text-sm font-bold text-slate-900">Map Interface</h4>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {pickingStopId ? 'Select the exact location for ' + (stops.find(s => s.id === pickingStopId)?.name || 'this stop') + ' by clicking on the map.' : 'Click "Pick on Map" for any stop to start selecting coordinates.'}
                    </p>
                  </div>
                  
                  {pickingStopId ? (
                    <div className="space-y-4 animate-in slide-in-from-right-4">
                      <MapPicker 
                        currentPos={stops.find(s => s.id === pickingStopId)?.lat ? [stops.find(s => s.id === pickingStopId).lat, stops.find(s => s.id === pickingStopId).lng] : null}
                        onLocationSelect={(lat, lng) => {
                          handleStopChange(pickingStopId, 'lat', lat);
                          handleStopChange(pickingStopId, 'lng', lng);
                        }}
                      />
                      <button onClick={() => setPickingStopId(null)} className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg transition-all hover:bg-slate-800">Done Selecting</button>
                    </div>
                  ) : (
                    <div className="h-[350px] bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-8">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4"><MapIcon className="text-slate-400" size={24} /></div>
                      <p className="text-sm text-slate-400 font-medium">Select a stop waypoint to activate map picker</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
              <button onClick={resetAndClose} className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-all">Cancel</button>
              <button 
                onClick={handleSubmit} 
                disabled={loading} 
                className="px-10 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-200 disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : editingRouteId ? 'Save Changes' : 'Create Route'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
