/**
 * RideContext – manages active ride request, ride, and location state
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import {
  requestRide    as apiRequestRide,
  cancelRideRequest as apiCancelRequest,
  getActiveRide  as apiGetActiveRide,
  getRideRequest as apiGetRideRequest,
} from '../services/api';
import {
  getSocket,
  joinRideRoom,
  onDriverLocation,
  onRideStatusUpdate,
  onRideAccepted,
} from '../services/socket';

const RideContext = createContext(null);

export function RideProvider({ children }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [pickup, setPickup]   = useState(null);
  const [drop, setDrop]       = useState(null);
  const [activeRequest, setActiveRequest] = useState(null); // ride_request
  const [activeRide, setActiveRide]       = useState(null); // ride
  const [driverLocation, setDriverLocation] = useState(null);
  const [rideStatus, setRideStatus] = useState(null);
  const watchRef = useRef(null);

  // Get user's current GPS location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude:  loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      // Watch for changes
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => setCurrentLocation({
          latitude:  loc.coords.latitude,
          longitude: loc.coords.longitude,
        })
      );
    })();

    return () => watchRef.current?.remove();
  }, []);

  // Socket listeners
  useEffect(() => {
    const offLoc    = onDriverLocation((data) => setDriverLocation(data));
    const offStatus = onRideStatusUpdate((data) => {
      setRideStatus(data.status);
      if (activeRide) setActiveRide((r) => ({ ...r, status: data.status }));
    });
    const offAccept = onRideAccepted(async (data) => {
      if (activeRequest && data.request_id === activeRequest.id) {
        joinRideRoom(data.ride_id);
        const { data: rd } = await apiGetRideRequest(data.request_id);
        setActiveRequest(rd.request);
      }
    });

    return () => { offLoc(); offStatus(); offAccept(); };
  }, [activeRequest, activeRide]);

  /** Request a new ride */
  const requestRide = async (pickupData, dropData) => {
    const { data } = await apiRequestRide({
      pickup_location:  pickupData.address,
      drop_location:    dropData.address,
      pickup_latitude:  pickupData.latitude,
      pickup_longitude: pickupData.longitude,
      drop_latitude:    dropData.latitude,
      drop_longitude:   dropData.longitude,
    });
    setActiveRequest({ id: data.request_id, status: data.status });
    return data;
  };

  /** Cancel active request */
  const cancelRequest = async (requestId) => {
    await apiCancelRequest(requestId);
    setActiveRequest(null);
  };

  /** Refresh active ride/request state */
  const refreshActiveRide = async () => {
    try {
      const { data } = await apiGetActiveRide();
      if (data.type === 'ride') {
        setActiveRide(data.data);
        setActiveRequest(null);
        joinRideRoom(data.data.id);
      } else if (data.type === 'request') {
        setActiveRequest(data.data);
        setActiveRide(null);
      } else {
        setActiveRequest(null);
        setActiveRide(null);
      }
    } catch {}
  };

  /** Clear ride state after completion / rating */
  const clearRide = () => {
    setActiveRequest(null);
    setActiveRide(null);
    setDriverLocation(null);
    setRideStatus(null);
  };

  return (
    <RideContext.Provider value={{
      currentLocation,
      pickup, setPickup,
      drop,   setDrop,
      activeRequest, setActiveRequest,
      activeRide,    setActiveRide,
      driverLocation,
      rideStatus,
      requestRide,
      cancelRequest,
      refreshActiveRide,
      clearRide,
    }}>
      {children}
    </RideContext.Provider>
  );
}

export function useRide() {
  const ctx = useContext(RideContext);
  if (!ctx) throw new Error('useRide must be used inside RideProvider');
  return ctx;
}
