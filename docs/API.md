# Ghoomo API Documentation

## Base URL

```
http://localhost:3001/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer {token}
```

## Endpoints

### Authentication

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@iitropar.ac.in",
  "phone": "+919876543210",
  "role": "student" // or "driver"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@iitropar.ac.in",
    "role": "student"
  }
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@iitropar.ac.in"
}

Response: 200 OK
{
  "message": "OTP sent to registered phone",
  "user_id": 1
}
```

#### Verify OTP
```
POST /auth/verify-otp
Content-Type: application/json

{
  "user_id": 1,
  "otp": "123456"
}

Response: 200 OK
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@iitropar.ac.in",
    "role": "student"
  }
}
```

### Rides

#### Request a Ride
```
POST /rides/request
Authorization: Bearer {token}
Content-Type: application/json

{
  "pickup_location": "Main Gate, IIT Ropar",
  "drop_location": "Chandigarh Railway Station"
}

Response: 201 Created
{
  "id": 1,
  "student_id": 1,
  "driver_id": null,
  "pickup_location": "Main Gate, IIT Ropar",
  "drop_location": "Chandigarh Railway Station",
  "status": "requested",
  "start_time": "2026-03-10T10:30:00Z"
}
```

#### Get Ride Details
```
GET /rides/{rideId}
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "student_id": 1,
  "driver_id": 2,
  "pickup_location": "Main Gate, IIT Ropar",
  "drop_location": "Chandigarh Railway Station",
  "status": "in-progress",
  "start_time": "2026-03-10T10:30:00Z",
  "end_time": null,
  "student_name": "John Doe",
  "driver_name": "Raj Kumar"
}
```

#### Accept Ride (Driver)
```
PUT /rides/{rideId}/accept
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "driver_id": 2,
  "status": "accepted"
}
```

#### Complete Ride
```
PUT /rides/{rideId}/complete
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "status": "completed",
  "end_time": "2026-03-10T11:15:00Z"
}
```

#### Get Active Rides
```
GET /rides/active
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": 1,
    "student_id": 1,
    "driver_id": 2,
    "status": "in-progress",
    ...
  }
]
```

### GPS Tracking

#### Log GPS Location
```
POST /gps/log
Authorization: Bearer {token}
Content-Type: application/json

{
  "latitude": 30.6356,
  "longitude": 76.8140,
  "ride_id": 1
}

Response: 201 Created
{
  "id": 1,
  "driver_id": 2,
  "ride_id": 1,
  "latitude": 30.6356,
  "longitude": 76.8140,
  "timestamp": "2026-03-10T10:35:00Z"
}
```

#### Get GPS Logs for Ride
```
GET /gps/ride/{rideId}
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": 1,
    "latitude": 30.6356,
    "longitude": 76.8140,
    "timestamp": "2026-03-10T10:35:00Z"
  }
]
```

### Admin

#### Get All Drivers
```
GET /admin/drivers?status=approved&limit=20&offset=0
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": 1,
    "user_id": 2,
    "name": "Raj Kumar",
    "email": "raj@example.com",
    "vehicle_number": "HR-01-AB-1234",
    "license_number": "DL-123456",
    "status": "approved",
    "is_online": true
  }
]
```

#### Approve Driver
```
PUT /admin/drivers/{driverId}/approve
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "user_id": 2,
  "status": "approved"
}
```

#### Get Ride History
```
GET /admin/rides?limit=50&offset=0
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": 1,
    "student_id": 1,
    "driver_id": 2,
    "status": "completed",
    "start_time": "2026-03-10T10:30:00Z",
    "end_time": "2026-03-10T11:15:00Z"
  }
]
```

#### Get Dashboard Statistics
```
GET /admin/dashboard/stats
Authorization: Bearer {token}

Response: 200 OK
{
  "total_users": 150,
  "total_drivers": 25,
  "active_rides": 5,
  "completed_rides": 120,
  "online_drivers": 12,
  "pending_approvals": 3
}
```

## Error Responses

```
400 Bad Request
{
  "error": "Invalid request data"
}

401 Unauthorized
{
  "error": "No token provided" or "Invalid or expired token"
}

404 Not Found
{
  "error": "Resource not found"
}

500 Internal Server Error
{
  "error": "Internal server error"
}
```

## WebSocket Events

### Connect
```
const socket = io('http://localhost:3001');
socket.on('connect', () => {
  console.log('Connected to server');
});
```

### Driver Location Update
```
socket.emit('driver_location', {
  ride_id: 1,
  latitude: 30.6356,
  longitude: 76.8140,
  timestamp: new Date()
});

// Listen for updates
socket.on('driver_location_update', (data) => {
  console.log('Driver location:', data);
});
```

### Ride Status Update
```
socket.on('ride_status_update', (data) => {
  console.log('Ride status changed:', data);
});
```
