# SocialCommand

## Overview

SocialCommand is a unified social media management platform that allows users to manage multiple social media channels, schedule posts, and track analytics from a single dashboard. The application features AI-powered content generation using OpenAI for copywriting, ElevenLabs for voice synthesis, and Fal.ai for video lip-sync processing. Users can create brand briefs that define their brand voice and content strategy, then generate social media content (scripts, captions, hashtags) based on those briefs.

### Auto-Posting Feature (December 2025)
The platform supports OAuth-based auto-posting to 9 social media platforms:

| Platform | Auth Type | API | Environment Variables |
|----------|-----------|-----|----------------------|
| YouTube | OAuth 2.0 | Google API | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET |
| Twitter/X | OAuth 2.0 + PKCE | Twitter API v2 | TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET |
| LinkedIn | OAuth 2.0 | LinkedIn API | LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET |
| Facebook | OAuth 2.0 | Graph API | FACEBOOK_APP_ID, FACEBOOK_APP_SECRET |
| Instagram | OAuth 2.0 (via Facebook) | Graph API | FACEBOOK_APP_ID, FACEBOOK_APP_SECRET |
| TikTok | OAuth 2.0 | Content Posting API | TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET |
| Threads | OAuth 2.0 | Threads API | FACEBOOK_APP_ID, FACEBOOK_APP_SECRET |
| Bluesky | App Password | AT Protocol | (user provides app password) |
| Pinterest | OAuth 2.0 | Pinterest API | PINTEREST_APP_ID, PINTEREST_APP_SECRET |

**Key Implementation Details:**
- OAuth routes in `server/routes.ts` with CSRF protection via session state
- Platform service layer in `server/socialPlatforms.ts`
- Universal posting endpoint: `POST /api/social/post`
- All OAuth initiation routes require authentication (`requireAuth` middleware)
- Session state saved with `req.session.save()` before redirects

### Social Listening Feature
The platform includes a Social Listening module that allows users to:
- **Monitor mentions**: Track posts/comments from various platforms (YouTube, TikTok, Instagram, X/Twitter, Reddit)
- **AI-powered analysis**: Automatically analyze sentiment, detect questions, and identify matched keywords
- **AI reply generation**: Generate contextual replies based on brand briefs with multiple tone options (helpful, promotional, educational, friendly)
- **Reply management**: Review, edit, and approve AI-generated replies before posting
- **Trending topics**: Track trending topics and keywords across monitored content

### Authentication System
- **Custom Auth**: Email/password + Google OAuth using Passport.js
- **Session Storage**: PostgreSQL-backed sessions (7-day TTL)
- **Owner Account**: gio.abbate@hotmail.com (existing demo data linked to this account)
- **Password Hashing**: bcryptjs with 10 salt rounds

### CRITICAL: Authentication & Data Isolation Notes
**DO NOT BREAK THESE PATTERNS:**

1. **Owner Privileges**: The `upsertUser` function in `server/replit_integrations/auth/storage.ts` applies owner flags (tier=pro, isOwner=true, creatorStudioAccess=true) on EVERY login. Both email/password and Google OAuth call `upsertUser`.

2. **User ID Retrieval**: The `getUserId` function in `server/routes.ts` must support BOTH auth formats:
   - Replit auth: `req.user.claims.sub`
   - Passport auth: `req.user.id`
   Breaking this causes all APIs to appear unconfigured.

3. **Data Isolation**: ALL data endpoints filter by userId:
   - `getBrandBriefsByUser(userId)`
   - `getSocialAccountsByUser(userId)`
   - `getContentByUser(userId)`
   Users must ONLY see their own data.

4. **Platform API Access**: Premium/Pro users see platform API keys as configured. Free users see their own API key status. The `/api/ai-engines/status` endpoint handles this based on user tier.

5. **Login Response**: Must include tier, isOwner, and creatorStudioAccess in the JSON response.

### Tier System & Usage Quotas
Three subscription tiers with monthly usage limits:

| Feature | Free | Premium (£29.99/mo) | Pro (£49.99/mo) |
|---------|------|---------------------|-----------------|
| Brand Briefs | 1 | 5 | 10 |
| Scripts | Own API keys | Unlimited | Unlimited |
| Voiceovers | Own API keys | 25 min | 60 min |
| A2E Videos | Own API keys | 16 | 32 |
| Lipsync | Own API keys | 120 | 300 |
| Avatars | Own API keys | 4 | 8 |
| DALL-E Images | Own API keys | 150 | 400 |
| Sora Videos | Own API keys | 12 | 30 |
| Social Listening Keywords | Own API keys | 3 | 6 |
| Uses Platform API Keys | No | Yes | Yes |

**Platform API Costs (£310/month total):**
- A2E Max: £32/mo (5,400 credits)
- ElevenLabs Pro: £78/mo (1,000 min voiceover)
- OpenAI API: £200/mo (DALL-E + Sora)

**Usage Type Definitions:**
- `a2eVideos`: A2E video clips (30 credits each)
- `lipsync`: A2E lipsync videos (1 credit per second)
- `avatars`: A2E avatars (100 credits each)
- `dalleImages`: OpenAI DALL-E images ($0.04 each)
- `soraVideos`: OpenAI Sora videos ($0.10/sec)

- **Owner Flag**: `isOwner=true` grants admin panel access (separate from tier)
- **Usage Tracking**: Monthly periods with automatic reset on the 1st
- **Top-Up System**: £10 one-time payment adds 40% to current month's quotas
- **Quota Enforcement**: All AI generation endpoints check quotas before processing
- **Database Tables**: `usage_periods` (monthly tracking), `usage_topups` (purchase records)
- **Service Layer**: `server/usageService.ts` handles all quota logic

### Creator Studio Add-on (£20/month)
Advanced AI creation tools available as a paid add-on for Premium/Pro subscribers:

| Feature | Monthly Limit | Description |
|---------|---------------|-------------|
| Voice Cloning | 2 | Clone any voice from audio/video |
| Talking Photos | 10 | Animate photos to speak text |
| Talking Videos | 5 | Make videos speak new dialogue |
| Face Swap | 8 | Swap faces in videos |
| AI Dubbing | 3 | Translate and dub videos |
| Image to Video | 5 | Animate still images |
| Caption Removal | 10 | Remove burned-in captions |
| Video Style Transfer | 3 | Apply artistic styles to videos |
| Virtual Try-On | 5 | Try clothes on photos |

**A2E Credits per Creator Studio User**: ~1,300/month
**Platform Capacity**: 1 A2E account (5,400 credits) supports ~4 Creator Studio users

- **Stripe Product**: `creator_studio` (£20/month recurring)
- **Access Control**: `users.creatorStudioAccess` boolean flag
- **Webhook Handling**: Auto-enables on checkout, auto-disables on subscription deletion
- **Quota Service**: `server/usageService.ts` with CREATOR_STUDIO_LIMITS

### How To Page
In-app documentation accessible at `/how-to` covering:
- All 10 features with detailed explanations
- 4 content creation workflow diagrams
- API key requirements and pricing for each service
- Step-by-step setup guide for new users
- Quick start checklist

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
  socialPlatforms.ts  # Social media OAuth and posting service
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
- **OpenAI**: Content generation (scripts, captions, hashtags, content ideas) + DALL-E 3 images via `AI_INTEGRATIONS_OPENAI_API_KEY`
- **ElevenLabs**: Voice synthesis for video voiceovers via `ELEVENLABS_API_KEY`
- **A2E**: Avatar lip-sync video generation (default engine) via `A2E_API_KEY`
- **Fal.ai**: AI video/image generation (backup engine) via `FAL_API_KEY`

### Video Engine Selection
Users can choose between two video generation engines in the Content Queue:
- **A2E (default)**: Creates realistic lip-sync avatar videos from text using 50+ pre-built avatars
- **Fal.ai**: Generates AI video clips from visual prompts

### Image Engine Selection
Users can choose between four image generation engines in the Content Queue:
- **A2E (default)**: High-quality images with general or manga styles, uses same API as video avatars
- **DALL-E 3**: OpenAI's image generation with excellent text rendering via `OPENAI_DALLE_API_KEY`
- **Fal.ai**: Fast AI image generation with various style options (requires balance)
- **Pexels**: Free stock photos matching your content prompt

### Caption Generation Framework
AI-generated captions follow a structured SEO-first approach:
1. **CONTEXT**: Lead with searchable keyword phrase
2. **BELIEF BREAK**: Challenge assumption or surprising insight  
3. **PAYOFF**: Deliver the promised value
4. **CTA**: End with a question to drive comments

Caption Rules:
- Search-first writing for Instagram/TikTok SEO
- Keyword repetition (2-3x) over hashtag reliance
- Standalone captions that work without video audio
- Platform-specific length and style
- Max 3-5 targeted hashtags
- Comment-based CTAs (questions > statements)

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