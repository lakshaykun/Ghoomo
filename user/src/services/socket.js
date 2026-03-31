/**
 * Socket.IO client service
 */

import { io } from 'socket.io-client';
import { BASE_URL } from './api';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(BASE_URL, {
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(token) {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { token };
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}

/** Join the ride room so we get real-time driver location */
export function joinRideRoom(rideId) {
  getSocket().emit('join_ride', { ride_id: rideId });
}

/** Listen for driver location events */
export function onDriverLocation(cb) {
  getSocket().on('driver_location', cb);
  return () => getSocket().off('driver_location', cb);
}

/** Listen for ride status updates */
export function onRideStatusUpdate(cb) {
  getSocket().on('ride_status_update', cb);
  return () => getSocket().off('ride_status_update', cb);
}

/** Listen for ride accepted event */
export function onRideAccepted(cb) {
  getSocket().on('ride_accepted', cb);
  return () => getSocket().off('ride_accepted', cb);
}
