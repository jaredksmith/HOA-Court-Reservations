# HOA Court Reservations PWA

A mobile-first Progressive Web App (PWA) for managing HOA pickleball court bookings with flexible group booking capabilities.

## Features

### MVP Features (Phase 1)
- **User Authentication & Household Management** - Secure login tied to HOA households
- **Hour Allocation System** - Prime/Standard hour tracking with bi-weekly reset
- **Flexible Group Booking** - Multi-court reservations with minimum member requirements
- **Guest Management** - Support for non-member guests in bookings
- **Last-Minute Solo Booking** - Zero-cost bookings within 12 hours
- **Push Notifications** - Real-time notifications for invitations, confirmations, and reminders
- **PWA Functionality** - Installable app with offline capabilities
- **Admin Dashboard** - Basic administration and system configuration

### Planned Features (Phase 2)
- GPS Check-in & Automated No-Show Penalties
- Advanced Mobile UX (Calendar Heat Map, One-Tap Repeat Booking)
- Public Community Events
- Advanced Admin Analytics

## Tech Stack

- **Frontend**: SvelteKit with TypeScript
- **Backend**: SvelteKit API routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **PWA**: Vite PWA Plugin
- **Notifications**: Web Push API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd hoa-court-reservations
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Supabase credentials and other configuration values.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Quick setup
npm run setup:env

# Then edit .env with your actual credentials
```

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Web Push Configuration
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your_email@example.com

# Application Configuration
PUBLIC_APP_URL=http://localhost:5173
NODE_ENV=development
```

### Database Setup

1. **Create Supabase Project**: Go to [Supabase](https://app.supabase.com) and create a new project
2. **Run Database Setup**: Copy and run the SQL from `database-setup.sql` in your Supabase SQL editor
3. **Test Connection**:
   ```bash
   npm run test:db
   ```

For detailed setup instructions, see [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   ├── booking/       # Booking-related components
│   │   ├── admin/         # Admin dashboard components
│   │   └── ui/            # Reusable UI components
│   ├── server/
│   │   ├── db/            # Database operations
│   │   ├── auth/          # Authentication logic
│   │   ├── booking/       # Booking business logic
│   │   ├── admin/         # Admin operations
│   │   └── push/          # Push notification handling
│   ├── stores/            # Svelte stores for state management
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── routes/
│   ├── api/               # API endpoints
│   ├── admin/             # Admin pages
│   ├── auth/              # Authentication pages
│   ├── booking/           # Booking pages
│   └── profile/           # User profile pages
├── params/                # Route parameters
├── app.html               # Main HTML template
├── service-worker.js      # PWA service worker
├── hooks.server.js        # Server-side hooks
└── hooks.client.js        # Client-side hooks
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run type checking
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Database Setup

The application uses Supabase for data storage. You'll need to set up the following tables:

1. **profiles** - User profiles with hour balances
2. **bookings** - Court reservations
3. **booking_participants** - Participants in group bookings
4. **push_subscriptions** - Push notification subscriptions

Refer to the database schema in the documentation for detailed table structures.

## Deployment

### Vercel Deployment

For detailed deployment instructions, see [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)

Quick steps:
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Configuration

Make sure to set all required environment variables in your deployment platform.

## Development Scripts

```bash
# Setup environment file
npm run setup:env

# Test database connection
npm run test:db

# Start development server
npm run dev

# Build for production
npm run build

# Run linting and formatting
npm run lint
npm run format
```

## Documentation

- [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md) - Complete database setup guide
- [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) - Production deployment guide
- [database-setup.sql](./database-setup.sql) - SQL script for database schema
- [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) - Development setup verification

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
