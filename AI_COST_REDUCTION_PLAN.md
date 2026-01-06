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

### Optional Enhancements

- [ ] Trending topics - more data sources beyond Apify
- [ ] Anthropic/Claude as alternative to OpenAI (requires `ANTHROPIC_API_KEY`)
- [ ] Real-time notifications for mentions
- [ ] Webhook integrations for external tools
- [ ] White-label option for agencies
- [ ] API access for developers

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
