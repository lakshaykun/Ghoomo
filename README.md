# Ghoomo - Campus Ride-Hailing Platform

> A technology-driven mobility platform for IIT Ropar students and auto drivers

[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

## 📋 Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [MVP Features](#mvp-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [License](#license)

## 🚨 Problem Statement

Students at IIT Ropar face significant challenges in accessing reliable last-mile transportation. The absence of organized ride-hailing services means transportation operates through an informal phone-based system, resulting in:

- ❌ No real-time availability visibility
- ❌ No standardized or transparent pricing
- ❌ Lack of digital safety tracking and accountability
- ❌ High coordination friction during peak hours
- ❌ Inefficient driver allocation
- ❌ No centralized verification for campus security

## 💡 Solution

**Ghoomo** digitizes ride coordination between IIT Ropar students and registered auto drivers by providing:

- ✅ Token-based ride authorization
- ✅ Real-time driver allocation and tracking
- ✅ GPS logging for safety and accountability
- ✅ Centralized driver verification and approval
- ✅ Enhanced campus security through digital access control
- ✅ Transparent and efficient ride management

## 🎯 MVP Features

### Student App (User)
Users can:
- Login using IIT email (OTP-based authentication)
- Request rides with pickup & drop-off locations
- View driver details (name, phone, vehicle number)
- Receive unique ride tokens
- Track live GPS location during rides

### Driver App
Drivers can:
- Go online/offline
- Accept ride requests
- View pickup location and ride tokens
- Mark rides as completed
- Track historical ride data

### Admin Dashboard
Admins can:
- Approve/reject drivers (verify license, RC, permit)
- Monitor active rides in real-time
- View driver statistics and ride history
- Access GPS logs for accountability
- Manage campus vehicle presence

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js/Express, Python/Flask |
| **Frontend Web** | React.js, Material-UI |
| **Mobile Apps** | React Native / Flutter |
| **Database** | PostgreSQL, MongoDB |
| **Real-time** | WebSocket, Socket.io |
| **Maps & GPS** | Google Maps API |
| **Authentication** | JWT, OTP |
| **Deployment** | Docker, AWS/GCP |

## 📁 Project Structure

```
ghoomo/
├── user/                    # Student app (React Native / Flutter)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
├── driver/                  # Driver app (React Native / Flutter)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
├── admin/                   # Admin dashboard (React.js)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
├── backend/                 # REST API & WebSocket Server
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   ├── middleware/
│   ├── config/
│   ├── server.js
│   ├── package.json
│   └── requirements.txt
├── database/                # Database schemas & migrations
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
├── docs/                    # Documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── SETUP.md
├── docker/                  # Docker configuration
│   ├── Dockerfile.backend
│   ├── Dockerfile.user
│   ├── Dockerfile.driver
│   └── docker-compose.yml
├── .env.example             # Environment variables template
├── .gitignore
├── LICENSE
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL (v12 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ghoomo.git
   cd ghoomo
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../user
   npm install
   cd ../driver
   npm install
   cd ../admin
   npm install
   ```

4. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Setup database**
   ```bash
   cd database
   psql -U postgres -f schema.sql
   ```

6. **Start development servers**
   ```bash
   # Terminal 1: Backend
   cd backend && npm start

   # Terminal 2: User App
   cd user && npm start

   # Terminal 3: Driver App
   cd driver && npm start

   # Terminal 4: Admin Dashboard
   cd admin && npm start
   ```

## 📊 Database Schema

### Users Table
```sql
id | name | email | phone | role (student/driver/admin) | created_at
```

### Drivers Table
```sql
id | user_id | vehicle_number | license_number | rc_number | status (approved/pending/rejected) | created_at
```

### Rides Table
```sql
id | student_id | driver_id | pickup_location | drop_location | status (requested/accepted/completed/cancelled) | start_time | end_time
```

### GPS Logs Table
```sql
id | driver_id | timestamp | latitude | longitude | ride_id
```

### Ride Tokens Table
```sql
id | ride_id | token | created_at | expires_at
```

## 📱 API Endpoints (Planned)

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/logout` - Logout user

### Rides
- `POST /api/rides/request` - Request a ride
- `GET /api/rides/:id` - Get ride details
- `PUT /api/rides/:id/accept` - Accept a ride (driver)
- `PUT /api/rides/:id/complete` - Complete a ride
- `GET /api/rides/active` - Get active rides

### GPS Tracking
- `POST /api/gps/log` - Log GPS location
- `GET /api/gps/ride/:rideId` - Get GPS logs for a ride

### Admin
- `GET /api/admin/drivers` - List drivers
- `PUT /api/admin/drivers/:id/approve` - Approve driver
- `GET /api/admin/rides` - View ride history
- `GET /api/admin/dashboard` - Get dashboard stats

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows our coding standards and includes appropriate tests.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 👥 Author

- **Your Name** - Initial work

## 🙏 Acknowledgments

- IIT Ropar administration for the inspiration
- The open-source community for amazing tools and libraries
