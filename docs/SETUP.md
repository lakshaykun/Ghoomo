# Ghoomo Setup Guide

## Prerequisites

- Node.js 14+ and npm
- PostgreSQL 12+
- Git
- Docker (optional)

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/ghoomo.git
cd ghoomo
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create `.env` file:
```bash
cp ../.env.example .env
```

Edit `.env` with your local settings:
```
PORT=3001
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ghoomo
JWT_SECRET=your-secret-key
```

### 3. Setup Database

Create PostgreSQL database:
```bash
psql -U postgres
CREATE DATABASE ghoomo;
\q
```

Run schema:
```bash
psql -U postgres -d ghoomo -f ../database/schema.sql
```

### 4. Start Backend

```bash
npm start
# or npm run dev (with nodemon)
```

Backend will run on http://localhost:3001

### 5. Setup User App

```bash
cd ../user
npm install
npm start
```

App will run on http://localhost:3000

### 6. Setup Driver App

```bash
cd ../driver
npm install
npm start
```

App will run on http://localhost:3002

### 7. Setup Admin Dashboard

```bash
cd ../admin
npm install
npm start
```

Dashboard will run on http://localhost:3003

## Docker Setup (Optional)

### Build and Run with Docker Compose

```bash
cd docker
docker-compose up -d
```

This will start:
- Backend API on port 3001
- PostgreSQL on port 5432

### Individual Docker Builds

Backend:
```bash
docker build -f docker/Dockerfile.backend -t ghoomo-backend .
docker run -p 3001:3001 ghoomo-backend
```

## Testing

### Run Backend Tests

```bash
cd backend
npm test
```

### Run All Tests with Coverage

```bash
npm test -- --coverage
```

## API Testing

### Using Thunder Client or Postman

1. Import API collection from `docs/API.md`
2. Set base URL: `http://localhost:3001/api`
3. Get JWT token from `/auth/verify-otp`
4. Add token to Authorization header

### Example: Register User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@iitropar.ac.in",
    "phone": "+919876543210",
    "role": "student"
  }'
```

### Example: Request a Ride

```bash
curl -X POST http://localhost:3001/api/rides/request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_location": "Main Gate",
    "drop_location": "Railway Station"
  }'
```

## Database Migrations

Run all migrations:
```bash
cd backend
npm run migrate
```

Create new migration:
```bash
# Add migration file to database/migrations/
```

## Common Issues

### PostgreSQL Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Make sure PostgreSQL is running
```bash
# Linux
sudo service postgresql start

# macOS
brew services start postgresql

# Windows
pg_ctl -D "C:\Program Files\PostgreSQL\14\data" start
```

### Port Already in Use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Troubleshooting

### Clear Everything and Start Fresh

```bash
# Stop all services
# Kill backend, user, driver, admin servers

# Clean databases
psql -U postgres -c "DROP DATABASE ghoomo;"
psql -U postgres -c "CREATE DATABASE ghoomo;"

# Reinstall dependencies
cd backend && rm -rf node_modules && npm install
cd ../user && rm -rf node_modules && npm install
cd ../driver && rm -rf node_modules && npm install
cd ../admin && rm -rf node_modules && npm install

# Run migration
cd ../database
psql -U postgres -d ghoomo -f schema.sql

# Start servers again
```

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Backend server port | 3001 |
| NODE_ENV | Development/Production | development |
| DB_USER | PostgreSQL user | postgres |
| DB_PASSWORD | PostgreSQL password | password |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_NAME | Database name | ghoomo |
| JWT_SECRET | JWT signing secret | your-secret-key |
| JWT_EXPIRY | Token expiry time | 24h |

## Next Steps

1. Review [API Documentation](./API.md)
2. Read [Architecture Guide](./ARCHITECTURE.md)
3. Set up Git hooks for pre-commit checks
4. Configure IDE for development
5. Join the development team!

## Support

For issues or questions:
1. Check this guide
2. Review existing GitHub issues
3. Create a new issue with details
4. Contact the team lead
