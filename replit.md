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

## AI Content Knowledge Base

### Instagram Content Ideas by Format

**Single Posts:**
- Checklists, Memes, Quotes, Routines, Personal Milestones
- Wallpapers, Work Samples, Photos of your team, Infographics
- Moodboard, Promotion, Recipes

**Reels:**
- Tutorials, Behind the Scenes, Before and After, Trends
- Talking Head Style, Acting Skit, Product Reviews
- Q&A Response, Day in the Life

**Carousels:**
- Tutorials, Photodump, Toolkit, Case Studies
- How to Guides, Blueprints, Strategy Guides
- Product Showcase, Fashion Lookbook, Collab Post

**Stories:**
- Q&As, Polls, Ask Me Anything, Behind the Scenes
- Customer Reviews, Link Stickers, Countdown
- Product Launch, UGC (User Generated Content)

### Viral Hook Templates (All Platforms)

**Curiosity & Intrigue:**
- "Everyone is asking me about..."
- "You're never gonna believe this"
- "I can't believe what just happened"
- "I just discovered the secret to..."
- "Here's a secret no one is talking about..."

**Mistakes & Lessons:**
- "I never knew I was doing (this wrong)"
- "My biggest mistake ever was..."
- "Stop doing (this) if you want (that)"
- "The best piece of advice I've had is..."

**Urgency & Value:**
- "This is the fastest way to..."
- "5 ways to crush your (thing)"
- "I wish I knew this 10 years ago"
- "Pay attention, this is important..."
- "Mind blowing hack to..."

**POV & Relatability:**
- "POV: When you realise..."
- "Watch till the end for (this bonus)"
- "Honestly, I am shocked"
- "Unpopular opinion: I hate..."

### Content Hooks That Convert

**Engagement Starters:**
- "Wait... are you seeing what I'm seeing?"
- "Imagine where you'd be if you knew this a year ago"
- "Bet you've been doing ____ wrong this whole time"
- "I'm probably going to get a lot of comments for this but..."
- "The reason why __ isn't working for you"

**Story-Based Hooks:**
- "POV: You're scrolling, and you accidentally stumble on the answer to ___"
- "I took __ seriously, and this happened"
- "This blew my mind – and now it's your turn"
- "The day I stopped following the rules, everything shifted"

**Challenge Hooks:**
- "Be honest: Are you team A or team B?"
- "The best-kept secret in [industry] that you need to know"
- "Why everyone is talking about __"
- "The most shocking way to [get a benefit]"
- "Think fast: What's the first thing that comes to mind?"

### Negative Hooks (High Reach)

**Problem-Focused:**
1. "Most people fail at [goal] because of this one thing"
2. "You've been lied to about [strategy or trend]"
3. "The dark side of [popular platform or tool] no one talks about"
4. "[Thing everyone's doing] isn't working anymore"
5. "Why [niche or industry] experts don't want you to know this"

**Calling Out Mistakes:**
6. "You're following [common path] straight into burnout"
7. "You're building the wrong audience with [specific tactic]"
8. "Think you're doing everything right? Think again"
9. "[Goal] isn't your problem—[habit] is"
10. "You're overcomplicating [simple but essential task]"

**Truth Bombs:**
11. "Your [platform] strategy is working... against you"
12. "[Trusted source] was wrong about this"
13. "If you keep doing [mistake], you'll stay stuck forever"
14. "You're doing too much of [action] and not enough of [better action]"
15. "The truth about [easy tactic everyone promotes]"

**Harsh Realities:**
16. "The harsh truth about [why people unfollow or ignore]"
17. "[Thing you thought was a strength] is actually a weakness"
18. "[Common framework] is outdated—and here's what works instead"
19. "People scroll past because of [mistake] you didn't notice"
20. "Your audience doesn't trust you because of [invisible mistake]"

### 30 Strategies for Relatable Content

**Personal & Authentic:**
1. Share a personal mistake or failure
2. Tell a story about your failures
3. Use casual, everyday language
4. Share mini "behind-the-scenes"
5. Talk about common fears + doubts
6. Show your beginner phase
7. Tell stories in real time
8. Use a 5th grade reading level
9. Use humor
10. Show vulnerability

**Connection Building:**
11. Talk about unpopular opinions
12. Share small, everyday wins
13. Let people see your quirks
14. Express genuine gratitude
15. Tell stories that show real emotions, not just highlight reels
16. Write like you're texting a friend
17. Use memes, gifs, or pop culture
18. Ask open-ended questions

**Content Style:**
19. Start captions with "real talk..."
20. Avoid buzzwords
21. Avoid heavy industry jargon
22. Keep sentences short and punchy
23. Add playful or casual phrasing
24. Share experiences
25. Talk about the "messy stuff"
26. Share things no one talks about
27. Use captions as a second "hook"
28. Talk about well known experiences
29. Use "you" language instead of "I"
30. Most relatable subjects: money, relationships, and food

---

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