# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (builds both frontend with Vite and server with esbuild)
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes using Drizzle

### Database Operations
- `npm run db:push` - Push schema changes to database
- Database configuration uses MySQL via environment variables (MYSQL_HOST, MYSQL_USER, etc.)

## Architecture Overview

### Multi-Tenant WhatsApp AI System
This is a multi-company SaaS platform for WhatsApp automation using AI agents. The system integrates with Evolution API for WhatsApp management and OpenAI for AI responses.

### Technology Stack
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TailwindCSS + Shadcn/ui
- **Database**: MySQL with Drizzle ORM
- **Authentication**: JWT tokens with bcryptjs
- **External APIs**: Evolution API (WhatsApp), OpenAI API, Google Cloud Storage

### Key Architecture Patterns

#### Lazy Storage Initialization
The storage system uses lazy initialization to ensure environment variables are loaded before database connections:
```typescript
// Use getStorage() instead of direct imports
const storage = getStorage();
await storage.init();
```

#### Multi-Tenant Data Access
All database operations include company-level isolation:
- Users belong to companies (`companyId`)
- WhatsApp instances, AI agents, and conversations are scoped by company
- Access control middleware (`requireCompanyAccess`) enforces tenant boundaries

#### AI Agent Hierarchy
- **Main Agents**: Primary AI agents linked to WhatsApp instances
- **Secondary Agents**: Specialized agents that can be delegated to based on keywords
- Delegation logic in `aiService.ts` routes messages to appropriate specialized agents

### Core Services

#### WhatsApp Integration (`server/services/`)
- **evolutionApi.ts**: Evolution API client for WhatsApp operations
- **whatsappWebhook.ts**: Webhook handler for incoming WhatsApp messages
- **messageProcessor.ts**: Message processing and routing
- **aiService.ts**: AI response generation with agent hierarchy

#### Storage Layer (`server/storage.ts`)
- MySQL connection with lazy initialization
- Company-scoped data access patterns
- Conversation and message persistence

#### Authentication (`server/auth.ts`)
- JWT-based authentication
- Role-based access (admin/client)
- Password hashing with bcryptjs

### Frontend Structure

#### Route Organization
- `/admin/*` - Administrative interface (global configs, Evolution API, companies)
- `/client/*` - Client interface (WhatsApp instances, AI agents, conversations)
- Authentication-based route protection

#### State Management
- TanStack Query v5 for server state
- React Context for authentication
- Wouter for client-side routing

#### UI Components
- Shadcn/ui component library
- TailwindCSS for styling
- Uppy.js for file uploads

### Key Integration Points

#### Evolution API Integration
- Instance creation and management
- QR code generation for WhatsApp connection
- Webhook configuration for message receiving
- Settings configuration (auto-read, call rejection, etc.)

#### OpenAI Integration
- Text generation using GPT-4o
- Image analysis support
- Audio transcription with Whisper
- Agent-specific prompts and training content

#### Message Flow
1. WhatsApp message received via Evolution API webhook
2. Message routed to appropriate AI agent based on instance configuration
3. Agent hierarchy evaluates delegation keywords
4. OpenAI generates response using agent's prompt and training content
5. Response sent back through Evolution API
6. Conversation saved to database with agent tracking

### Environment Configuration
Essential environment variables:
- `MYSQL_*` - Database connection
- `JWT_SECRET` - Authentication
- Evolution API and OpenAI keys configured through admin interface
- `NODE_ENV` - Development/production mode

### File Upload Handling
- Local file uploads via multer for logos/favicons
- Object storage integration for avatar uploads
- PDF processing for AI agent training content

### Development Notes
- Hot reload enabled in development via Vite
- TypeScript strict mode enabled
- Error handling includes detailed logging for debugging
- Evolution API webhook endpoints use specific event routing
- Media support includes images and audio with base64 processing