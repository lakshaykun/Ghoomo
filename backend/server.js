/**
 * Ghoomo Backend Server
 * Main entry point for the REST API and WebSocket server
 */

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const http      = require('http');
const socketIO  = require('socket.io');
const socketMgr = require('./socket');

// Routes
const authRoutes     = require('./routes/auth');
const rideRoutes     = require('./routes/rides');
const gpsRoutes      = require('./routes/gps');
const adminRoutes    = require('./routes/admin');
const locationRoutes = require('./routes/locations');

const app    = express();
const server = http.createServer(app);
const io     = socketIO(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Init socket singleton so controllers can emit
socketMgr.init(io);

// ── Middleware ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ── Health ────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── API Routes ────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/rides',     rideRoutes);
app.use('/api/gps',       gpsRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/locations', locationRoutes);

// ── WebSocket ─────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Driver joins their personal room so the server can address them
  socket.on('join_driver', ({ driver_id }) => {
    if (driver_id) {
      socket.join(`driver:${driver_id}`);
      console.log(`Driver ${driver_id} joined room`);
    }
  });

  // User joins a ride room to get real-time driver location
  socket.on('join_ride', ({ ride_id }) => {
    if (ride_id) {
      socket.join(`ride:${ride_id}`);
      console.log(`Client joined ride room ${ride_id}`);
    }
  });

  // Driver broadcasts location update
  socket.on('driver_location', (data) => {
    const { driver_id, ride_id, latitude, longitude } = data;
    if (ride_id) {
      io.to(`ride:${ride_id}`).emit('driver_location', { latitude, longitude });
    }
    // Also update admin dashboard
    socket.broadcast.emit('driver_location_update', data);
  });

  // Driver accepts a ride request  → inform user
  socket.on('ride_accepted', (data) => {
    const { request_id, ride_id, driver_id } = data;
    io.emit('ride_accepted', { request_id, ride_id, driver_id });
  });

  // Generic ride status update
  socket.on('ride_update', (data) => {
    const { ride_id, status } = data;
    if (ride_id) {
      io.to(`ride:${ride_id}`).emit('ride_status_update', { ride_id, status });
    }
    socket.broadcast.emit('ride_status_update', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ── Error Handlers ────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Ghoomo Backend running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready at ws://localhost:${PORT}`);
});

module.exports = app;

