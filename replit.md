# Multi-Enterprise System

## Overview

This is a comprehensive multi-tenant web application built for managing multiple companies with WhatsApp automation and AI integration capabilities. The system provides separate interfaces for administrators and clients, featuring global system configuration, Evolution API integration for WhatsApp functionality, and OpenAI-powered conversational agents.

The application supports user authentication with role-based access control, company management, file uploads with access control, and real-time messaging capabilities. It's designed to be a complete business automation platform combining communication tools with intelligent AI responses.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state and React Context for auth/theme
- **Routing**: Wouter for client-side routing with role-based route protection
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Database**: MySQL with Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **File Storage**: Google Cloud Storage with custom ACL (Access Control List) system
- **API Structure**: RESTful API with role-based middleware protection

### Database Design
- **Users Table**: Stores user credentials with role (admin/client) and company association
- **Companies Table**: Multi-tenant company data with profile information
- **Global Configurations**: System-wide settings for branding and appearance
- **Evolution API Config**: WhatsApp API integration settings
- **AI Configuration**: OpenAI API settings and parameters
- **WhatsApp Instances**: Company-specific WhatsApp connections
- **AI Agents**: Configurable chatbots per company
- **Conversations & Messages**: Chat history and message storage

### Role-Based Access Control
- **Admin Role**: 
  - Global system configuration (branding, colors, system name)
  - Evolution API settings management
  - AI global configuration
  - Company management (CRUD operations)
  - System-wide dashboard and analytics
- **Client Role**:
  - Company profile management
  - WhatsApp instance configuration
  - AI agent creation and management
  - Conversation monitoring
  - Company-specific dashboard

### Multi-Tenancy Strategy
The system implements multi-tenancy through company-based data isolation. Each user belongs to a company, and data access is restricted based on the user's company association. Middleware ensures users can only access data from their own company.

## External Dependencies

### Third-Party APIs
- **OpenAI API**: Powers AI agents with configurable models, temperature, and token limits
- **Evolution API**: Provides WhatsApp integration for automated messaging
- **Google Cloud Storage**: File storage with custom access control policies

### Database
- **Neon Database**: PostgreSQL-compatible serverless database (configured for MySQL in Drizzle)
- **Drizzle ORM**: Type-safe database operations with automatic migrations

### Frontend Libraries
- **Shadcn/ui**: Complete UI component library built on Radix UI
- **TanStack Query**: Server state management and caching
- **Uppy**: File upload handling with drag-and-drop support
- **Wouter**: Lightweight client-side routing

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire application
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production builds