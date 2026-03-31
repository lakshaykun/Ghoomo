# Ghoomo Admin Dashboard - React

Professional admin web dashboard for the Ghoomo ride-sharing platform. Built with React, Vite, and modern web technologies.

## Features

✅ Real-time dashboard with key metrics
✅ User Management (view, suspend, activate)
✅ Driver Management (view, suspend, activate)
✅ Ride Management (view, cancel, complete)
✅ Route Management (create, update, delete)
✅ Authentication with JWT
✅ Responsive design
✅ Fast performance with Vite

## Quick Start

### Prerequisites
- Node.js 16.x or higher
- npm or yarn

### Installation

```bash
cd web
npm install
```

### Development

```bash
npm run dev
```

Server runs at `http://localhost:5173`

### Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/      # Reusable components
├── pages/          # Page components
├── context/        # React Context (Auth)
├── services/       # API services
├── styles/         # CSS styles
└── App.jsx         # Main App component
```

## API Integration

The dashboard connects to the backend API at `http://localhost:4000/api`

### Endpoints Used

- `POST /auth/login` - Admin authentication
- `GET /admin/dashboard` - Dashboard statistics
- `GET /admin/users` - List all users
- `GET /admin/drivers` - List all drivers
- `GET /admin/rides` - List all rides
- `GET /admin/routes` - List all routes
- `POST /admin/users/:id/suspend` - Suspend user
- `POST /admin/drivers/:id/suspend` - Suspend driver
- And more...

## Configuration

Edit `.env` to configure API URL:

```
VITE_API_URL=http://localhost:4000/api
```

## Dependencies

- **react** - UI library
- **react-router-dom** - Routing
- **axios** - HTTP client
- **recharts** - Charts (optional)
- **lucide-react** - Icons (optional)

## Development Dependencies

- **vite** - Build tool
- **@vitejs/plugin-react** - React plugin
- **tailwindcss** - CSS framework (optional)

## Admin Credentials

For testing:
- Email: admin@example.com
- Password: adminpassword

## Testing

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build
```

## Deployment

### Vercel

```bash
vercel deploy
```

### Netlify

```bash
netlify deploy --prod
```

### Self-hosted

```bash
npm run build
# Upload 'dist' folder to your web server
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
