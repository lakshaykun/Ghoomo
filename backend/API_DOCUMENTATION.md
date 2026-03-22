# Ghoomo Backend API

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Database Setup
- Make sure PostgreSQL is running
- The database schema will be automatically created on server startup
- Configure DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD in .env

### 4. Start Server
```bash
npm start
```

Server will run on http://localhost:4000

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout (requires auth)
- `GET /api/auth/me` - Get current user (requires auth)

### Rides
- `POST /api/rides` - Create a ride request (requires auth)
- `GET /api/rides/:rideId` - Get ride details (requires auth)
- `DELETE /api/rides/:rideId` - Cancel ride (requires auth)
- `POST /api/rides/:rideId/rate` - Rate a ride (requires auth)

### Drivers
- `POST /api/drivers/register` - Register as driver (requires auth)
- `GET /api/drivers/profile` - Get driver profile (requires auth)
- `PUT /api/drivers/availability` - Update driver availability (requires auth)
- `GET /api/drivers/available-rides` - Get available rides (requires auth)

### Admin
- `GET /api/admin/dashboard` - Get dashboard stats (requires auth)
- `GET /api/admin/users` - Get all users (requires auth)
- `GET /api/admin/rides` - Get all rides (requires auth)
- `PUT /api/admin/users/:userId/suspend` - Suspend user (requires auth)

## Health Check
- `GET /health` - Server health check

## Implementation Status

✅ **Completed**
- Express.js setup
- Routing structure
- Authentication middleware (basic)
- Input validation
- Error handling
- Database schema
- Service layer foundation

🔄 **TODO**
- JWT token generation and verification
- Password hashing
- Database integration for actual data persistence
- Role-based access control
- Ride matching algorithm
- Real-time updates (WebSockets)
- Payment integration
- Notification system
- Bus routes implementation
- Shared rides implementation
