# SocialCommand

## Overview
SocialCommand is a unified social media management platform for managing multiple social media channels, scheduling posts, and analyzing performance from a single dashboard. It leverages AI for content generation (copywriting, voice synthesis, video lip-sync), allowing users to define brand voice and strategy. The platform offers auto-posting to nine social media platforms and includes a Social Listening module for monitoring mentions, sentiment analysis, and AI-powered reply generation. The project aims to provide an efficient, AI-augmented solution for social media management with a tiered subscription model featuring usage quotas.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Mobile-First Visual Design**: 2-column visual card grids, dark theme editors, step wizards (1/3), center FAB navigation
- **Ava AI = Active Workflow Guide**: Not just advisor - guides users through decision tree, moves them between steps, presents visual cards at each decision point
- **All Decisions = Visual Cards**: Images/video previews, never text lists. Templates show metadata (clips, duration, song)
- **Content Creator Selection**: User always chooses WHO creates content (Platform AI vs BYOK keys)
- **Silent Tier Gating**: Features disabled for tier, upgrade prompt on hover/tap, no blocking modals
- **Navigation**: Dropdown menu always accessible - user can jump to any section, not locked in workflow
- **Scheduling**: Dual view - Board (Kanban) → Calendar, visual card previews throughout
- Full workflow documented in `AUTOMATION_UPGRADE_PLAN.md` (Ava AI section)

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
-   **OpenAI Sora 2**: DEFAULT video generation engine (text-to-video, image-to-video, remix).
-   **OpenAI GPT Image / DALL-E**: DEFAULT image generation engine.
-   **OpenAI**: Content generation (scripts, captions, hashtags, ideas).
-   **ElevenLabs**: Voice synthesis.
-   **A2E**: Backup/alternative for video (access to Kling, Veo, etc.).
-   **Fal.ai**: Backup for AI video/image generation.
-   **Steve AI**: Enterprise-level video creation (Studio tier).

### Planned AI Engine Additions
-   **Kling**: Direct API integration for video.
-   **Runway Gen-3**: Direct API integration for video.
-   **Veo 3**: Google video generation.
-   **Hailuo 2.3**: Video generation.
-   **Luma Dream Machine**: Video generation.
-   **Pixverse**: Video generation.

### AI Tools to Build (Previously via A2E)
-   **Face Swap**: InsightFace / Replicate
-   **Background Remove**: Remove.bg / Replicate
-   **Image Upscale**: Real-ESRGAN
-   **Lip Sync**: Wav2Lip / SadTalker
-   **Image Editor**: Fabric.js (frontend)
-   **Style Transfer**: Replicate models
-   **Inpainting/Outpainting**: DALL-E / Stable Diffusion

### AI Content Features (Submagic/ThumbMagic-inspired)
-   **Thumbnail Generator**: AI-generated YouTube/Reels thumbnails with CTR prediction
-   **Magic Clips**: Long video → 20+ viral short clips with virality scoring
-   **AI Caption Styles**: Named presets (Hormozi, MrBeast, etc.), word-by-word animation
-   **Virality Score**: Applied to all content before publishing (CTR, engagement, trend alignment)
-   **Text-Based Video Editing**: Edit video by editing transcript
-   **Auto B-Roll**: AI inserts relevant stock footage over talking segments
-   **AI Hooks**: Generates attention-grabbing opening titles
-   **Auto-Trim**: Removes silences and filler words

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

### Creatify UGC Integration (Studio Tier)
- **Feature**: Integrate Creatify API for UGC-style avatar videos
- **Tier**: Studio exclusive (or premium add-on)
- **Capabilities**: 1500+ UGC avatars, URL-to-Video, AI Scripts, TTS, AI Shorts
- **Pricing**: $99/mo (500 credits) or $299/mo (2000 credits) - platform cost
- **Implementation**:
  1. Add Creatify API service layer (~2 days)
  2. Avatar selection UI in Creator Studio (~2 days)
  3. Video preview and download integration (~1 day)
  4. Credit tracking for Studio users (~1 day)
- **Estimated effort**: ~1 week

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