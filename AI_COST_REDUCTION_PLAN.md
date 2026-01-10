# AI Cost Reduction Plan

## Overview

This document outlines strategies to reduce AI service costs while maintaining quality. Some changes have been implemented; others are planned for future implementation.

---

## Quota Increases (COMPLETED)

Thanks to cost savings from model optimization, we've increased quotas to drive signups:

### Premium (£29.99/mo)

| Feature | Old | New | Change |
|---------|-----|-----|--------|
| Social channels | 3 | **6** | +100% |
| Voiceovers | 25 min | **30 min** | +20% |
| A2E videos | 16 | **20** | +25% |
| DALL-E images | 150 | **180** | +20% |
| Lipsync | 120 | **150** | +25% |
| Avatars | 4 | **5** | +25% |
| Content comparisons | 3 | **Unlimited** | Unlimited |

### Pro (£49.99/mo)

| Feature | Old | New | Change |
|---------|-----|-----|--------|
| Social channels | 5 | **8** | +60% |
| Voiceovers | 60 min | **75 min** | +25% |
| A2E videos | 32 | **45** | +40% |
| DALL-E images | 400 | **500** | +25% |
| Lipsync | 300 | **400** | +33% |
| Avatars | 8 | **10** | +25% |
| Content comparisons | 5 | **Unlimited** | Unlimited |
| Team logins | 1 | **4** | +300% |

### Studio (£99.99/mo)

| Feature | Old | New | Change |
|---------|-----|-----|--------|
| Social channels | 9 | **10** | +11% |
| Voiceovers | 75 min | **90 min** | +20% |
| A2E videos | 48 | **60** | +25% |
| DALL-E images | 450 | **500** | +11% |
| Lipsync | 360 | **450** | +25% |
| Avatars | 12 | **15** | +25% |
| Brand briefs | 10 | **15** | +50% |
| Steve AI video | 100 min | **120 min** | +20% |
| Steve AI images | 800 | **1000** | +25% |
| Team logins | 5 | **6** | +20% |

**Estimated extra cost per user:** Premium +£2.00 | Pro +£3.50 | Studio +£8.00

**Margins remain healthy:** Premium 53% | Pro 44% | Studio 31%

---

## Phase 1: Model Optimization (COMPLETED)

### 1.1 OpenAI GPT-4o-mini for Text Generation

**Status:** ✅ Implemented

Switched routine text generation tasks from GPT-4o to GPT-4o-mini:

| Function | Purpose | New Model |
|----------|---------|-----------|
| `generateContent` | Scripts, captions, hashtags, CTAs | gpt-4o-mini |
| `generateContentIdeas` | Content idea generation | gpt-4o-mini |
| `generateReply` | Social media reply generation | gpt-4o-mini |
| `analyzePostForListening` | Sentiment/trend analysis | gpt-4o-mini |
| `analyzeBrandFromWebsite` | Brand brief extraction | gpt-4o-mini |

**Kept on GPT-4o (requires vision/complex analysis):**
- `analyzeViralContent` - Image analysis
- `extractAnalyticsFromScreenshot` - Screenshot OCR
- `compareContentToViral` - Content comparison with images

**Savings:** ~80% reduction in GPT costs (~£1.44/user/month saved)

---

### 1.2 ElevenLabs Turbo v2.5

**Status:** ✅ Implemented

Changed default model from `eleven_monolingual_v1` to `eleven_turbo_v2_5`.

- Same quality output
- 50% cheaper per character
- Supports 32 languages

**File changed:** `server/elevenlabs.ts`

**Savings:** 50% reduction in voiceover costs

---

## Phase 2: Component-Based Caching (PLANNED)

### 2.1 Database Schema Addition

Add a new table to store reusable AI-generated components:

```sql
CREATE TABLE brand_cached_assets (
  id SERIAL PRIMARY KEY,
  brand_brief_id INTEGER REFERENCES brand_briefs(id),
  user_id INTEGER REFERENCES users(id),
  asset_type VARCHAR(50) NOT NULL, -- intro_audio, outro_audio, intro_video, background_image, etc.
  source_service VARCHAR(50) NOT NULL, -- elevenlabs, a2e, dalle, steveai
  file_url TEXT NOT NULL,
  metadata JSONB, -- duration, dimensions, voice_id, avatar_id, style, etc.
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cached_assets_brand ON brand_cached_assets(brand_brief_id);
CREATE INDEX idx_cached_assets_type ON brand_cached_assets(asset_type);
```

---

### 2.2 DALL-E Image Caching

**Goal:** 60% reduction in image generation costs

**Implementation:**

1. **Background Library**
   - When generating carousel images, save background images to brand library
   - Store without text overlays
   - Apply text overlays client-side using Canvas API or server-side using Sharp

2. **User Experience**
   - Add "Brand Image Library" section in UI
   - Option to "Use existing background" during carousel generation
   - "Generate new backgrounds" costs credits; "Use library" is free

3. **Code Changes Required:**
   - Modify `generateCarouselImage()` to optionally save backgrounds
   - Add client-side text overlay component
   - Add API endpoints for brand asset CRUD

**Estimated Savings per User:**
| Tier | Current DALL-E Cost | With Caching | Savings |
|------|---------------------|--------------|---------|
| Premium | £2.88 | £1.15 | £1.73 |
| Pro | £9.60 | £3.84 | £5.76 |
| Studio | £14.40 | £5.76 | £8.64 |

---

### 2.3 ElevenLabs Audio Caching

**Goal:** 30% reduction in voiceover costs

**Implementation:**

1. **Intro/Outro Snippets**
   - Detect common phrases during first voiceover generation:
     - Intros: "Hey everyone", "Welcome back", "What's up"
     - Outros: "Follow for more", "Link in bio", "See you next time"
   - Save as separate 2-5 second audio clips

2. **Audio Stitching**
   - For subsequent voiceovers:
     - Generate only unique middle content
     - Stitch: `[cached intro]` + `[fresh content]` + `[cached outro]`
   - Use FFmpeg for server-side audio concatenation

3. **User Experience**
   - "Audio Snippets" library in settings
   - Auto-suggest cached intro/outro during generation
   - Option to record custom intros/outros once

**Estimated Savings per User:**
| Tier | Current ElevenLabs Cost | With Caching | Savings |
|------|-------------------------|--------------|---------|
| Premium | £2.37 | £1.66 | £0.71 |
| Pro | £7.11 | £4.98 | £2.13 |
| Studio | £11.85 | £8.30 | £3.55 |

---

### 2.4 A2E Video Caching

**Goal:** 30% reduction in A2E video costs

**Implementation:**

1. **Avatar Bookends**
   - First video: Generate separate intro clip (avatar greeting)
   - First video: Generate separate outro clip (avatar CTA)
   - Store as reusable components

2. **Video Assembly**
   - Future videos: Generate only main content
   - Stitch: `[cached intro]` + `[fresh main]` + `[cached outro]`
   - Use FFmpeg for video concatenation

3. **Non-Avatar Scenes**
   - Cache background scene videos (no text overlay)
   - Apply text overlays during final render
   - Reuse across multiple posts

**Estimated Savings per User:**
| Tier | Current A2E Cost | With Caching | Savings |
|------|------------------|--------------|---------|
| Premium | £6.00 | £4.20 | £1.80 |
| Pro | £12.00 | £8.40 | £3.60 |
| Studio | £24.00 | £16.80 | £7.20 |

---

### 2.5 Steve AI Template Caching

**Goal:** 20% reduction in Steve AI costs

**Implementation:**

1. **Branded Templates**
   - Generate 5-second branded intro with logo animation
   - Generate transition effect clips
   - Generate 5-second outro with CTA

2. **Template-Based Generation**
   - New videos use cached template elements
   - Only unique content scenes are generated fresh
   - Assemble: `[template intro]` + `[fresh scenes]` + `[template outro]`

**Estimated Savings per User (Studio only):**
| Current Cost | With Caching | Savings |
|--------------|--------------|---------|
| £32.25 | £25.80 | £6.45 |

---

### 2.6 Storage Requirements

| Asset Type | Size per User | Total for 1000 Users |
|------------|---------------|----------------------|
| 5 background images | ~5 MB | 5 GB |
| 10 audio clips | ~2 MB | 2 GB |
| 2-3 video intros/outros | ~20 MB | 20 GB |
| **Total** | ~27 MB/user | ~27 GB |

Storage cost is negligible compared to AI savings.

---

## Phase 3: Volume Discounts (FUTURE)

### 3.1 OpenAI Enterprise

**When:** Monthly spend exceeds $10K

**How to access:**
- Contact: https://openai.com/contact-sales
- Custom pricing negotiation
- Potential savings: 20-40%

### 3.2 A2E Bulk Credits

**When:** 50K+ credits monthly

**How to access:**
- Contact A2E sales for bulk package pricing
- Annual prepay commitment for additional discount
- Potential savings: 15-25%

### 3.3 Steve AI Enterprise

**When:** 10+ Studio tier users

**How to access:**
- Contact: team@steve.ai
- Enterprise tier with custom volume pricing
- Includes reselling rights and white-label options
- Potential savings: 20-30%

### 3.4 ElevenLabs Annual Plan

**Current:** Monthly billing

**Potential:** Annual commitment

**Savings:** ~25% discount on annual vs monthly

---

## Summary: Projected Margins After All Phases

### Current State (Phase 1 Complete)

| Tier | Price | Cost | Margin |
|------|-------|------|--------|
| Core | £9.99 | £0.36 | £9.63 (96%) |
| Premium | £29.99 | £16.19 | £13.80 (46%) |
| Pro | £49.99 | £36.02 | £13.97 (28%) |
| Studio | £99.99 | £86.44 | £13.55 (14%) |

### After Phase 2 (Component Caching)

| Tier | Price | Cost | Margin | Improvement |
|------|-------|------|--------|-------------|
| Core | £9.99 | £0.36 | £9.63 (96%) | - |
| Premium | £29.99 | £11.95 | £18.04 (60%) | +£4.24 |
| Pro | £49.99 | £24.53 | £25.46 (51%) | +£11.49 |
| Studio | £99.99 | £60.55 | £39.44 (39%) | +£25.89 |

### After Phase 3 (Volume Discounts at Scale)

Additional 15-25% savings possible on top of Phase 2.

---

## Implementation Checklist

### Phase 2 Tasks

- [ ] Add `brand_cached_assets` database table
- [ ] Create storage interface methods for cached assets
- [ ] Implement DALL-E background caching
  - [ ] Save backgrounds without text overlays
  - [ ] Add client-side text overlay component
  - [ ] Add "Brand Image Library" UI
- [ ] Implement ElevenLabs audio caching
  - [ ] Detect and save intro/outro phrases
  - [ ] Add FFmpeg audio stitching
  - [ ] Add "Audio Snippets" UI
- [ ] Implement A2E video caching
  - [ ] Generate/cache avatar bookends
  - [ ] Add FFmpeg video stitching
  - [ ] Add video component library UI
- [ ] Implement Steve AI template caching
  - [ ] Create branded intro/outro templates
  - [ ] Template-based video assembly
- [ ] Add usage analytics for cached assets
- [ ] Add "Savings Dashboard" showing reuse stats

---

## Notes

- Phase 1 already saves ~£1.44/user/month (GPT) + 50% on voiceovers
- Phase 2 is the highest ROI - implement when credits allow
- Phase 3 becomes relevant at 100+ paying users
- Monitor quality closely after caching implementation
- Consider A/B testing cached vs fresh content engagement

---

## Outstanding Work (PENDING - When Credits Available)

### Social Platform API Keys Needed

| Platform | Secrets Required | Status |
|----------|------------------|--------|
| Twitter/X | `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET` | ❌ Not configured |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | ❌ Not configured |
| Facebook | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | ❌ Not configured |
| Instagram | Uses Facebook credentials above | ❌ Not configured |
| Threads | Uses Facebook credentials above | ❌ Not configured |
| Reddit | `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` | ❌ Not configured |

**Note:** OAuth flows and posting code are 100% implemented for all platforms. Just need API keys.

---

### TikTok App Verification

**Status:** OAuth keys configured, but TikTok app may need verification

**Action Required:**
- Check TikTok Developer Console for app status
- May need to create new app or complete verification
- Current keys: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` are set

---

### Background Job Runner for Auto-Scheduling

**Status:** Not implemented

**Current State:**
- YouTube auto-publishing works (via YouTube API scheduling)
- Other platforms are manual tracking only
- Users see scheduled posts but must post manually

**Implementation Required:**
- Add cron job or background worker (node-cron, BullMQ, or similar)
- Query `scheduled_posts` table for posts due within next 5 minutes
- Call platform posting functions with stored credentials
- Update post status after publishing

**Platforms needing auto-publish:**
- TikTok
- Instagram
- Facebook
- Twitter/X
- LinkedIn
- Threads
- Bluesky
- Pinterest
- Reddit

---

### Platform Analytics APIs

**Status:** Manual (screenshot-based) except YouTube

| Platform | Current Method | Ideal Method |
|----------|---------------|--------------|
| YouTube | ✅ Direct API | Already working |
| TikTok | Screenshot upload | TikTok Analytics API |
| Instagram | Screenshot upload | Instagram Insights API |
| Facebook | Screenshot upload | Graph API Insights |
| Twitter/X | Screenshot upload | Twitter Analytics API |
| LinkedIn | Screenshot upload | LinkedIn Analytics API |

**Note:** Screenshot OCR works well as interim solution. Direct API integrations can be added later for real-time data.

---

### Studio Package API Keys

| Service | Secret Required | Purpose |
|---------|-----------------|---------|
| Steve AI | `STEVEAI_API_KEY` | Long-form video, URL-to-video, voice-to-video |
| Getty Images | `GETTY_API_KEY` | Premium stock footage (optional) |

---

### LSP Errors to Fix

**File:** `server/openai.ts` has 10 diagnostics

**Action:** Fix TypeScript errors when next working on this file

---

### Creatify UGC Integration (Studio Tier)

**Status:** Not implemented
**Tier:** Studio exclusive (or premium add-on)
**Pricing:** $99/mo (500 credits) or $299/mo (2000 credits) - platform cost
**Effort:** ~1 week

#### Capabilities
- 1500+ UGC-style avatars with lip-sync
- URL-to-Video (paste product page → get video ad)
- AI Scripts generation
- Text-to-Speech
- AI Shorts (TikTok/Reels optimized)
- Custom templates

#### Credit Costs
| Feature | Credits |
|---------|---------|
| AI Avatar | 5 per 30 sec |
| URL-to-Video | 5 per 30 sec |
| AI Scripts | 1 |
| TTS | 1 per 30 sec |
| AI Shorts | 5 per 30 sec |

#### Implementation
- [ ] Add Creatify API service layer (`server/creatify.ts`)
- [ ] Avatar selection UI in Creator Studio
- [ ] Video preview and download integration
- [ ] Credit tracking for Studio users

**API Docs:** https://docs.creatify.ai/

---

### HeyGen UGC Integration (Studio Tier)

**Status:** Not implemented (tested - quality great)
**Tier:** Studio exclusive (or premium add-on)
**Pricing:** $25/mo (200 credits) - confirmed by owner testing
**Effort:** ~1 week

#### Capabilities
- 1100+ avatars (professional and UGC styles)
- Video Translation API (175+ languages with lip-sync)
- Interactive Avatar (live streaming)
- Photo-to-Avatar (custom avatar creation)
- ElevenLabs voice clone import (native integration)

#### Credit Costs
| Feature | Credits |
|---------|---------|
| Avatar video | 1 per minute |
| Interactive Avatar | 5 min streaming per credit |
| Video Translation | 1 per 20 sec |

#### Why HeyGen (vs Creatify)
- Better credit value at scale ($0.50/credit on Scale plan)
- Video translation for global/multilingual content
- Native ElevenLabs integration
- Higher quality avatars (tested)

#### Implementation
- [ ] Add HeyGen API service layer (`server/heygen.ts`)
- [ ] Avatar selection UI in Creator Studio
- [ ] Video translation option for existing content
- [ ] Credit tracking for Studio users

**API Docs:** https://docs.heygen.com/

---

### Trending Topics Enhancement (Google Trends + Reddit)

**Status:** Not implemented
**Cost:** Free (no API keys required for Google, Reddit free tier)
**Effort:** ~8 hours total

#### 1. Google Trends Integration

**Package:** `google-trends-api` (npm install)

**Implementation:**
```typescript
// server/googleTrends.ts
import googleTrends from 'google-trends-api';

export async function getTrendingSearches(geo: string = 'GB') {
  const results = await googleTrends.dailyTrends({ geo });
  return JSON.parse(results);
}

export async function getRelatedQueries(keyword: string) {
  const results = await googleTrends.relatedQueries({ keyword });
  return JSON.parse(results);
}

export async function getInterestOverTime(keywords: string[]) {
  const results = await googleTrends.interestOverTime({ keyword: keywords });
  return JSON.parse(results);
}
```

**Features to add:**
- [ ] Daily trending searches by country
- [ ] Related queries for brand keywords
- [ ] Interest over time charts
- [ ] "Rising" trends detection
- [ ] Compare brand vs competitors

**API Endpoints:**
- `GET /api/trends/daily?geo=GB` - Today's trending searches
- `GET /api/trends/related?keyword=fitness` - Related queries
- `GET /api/trends/interest?keywords=yoga,pilates` - Interest comparison

---

#### 2. Reddit Hot Posts Integration

**Requirements:** `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` (free tier)

**Implementation:**
```typescript
// server/redditTrends.ts
const REDDIT_BASE = 'https://oauth.reddit.com';

export async function getHotPosts(subreddit: string, limit: number = 25) {
  const token = await getRedditToken();
  const response = await fetch(
    `${REDDIT_BASE}/r/${subreddit}/hot?limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.json();
}

export async function getRisingPosts(subreddit: string) {
  const token = await getRedditToken();
  const response = await fetch(
    `${REDDIT_BASE}/r/${subreddit}/rising`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.json();
}

export async function searchSubreddits(query: string) {
  const token = await getRedditToken();
  const response = await fetch(
    `${REDDIT_BASE}/subreddits/search?q=${query}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.json();
}
```

**Features to add:**
- [ ] Configure subreddits per brand brief
- [ ] Hot posts from relevant subreddits
- [ ] Rising posts (early trend detection)
- [ ] Comment velocity tracking
- [ ] AI summary of trending discussions

**API Endpoints:**
- `GET /api/trends/reddit/hot?subreddit=socialmedia` - Hot posts
- `GET /api/trends/reddit/rising?subreddit=marketing` - Rising posts
- `POST /api/brand-briefs/:id/subreddits` - Save relevant subreddits

---

#### 3. Database Schema Addition

```sql
CREATE TABLE trending_topics (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id),
  brief_id VARCHAR REFERENCES brand_briefs(id),
  source VARCHAR(50) NOT NULL, -- 'google', 'reddit', 'tiktok'
  topic TEXT NOT NULL,
  description TEXT,
  volume INTEGER, -- search volume or upvotes
  trend_direction VARCHAR(20), -- 'rising', 'stable', 'falling'
  related_keywords TEXT[],
  source_url TEXT,
  discovered_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE brand_subreddits (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id VARCHAR REFERENCES brand_briefs(id),
  subreddit_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

#### 4. Trends Dashboard UI

**Location:** `client/src/pages/Trends.tsx`

**Components:**
- [ ] Daily trending searches (Google)
- [ ] Hot posts from configured subreddits
- [ ] Interest over time chart (Recharts)
- [ ] "Suggested content ideas" based on trends
- [ ] One-click "Generate content about this trend"

---

#### Implementation Checklist

- [ ] Install `google-trends-api` package
- [ ] Create `server/googleTrends.ts` service
- [ ] Create `server/redditTrends.ts` service
- [ ] Add `trending_topics` and `brand_subreddits` tables
- [ ] Add storage interface methods
- [ ] Create API routes in `server/routes.ts`
- [ ] Build Trends Dashboard page
- [ ] Add subreddit configuration to Brand Brief settings
- [ ] Add "Generate content from trend" button
- [ ] Schedule daily trend refresh (optional cron)

---

### Reels Generator with Google Drive Video Library

**Status:** Not implemented
**Cost:** Free (uses existing Google OAuth)
**Effort:** ~4-6 hours

#### Overview

Add 4th content format option: "Reels" (5-10 second videos) that leverages user's 5000+ video clips stored on Google Drive.

#### Folder Structure (User's Drive)

```
01-FA...IDEOS/
02-Boss...Videos/
03-300+ Luxury Clipss/
04-Travel Videos/
05-Ama...Videos/
06-Dark...Videos/
07-Luxury women/
08-Melanin Videos/
```

#### Implementation

**1. Google Drive Integration**
```typescript
// server/googleDrive.ts
import { google } from 'googleapis';

export async function listDriveFolders(accessToken: string) {
  const drive = google.drive({ version: 'v3', auth: oauthClient });
  return drive.files.list({
    q: "mimeType='application/vnd.google-apps.folder'",
    fields: 'files(id, name)'
  });
}

export async function listVideoClips(accessToken: string, folderId: string) {
  const drive = google.drive({ version: 'v3', auth: oauthClient });
  return drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'video/'`,
    fields: 'files(id, name, thumbnailLink, webContentLink)'
  });
}

export async function downloadClip(accessToken: string, fileId: string) {
  // Download to cloud storage for processing
}
```

**2. Database Schema**
```sql
CREATE TABLE video_clip_library (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id),
  drive_file_id VARCHAR NOT NULL,
  drive_folder_id VARCHAR,
  filename VARCHAR(255),
  thumbnail_url TEXT,
  category VARCHAR(100), -- Luxury, Travel, Boss, etc.
  tags TEXT[],
  duration_seconds INTEGER,
  synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clips_user ON video_clip_library(user_id);
CREATE INDEX idx_clips_category ON video_clip_library(category);
```

**3. Reels Generation Flow**
1. User selects "Reels" format in Brand Briefs
2. AI generates script, caption, hashtags (as normal)
3. UI shows "Select B-roll" with clips from user's Drive library
4. AI can suggest clips based on script keywords + category matching
5. System downloads selected clip, overlays text captions
6. Outputs 5-10 second reel ready to post

**4. Text Overlay Processing**
- Use FFmpeg for video processing
- Add text overlays with animated captions
- Support multiple text styles (handwritten, bold, minimal)
- Preserve original video audio or mute for voiceover

**5. API Endpoints**
- `GET /api/drive/folders` - List user's video folders
- `GET /api/drive/clips?folderId=xxx` - List clips in folder
- `POST /api/drive/sync` - Sync clips metadata to database
- `POST /api/reels/generate` - Generate reel with overlay
- `GET /api/clips/suggest?keywords=luxury,travel` - AI clip suggestions

**6. UI Components**
- [ ] "Reels" format option in Brand Briefs (4th box)
- [ ] Google Drive folder browser
- [ ] Clip preview grid with thumbnails
- [ ] Text overlay editor with style options
- [ ] Preview before finalizing

#### Implementation Checklist

- [ ] Add Google Drive API scopes to OAuth flow
- [ ] Create `server/googleDrive.ts` service
- [ ] Add `video_clip_library` table
- [ ] Create sync endpoint to import clip metadata
- [ ] Install FFmpeg for video processing
- [ ] Build text overlay service with FFmpeg
- [ ] Add "Reels" format option to Brand Briefs UI
- [ ] Create clip browser/selector component
- [ ] Add AI clip suggestion based on script content
- [ ] Test end-to-end reel generation

---

### OpenAI Batch API Integration (50% Cost Savings)

**Status:** Not implemented
**Cost:** Free (uses existing OpenAI API key)
**Effort:** ~3-4 hours
**Savings:** 50% on all batch-eligible GPT calls

#### Overview

OpenAI Batch API offers 50% discount for non-urgent processing (results within 24 hours). We can use this for any AI task that doesn't need instant results.

#### 🔒 Hard Boundary (NEVER use Batch API for)

- Live typing responses
- On-screen "Generate now" actions  
- Anything the user explicitly triggers and expects instantly

Batch API is ONLY for background pre-generation that users don't see happening.

#### Batch-Eligible Tasks

| Task | Current Method | Batch Method | User Experience |
|------|----------------|--------------|-----------------|
| Content ideas (30 per brief) | On-demand | Queue when brief created | Ideas ready next login |
| Hashtag libraries (100 per niche) | On-demand | Weekly batch refresh | Instant suggestions from cache |
| Hook variations (10 per post) | On-demand | Queue after content saved | "Alternative hooks" ready next session |
| Caption rewrites (per platform) | On-demand | Queue after approval | Platform versions ready by morning |
| Trend analysis | On-demand | Nightly batch | "Today's trending ideas" pre-loaded |

#### Implementation

**1. Batch Queue System**
```typescript
// server/batchQueue.ts
interface BatchJob {
  id: string;
  userId: string;
  jobType: 'content_ideas' | 'hashtags' | 'hooks' | 'captions' | 'trends';
  input: any;
  status: 'pending' | 'submitted' | 'completed' | 'failed';
  result?: any;
  createdAt: Date;
  completedAt?: Date;
}

export async function queueBatchJob(job: Omit<BatchJob, 'id' | 'status' | 'createdAt'>) {
  // Save to database
  // Submit to OpenAI Batch API
  // Poll for completion
  // Store results
}
```

**2. Database Schema**
```sql
CREATE TABLE batch_jobs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id),
  job_type VARCHAR(50) NOT NULL,
  input JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  result JSONB,
  openai_batch_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE cached_content (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id),
  brief_id VARCHAR REFERENCES brand_briefs(id),
  content_type VARCHAR(50), -- ideas, hashtags, hooks, captions
  content JSONB NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

**3. Background Worker**
- Cron job runs every hour
- Submits pending batch jobs to OpenAI
- Polls for completed batches
- Stores results in cached_content table

**4. API Flow Changes**
```
Before: User clicks "Generate Ideas" → Wait 3s → Show results
After:  User creates brief → Batch queued → Next login → Ideas pre-loaded (instant)
```

#### Cost Savings Example

| Monthly Volume | Normal Cost | With Batch (50%) | Savings |
|----------------|-------------|------------------|---------|
| 10,000 GPT calls | £100 | £50 | £50 |
| 50,000 GPT calls | £500 | £250 | £250 |
| 100,000 GPT calls | £1,000 | £500 | £500 |

#### Implementation Checklist

- [ ] Create `batch_jobs` and `cached_content` tables
- [ ] Build batch queue service (`server/batchQueue.ts`)
- [ ] Integrate OpenAI Batch API submission
- [ ] Add polling/webhook for batch completion
- [ ] Modify content ideas to check cache first
- [ ] Modify hashtag generation to use cached library
- [ ] Add background worker (node-cron)
- [ ] Add "pre-generate" trigger when brand brief is created/updated
- [ ] Add cache expiry and refresh logic

---

### Pre-Made Reels Template Library

**Status:** Not implemented
**Cost:** £0 per use (templates created in advance)
**Effort:** User prep time + ~2 hours dev work

#### Overview

Pre-create template reels for top 20 niches using Canva. Users get instant reels by selecting templates - only text overlay customization needed (free FFmpeg processing).

#### Niche Coverage (20 niches × 10 hooks × 4 variations = 800 templates)

| Niche | Example Hooks |
|-------|---------------|
| Fitness | "3 mistakes", "morning routine", "what I eat" |
| Beauty | "skincare secrets", "makeup hacks", "glow up" |
| Wealth/Finance | "money mistakes", "passive income", "investing tips" |
| Real Estate | "staging secrets", "buyer mistakes", "market update" |
| Travel | "packing hacks", "hidden gems", "budget tips" |
| Food/Restaurant | "recipe reveal", "kitchen hacks", "taste test" |
| Fashion | "outfit ideas", "style tips", "capsule wardrobe" |
| Tech | "app review", "productivity hack", "gadget unboxing" |
| Coaching | "mindset shift", "client wins", "tough love" |
| E-commerce | "product reveal", "behind the scenes", "packing orders" |
| Health/Wellness | "self-care routine", "mental health tip", "daily habits" |
| Parenting | "mom hack", "toddler tip", "real talk" |
| Pets | "training tip", "day in the life", "product review" |
| Education | "study hack", "learn this", "quick lesson" |
| Music | "practice routine", "gear review", "cover song" |
| Art/Design | "process video", "tool review", "before after" |
| Photography | "editing tip", "gear talk", "location scout" |
| Gaming | "game tip", "setup tour", "hot take" |
| Spirituality | "daily practice", "sign meaning", "meditation" |
| Home/DIY | "room makeover", "budget hack", "tool tip" |

#### File Naming Convention

```
{niche}-{hook-type}-v{1-4}.mp4

Examples:
wealth-money-mistakes-v1.mp4  (dark/moody)
wealth-money-mistakes-v2.mp4  (bright/clean)
wealth-money-mistakes-v3.mp4  (luxury gold)
wealth-money-mistakes-v4.mp4  (minimalist)
```

#### How It Works

1. User selects "Reels" format
2. AI detects brand niche from brief
3. Shows matching template variations
4. User picks one
5. FFmpeg overlays custom text (user's hook/CTA)
6. Done - no AI video generation credits used

#### Cost Comparison

| Method | Cost per Reel |
|--------|---------------|
| A2E video generation | ~£0.30-0.50 |
| Pre-made template + text overlay | **£0.00** |

#### User Prep (You)

- [ ] Create template reels in Canva for 20 niches
- [ ] 10 hook types per niche
- [ ] 4 style variations each
- [ ] Save to Google Drive with naming convention
- [ ] Mark folder as "Templates" vs "B-roll"

#### Dev Implementation

- [ ] Add "template" flag to video_clip_library table
- [ ] Filter template clips by user's brand niche
- [ ] Show variation picker in UI
- [ ] Apply text overlay with FFmpeg
- [ ] Track which templates used to avoid repetition

---

### Visual Editor Upgrade (TikTok-Style)

**Status:** Not implemented
**Cost:** Development time only
**Effort:** ~2-3 weeks

#### Overview

Transform the current Editor from basic snip/text functionality to a full TikTok-style visual editor with timeline, layers, and drag-and-drop editing.

#### Core Features

| Feature | Current State | Target State |
|---------|---------------|--------------|
| Timeline | ❌ None | ✅ Visual timeline with scrubber |
| Layers | ❌ None | ✅ Video, text, stickers, audio layers |
| Text boxes | Basic overlay | Animated text with timing |
| Effects | ❌ None | ✅ Transitions, filters, speed control |
| Preview | Static | ✅ Real-time playback |
| Trimming | Basic snip | ✅ Visual trim with handles |

#### UI Components Needed

1. **Timeline Component**
   - Horizontal scrollable track
   - Zoom in/out controls
   - Playhead scrubber
   - Layer rows (video, audio, text, stickers)

2. **Layer System**
   - Drag to reorder
   - Lock/unlock layers
   - Visibility toggle
   - Opacity control

3. **Text Editor**
   - Font selection (10+ fonts)
   - Text animations (fade, slide, typewriter, bounce)
   - Timing controls (start/end time)
   - Position/rotation handles
   - Color + shadow options

4. **Effects Panel**
   - Transitions (cut, fade, slide, zoom)
   - Speed control (0.5x, 1x, 1.5x, 2x)
   - Filters (vintage, B&W, vibrant, etc.)
   - Audio fade in/out

5. **Sticker/Emoji Library**
   - Trending stickers
   - Emoji picker
   - GIF integration (optional)

#### Tech Stack Options

| Library | Pros | Cons |
|---------|------|------|
| Fabric.js | Canvas-based, layer support | Learning curve |
| Remotion | React-native, composable | Heavy bundle |
| ffmpeg.wasm | Browser-side processing | Performance limits |
| Custom + FFmpeg server | Full control | More dev work |

#### Implementation Phases

**Phase 1: Timeline + Text (1 week)**
- [ ] Timeline component with playhead
- [ ] Text layer with timing
- [ ] Basic text animations
- [ ] Real-time preview

**Phase 2: Effects + Transitions (1 week)**
- [ ] Transition library
- [ ] Speed control
- [ ] Filter presets
- [ ] Audio fade controls

**Phase 3: Polish + UX (1 week)**
- [ ] Sticker library
- [ ] Keyboard shortcuts
- [ ] Undo/redo
- [ ] Mobile-responsive layout
- [ ] Export quality options

#### Estimated Tier Impact

- Editor unlock stays at Core+ (no change)
- Visual editor differentiates from free download-only workflow
- Competes with CapCut, InShot, TikTok native editor

---

### Optional Enhancements

- [ ] Anthropic/Claude as alternative to OpenAI (requires `ANTHROPIC_API_KEY`)
- [ ] Real-time notifications for mentions
- [ ] Webhook integrations for external tools
- [ ] White-label option for agencies
- [ ] API access for developers
- [ ] TikTok Creative Center scraping (uses existing Apify)

---

## Quick Reference: What Works Now

| Category | Working | Needs Setup |
|----------|---------|-------------|
| Authentication | Email + Google OAuth | - |
| Payments | Stripe (all 5 tiers) | - |
| AI Text | GPT-4o-mini (scripts, captions, etc.) | - |
| AI Images | DALL-E 3 | - |
| AI Voice | ElevenLabs Turbo v2.5 | - |
| AI Video | A2E (avatars, lipsync, scenes) | Steve AI (Studio) |
| Social Posting | YouTube, Pinterest, Bluesky | 6 platforms need keys |
| Scheduling | YouTube auto-publish | Other platforms need cron |
| Analytics | YouTube direct API | Others via screenshot |
| Social Listening | Apify (Reddit, Instagram, TikTok, YouTube) | - |
| Brand Management | Briefs, assets, website analysis | - |
| Content Queue | Full approve/reject/edit flow | - |
