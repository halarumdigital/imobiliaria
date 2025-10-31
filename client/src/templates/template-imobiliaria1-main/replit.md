# Find House - Real Estate Platform

## Overview

Find House is a full-stack real estate platform built with React, Express, and MySQL. The application features a complete admin panel with authentication system, allowing administrators to manage users and view system statistics. It features a modern, responsive UI built with shadcn/ui components and Tailwind CSS.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server, providing fast HMR and optimized production builds
- **Wouter** for lightweight client-side routing instead of React Router
- Single-page application (SPA) architecture with component-based design

**UI Component System**
- **shadcn/ui** component library using Radix UI primitives for accessible, unstyled components
- **Tailwind CSS** for utility-first styling with custom CSS variables for theming
- Component library configured in "new-york" style with extensive Radix UI components (dialogs, dropdowns, forms, etc.)
- Custom design tokens defined in CSS variables for consistent theming (primary, secondary, accent colors)

**State Management**
- **TanStack Query (React Query)** for server state management and data fetching
- Local component state using React hooks
- Custom query client configuration with credential-based requests and infinite stale time

**Key UI Features**
- Admin authentication system with login/logout
- Protected admin panel with role-based access control
- Admin dashboard with user statistics
- Full CRUD user management interface
- Responsive design with mobile sidebar support

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript for type-safe server development
- ES modules configuration (`"type": "module"`)
- Custom request logging middleware tracking API response times
- JSON body parsing with raw body preservation for webhook support

**Development Setup**
- **tsx** for running TypeScript directly in development
- **esbuild** for production builds with external package bundling
- Vite middleware integration for SPA serving in development
- Hot module replacement (HMR) support via Vite

**API Design**
- RESTful API architecture (routes prefixed with `/api`)
- Modular route registration system
- Centralized error handling and response formatting
- Request/response logging with truncation for long responses

### Data Storage

**Database**
- **MySQL** as the primary database
- **mysql2** driver for database connectivity
- Database credentials read from `.env` file (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
- **Drizzle ORM** for type-safe database queries and schema management
- Schema-first approach with TypeScript type inference

**Current Schema**
- `users` table with UUID primary keys, username (varchar 255), password (text), and role fields
- Username uniqueness constraint
- Role field: "admin" or "user"
- Initial admin user: username "admin", password "admin123" (should be changed in production)
- Zod validation schemas generated from Drizzle schemas for runtime validation

**Storage Interface**
- Abstract `IStorage` interface defining CRUD operations
- `DbStorage` MySQL-backed implementation
- User management methods: `getUser`, `getUserByUsername`, `createUser`, `getAllUsers`, `updateUser`, `deleteUser`

**Data Layer Philosophy**
- Repository pattern via storage interface abstraction
- Type-safe operations using shared schema types
- Separation of concerns between storage implementation and business logic

### Authentication & Authorization

**Authentication System**
- Login page at `/login` with username/password form
- Session-based authentication using `express-session` with `memorystore`
- Passwords hashed with **bcrypt** (salt rounds: 10)
- HTTP-only cookies for session security
- Session persistence across page reloads

**Authorization & Access Control**
- Role-based access control (RBAC) with "admin" and "user" roles
- `requireAdmin` middleware protecting admin-only routes
- Protected routes automatically redirect to login if not authenticated
- Admin users cannot delete themselves

**Auth API Endpoints**
- POST `/api/auth/login` - Authenticate user and create session
- POST `/api/auth/logout` - Destroy session and logout
- GET `/api/auth/me` - Get current user session info

### Admin Panel

**Layout & Navigation**
- `AdminLayout` component with responsive sidebar
- Mobile-friendly sheet/drawer navigation
- Menu items: Dashboard, Users (Usuários)
- Logout button in sidebar
- Auto-redirect to login for non-admin users

**Dashboard Page** (`/admin`)
- Statistics cards showing:
  - Total users count
  - Admin users count
  - Regular users count
  - System status
- Real-time data from database

**User Management Page** (`/admin/users`)
- Table listing all users (username, role)
- Create user: Dialog with form (username, password, role selection)
- Edit user: Dialog with pre-filled data, optional password update
- Delete user: Confirmation dialog with safeguards
- Toast notifications for all operations
- Admin cannot delete themselves

**Admin API Endpoints (Protected)**
- POST `/api/users` - Create new user (admin only)
- GET `/api/users` - List all users without passwords (admin only)
- GET `/api/users/:id` - Get single user (admin only)
- PUT `/api/users/:id` - Update user (admin only)
- DELETE `/api/users/:id` - Delete user (admin only, cannot delete self)

### External Dependencies

**Core Dependencies**
- **mysql2**: MySQL database driver
- **drizzle-orm** & **drizzle-zod**: ORM and schema validation
- **express**: Web application framework
- **express-session** & **memorystore**: Session management
- **bcrypt**: Password hashing
- **react** & **react-dom**: UI library

**UI Component Libraries**
- **@radix-ui/***: Comprehensive set of accessible UI primitives (20+ component packages)
- **@tanstack/react-query**: Server state management
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority** & **clsx**: Conditional className utilities
- **lucide-react**: Icon library

**Form Management**
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Schema validation

**Additional UI Features**
- **embla-carousel-react**: Carousel/slider functionality
- **date-fns**: Date manipulation and formatting
- **cmdk**: Command menu component
- **vaul**: Drawer component primitives

**Development Tools**
- **@replit/vite-plugin-***: Replit-specific development tools (error overlay, dev banner, cartographer)
- **vite**: Build tool and dev server
- **typescript**: Type checking and compilation

**Recent Changes (October 2025)**
- Migrated from PostgreSQL to MySQL database
- Implemented complete authentication system with bcrypt password hashing
- Built admin panel with dashboard and user management
- Added role-based access control (admin/user)
- Secured all admin endpoints with authentication middleware
- Fixed security vulnerabilities: user creation endpoint now admin-protected