const { Server } = require("ws");
const { verifyAuthToken } = require("./helpers");
const driverRepository = require("../../modules/driver/driver.repository");

let wss = null;
// userId -> { ws, role }
const connectedClients = new Map();

function initializeWebSocket(server) {
  wss = new Server({ server, path: "/socket" });

  wss.on("connection", (ws, req) => {
    const connLog = `[${new Date().toISOString()}] New WebSocket connection attempt: ${req.url}\n`;
    require('fs').appendFileSync('/Users/shivamgoyal/Desktop/Ghoomo/Ghoomo/scratch/backend_logs.txt', connLog);
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");

      if (token) {
        const payload = verifyAuthToken(token);
        const userId = payload.sub || payload.id;
        const role = String(payload.role || "").toLowerCase();

        ws.userId = userId;
        ws.role = role;

        console.log(`[Socket] User connecting: ${userId}, role: ${role}`);

        // Set initial info from token
        connectedClients.set(userId, { ws, role });

        // Refresh with fresh driver info from DB
        driverRepository.findDriverByUserId(userId).then(driver => {
          if (driver) {
            const logMsg = `[${new Date().toISOString()}] Socket identified driver ${userId}: type=${driver.vehicle_type}, available=${driver.is_available}\n`;
            require('fs').appendFileSync('/Users/shivamgoyal/Desktop/Ghoomo/Ghoomo/scratch/backend_logs.txt', logMsg);
            const driverInfo = {
              ws,
              role: "driver",
              vehicleType: driver.vehicle_type,
              isAvailable: Boolean(driver.is_available)
            };
            connectedClients.set(userId, driverInfo);
            ws.role = "driver";
            ws.vehicleType = driver.vehicle_type;
          }
        }).catch(err => {
          const logMsg = `[${new Date().toISOString()}] Socket error fetching driver ${userId}: ${err.message}\n`;
          require('fs').appendFileSync('/Users/shivamgoyal/Desktop/Ghoomo/Ghoomo/scratch/backend_logs.txt', logMsg);
        });
      }
    } catch (err) {
      console.error("[Socket] Auth error during connection:", err.message);
    }

    ws.on("message", (raw) => {
      try {
        const data = JSON.parse(raw);
        // Handle incoming client events here if needed
        void data;
      } catch (_) { }
    });

    ws.on("close", () => {
      if (ws.userId) {
        const current = connectedClients.get(ws.userId);
        if (current && current.ws === ws) {
          connectedClients.delete(ws.userId);
          console.log(`[Socket] User removed from active clients: ${ws.userId}`);
        } else {
          console.log(`[Socket] Stale connection closed for user: ${ws.userId}, ignoring delete`);
        }
      }
    });
  });

  return wss;
}

function send(userId, event, payload) {
  const client = connectedClients.get(userId);
  if (client && client.ws.readyState === 1 /* OPEN */) {
    client.ws.send(JSON.stringify({ event, data: payload }));
    return true;
  }
  return false;
}

function broadcastToUser(userId, event, payload) {
  send(userId, event, payload);
}

function broadcastToDriver(driverId, event, payload) {
  send(driverId, event, payload);
}

function broadcastToDriverUsers(userIds, event, payload) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  const deliveredUserIds = [];
  for (const userId of userIds) {
    if (send(userId, event, payload)) {
      deliveredUserIds.push(userId);
    }
  }

  return deliveredUserIds;
}

/**
 * Sends to every connected client whose role is "driver".
 * Falls back to broadcast-all when no role info is available.
 */
function broadcastToAllDrivers(event, payload) {
  const message = JSON.stringify({ event, data: payload });
  for (const { ws, role } of connectedClients.values()) {
    if (ws.readyState !== 1) continue;
    if (!role || role === "driver") {
      ws.send(message);
    }
  }
}

/**
 * Sends to drivers whose vehicleType matches the request.
 */
function broadcastToNearbyDrivers(event, payload) {
  const vehicleType = payload.request?.vehicle_type || payload.tripQuote?.vehicleType;
  const message = JSON.stringify({ event, data: payload });
  const notifiedUserIds = [];

  const allClients = Array.from(connectedClients.keys());
  require('fs').appendFileSync('/Users/shivamgoyal/Desktop/Ghoomo/Ghoomo/scratch/backend_logs.txt', `[${new Date().toISOString()}] broadcastToNearbyDrivers: vehicleType=${vehicleType}, connectedClients=${JSON.stringify(allClients)}\n`);

  for (const [uid, client] of connectedClients.entries()) {
    const { ws, role, vehicleType: driverVehicleType } = client;

    if (ws.readyState !== 1) {
      console.log(`[Socket] Skipping client ${uid}: ws.readyState=${ws.readyState}`);
      continue;
    }

    if (role === "driver") {
      const logMsg = `[${new Date().toISOString()}] Candidate driver ${uid}: isAvailable=${client.isAvailable}, vehicleType=${driverVehicleType}\n`;
      require('fs').appendFileSync('/Users/shivamgoyal/Desktop/Ghoomo/Ghoomo/scratch/backend_logs.txt', logMsg);
      // Only notify if driver is available
      if (client.isAvailable === false) {
        require('fs').appendFileSync('/Users/shivamgoyal/Desktop/Ghoomo/Ghoomo/scratch/backend_logs.txt', `[${new Date().toISOString()}] Skipping busy driver ${uid}\n`);
        continue;
      }

      require('fs').appendFileSync('/Users/shivamgoyal/Desktop/Ghoomo/Ghoomo/scratch/backend_logs.txt', `[${new Date().toISOString()}] Checking driver ${uid}: requested=${vehicleType}, driver=${driverVehicleType}\n`);
      // If we know the vehicle types, filter; otherwise fallback to sending to all drivers
      if (vehicleType && driverVehicleType) {
        if (String(vehicleType).toLowerCase() === String(driverVehicleType).toLowerCase()) {
          ws.send(message);
          notifiedUserIds.push(uid);
          require('fs').appendFileSync('/Users/shivamgoyal/Desktop/Ghoomo/Ghoomo/scratch/backend_logs.txt', `[${new Date().toISOString()}] SUCCESS: Notified driver ${uid}\n`);
        } else {
          require('fs').appendFileSync('/Users/shivamgoyal/Desktop/Ghoomo/Ghoomo/scratch/backend_logs.txt', `[${new Date().toISOString()}] MISMATCH: requested ${vehicleType} vs driver ${driverVehicleType}\n`);
        }
      } else {
        ws.send(message);
        notifiedUserIds.push(uid);
        require('fs').appendFileSync('/Users/shivamgoyal/Desktop/Ghoomo/Ghoomo/scratch/backend_logs.txt', `[${new Date().toISOString()}] FALLBACK SUCCESS: Notified driver ${uid} (missing type info)\n`);
      }
    }
  }
  require('fs').appendFileSync('/Users/shivamgoyal/Desktop/Ghoomo/Ghoomo/scratch/backend_logs.txt', `[${new Date().toISOString()}] Broadcast complete for ${event}. Notified: ${notifiedUserIds.length} drivers.\n`);
  return notifiedUserIds;
}

module.exports = {
  initializeWebSocket,
  broadcastToUser,
  broadcastToDriver,
  broadcastToDriverUsers,
  broadcastToAllDrivers,
  broadcastToNearbyDrivers,
  updateDriverSocketInfo: (userId, updates = {}) => {
    const client = connectedClients.get(userId);
    if (client) {
      if (updates.isAvailable !== undefined) client.isAvailable = Boolean(updates.isAvailable);
      if (updates.vehicleType !== undefined) client.vehicleType = updates.vehicleType;
    }
  }
};
