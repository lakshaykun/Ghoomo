import React, { useEffect, useMemo, useState } from 'react';
import dashboardAPI from '../services/dashboardAPI';
import '../styles/Routes.css';

const EMPTY_ROUTE_FORM = {
  name: '',
  departureTime: '',
  arrivalTime: '',
};

const EMPTY_STOP_FORM = {
  routeId: '',
  stopName: '',
  stopOrder: '1',
  stopType: 'pickup',
  arrivalTime: '',
  latitude: '',
  longitude: '',
};

export default function BusRoutes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [routeSubmitting, setRouteSubmitting] = useState(false);
  const [stopSubmitting, setStopSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [routeForm, setRouteForm] = useState(EMPTY_ROUTE_FORM);
  const [stopForm, setStopForm] = useState(EMPTY_STOP_FORM);

  useEffect(() => {
    void fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await dashboardAPI.getRoutes();
      setRoutes(response.data);

      if (!selectedRouteId && response.data[0]?.id) {
        setSelectedRouteId(response.data[0].id);
        setStopForm((current) => ({ ...current, routeId: response.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch routes:', err);
      setErrorMessage('Unable to load routes right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) || null,
    [routes, selectedRouteId]
  );

  const handleRouteChange = (event) => {
    const { name, value } = event.target;
    setRouteForm((current) => ({ ...current, [name]: value }));
  };

  const resetRouteForm = () => {
    setRouteForm(EMPTY_ROUTE_FORM);
  };

  const handleStopChange = (event) => {
    const { name, value } = event.target;
    setStopForm((current) => ({ ...current, [name]: value }));

    if (name === 'routeId') {
      setSelectedRouteId(value);
    }
  };

  const resetStopForm = () => {
    setStopForm((current) => ({
      ...EMPTY_STOP_FORM,
      routeId: current.routeId || selectedRouteId,
      stopOrder: String((selectedRoute?.stops?.length || 0) + 1),
    }));
  };

  const handleCreateRoute = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!routeForm.name.trim() || !routeForm.departureTime || !routeForm.arrivalTime) {
      setErrorMessage('Route name, departure time, and arrival time are required.');
      return;
    }

    try {
      setRouteSubmitting(true);
      const createdRoute = await dashboardAPI.createRoute({
        name: routeForm.name.trim(),
        departureTime: routeForm.departureTime,
        arrivalTime: routeForm.arrivalTime,
      });

      setSelectedRouteId(createdRoute.id);
      resetRouteForm();
      setShowRouteForm(false);
      await fetchRoutes();
    } catch (err) {
      console.error('Failed to create route:', err);
      setErrorMessage(err?.message || 'Failed to create route.');
    } finally {
      setRouteSubmitting(false);
    }
  };

  const handleAddStop = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    const routeId = stopForm.routeId || selectedRouteId;

    if (!routeId) {
      setErrorMessage('Select a route before adding a stop.');
      return;
    }

    if (!stopForm.stopName.trim() || !stopForm.stopOrder || !stopForm.stopType || !stopForm.arrivalTime) {
      setErrorMessage('Stop name, order, type, and arrival time are required.');
      return;
    }

    try {
      setStopSubmitting(true);
      await dashboardAPI.addRouteStop(routeId, {
        stopName: stopForm.stopName.trim(),
        stopOrder: Number(stopForm.stopOrder),
        stopType: stopForm.stopType,
        arrivalTime: stopForm.arrivalTime,
        latitude: stopForm.latitude || null,
        longitude: stopForm.longitude || null,
      });

      resetStopForm();
      await fetchRoutes();
    } catch (err) {
      console.error('Failed to add stop:', err);
      setErrorMessage(err?.message || 'Failed to add stop.');
    } finally {
      setStopSubmitting(false);
    }
  };

  const formatStops = (stops) => {
    if (!Array.isArray(stops) || stops.length === 0) {
      return '-';
    }

    return stops
      .map((stop) => {
        if (typeof stop === 'string') {
          return stop;
        }

        const arrivalSuffix = stop.arrivalTime ? ` • ${stop.arrivalTime}` : '';
        return `${stop.stopName || stop.name || 'Stop'}${arrivalSuffix}`;
      })
      .filter(Boolean);
  };

  if (loading) return <div className="loading">Loading routes...</div>;

  return (
    <div className="routes-page">
      <div className="routes-header">
        <div>
          <h2>Bus Route Management</h2>
          <p style={{ color: 'var(--ink-600)', lineHeight: 1.6, maxWidth: '760px', marginTop: '8px' }}>
            Create bus routes, attach stops, and review the current route catalog directly from the backend.
          </p>
        </div>
        <button
          type="button"
          className="btn-create"
          onClick={() => {
            setErrorMessage('');
            setShowRouteForm((prev) => !prev);
          }}
        >
          {showRouteForm ? 'Close Route Form' : 'Add Route'}
        </button>
      </div>

      {showRouteForm && (
        <form className="route-form" onSubmit={handleCreateRoute}>
          <input
            type="text"
            name="name"
            value={routeForm.name}
            onChange={handleRouteChange}
            placeholder="Route name"
            required
          />
          <input
            type="time"
            name="departureTime"
            value={routeForm.departureTime}
            onChange={handleRouteChange}
            placeholder="Departure time"
            required
          />
          <input
            type="time"
            name="arrivalTime"
            value={routeForm.arrivalTime}
            onChange={handleRouteChange}
            placeholder="Arrival time"
            required
          />
          <div className="route-form-actions route-form-full">
            <button type="submit" className="btn-submit" disabled={routeSubmitting}>
              {routeSubmitting ? 'Creating...' : 'Create Route'}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                setErrorMessage('');
                resetRouteForm();
                setShowRouteForm(false);
              }}
              disabled={routeSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <form className="route-form" onSubmit={handleAddStop}>
        <input
          type="text"
          value={selectedRoute?.name || ''}
          placeholder={selectedRoute?.name ? 'Selected route' : 'Choose a route below'}
          disabled
        />

        <select
          name="routeId"
          value={stopForm.routeId || selectedRouteId}
          onChange={handleStopChange}
          style={{
            padding: '10px 16px',
            border: '1px solid var(--gray-300)',
            borderRadius: '6px',
            fontSize: '14px',
            background: 'white',
          }}
          required
        >
          <option value="">Select route</option>
          {routes.map((route) => (
            <option key={route.id} value={route.id}>
              {route.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="stopName"
          value={stopForm.stopName}
          onChange={handleStopChange}
          placeholder="Stop name"
          required
        />

        <input
          type="number"
          min="1"
          name="stopOrder"
          value={stopForm.stopOrder}
          onChange={handleStopChange}
          placeholder="Stop order"
          required
        />

        <select
          name="stopType"
          value={stopForm.stopType}
          onChange={handleStopChange}
          style={{
            padding: '10px 16px',
            border: '1px solid var(--gray-300)',
            borderRadius: '6px',
            fontSize: '14px',
            background: 'white',
          }}
          required
        >
          <option value="pickup">Pickup</option>
          <option value="dropoff">Dropoff</option>
          <option value="both">Both</option>
        </select>

        <input
          type="time"
          name="arrivalTime"
          value={stopForm.arrivalTime}
          onChange={handleStopChange}
          placeholder="Arrival time"
          required
        />

        <input
          type="text"
          name="latitude"
          value={stopForm.latitude}
          onChange={handleStopChange}
          placeholder="Latitude (optional)"
        />

        <input
          type="text"
          name="longitude"
          value={stopForm.longitude}
          onChange={handleStopChange}
          placeholder="Longitude (optional)"
        />

        <div className="route-form-actions route-form-full">
          <button type="submit" className="btn-submit" disabled={stopSubmitting}>
            {stopSubmitting ? 'Adding...' : 'Add Stop'}
          </button>
          <button
            type="button"
            className="btn-cancel"
            onClick={() => {
              setErrorMessage('');
              resetStopForm();
            }}
            disabled={stopSubmitting}
          >
            Reset
          </button>
        </div>
      </form>

      {errorMessage && <p className="route-error">{errorMessage}</p>}

      <div className="table-card">
        <h3 style={{ marginBottom: '16px' }}>Route Catalog</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Departure</th>
              <th>Arrival</th>
              <th>Stops</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.length === 0 ? (
              <tr>
                <td colSpan="6">No bus routes are available yet.</td>
              </tr>
            ) : routes.map((route) => {
              const stopLabels = formatStops(route.stops);

              return (
                <tr key={route.id}>
                  <td>{route.name}</td>
                  <td>{route.departureTime || '-'}</td>
                  <td>{route.arrivalTime || '-'}</td>
                  <td>
                    {Array.isArray(stopLabels) ? (
                      <div className="timetable-list">
                        {stopLabels.map((item, index) => (
                          <span key={`${route.id}-stop-${index}`} className="timetable-item">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      stopLabels
                    )}
                  </td>
                  <td>{route.updatedAt ? new Date(route.updatedAt).toLocaleString() : '-'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-add-stop"
                      onClick={() => {
                        setSelectedRouteId(route.id);
                        setStopForm((current) => ({ ...current, routeId: route.id }));
                      }}
                    >
                      Manage Stops
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
