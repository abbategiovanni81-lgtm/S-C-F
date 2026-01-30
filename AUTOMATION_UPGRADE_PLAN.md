# SocialCommand Automation Upgrade Plan

## Vision: The "Saturday Morning" Content Factory

Compress a week's content work into 2-3 hours across multiple brands. Log on Saturday, plan and batch generate for 10 brands, come back Sunday to review and schedule.

---

## Core Workflow

```
SELECT BRAND → SOCIAL LISTENING LEARNS → AI BUILDS CONTENT PLAN → YOU REVIEW/EDIT → BATCH GENERATE → COME BACK NEXT DAY → REVIEW/SCHEDULE
```

**Key insight:** The AI does the research AND the planning, not just execution. You're the creative director approving concepts, not the worker making each piece.

---

## UX Flow

| Step | You Do | AI Does |
|------|--------|---------|
| 1. Select brand | Click | - |
| 2. Trigger listening | Click "Analyze Trends" | Scans niche keywords, competitors, viral posts |
| 3. Review insights | Skim AI summary | Shows what's working (hooks, formats, styles) |
| 4. See content plan | Review 10-15 content cards | Pre-filled with scenes, scripts, B-roll notes |
| 5. Edit any card | Tweak text, swap ideas | - |
| 6. Select & generate | Check boxes, click "Batch Create" | Queues all jobs |
| 7. Next day | Review generated content | - |
| 8. Polish & schedule | Edit/merge if needed → Ready to Post | - |

---

## Content Matrix Example

| Type | Count | Platforms |
|------|-------|-----------|
| Short-form video (6-12s) | 5 | TikTok, IG Reels, YT Shorts |
| Explainer video (15-25s) | 2 | TikTok, IG Reels |
| Carousel | 2 | Instagram |
| UGC 30 min clip | 2 | Instagram |
| Static post | 1 | Instagram |
| Long-form video/podcast | 1 | YouTube |

---

## What Makes This Sharp

### 1. Social Listening → Content Ideas
Not just "trending topics" but *why* things are viral. Thumbnail styles, hook patterns, caption structures. The AI reverse-engineers success.

### 2. Pre-Broken-Down Content
Each content piece arrives as:
- Scenes/slides (with B-roll suggestions)
- Script/captions
- Format/structure notes

You're reviewing *blueprints* before clicking generate.

### 3. Batch Generate & Walk Away
Queue 50+ pieces across 10 brands. Server works overnight. You come back to a review queue.

### 4. Edit In-Place or Deep Edit
- Quick fix? Regenerate that scene
- Need more? → Editor / Edit & Merge
- Done? → Ready to Post

---

## Multi-Brand Support

- Brand switcher at top
- Each brand has its own content plan queue
- "Generate All Brands" button for power users

---

## Implementation Requirements

### Currently Available
| Component | Status |
|-----------|--------|
| Brand Brief | Ready |
| Content Ideas (lightbulb) | Ready - extend to batch mode |
| Social Listening | Ready - needs deeper trend analysis |
| Content Analyzer | Ready |
| Scene/slide breakdown | Ready (scripts, captions, image prompts) |
| Short-form video | Ready (Sora/A2E) |
| Carousel images | Ready (GPT-Image-1.5) |
| Static posts | Ready |
| B-roll suggestions | Partial (Pexels search exists) |
| Edit & Merge | Ready |
| Ready to Post | Ready |

### Needs Building
| Component | Description |
|-----------|-------------|
| Content Plan UI | New page showing weekly content cards |
| Batch generation queue | Job queue system for multiple content pieces |
| Overnight processing | Background worker for long-running jobs |
| Review queue UI | New page for reviewing generated batch content |
| Podcast/Long-form | ElevenLabs Create Podcast API integration |

---

## Technical Considerations

### Cost Management
- Batch generation could burn through quotas fast
- Need clear estimates before generating: "This batch will use ~15 video credits, 8 image credits"

### Generation Time
- Sora videos take time
- Need background processing with progress tracking
- Webhook notifications when complete

### Failure Handling
- If one video fails mid-batch, don't lose the whole batch
- Individual retry per content piece

---

## A2E Full Feature Integration

Based on A2E platform capabilities (video.a2e.ai), these features should be integrated:

### Image Generation Models (Priority: High)

| Feature | Description | Use Case |
|---------|-------------|----------|
| **Image Editor** | Upload source + reference image, AI modifies | Edit existing images with AI guidance |
| **Nano Banana Pro** | Premium text-to-image, 1K/2K/4K resolution | High-quality thumbnails, product shots |
| **Seedream 4.5** | Alternative image model | Style variety |
| **Flux 2 Pro** | Premium image generation | Photorealistic content |
| **Z-Image** | Specialized image generation | Creative effects |

### Video Generation Models (Priority: High)

| Feature | Description | Use Case |
|---------|-------------|----------|
| **Wan 2.6 / Wan 2.6 Flash** | Fast video generation | Quick short-form content |
| **Seedance 1.5 Pro** | Premium video model | High-quality motion |
| **Kling Video** | Alternative video engine | Different motion styles |
| **Veo 3.1** | Google's video model | Premium video quality |
| **Sora 2 Pro** | OpenAI's video via A2E | Storyboard mode, multi-scene |
| **Storyboard Mode** | Multi-scene video with shots | Complex narratives, explainers |

### Image to Video (Priority: High)

| Feature | Description | Use Case |
|---------|-------------|----------|
| **Duration Control** | 5s, 10s, 15s options | Match platform requirements |
| **Multiple Outputs** | Generate 1-8 videos at once | Batch variations |
| **Creative Effects** | Motion styles and effects | Visual variety |
| **Model Selection** | A2E, Wan, Seedance, etc. | Quality/speed tradeoffs |

### Avatar & Lip-Sync (Priority: Medium)

| Feature | Description | Current Status |
|---------|-------------|----------------|
| **Create LipSync** | Avatar speaks script | ✓ Implemented |
| **Talking Photo** | Any photo speaks | API ready, needs UI |
| **Talking Video** | Re-dub existing video | API ready, needs UI |
| **Create Avatar from Video** | Clone person from video | Not implemented |
| **Create Avatar from Image** | Clone person from photo | Not implemented |
| **Actor Animation** | Animate static person | Not implemented |
| **Actor Swap (Viggle)** | Replace actor in video | Not implemented |

### Face/Body Editing (Priority: Medium)

| Feature | Description | Current Status |
|---------|-------------|----------------|
| **Face Swap** | Swap face into video | API ready, needs UI |
| **Head Swap** | Replace entire head | Not implemented |
| **Cloth Swap** | Change clothing | Not implemented |
| **Virtual Try-On** | Put clothing on person | API ready, needs UI |
| **Product Avatar** | Animate product images | Not implemented |

### Voice Studio (Priority: High)

| Feature | Description | Current Status |
|---------|-------------|----------------|
| **Voice Clone** | Clone voice from audio | API ready, needs UI |
| **Text-to-Speech** | A2E TTS engine | Using ElevenLabs/OpenAI |
| **Video to Audio** | Extract audio from video | Not implemented |

### Video Toolbox (Priority: High)

| Feature | Description | Current Status |
|---------|-------------|----------------|
| **Upscale** | Enhance video resolution | Not implemented |
| **Subtitle Remover** | Remove burned-in captions | API ready, needs UI |
| **Video Downloader** | Download from URL | Not implemented |

---

## A2E Integration Roadmap

### Phase 1: Core Video Models (Week 1-2)
1. Add model selector to video generation UI (Wan 2.6, Seedance, Kling, Veo 3.1)
2. Implement duration control (5s/10s/15s)
3. Add batch video generation (1-8 outputs)
4. Storyboard mode for multi-scene videos

### Phase 2: Image Enhancement (Week 2-3)
1. Image Editor with reference image support
2. Add Nano Banana Pro, Flux 2 Pro models
3. Resolution selector (1K/2K/4K)
4. Aspect ratio options

### Phase 3: Avatar & Voice (Week 3-4)
1. UI for Talking Photo / Talking Video
2. Voice Clone interface
3. Create Avatar from Video/Image
4. Actor Animation

### Phase 4: Advanced Editing (Week 4-5)
1. Face Swap / Head Swap UI
2. Cloth Swap / Virtual Try-On
3. Video Upscaling
4. Subtitle Remover UI

---

## Future APIs to Integrate

### ElevenLabs Create Podcast API
- Auto-generated 2-host AI podcasts from content
- Duration control: short (<3 min), default (3-7 min), long (>7 min)
- 32 languages supported
- Customizable intro/outro and style

### Remotion (Optional)
- React-based programmatic video creation
- Template-driven branded content
- AWS Lambda / GCP Cloud Run rendering
- TikTok-style caption generation

---

## Goal

Log on Saturday morning → Have a week's worth of content planned and batch generated for 10 brands in 2-3 hours → Come back Sunday → Edit, review, schedule posting → Download for platforms without API access.

---

## A2E API Endpoints Reference

Based on current implementation in `server/a2e.ts`:

```
Base URL: https://video.a2e.ai

Implemented:
- /api/v1/anchor/character_list - List avatars
- /api/lipsyncs/ - Create lip-sync video
- /api/lipsyncs/{id}/ - Check lip-sync status
- /api/v1/userImage2Video/start - Image to video
- /api/v1/userImage2Video/{id} - Check I2V status
- /api/v1/userText2image/start - Text to image
- /api/v1/userText2image/{id} - Check T2I status
- /api/v1/voice_clone/train - Clone voice
- /api/v1/voice_clone/list - List cloned voices
- /api/v1/talking_photo/start - Talking photo
- /api/v1/talking_video/start - Talking video
- /api/v1/face_swap/start - Face swap
- /api/v1/dubbing/start - AI dubbing
- /api/v1/caption_removal/start - Remove captions
- /api/v1/video_to_video/start - Style transfer
- /api/v1/virtual_tryon/start - Virtual try-on

To Add:
- Premium video models (Wan 2.6, Seedance, Kling, Veo, Sora 2 Pro)
- Image Editor endpoint
- Upscale endpoint
- Head Swap endpoint
- Cloth Swap endpoint
- Actor Animation endpoint
- Actor Swap (Viggle) endpoint
- Product Avatar endpoint
- Video to Audio endpoint
```

---

## Free Features to Build (No Additional APIs Needed)

These features can be built using existing GPT-4 capabilities - inspired by AnswerSocrates and Ranked.ai.

### Keyword & Topic Research (AnswerSocrates-Style)

| Feature | Description | How to Build |
|---------|-------------|--------------|
| **Keyword Expansion** | Enter 1 topic → Get 50+ long-tail variations | GPT-4 prompt engineering |
| **Question Generation** | Generate "People Also Ask" style questions | GPT-4 + structured output |
| **Question Clustering** | Group questions by intent (how/what/why/where/when) | GPT-4 categorization |
| **Topic Clustering** | Group related keywords into content pillars | GPT-4 semantic grouping |
| **Content Gap Analysis** | Identify missing topics based on niche | GPT-4 analysis |
| **Comparison Keywords** | Generate "X vs Y" style content ideas | GPT-4 prompt |
| **Local Keywords** | Add location modifiers to keywords | GPT-4 expansion |

### Trending Topic Discovery

| Feature | Description | How to Build |
|---------|-------------|--------------|
| **Niche Trend Detection** | Find what's trending in specific niches | Existing Social Listening + GPT-4 analysis |
| **Platform-Specific Trends** | TikTok vs Instagram vs YouTube trends | Platform APIs we already have |
| **Viral Pattern Analysis** | WHY content goes viral (hooks, formats, timing) | Content Analyzer enhancement |
| **Trend Forecasting** | Predict what's about to trend | GPT-4 pattern recognition |

### LLM Brand Tracking (Ranked.ai-Style)

| Feature | Description | How to Build |
|---------|-------------|--------------|
| **ChatGPT Brand Check** | Does ChatGPT recommend your brand? | Query OpenAI API with brand prompts |
| **Perplexity Brand Check** | Does Perplexity cite your brand? | Query Perplexity API |
| **Claude Brand Check** | Does Claude mention your brand? | Query Anthropic API |
| **Gemini Brand Check** | Does Gemini recommend you? | Query Google Gemini API |
| **AI Visibility Score** | Overall AI search visibility rating | Aggregate all LLM checks |
| **Visibility Over Time** | Track AI mentions weekly/monthly | Store results, show trend chart |
| **Competitor AI Visibility** | Compare your AI visibility vs competitors | Run same checks for competitors |

### Content Strategy Features

| Feature | Description | How to Build |
|---------|-------------|--------------|
| **Content Calendar Generator** | Auto-fill calendar based on trends + brief | GPT-4 + existing calendar |
| **Hook Library** | Database of effective hooks by niche | GPT-4 generation + user saves |
| **Caption Templates** | Platform-optimized caption structures | GPT-4 templates |
| **Hashtag Clusters** | Related hashtag groups by topic | GPT-4 clustering |
| **CTA Library** | Effective call-to-action templates | GPT-4 generation |

### Implementation Priority

**Phase 1: Quick Wins (1-2 days each)**
1. Keyword Expansion (add to Brand Brief lightbulb)
2. Question Generation (add to Content Queue)
3. Question Clustering (group generated questions)

**Phase 2: Trend Enhancement (2-3 days each)**
4. Viral Pattern Analysis (enhance Content Analyzer)
5. Trending Topic Feed (enhance Social Listening)
6. Platform-Specific Trends (per-platform insights)

**Phase 3: AI Visibility (3-4 days)**
7. LLM Brand Tracker (new section in Social Listening)
8. Visibility Over Time (chart + history)
9. Competitor AI Visibility (comparison view)

**Phase 4: Content Strategy (2-3 days each)**
10. Content Calendar Auto-Fill
11. Hook Library
12. Caption/CTA Templates

---

## APIs That Would Enhance (Optional - Paid)

These are nice-to-have but not required:

| API | What It Adds | Cost |
|-----|--------------|------|
| **DataForSEO** | Real search volume, CPC, competition data | ~$50/mo |
| **SerpAPI** | Google SERP data, People Also Ask | ~$50/mo |
| **Google Trends API** | Official trending data | Free (unofficial) |
| **Perplexity API** | Direct AI search queries | Pay per query |

Without these, we use GPT-4 to generate plausible keyword ideas and questions - which works well for content ideation even without exact search volume numbers.
