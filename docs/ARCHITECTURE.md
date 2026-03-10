# Ghoomo Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Ghoomo Platform                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Student App  │  │ Driver App   │  │ Admin Dash   │      │
│  │(React Native)│  │(React Native)│  │(React.js)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┼──────────────────┘               │
│                            │                                  │
│         ┌──────────────────▼──────────────────┐              │
│         │      REST API + WebSocket           │              │
│         │      (Node.js/Express)              │              │
│         │      Port: 3001                     │              │
│         └──────────────────┬──────────────────┘              │
│                            │                                  │
│         ┌──────────────────▼──────────────────┐              │
│         │    Authentication & Authorization   │              │
│         │    (JWT + OTP)                      │              │
│         └──────────────────┬──────────────────┘              │
│                            │                                  │
│  ┌─────────────────────────▼─────────────────────────┐      │
│  │          Business Logic Layer                      │      │
│  │  ├─ Ride Management                               │      │
│  │  ├─ Driver Allocation                             │      │
│  │  ├─ GPS Tracking                                  │      │
│  │  ├─ Token Generation                              │      │
│  │  └─ Admin Functions                               │      │
│  └─────────────────────────┬─────────────────────────┘      │
│                            │                                  │
│         ┌──────────────────▼──────────────────┐              │
│         │      PostgreSQL Database            │              │
│         │  • Users                            │              │
│         │  • Drivers                          │              │
│         │  • Rides                            │              │
│         │  • GPS Logs                         │              │
│         │  • Ride Tokens                      │              │
│         └──────────────────────────────────────┘              │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │        External Services                         │       │
│  │  ├─ Google Maps API (Geocoding, Directions)    │       │
│  │  ├─ Twilio/SMS (OTP)                           │       │
│  │  └─ Email Service (Notifications)              │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **User App**: React Native or Flutter
- **Driver App**: React Native or Flutter
- **Admin Dashboard**: React.js with Material-UI

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.io
- **Language**: JavaScript

### Database
- **Primary**: PostgreSQL
- **Caching** (Optional): Redis

### External Services
- **Maps**: Google Maps API
- **SMS/OTP**: Twilio
- **Email**: SendGrid or Gmail SMTP
- **Hosting**: AWS/GCP/Azure

## API Architecture

### RESTful Endpoints
```
/api/auth/*          - Authentication
/api/rides/*         - Ride management
/api/drivers/*       - Driver operations
/api/gps/*           - GPS tracking
/api/admin/*         - Admin functions
/api/users/*         - User management
```

### WebSocket (Real-time)
- Driver location updates
- Ride status changes
- Live notifications

## Database Design

### Key Tables
1. **users** - All platform users
2. **drivers** - Driver profiles
3. **rides** - Ride requests and history
4. **gps_logs** - GPS tracking data
5. **ride_tokens** - Ride authorization tokens

## Security

1. **Authentication**
   - OTP-based login for students
   - JWT tokens for session management
   - Token expiry: 24 hours

2. **Authorization**
   - Role-based access control (RBAC)
   - Roles: student, driver, admin

3. **Data Protection**
   - HTTPS/TLS encryption
   - Password hashing (bcryptjs)
   - Sensitive data encryption

4. **API Security**
   - CORS configuration
   - Rate limiting
   - Input validation

## Deployment Architecture

```
┌─────────────────────────────────────────────┐
│         Load Balancer (Nginx)               │
└────────────────┬────────────────────────────┘
                 │
     ┌───────────┼───────────┐
     │           │           │
┌────▼──┐   ┌────▼──┐   ┌────▼──┐
│Server1│   │Server2│   │Server3│
└────┬──┘   └────┬──┘   └────┬──┘
     │           │           │
     └───────────┼───────────┘
                 │
         ┌───────▼────────┐
         │ PostgreSQL     │
         │ (Replicated)   │
         └────────────────┘
         
         ┌────────────────┐
         │ Redis Cache    │
         │ (Optional)     │
         └────────────────┘
```

## Scalability Considerations

1. **Horizontal Scaling**
   - Multiple API server instances
   - Load balancing with Nginx

2. **Database**
   - Connection pooling
   - Read replicas for analytics
   - Partitioning by ride date

3. **Caching**
   - Redis for session caching
   - User session caching

4. **Microservices** (Future)
   - Separate services for GPS tracking
   - Separate notification service
   - Separate analytics service

## Development Workflow

1. **Local Development**
   - Node.js backend on port 3001
   - React apps on ports 3000, 3002, 3003
   - Docker for PostgreSQL

2. **Testing**
   - Unit tests with Jest
   - Integration tests
   - API tests with Postman/Thunder Client

3. **Version Control**
   - Git with GitHub
   - Feature branches
   - Pull request reviews

4. **CI/CD**
   - Automated testing
   - Docker image builds
   - Auto-deployment to staging/production
