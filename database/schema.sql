-- Ghoomo Database Schema
-- PostgreSQL Setup

-- Create database (run this separately)
-- CREATE DATABASE ghoomo;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'driver', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  vehicle_number VARCHAR(50) NOT NULL UNIQUE,
  license_number VARCHAR(100) NOT NULL UNIQUE,
  rc_number VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  is_online BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rides Table
CREATE TABLE IF NOT EXISTS rides (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
  pickup_location VARCHAR(500) NOT NULL,
  drop_location VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'in-progress', 'completed', 'cancelled')),
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ride Tokens Table
CREATE TABLE IF NOT EXISTS ride_tokens (
  id SERIAL PRIMARY KEY,
  ride_id INTEGER NOT NULL UNIQUE REFERENCES rides(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

-- GPS Logs Table
CREATE TABLE IF NOT EXISTS gps_logs (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  ride_id INTEGER REFERENCES rides(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_is_online ON drivers(is_online);
CREATE INDEX idx_rides_student_id ON rides(student_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_start_time ON rides(start_time);
CREATE INDEX idx_gps_logs_driver_id ON gps_logs(driver_id);
CREATE INDEX idx_gps_logs_ride_id ON gps_logs(ride_id);
CREATE INDEX idx_gps_logs_timestamp ON gps_logs(timestamp);
CREATE INDEX idx_ride_tokens_ride_id ON ride_tokens(ride_id);
CREATE INDEX idx_ride_tokens_token ON ride_tokens(token);
