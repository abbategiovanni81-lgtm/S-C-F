# SocialCommand

## Overview
SocialCommand is a unified social media management platform designed for managing multiple social media channels, scheduling posts, and analyzing performance from a single dashboard. It leverages AI for content generation, including copywriting, voice synthesis, and video lip-sync processing. The platform enables users to define brand voice and strategy through brand briefs to generate social media content (scripts, captions, hashtags), offers auto-posting to nine social media platforms, and includes a Social Listening module for monitoring mentions, sentiment analysis, and AI-powered reply generation. The project aims to provide a comprehensive tool for efficient and AI-augmented social media management, featuring a tiered subscription model with usage quotas and advanced features for higher tiers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is built with React 18 and TypeScript, using Wouter for routing and TanStack React Query for state management. UI components are developed using shadcn/ui (Radix UI) and styled with Tailwind CSS v4, with Vite as the build tool.

### Backend
The backend is a Node.js Express.js application written in TypeScript, providing RESTful API endpoints. It utilizes Drizzle ORM with a PostgreSQL dialect for database interactions, with a shared schema (`shared/schema.ts`) for consistency.

### Data Storage
PostgreSQL serves as the primary database. Google Cloud Storage is used for file uploads. Express sessions are managed with a `pg-simple` connector for session storage.

### Application Structure
The project is organized into `client/` (React frontend), `server/` (Express backend), and `shared/` (common code, schemas, Zod validation).

### Key Design Decisions
-   **Shared Schema Pattern**: Drizzle ORM defines a single database schema, with Zod schemas auto-generated for validation across the stack.
-   **Service Layer Pattern**: External AI services are encapsulated in dedicated service classes with pre-call configuration checks.
-   **API Status Endpoint**: An `/api/ai-engines/status` endpoint informs the frontend about configured AI services.
-   **Tier System & Usage Quotas**: A comprehensive tier system (Free, Core, Premium, Pro, Studio) with distinct usage quotas for AI features and social channels. It includes monthly usage tracking, top-up options, and an `isOwner` flag for admin access.
-   **Authentication & Data Isolation**: Custom email/password and Google OAuth (Passport.js) authentication. Strict data isolation is enforced by filtering all data endpoints by `userId`. Premium/Pro users access platform API keys, while Free users see their own API key status.
-   **UI/UX**: All tools are visible to all users, with "Upgrade" prompts for non-subscribers to access tier-specific features like Steve AI.

## External Dependencies

### AI Services
-   **OpenAI**: Content generation (scripts, captions, hashtags, ideas) and DALL-E 3 image generation.
-   **ElevenLabs**: Voice synthesis.
-   **A2E**: Default engine for ALL video generation. API endpoints:
    - Avatars: `GET /api/v1/anchor/character_list` - returns list of available avatars
    - Text-to-image: `POST /api/v1/userText2image/start` - async task with polling via `GET /api/v1/userText2image/{taskId}`
    - Image-to-video: `POST /api/v1/userImage2Video/start` - requires `prompt` and `negative_prompt` fields
    - Supports: (1) Lip-sync avatar videos when avatar is selected, (2) Scene videos via text-to-image + image-to-video pipeline when no avatar selected.
-   **Fal.ai**: Backup engine for AI video/image generation (only used if A2E unavailable).
-   **Steve AI**: Enterprise-level video creation for Studio tier.

### Social Media Platforms
-   YouTube (Google API)
-   Twitter/X (Twitter API v2)
-   LinkedIn (LinkedIn API)
-   Facebook (Graph API)
-   Instagram (via Facebook Graph API)
-   TikTok (Content Posting API)
-   Threads (Threads API)
-   Bluesky (App Password, AT Protocol)
-   Pinterest (Pinterest API)
-   Reddit (OAuth2, for A2E SEO Bonus - max 5 posts/day, 620 credits per post)

### Database
-   **PostgreSQL**: Primary data store.

### Cloud Storage
-   **Replit App Storage (Google Cloud Storage)**: All file uploads (images, video clips) are stored in cloud storage via presigned URLs. Upload endpoints in `server/routes.ts` use `objectStorageService.uploadBuffer()` to persist files. Files are served via `/objects/*` route. This ensures uploads persist in production (unlike local filesystem storage).

## AI Content Generation Rules

### Carousel Optimization (Instagram/Social)
1. **Prefer vertical carousels**: Use 4:5 or 3:4 ratios to maximize screen space and feed visibility
2. **Slide 1 = Hook**: 6-8 words max, speak audience's language, signal value/tension/curiosity
3. **Slide 2 is critical for reach**: Instagram may resurface posts using slide 2. Reinforce hook, add context, push curiosity
4. **One idea per carousel**: Maintain clear narrative: hook → explanation → insight → CTA
5. **Flow > volume**: Each slide should naturally lead to the next
6. **End with clear CTA**: Prompt comments, keywords, or actions. "Link in bio" is fine
7. **Visuals increase discoverability**: Screenshots, typography, illustrations, relevant photos
8. **Platform signals**: Add music (instrumental) for Reels distribution. Use location tags for local reach

### AI Generation Behavior
- Optimize for swipe depth, not just slide 1
- Generate hooks first, then build content around them
- Enforce structural discipline (one idea, clear flow)
- Auto-suggest CTAs aligned to post intent
- Recommend visuals and music as part of post readiness, not optional extras