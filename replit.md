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

### Carousel Optimization (Instagram 2025/2026)
**Content Strategy (NEW vs OLD):**
| OLD (Avoid) | NEW (Use) |
|-------------|-----------|
| Generic tips | Specific, personal tips you can't find on Google |
| How To's | How I's - Share personal experiences |
| Clean & professional Canva designs | Handwritten fonts, scrapbook elements, "cosy design" |
| Static carousels | Videos or animated elements in some slides |
| Didn't reach non-followers | Great for reaching non-followers now |

**Structure Rules:**
1. **Prefer vertical carousels**: Use 4:5 or 3:4 ratios to maximize screen space and feed visibility
2. **Slide 1 = Hook**: 6-8 words max, speak audience's language, signal value/tension/curiosity
3. **Slide 2 is critical for reach**: Instagram may resurface posts using slide 2. Reinforce hook, add context, push curiosity
4. **One idea per carousel**: Maintain clear narrative: hook → explanation → insight → CTA
5. **Flow > volume**: Each slide should naturally lead to the next
6. **End with clear CTA**: Prompt comments, keywords, or actions. "Link in bio" is fine
7. **Add motion**: Include video or animated elements in at least some slides
8. **Platform signals**: Add music (instrumental) for Reels distribution. Use location tags for local reach

### AI Generation Behavior
- Optimize for swipe depth, not just slide 1
- Generate hooks first, then build content around them
- Enforce structural discipline (one idea, clear flow)
- Auto-suggest CTAs aligned to post intent
- Recommend visuals and music as part of post readiness, not optional extras

### Instagram Reels Optimization (2025/2026)
**Content Strategy (NEW vs OLD):**
| OLD (Avoid) | NEW (Use) |
|-------------|-----------|
| B-roll with low-effort, vague advice | B-roll with step-by-step tips on top |
| Lip syncs, dancing, quotes | Talk-to-camera reels & storytelling |
| Over-reliance on trending content | Evergreen content with timeless value |
| Focus on saves and shares | Focus on shares, likes, and watch time |
| Written hook only | Written hook + sound hook + visual hook |

**Key Rules:**
1. **Multi-sensory hooks**: Combine written text, sound/voice hook, and visual hook together
2. **Talk-to-camera wins**: Authentic storytelling outperforms trend-chasing
3. **Evergreen > trending**: Timeless value content has longer shelf life
4. **Step-by-step overlays**: Add actionable tips on top of B-roll footage
5. **Watch time priority**: Algorithm now weights shares + likes + watch time equally

### Instagram Stories Optimization (2025/2026)
**Content Strategy (NEW vs OLD):**
| OLD (Avoid) | NEW (Use) |
|-------------|-----------|
| 10+ stories daily | 1-3 stories mostly (quality over quantity) |
| Post stories throughout the day | Post them all at once |
| Focus on polls and stickers to boost views | Focus on story replies |
| Share your posts on your story | Turn the main points of the post into their own story |
| Manual story posting every day | Batch + schedule some stories in advance |

**Key Rules:**
1. **Less is more**: 1-3 quality stories beats 10+ low-effort ones
2. **Batch posting**: Post all stories at once rather than throughout the day
3. **Replies > stickers**: Story replies are the key engagement metric now
4. **Expand posts, don't just share**: Turn post points into standalone story content
5. **Schedule ahead**: Batch create and schedule stories in advance

### Instagram Overall Strategy (2025/2026)
**Content Strategy (NEW vs OLD):**
| OLD (Avoid) | NEW (Use) |
|-------------|-----------|
| 30 hashtags | 3 hashtags maximum |
| Hashtags helped your reach | Hashtags help SEO |
| Posts have short shelf life | Posts have longer shelf life & appear in search results |
| Repost button for your own content | Repost for others' content, Remix for your own |
| Perfect brand aesthetic | Relatable and real > polished perfection |

**Key Rules:**
1. **3 hashtags max**: Quality over quantity, hashtags now serve SEO not reach
2. **SEO matters**: Posts can appear in Google/search engine results now
3. **Longer content lifespan**: Posts stay discoverable longer than before
4. **Be relatable**: People prefer businesses that feel real over perfectly polished
5. **Remix your content**: Use Remix button to reshare your own content, not Repost

### Instagram Post Optimization (Single Images & Stories)
1. **Ask, don't tell**: Questions, polls, and choices drive engagement - interaction is the goal
2. **Low-friction prompts**: Binary choices ("this or that"), simple opinion asks, one-word reply triggers
3. **Audience validation**: Ask about struggles/preferences - make users feel seen, let them talk about themselves
4. **Conversation framing > expertise framing**: Casual language, write like a DM not a broadcast
5. **Soft CTAs for stories**: Reply-based CTAs outperform "click now" - frame offers as optional help
6. **Social proof prompts**: "Drop your IG below", "Anyone else watching...?" for community engagement
7. **Research value**: Use posts to surface audience pain points for future content

### CTA & Follow Optimization
1. **Soft CTAs > direct asks**: Reframe follows as belonging/alignment, not sales
2. **Identity-based language**: "This is for people like you" > "Everyone follow me"
3. **Confidence > persuasion**: Declarative statements, "I'm not for everyone" increases value
4. **Emotional resonance > instruction**: Reference clarity, relief, feeling "seen" - follow becomes natural
5. **Curiosity creates commitment**: "Stay close", "What's next" - hint at future value
6. **Subtle exclusion increases conversion**: "Maybe that's why you're here" filters audience
7. **Tone matters**: Calm, assured, conversational - NO urgency spam or algorithm begging

### Carousel Format Strategy (Match Format to Goal)
| Format | Goal | Examples |
|--------|------|----------|
| **Educational** | Trust, saves, long-term growth | Tutorials, checklists, top tools, beginner mistakes, myth-busting |
| **Relatable** | Engagement, resonance, comments | Before vs after, "if you know you know", unpopular opinions |
| **Storytelling** | Depth, loyalty, bonding | Struggle→success, behind-the-scenes, "the day everything changed" |
| **Credible** | Conversion, authority, offers | Case studies, real results, what I'd do starting over, testimonials |
| **Saveable** | Algorithm signals, shares | Infographics, do's & don'ts, cheat sheets, top resources |

**Strategy**: Rotate educational + relatable + credible weekly. Optimize for saves/shares/clarity, not volume.

### Platform-Specific Algorithm Rules

**Instagram (Feed/Reels/Stories)**:
- Early saves > early likes
- Replays > completion rate
- Comment depth > comment count
- Profile taps = quality signal
- Carousel dwell time weighting

**TikTok**:
- Watch time > everything
- Rewatch loops = primary boost
- Shares > likes for scale
- Comment velocity in first 30-60 mins
- Sound + format relevance scoring

**YouTube (Shorts & Long-form)**:
- First 5 seconds = retention cliff
- Average View Duration (AVD) priority
- Session continuation signal
- Suggested feed dependency
- Title–thumbnail alignment penalty

**Facebook**:
- Meaningful interactions > reactions
- Shares to groups > personal shares
- Comment replies (thread depth)
- Native content preference
- External link suppression logic

### Platform-Specific Hook Styles

**TikTok**: POV hooks, "Watch till the end" disguised, pattern-break openers, whisper hooks, visual chaos
**YouTube**: Curiosity gap, outcome-first, time-bound promises, authority-anchored, comparison (X vs Y)
**Facebook**: Nostalgia, opinionated long-sentence, community-based, question-led story, authority positioning

### Content Length Optimization

| Platform | Short | Medium | Long |
|----------|-------|--------|------|
| TikTok | 7-12s (micro-viral) | 20-35s (explainers) | 45-60s (authority) |
| YT Shorts | 15-25s (discovery) | 30-45s (retention) | 50-59s (monetization) |
| Facebook | Sub-30s (autoplay) | 45-90s (story) | Long captions + short videos |

### YouTube Title & Thumbnail System
- Title curiosity gap (leave something unsaid)
- Thumbnail emotional triggers (faces with emotion)
- Face vs object logic (faces for personality, objects for tutorials)
- Text-on-thumbnail: 3-4 words max
- Title–thumbnail: complement, don't repeat

### Comment & Community Engineering
- Comment VALUE over bait
- Pinned comment strategy
- Reply-to-comment content loops
- Question chaining tactics
- Community language mirroring

### Saves & Share Engineering
- Save-first content design (utility gets saved)
- Share-to-DM triggers ("Send this to someone who...")
- Group-share hooks (Facebook)
- "You'll need this later" framing
- Utility > entertainment rule