# SocialCommand

## Overview
SocialCommand is a unified social media management platform designed for managing multiple social media channels, scheduling posts, and analyzing performance from a single dashboard. It leverages AI for content generation, including copywriting via OpenAI, voice synthesis via ElevenLabs, and video lip-sync processing via Fal.ai. Users can define brand voice and strategy through brand briefs to generate social media content such as scripts, captions, and hashtags. The platform also features an auto-posting capability for 9 social media platforms and a Social Listening module for monitoring mentions, sentiment analysis, and AI-powered reply generation.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18 and TypeScript, utilizing Wouter for routing and TanStack React Query for state management. UI components are developed using shadcn/ui (based on Radix UI) and styled with Tailwind CSS v4. Vite is used as the build tool, and fonts are sourced from Google Fonts.

### Backend Architecture
The backend is a Node.js Express.js application written in TypeScript. It uses RESTful API endpoints under the `/api/*` prefix. Drizzle ORM with a PostgreSQL dialect handles database interactions, with a shared schema located in `shared/schema.ts` for consistency between frontend and backend.

### Data Storage
PostgreSQL serves as the primary database, configured via `DATABASE_URL`. Google Cloud Storage is used for file uploads, accessed via Replit's sidecar endpoint. Express sessions are managed with a `pg-simple` connector for session storage.

### Application Structure
The project is organized into `client/` for the React frontend, `server/` for the Express backend, and `shared/` for common code like database schemas and Zod validation.

### Key Design Decisions
1.  **Shared Schema Pattern**: Drizzle ORM defines the database schema once in `shared/schema.ts`, with Zod schemas auto-generated for validation across the stack.
2.  **Service Layer Pattern**: External AI services are encapsulated within dedicated service classes, ensuring configuration checks before API calls.
3.  **API Status Endpoint**: An `/api/ai-engines/status` endpoint allows the frontend to display configured AI services.
4.  **Tier System & Usage Quotas**: A comprehensive tier system (Free, Core, Premium, Pro, Studio) with distinct usage quotas for AI features and social channels is enforced. The system tracks monthly usage, allows top-ups, and includes an `isOwner` flag for admin access, separate from subscription tiers.
5.  **Authentication & Data Isolation**: A custom authentication system using email/password and Google OAuth (Passport.js) is implemented. Critical patterns include ensuring the `upsertUser` function applies owner flags correctly, `getUserId` supports both Replit and Passport auth formats, and all data endpoints strictly filter by `userId` to ensure data isolation. Premium/Pro users have access to platform API keys, while Free users see their own API key status.

## External Dependencies

### AI Services
-   **OpenAI**: For content generation (scripts, captions, hashtags, ideas) and DALL-E 3 image generation.
-   **ElevenLabs**: For voice synthesis.
-   **A2E**: Default engine for avatar lip-sync video generation.
-   **Fal.ai**: Backup engine for AI video/image generation.
-   **Steve AI**: Enterprise-level video creation for Studio tier.

### Social Media Platforms (OAuth 2.0 unless specified)
-   YouTube (Google API)
-   Twitter/X (Twitter API v2)
-   LinkedIn (LinkedIn API)
-   Facebook (Graph API)
-   Instagram (via Facebook Graph API)
-   TikTok (Content Posting API)
-   Threads (Threads API)
-   Bluesky (App Password, AT Protocol)
-   Pinterest (Pinterest API)

### Database
-   **PostgreSQL**: Primary data store.

### Cloud Storage
-   **Google Cloud Storage**: For file uploads.

### Key NPM Packages
-   `@tanstack/react-query`
-   `drizzle-orm`, `drizzle-kit`
-   `zod`, `drizzle-zod`
-   `recharts`
-   `date-fns`
-   `wouter`