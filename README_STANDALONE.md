# Standalone Deployment Guide

This project can be deployed independently of Replit's infrastructure. This guide covers how to deploy the application to a VPS, Render, Railway, or any Node.js hosting environment.

## Prerequisites

- **Node.js**: v20 or later
- **PostgreSQL Database**: Supabase, Neon, or a self-hosted Postgres instance.
- **Environment Variables**: You need to configure the `.env` file with your credentials.

## Environment Variables

Create a `.env` file in the root directory (or set these variables in your hosting provider's dashboard):

```env
# Server Configuration
NODE_ENV=production
PORT=5000
STANDALONE_PORT=5001

# Database Connection
# Ensure your database supports SSL or adjust the connection string options
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# Authentication
# Generate a strong random string for session encryption
SESSION_SECRET=your_strong_session_secret_key

# Object Storage (Optional - for file uploads)
# Using Google Cloud Storage
GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json
# OR use inline credentials
GCS_PROJECT_ID=your_project_id
GCS_CLIENT_EMAIL=your_service_account_email
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Stripe Payments (Optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Google AI (Optional - for AI features)
GOOGLE_API_KEY=your_gemini_api_key
```

## Build and Run

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the Application**
   This compiles both the React frontend and the Express backend.
   ```bash
   npm run build
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

## Running in Development Mode (Standalone)

To run the standalone server in development mode (with hot-reloading):

```bash
npm run standalone
```

This will start the server on port 5001 (by default) using `server/standalone/index.ts`.

## Database Migration

The project uses Drizzle ORM. To push schema changes to your production database:

```bash
npm run db:push
```

## Seeding Initial Data

To populate the database with initial required data (like the default admin user):

```bash
# Edit seed_full.ts or seed_dev_user.ts as needed before running
npx tsx seed_full.ts
```

## Deployment Notes

- **Static Files**: The build process outputs frontend assets to `dist/public`. The server is configured to serve these files automatically in production mode.
- **CORS**: In the standalone setup, the API and frontend are served from the same origin, so CORS issues are minimized.
- **Rate Limiting**: Basic rate limiting is enabled by default for API endpoints.
