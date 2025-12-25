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

---

## Project Implementation Phases (12 Phases)

### Phase 1: Database Schema Updates - COMPLETE
- [x] TierType enum with free, core, premium, pro, studio
- [x] TIER_LIMITS defined for all tiers
- [x] Steve AI quota fields (steveAIVideos, steveAIGenerative, steveAIImages)
- [x] Social channel limits per tier (0/1/3/5/9)
- [x] Usage tracking columns for Steve AI

### Phase 2: Usage Service Updates - COMPLETE
- [x] usageService.ts with Steve AI usage types
- [x] Free tier restrictions (scripts + images only)
- [x] Core tier handling (full tools, own APIs)
- [x] Studio quota enforcement

### Phase 3: Stripe Integration - COMPLETE
- [x] Stripe products created (Core £9.99, Studio £99.99)
- [x] Webhook handlers for new tiers
- [x] Checkout endpoints updated

### Phase 4: Social Media Channels Setup - 90%
- [x] YouTube, Twitter/X, LinkedIn, Facebook, Instagram OAuth
- [x] TikTok, Threads, Bluesky, Pinterest - CODE COMPLETE
- [ ] End-to-end verification pending (requires API credentials)

### Phase 5: User Migration - 50%
- [x] Owner account set to Studio tier
- [ ] Existing free users migration to Core (manual or automated?)

### Phase 6: Feature Gating - COMPLETE
- [x] Routes for tier-based access control
- [x] /api/ai-engines/status for tier-specific APIs
- [x] Social channel limit enforcement per tier

### Phase 7: Admin Panel - 80%
- [x] Tier dropdown (Free, Core, Premium, Pro, Studio)
- [ ] Session count display for Studio

### Phase 8: Creator Studio UI - COMPLETE
- [x] All tools visible to all users
- [x] "Upgrade to Creator Studio" box for non-subscribers
- [x] "Upgrade to Studio Package" box for Steve AI features

### Phase 9: Steve AI Features (Studio Only) - COMPLETE
- [x] Text-to-Long-Form Video (5 styles, up to 3 min)
- [x] Blog/URL-to-Video
- [x] Voice-to-Video
- [x] Multi-Voice Scenes
- [x] Scene Properties
- [x] Getty Images B-roll search

### Phase 10: Content Queue Updates - COMPLETE
- [x] Getty Images as image engine choice
- [x] Free tier blocks voiceover/video
- [x] Steve AI options for Studio only

### Phase 11: Multi-Login for Studio - NOT STARTED
- [ ] Session tracking (max 5 concurrent)
- [ ] Block 6th+ simultaneous login

### Phase 12: Documentation & UI Updates - COMPLETE
- [x] How To page: Steve AI features documentation
- [x] How To page: Getty Images documentation
- [x] How To page: New Tiers tab with subscription info and social channel limits
- [x] Dashboard: tier display and upgrade prompts
- [x] Settings/Pricing: new tier options
- [x] Sidebar: Creator Studio visibility
- [x] replit.md documentation