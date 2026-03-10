# Ghoomo - Development Quick Start

Complete installation in 5 minutes.

## 1️⃣ Clone & Setup

```bash
git clone https://github.com/yourusername/ghoomo.git
cd ghoomo
```

## 2️⃣ Backend Setup

```bash
cd backend
npm install
echo "PORT=3001
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ghoomo
JWT_SECRET=dev-secret" > .env
npm run dev
```

## 3️⃣ Database Setup (New Terminal)

```bash
# Create database
createdb -U postgres ghoomo

# Apply schema
psql -U postgres -d ghoomo -f database/schema.sql
```

## 4️⃣ Frontend Apps (New Terminals)

**User App:**
```bash
cd user && npm install && npm start
# http://localhost:3000
```

**Driver App:**
```bash
cd driver && npm install && npm start
# http://localhost:3002
```

**Admin Dashboard:**
```bash
cd admin && npm install && npm start
# http://localhost:3003
```

## 🧪 Test API

```bash
# Health check
curl http://localhost:3001/api/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@test.com",
    "phone": "+919876543210",
    "role": "student"
  }'
```

## 📚 Documentation

- [Complete Setup Guide](./docs/SETUP.md)
- [API Documentation](./docs/API.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Contributing](./CONTRIBUTING.md)

## 🐳 Docker

```bash
cd docker
docker-compose up
```

## ⚡ Common Issues

**Port in use?**
```bash
lsof -ti:3001 | xargs kill -9
```

**Database connection error?**
```bash
sudo service postgresql start  # Linux
brew services start postgresql # macOS
```

**Module not found?**
```bash
# In affected directory:
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Next Steps

1. Review [API docs](./docs/API.md)
2. Start implementing features from [ROADMAP](./ROADMAP.md)
3. Read [Contributing guide](./CONTRIBUTING.md)
4. Join the team!

---

**Happy Coding! 🎉**

For detailed help, see [SETUP.md](./docs/SETUP.md)
