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
