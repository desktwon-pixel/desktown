# DeskTown - Virtual Workspace

## Overview

DeskTown is a comprehensive virtual cloud office platform designed for remote teams. It unifies task management, support ticketing, team communication, meeting scheduling, job postings, financial tracking, and access control into a single integrated workspace. The application provides a professional, productivity-focused interface combining Linear's clean task management aesthetics with Material Design's robust component patterns.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- React Query (TanStack Query) for server state management and data fetching

**UI Component System**
- Shadcn/ui component library (New York style preset) built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- CSS variables for theming with light/dark mode support
- Inter font family via Google Fonts CDN

**Design System**
- Modern dark-first theme with glass-morphism effects
- Deep charcoal backgrounds (#0B0F19) with cyan (#06B6D4) and teal (#14B8A6) accents
- Glass effect cards with backdrop-blur and 40% opacity backgrounds
- Gradient text effects for headings and KPI values
- Custom utility classes: `glass`, `gradient-text`, `hover-glow`, `glow`
- Custom spacing primitives (2, 4, 6, 8, 12, 16 Tailwind units)
- Card-based content containers with subtle borders (border-white/5)
- Responsive breakpoints for mobile-first development

**State Management**
- React Query for server state with infinite stale time and disabled refetch
- Context API for theme management (light/dark mode)
- Zustand for language state management with localStorage persistence
- Local component state for UI interactions

**Internationalization (i18n)**
- Language switcher supporting Arabic and English
- Zustand store with localStorage persistence (`cloudoffice-language` key)
- RTL/LTR layout support with automatic document direction switching
- Translation system in `client/src/lib/i18n.ts`
- Available on Landing page (for visitors) and Welcome page (for logged-in visitors)

### Backend Architecture

**Server Framework**
- Express.js for REST API endpoints
- HTTP server with middleware for JSON parsing and URL encoding
- Custom logging middleware for request/response tracking

**Authentication & Session Management**
- Replit Auth integration using OpenID Connect (OIDC)
- Passport.js with OpenID Client strategy
- Session storage via connect-pg-simple (PostgreSQL-backed sessions)
- Session-based authentication with HTTP-only secure cookies (7-day TTL)

**Role-Based Access Control (RBAC)**
- Five-tier role system: visitor < member (default) < office_renter < manager < admin
- Frontend: AppSidebar/VisitorSidebar filters navigation by user.role; RoleGuard component protects routes
- Backend: requireRole() middleware validates roles before API access
- Role permissions matrix:
  - visitor: Welcome Page, Browse Offices, View Services, Find Jobs, Contact, Profile (public-facing experience)
  - member: MyWorkspace, Dashboard, Employee Profile, Tasks, Tickets, Social, Messages, Meetings, Team, Departments
  - office_renter: Dashboard + Business Services (My Office, My Services, My Subscriptions)
  - manager/admin: All member access + n8n Automation, Office Management, Job Postings
  - admin only: Finances, Advertising, Access Control, User Roles management

**MyWorkspace Page (Default Landing for Members/Managers/Admins)**
- Unified workspace page at "/" that combines all tools in one place
- Features:
  - Welcome header with user avatar and personalized greeting
  - Quick stats: Active Tasks, Unread Messages, Unread Emails, Upcoming Meetings
  - Quick links grid: Tasks, Messages, Mail, Meetings, Team, Departments, Feed, Profile
  - 4 preview cards with real-time data:
    - Current Tasks (pending/in-progress with priority indicators)
    - Recent Chats (with unread counts)
    - Inbox (email with read/unread status)
    - Upcoming Meetings (with "Today" badges)
- Routes:
  - "/" → MyWorkspace (default for authenticated users)
  - "/workspace" → MyWorkspace (alternative route)
  - "/dashboard" → Dashboard (original dashboard page)

**Visitor Role Redirection**
- Users with role="visitor" are redirected to /welcome after login (not Dashboard)
- VisitorSidebar shows "Welcome Portal" branding with visitor-specific navigation
- Welcome page provides quick actions: Browse Offices, View Services, Find Jobs, Contact
- Visitor routes: /welcome, /visitor/offices, /visitor/services, /visitor/contact, /careers, /profile

**Office Renter Role (Business Services)**
- Only users with role="office_renter" see "Business Services" subtitle in sidebar
- All other roles see "Virtual Workspace" subtitle
- Business Services navigation items (My Office, My Services, My Subscriptions) are restricted to office_renter only
- OfficeRenterRouter provides dedicated routes: /, /my-office, /my-services, /my-subscriptions, /profile

**API Design**
- RESTful endpoints organized by resource type:
  - `/api/auth/*` - Authentication endpoints
  - `/api/users/*` - User management
  - `/api/tasks/*` - Task CRUD operations
  - `/api/tickets/*` - Support ticket management
  - `/api/posts/*` - Social feed posts and comments
  - `/api/threads/*` - Chat threads and messages
  - `/api/meetings/*` - Meeting scheduling
  - `/api/jobs/*` - Job posting management
  - `/api/transactions/*` - Financial transaction tracking
  - `/api/notifications/*` - User notifications
  - `/api/subscriptions/*` - Office subscription management
  - `/api/n8n/*` - n8n integration settings and management
  - `/api/automations/*` - Task automation workflows (send, approve, reject)
- Consistent error handling with status code and message formatting
- Request body validation using Zod schemas

### Data Layer

**ORM & Database**
- Drizzle ORM for type-safe database queries
- PostgreSQL as the primary database (via Neon serverless)
- WebSocket-based connection pooling for serverless environments
- Schema-first approach with TypeScript type inference

**Database Schema**
Core tables include:
- `users` - User profiles with role-based access
- `sessions` - PostgreSQL session storage
- `tasks` - Task management with assignees and priorities
- `tickets` - Support ticket tracking
- `posts`, `post_comments`, `post_likes` - Social feed engagement
- `chat_threads`, `chat_participants`, `messages` - Team messaging
- `meetings`, `meeting_attendees` - Calendar scheduling
- `job_postings` - Internal job listings
- `transactions` - Financial tracking and approvals
- `roles`, `user_roles` - Access control system
- `notifications` - User notification queue
- `departments`, `remote_employees` - Department management system
- `subscriptions` - Office subscription plans (499 SAR/month or 3000 SAR/year)
- `advertisements` - Homepage ad placements (500 SAR for 3-day placements, requires subscription)
- `push_subscriptions` - Browser push notification subscriptions per user

**Push Notifications**
- Web Push API integration using `web-push` npm package
- VAPID authentication with public/private key pair (stored in environment secrets)
- Service Worker (`public/sw.js`) handles push events and notification clicks
- Frontend utilities in `client/src/lib/notifications.ts`:
  - `subscribeToPush()` / `unsubscribeFromPush()` - Manage browser subscriptions
  - `isPushSupported()` / `isSubscribedToPush()` - Check browser support and status
  - VAPID key fetched dynamically from `/api/push/vapid-public-key`
- UI Components in `client/src/components/NotificationPermission.tsx`:
  - `NotificationPermission` - Banner prompting users to enable notifications (authenticated users only)
  - `NotificationToggle` - Toggle button for settings pages
- Server Push Service (`server/pushService.ts`):
  - `sendPushNotification(userId, payload)` - Send to specific user
  - `sendPushToAllUsers(payload)` - Broadcast to all subscribed users
  - Auto-cleanup of invalid/expired subscriptions
- API Routes (authenticated):
  - `POST /api/push/subscribe` - Register a push subscription
  - `POST /api/push/unsubscribe` - Remove subscription (user can only delete their own)
  - `GET /api/push/vapid-public-key` - Get VAPID public key

**Data Access Pattern**
- Storage abstraction layer (`server/storage.ts`) providing CRUD interfaces
- Zod validation schemas (`drizzle-zod`) for insert/update operations
- Relational queries using Drizzle's query builder with joins

### Build & Deployment

**Development Mode**
- Vite dev server with HMR (Hot Module Replacement)
- TSX for running TypeScript server code directly
- Development-only plugins: runtime error overlay, cartographer, dev banner

**Production Build**
- Client: Vite builds React app to `dist/public`
- Server: esbuild bundles TypeScript server to `dist/index.cjs`
- Selective dependency bundling (allowlist for critical packages, externals for others)
- Single-file server bundle for reduced cold start times

**File Structure**
- `/client` - Frontend React application
- `/server` - Express backend and API routes
- `/shared` - Shared TypeScript types and Zod schemas
- `/migrations` - Drizzle database migration files

## External Dependencies

### Core Infrastructure
- **Neon Database** - Serverless PostgreSQL database with WebSocket connections
- **Replit Auth** - OpenID Connect authentication provider

### UI Component Libraries
- **Radix UI** - Headless accessible component primitives (17 different components)
- **Shadcn/ui** - Pre-built component variants on top of Radix
- **Tailwind CSS** - Utility-first CSS framework
- **Google Fonts** - Inter font family

### Development & Build Tools
- **Vite** - Frontend build tool and dev server
- **esbuild** - Server-side bundler
- **Drizzle Kit** - Database migration tooling
- **TypeScript** - Type checking and compilation

### Backend Libraries
- **Passport.js** - Authentication middleware
- **OpenID Client** - OIDC protocol implementation
- **connect-pg-simple** - PostgreSQL session store
- **ws** - WebSocket library for Neon connections

### Data & Validation
- **Zod** - Runtime type validation
- **drizzle-zod** - Schema-to-Zod converter
- **date-fns** - Date manipulation utilities

### Optional Integrations (Dependencies Present)
- **Stripe** - Payment processing (not yet implemented)
- **Nodemailer** - Email sending (not yet implemented)
- **Multer** - File uploads (not yet implemented)
- **OpenAI / Google Generative AI** - AI integrations (not yet implemented)
- **XLSX** - Spreadsheet operations (not yet implemented)