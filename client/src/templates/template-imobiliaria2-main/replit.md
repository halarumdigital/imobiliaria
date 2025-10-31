# FindHouse - Real Estate Platform

## Overview

FindHouse is a modern real estate platform built with React and Express that enables users to browse, search, and explore properties for sale and rent. The application features a clean, responsive interface with property listings, search functionality, and a comprehensive component library built on shadcn/ui.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and data fetching
- Tailwind CSS for utility-first styling with custom design system

**UI Component System:**
- shadcn/ui component library (New York style) providing accessible, customizable components
- Radix UI primitives for headless, accessible UI components
- Custom CSS variables for theming with support for light/dark modes
- Poppins font family as the primary typeface

**State Management:**
- TanStack Query handles all server state with configured query client
- Custom hooks for UI state (mobile detection, toast notifications)
- React Hook Form with Zod resolvers for form validation (configured but not yet implemented)

**Project Structure:**
- `client/src/components/` - Reusable UI components and page sections
- `client/src/components/ui/` - shadcn/ui component library
- `client/src/pages/` - Route-based page components
- `client/src/hooks/` - Custom React hooks
- `client/src/lib/` - Utility functions and shared logic

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- Modular route registration pattern for API endpoints
- In-memory storage implementation with interface-based architecture for easy database migration

**Server Structure:**
- `server/index.ts` - Main server entry point with middleware setup
- `server/routes.ts` - Route registration and HTTP server creation
- `server/storage.ts` - Storage interface and in-memory implementation
- `server/vite.ts` - Vite development server integration

**Middleware Configuration:**
- JSON body parsing with raw body capture for webhook support
- URL-encoded form data support
- Request/response logging for API routes with duration tracking
- Error handling and response standardization

**Storage Pattern:**
- `IStorage` interface defines contract for data operations
- `MemStorage` provides in-memory implementation
- Designed for easy swap to database-backed storage (Drizzle ORM ready)

### Data Layer

**Database Configuration (Prepared but Not Active):**
- Drizzle ORM configured with PostgreSQL dialect
- Neon serverless driver for PostgreSQL connections
- Migration system using drizzle-kit
- Schema-first approach with TypeScript type inference

**Schema Design:**
- User table with UUID primary keys, username/password authentication
- Zod schemas for runtime validation aligned with database schema
- Type-safe insert and select operations

**Current State:**
- Application uses in-memory storage
- Database infrastructure configured but not yet populated with property models
- Ready for migration to PostgreSQL when needed

### External Dependencies

**Third-Party UI Libraries:**
- Radix UI component primitives (@radix-ui/react-*) for accessible UI building blocks
- Lucide React for icon system
- Embla Carousel for property image galleries
- cmdk for command palette functionality
- date-fns for date manipulation

**Development Tools:**
- Replit-specific plugins for runtime error overlay, cartographer, and dev banner
- esbuild for production server bundling
- Drizzle Kit for database migrations and schema management

**Authentication & Sessions (Configured):**
- connect-pg-simple for PostgreSQL-backed session storage
- Session infrastructure ready but not yet implemented

**API & Data Fetching:**
- Custom fetch wrapper with credential handling
- Centralized error handling for non-OK responses
- Query client configured for optimistic updates and caching

### Design System

**Color Scheme:**
- Primary: Blue (#2C9ADB) for CTAs and interactive elements
- Secondary: Dark gray (#1E2738) for headers and contrasts
- Accent: Light blue for hover states and highlights
- Destructive: Red (#F14F4F) for errors and critical actions

**Responsive Breakpoints:**
- Mobile-first approach with Tailwind's default breakpoints
- Custom mobile detection hook for conditional rendering
- Fluid typography and spacing using CSS custom properties

**Accessibility:**
- Radix UI ensures ARIA-compliant components
- Semantic HTML structure
- Focus management and keyboard navigation support
- Test IDs throughout components for automated testing