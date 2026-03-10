/**
 * Ghoomo Backend Server
 * Main entry point for the REST API and WebSocket server
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');

// Import routes (to be created)
// const authRoutes = require('./routes/auth');
// const rideRoutes = require('./routes/rides');
// const gpsRoutes = require('./routes/gps');
// const adminRoutes = require('./routes/admin');
// const driverRoutes = require('./routes/drivers');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/rides', rideRoutes);
// app.use('/api/gps', gpsRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/drivers', driverRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle driver location updates
  socket.on('driver_location', (data) => {
    console.log('Driver location:', data);
    // Broadcast to admin dashboard
    socket.broadcast.emit('driver_location_update', data);
  });

  // Handle ride updates
  socket.on('ride_update', (data) => {
    console.log('Ride update:', data);
    socket.broadcast.emit('ride_status_update', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Ghoomo Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready at ws://localhost:${PORT}`);
});

module.exports = app;
