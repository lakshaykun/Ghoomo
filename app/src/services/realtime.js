import { getApiBaseUrl } from "./api";

const ENABLE_REALTIME_WS = String(process.env.EXPO_PUBLIC_ENABLE_REALTIME_WS || "false").toLowerCase() === "true";

function noopUnsubscribe() {
  return () => {};
}

function toWebSocketUrl(httpUrl) {
  if (httpUrl.startsWith("https://")) {
    return httpUrl.replace("https://", "wss://");
  }
  if (httpUrl.startsWith("http://")) {
    return httpUrl.replace("http://", "ws://");
  }
  return `ws://${httpUrl}`;
}

export function subscribeRideRealtime(rideId, { onRideUpdate, onError } = {}) {
  void onRideUpdate;

  if (!rideId) {
    return () => {};
  }

  if (!ENABLE_REALTIME_WS) {
    onError?.(new Error("Realtime websocket is disabled for this backend deployment."));
    return noopUnsubscribe();
  }

  const baseUrl = getApiBaseUrl();
  const wsUrl = `${toWebSocketUrl(baseUrl)}/ws`;
  let socket;
  let reconnectTimer;
  let closedByClient = false;

  const connect = () => {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          action: "subscribe_ride",
          rideId,
        })
      );
    };

    socket.onmessage = (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      if (payload?.type === "ride:update" && payload.ride?.id === rideId) {
        onRideUpdate?.(payload.ride);
      }
    };

    socket.onerror = (error) => {
      onError?.(error);
    };

    socket.onclose = () => {
      if (closedByClient) return;
      reconnectTimer = setTimeout(connect, 1500);
    };
  };

  connect();

  return () => {
    closedByClient = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: "unsubscribe_ride", rideId }));
    }
    socket?.close?.();
  };
}

export function subscribeBusRealtime({ onBusUpdate, onError } = {}) {
  void onBusUpdate;

  if (!ENABLE_REALTIME_WS) {
    onError?.(new Error("Realtime websocket is disabled for this backend deployment."));
    return noopUnsubscribe();
  }

  const baseUrl = getApiBaseUrl();
  const wsUrl = `${toWebSocketUrl(baseUrl)}/ws`;
  let socket;
  let reconnectTimer;
  let closedByClient = false;

  const connect = () => {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      socket.send(JSON.stringify({ action: "subscribe_bus" }));
    };

    socket.onmessage = (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      if (payload?.type === "bus:update") {
        onBusUpdate?.(payload);
      }
    };

    socket.onerror = (error) => {
      onError?.(error);
    };

    socket.onclose = () => {
      if (closedByClient) return;
      reconnectTimer = setTimeout(connect, 1500);
    };
  };

  connect();

  return () => {
    closedByClient = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: "unsubscribe_bus" }));
    }
    socket?.close?.();
  };
}

/**
 * Connects to the backend WebSocket for real-time ride events:
 *   ride_accepted, ride_status_updated, new_ride_request
 *
 * @param {string} token  - JWT auth token for authentication
 * @param {{ onEvent, onError }} handlers
 * @returns {() => void}  cleanup function
 */
export function subscribeGlobalRealtime(token, { onEvent, onError } = {}) {
  if (!token) return noopUnsubscribe();

  const baseUrl = getApiBaseUrl();
  const wsUrl = `${toWebSocketUrl(baseUrl)}/socket?token=${encodeURIComponent(token)}`;
  console.log(`[Realtime] Connecting to: ${wsUrl}`);
  let socket;
  let reconnectTimer;
  let closedByClient = false;

  const connect = () => {
    console.log(`[Realtime] connect() called`);
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log(`[Realtime] WebSocket OPENED`);
    };

    socket.onmessage = (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
        console.log(`[Realtime] Message received:`, payload);
      } catch (err) {
        console.warn(`[Realtime] Failed to parse message:`, event.data);
        return;
      }
      // Server sends: { event: string, data: any }
      if (payload?.event) {
        onEvent?.(payload.event, payload.data);
      }
    };

    socket.onerror = (error) => {
      console.error(`[Realtime] WebSocket ERROR:`, error);
      onError?.(error);
    };

    socket.onclose = (e) => {
      console.log(`[Realtime] WebSocket CLOSED: code=${e.code}, reason=${e.reason}`);
      if (closedByClient) return;
      reconnectTimer = setTimeout(connect, 2000);
    };
  };

  connect();

  return () => {
    closedByClient = true;
    clearTimeout(reconnectTimer);
    socket?.close?.();
  };
}
