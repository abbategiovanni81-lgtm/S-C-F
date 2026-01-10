# SocialCommand

## Overview
SocialCommand is a unified social media management platform for managing multiple social media channels, scheduling posts, and analyzing performance from a single dashboard. It leverages AI for content generation (copywriting, voice synthesis, video lip-sync), allowing users to define brand voice and strategy. The platform offers auto-posting to nine social media platforms and includes a Social Listening module for monitoring mentions, sentiment analysis, and AI-powered reply generation. The project aims to provide an efficient, AI-augmented solution for social media management with a tiered subscription model featuring usage quotas.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- All tools are visible to all users, with "Upgrade" prompts for non-subscribers to access tier-specific features.
- Carousel, Reels, Stories, and general Instagram/YouTube content optimization guidelines focus on maximizing engagement, retention, and algorithmic favorability based on current platform trends (2025/2026). This includes strategies for hooks, content structure, CTAs, and format selection tailored to each platform's algorithm.
- YouTube content generation focuses on viewer intent, strong hooks, and retention-optimized script structures, avoiding common "algorithm hacks."

### Technical Implementations
- **Frontend**: React 18, TypeScript, Wouter (routing), TanStack React Query (state management), shadcn/ui (Radix UI), Tailwind CSS v4, Vite.
- **Backend**: Node.js Express.js, TypeScript, RESTful API.
- **Database**: PostgreSQL with Drizzle ORM, shared schema (`shared/schema.ts`).
- **File Storage**: Google Cloud Storage for uploads, served via `/objects/*` route.
- **Session Management**: Express sessions with `pg-simple` connector.
- **Application Structure**: `client/` (React), `server/` (Express), `shared/` (common code, schemas, Zod validation).

### Key Design Decisions
- **Shared Schema Pattern**: Drizzle ORM and Zod for consistent validation across the stack.
- **Service Layer Pattern**: Encapsulation of external AI services with pre-call configuration checks.
- **API Status Endpoint**: `/api/ai-engines/status` to inform the frontend about configured AI services.
- **Tier System & Usage Quotas**: Tiered subscription (Free, Core, Premium, Pro, Studio) with distinct quotas, monthly tracking, top-up options, and `isOwner` flag for admin.
- **Authentication & Data Isolation**: Custom email/password and Google OAuth (Passport.js), strict data isolation by `userId` for all data endpoints.

## External Dependencies

### AI Services
-   **OpenAI**: Content generation (scripts, captions, hashtags, ideas) and DALL-E 3 image generation.
-   **ElevenLabs**: Voice synthesis.
-   **A2E**: Primary engine for video generation (avatars, text-to-image, image-to-video, lip-sync).
-   **Fal.ai**: Backup for AI video/image generation.
-   **Steve AI**: Enterprise-level video creation (Studio tier).

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
-   Reddit (OAuth2)

### Database
-   **PostgreSQL**: Primary data store.

### Cloud Storage
-   **Replit App Storage (Google Cloud Storage)**: For all file uploads (images, video clips).

## Pending Project Plan

### Free Tier Monthly Allowances
- **Feature**: Give free users 1 Content Analysis and 1 Content Comparison per month
- **Implementation**:
  1. Add `freeAnalysisUsed`, `freeComparisonUsed`, `freeUsageResetDate` fields to user table
  2. Backend check before analysis/comparison API calls for free users
  3. Monthly reset logic when `freeUsageResetDate` < current month
  4. Increment counters on successful use (free users only)
  5. Frontend UI: show "1/1 used" badge, disable when exhausted, show upgrade prompt

## Tier Feature Access (Confirmed)

| Feature | Free | Core | Premium+ |
|---------|------|------|----------|
| Content Queue (scripts/captions/images) | ✓ (own OpenAI) | ✓ | ✓ |
| Brand Briefs | 1 | Unlimited | Unlimited |
| Editor | ✗ | ✓ | ✓ |
| Edit & Merge | ✗ | ✓ | ✓ |
| Content Analysis | ✗ | ✓ | ✓ |
| Content Comparison | ✗ | ✓ | ✓ |
| Video to Clips | ✗ | ✓ | ✓ |
| Blog Studio | ✗ | ✓ | ✓ |
| Social Listening | ✗ | ✓ (BYOK) | ✓ |
| Social Posting | ✗ | 1 channel | 6-10 channels |
| API Keys | OpenAI only | All (BYOK) | Platform included |