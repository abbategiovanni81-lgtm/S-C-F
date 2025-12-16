# SocialCommand

## Overview

SocialCommand is a unified social media management platform that allows users to manage multiple social media channels, schedule posts, and track analytics from a single dashboard. The application features AI-powered content generation using OpenAI for copywriting, ElevenLabs for voice synthesis, and Fal.ai for video lip-sync processing. Users can create brand briefs that define their brand voice and content strategy, then generate social media content (scripts, captions, hashtags) based on those briefs.

### Social Listening Feature
The platform includes a Social Listening module that allows users to:
- **Monitor mentions**: Track posts/comments from various platforms (YouTube, TikTok, Instagram, X/Twitter, Reddit)
- **AI-powered analysis**: Automatically analyze sentiment, detect questions, and identify matched keywords
- **AI reply generation**: Generate contextual replies based on brand briefs with multiple tone options (helpful, promotional, educational, friendly)
- **Reply management**: Review, edit, and approve AI-generated replies before posting
- **Trending topics**: Track trending topics and keywords across monitored content

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom theme variables and CSS-in-JS via class-variance-authority
- **Build Tool**: Vite with custom plugins for meta images and Replit integration
- **Fonts**: Inter and Outfit from Google Fonts

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript compiled with tsx for development, esbuild for production
- **API Pattern**: REST endpoints under `/api/*` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: Shared schema in `shared/schema.ts` used by both frontend and backend

### Data Storage
- **Database**: PostgreSQL (connection via `DATABASE_URL` environment variable)
- **Object Storage**: Google Cloud Storage via Replit's sidecar endpoint for file uploads
- **Session Storage**: Express sessions with pg-simple connector

### Application Structure
```
client/           # React frontend
  src/
    components/   # UI components (shadcn/ui in ui/, layout in layout/)
    pages/        # Route pages (Dashboard, BrandBriefs, ContentQueue, etc.)
    lib/          # Utilities, mock data, query client
    hooks/        # Custom React hooks
server/           # Express backend
  routes.ts       # API route definitions
  storage.ts      # Database access layer
  db.ts           # Database connection
  openai.ts       # OpenAI integration for content generation
  elevenlabs.ts   # ElevenLabs voice synthesis service
  fal.ts          # Fal.ai lip-sync processing service
shared/           # Shared code between frontend and backend
  schema.ts       # Drizzle database schema and Zod validation
```

### Key Design Decisions

1. **Shared Schema Pattern**: Database schema defined once in `shared/schema.ts` using Drizzle, with Zod schemas auto-generated via `drizzle-zod` for validation on both client and server.

2. **Service Layer Pattern**: External AI services (OpenAI, ElevenLabs, Fal.ai) encapsulated in dedicated service classes that check configuration status before making API calls.

3. **API Status Endpoint**: `/api/ai-engines/status` endpoint allows frontend to display which AI services are configured.

4. **Build Strategy**: Vite for frontend, esbuild for backend with selective bundling of dependencies to optimize cold start times.

## External Dependencies

### AI Services (require API keys in environment)
- **OpenAI**: Content generation (scripts, captions, hashtags, content ideas) via `AI_INTEGRATIONS_OPENAI_API_KEY`
- **ElevenLabs**: Voice synthesis for video voiceovers via `ELEVENLABS_API_KEY`
- **Fal.ai**: Lip-sync video processing via `FAL_API_KEY`

### Database
- **PostgreSQL**: Primary data store, connection string via `DATABASE_URL`
- **Drizzle Kit**: Schema migrations via `drizzle-kit push`

### Cloud Storage
- **Google Cloud Storage**: File uploads through Replit sidecar at `http://127.0.0.1:1106`

### Key NPM Packages
- `@tanstack/react-query`: Server state management
- `drizzle-orm` + `drizzle-kit`: Database ORM and migrations
- `zod` + `drizzle-zod`: Schema validation
- `recharts`: Analytics charts
- `date-fns`: Date manipulation
- `wouter`: Client-side routing