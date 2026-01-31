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

---

## Template-Based Reel Maker (Beat App Style)

### Vision
Browse a library of pre-made reel templates **synced to music beats**, pick one, fill in your images/videos, and get a polished reel instantly. AI suggests which template and content to use based on your brand brief.

### Core Concept: Music-First Templates

**The key differentiator:** Templates are built around the music. Each clip slot is timed to specific beats in the track. When user uploads, the reel includes the sound and all clips hit on beat.

```
MUSIC TRACK (120 BPM)
|----beat----|----beat----|----beat----|----beat----|
   [CLIP 1]     [CLIP 2]     [CLIP 3]     [CLIP 4]
    0.5s         0.5s         1.0s         0.5s
```

**What this means:**
- Template defines: music track + beat markers + clip durations
- User just fills slots with content
- Output: perfectly beat-synced reel with music included
- Ready to upload directly to Instagram/TikTok with sound

### UX Flow

```
1. BROWSE TEMPLATES → Auto-playing preview grid (like Beat app)
2. SELECT TEMPLATE → See slot count, duration, music, style
3. FILL SLOTS → Pick from Upload/Google Drive/Pexels/AI Generate
4. AI SUGGEST → AI recommends content based on template + brand brief
5. GENERATE → Reel created with template transitions/timing
6. EDIT (optional) → Fine-tune in Video Editor
```

### Template Library Categories

| Category | Example Styles |
|----------|----------------|
| **Recaps** | Travel recap, Event recap, Year in review |
| **Product** | Product showcase, Before/after, Unboxing |
| **Lifestyle** | Day in the life, Morning routine, GRWM |
| **Business** | Team intro, Behind the scenes, Process reveal |
| **Trending** | Hot trends, Viral formats, Challenge templates |
| **Educational** | How-to, Tips & tricks, Tutorial |
| **Promo** | Sale announcement, Launch, Countdown |

### Stock Reels Library

Pre-made complete reels users can use as-is or customize:

| Type | Description |
|------|-------------|
| **B-Roll Packs** | City, nature, office, lifestyle footage |
| **Intro/Outro Clips** | Branded openers and closers |
| **Transition Clips** | Swoosh, zoom, glitch transitions |
| **Text Animations** | Kinetic typography templates |
| **Music-Synced Templates** | Pre-timed to popular beats |

### AI Features

| Feature | Description |
|---------|-------------|
| **Template Suggestion** | Based on brand brief + content type, AI suggests best templates |
| **Content Selection** | AI picks best images/videos from your library for each slot |
| **Auto-Fill** | One-click fill all slots with AI-chosen content |
| **Style Matching** | AI ensures content matches template aesthetic |
| **Caption Generation** | Auto-generate captions that fit template style |

### Technical Implementation

**Option 1: Remotion (Recommended)**
- React-based video templates
- Full control over animations/transitions
- Server-side rendering
- Each template = React component with placeholder props

**Option 2: FFmpeg Sequences**
- Pre-defined transition timings
- Concat filter with crossfade
- Less flexible but simpler

**Option 3: A2E Storyboard Mode**
- Use Sora 2 Pro storyboard as template base
- AI generates transitions between user content
- Most "magic" but less control

### Template Structure (Music-First)

```json
{
  "id": "beach-vibes-01",
  "name": "Beach Vibes",
  "category": "lifestyle",
  "duration": 11.1,
  "slots": 12,
  "music": {
    "name": "Summer Days",
    "artist": "Royalty Free",
    "bpm": 120,
    "audioUrl": "/templates/audio/summer-days.mp3",
    "license": "royalty-free"
  },
  "beats": [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.5, 4.0, ...],
  "slots": [
    { "start": 0.0, "duration": 0.5, "beat": 1, "transition": "cut" },
    { "start": 0.5, "duration": 0.5, "beat": 2, "transition": "zoom" },
    { "start": 1.0, "duration": 1.0, "beat": 3, "transition": "fade" },
    ...
  ],
  "previewUrl": "/templates/beach-vibes-01/preview.mp4",
  "style": ["warm", "bright", "energetic"]
}
```

**Output includes:**
- Final video with music track mixed in
- Clips auto-trimmed/scaled to fit beat timing
- Transitions on beat drops
- Ready for direct upload with sound

### Preview Grid (Beat-Style)

**Performance Optimizations:**
- Low-res preview loops (~480p, 3-5 seconds)
- IntersectionObserver - only play visible templates
- Limit 6-8 concurrent video playback
- Animated WebP fallback for low-end devices
- Lazy load as user scrolls

### Implementation Phases

**Phase 1: Foundation (1 week)**
1. Template data structure + storage
2. Template grid UI with autoplay previews
3. Slot selection interface (reuse clip picker)
4. Basic concatenation via FFmpeg

**Phase 2: AI Integration (3-4 days)**
5. AI template recommendation based on brand brief
6. AI content selection for slots
7. Auto-fill feature

**Phase 3: Stock Library (1 week)**
8. Curate stock reel library
9. B-roll packs, transitions, intros/outros
10. Pexels integration for stock content

**Phase 4: Polish (3-4 days)**
11. Music sync improvements
12. Custom transition styles
13. Template favorites/history

### Tier Access

| Feature | Free | Core | Premium+ |
|---------|------|------|----------|
| Browse Templates | ✓ (view only) | ✓ | ✓ |
| Use Templates | ✗ | 5/month | Unlimited |
| AI Suggestions | ✗ | ✓ | ✓ |
| Stock Reels Library | ✗ | Basic | Full |
| Custom Templates | ✗ | ✗ | Premium+ |

---

## External Data → Auto Content Pipeline (Owner Feature)

### Use Case: Flight Deals App

Turn structured data from external apps into ready-to-post content automatically.

**Flow:**
```
External App (flight insights page)
    ↓ API/webhook
Extract data (route, airline, points, dates)
    ↓
Match airline → your seat image library
    ↓
Overlay text on matched image
    ↓
Generate 5-image carousel + reel
    ↓
Ready to post
```

**Example Output:**
- Image: Your Turkish Airlines business class seat photo
- Overlay: "Miami → Beijing | Turkish Airlines Business | 87,500 pts"
- Branding: Your logo in corner

**No AI image generation needed** - just text overlay on your existing airline image library.

**Implementation:**
1. Image library with tags (airline name, class)
2. API endpoint to receive flight data
3. Text overlay engine (Canvas/Sharp.js)
4. Auto-generate 5 variations for carousel
5. Create reel from carousel images (beat-synced template)

---

## AI Carousel Generation (Liz on the Web Method)

### Carousel Structure for Maximum Engagement

Based on proven viral carousel methodology - every slide creates pressure to see the next.

**Slide Structure:**

| Slide | Content | Purpose |
|-------|---------|---------|
| **1** | Headline only | Stop the scroll |
| **2** | Headline + subheader + leading text | Why this matters |
| **3-N** | Headline + subheader + open loop | Build curiosity |
| **Final** | Clear reveal + CTA | Payoff |

**Core Principles:**
- Never give closure until final slide
- Each slide intentionally leads to the next
- No instructions until the end
- Open loops create "what's next?" pressure

**AI Prompt Template:**

```
You are writing Instagram carousel text.

Tone: confident, clear, educational, beginner-friendly.
Goal: guide reader slide by slide using intentional curiosity.

Structure:
- Slide 1: headline only (hook)
- Slide 2: headline + subheader + leading curiosity text
- Slides 3 to penultimate: headline + subheader + leading text pushing to next
- Final slide: headline + clear reveal + CTA

Rules:
- Do not reveal the action/insight until final slide
- Every slide must lead into the next
- One idea per slide
- Simple language
- No steps or execution details until end

Topic: [from brand brief]
Audience: [from brand brief target audience]
CTA: [from brand brief CTA]

Write the carousel.
```

**Integration Points:**
- Add to Content Queue carousel generation
- Use brand brief for topic/audience/CTA
- Output structured slides for image generation
- Auto-create images with text overlays

---

## URL → Content Generator (Quick Generate)

### Concept
Paste any URL (product page, article, affiliate link) → AI analyzes it → generates ready-to-post content in multiple formats.

**Flow:**
```
Paste URL
    ↓
Scrape page content (title, description, benefits, images)
    ↓
AI extracts: key selling points, pain points solved, target audience
    ↓
Generate content in chosen formats:
    → Carousel (5-10 slides with open-loop structure)
    → Video script (hook + body + CTA)
    → Blog post
    → Social captions (platform-optimized)
    ↓
Ready to post or send to Editor for polish
```

### Use Cases

| Input | Output |
|-------|--------|
| Product page URL | Product showcase carousel + video script |
| Affiliate link | Review-style content + comparison posts |
| Article/blog URL | Summary carousel + quote cards |
| Competitor post | Inspired-by content with your angle |
| News article | Trending topic content for your niche |

### What AI Extracts From URL

- **Product/service name**
- **Key benefits** (what problem it solves)
- **Target audience** (who is this for)
- **Pain points addressed**
- **Pricing/offer details**
- **Images** (for reference in prompts)
- **Testimonials** (if present)
- **Unique selling points**

### Output Formats

| Format | Structure |
|--------|-----------|
| **Carousel** | Liz Method: hook → open loops → reveal → CTA |
| **Video Script** | Hook (0-3s) → Body → CTA |
| **Blog Post** | Title, intro, key points, conclusion |
| **Caption** | Platform-optimized (IG, TikTok, LinkedIn, etc.) |
| **Tweet/Thread** | X-optimized with hooks |

### Implementation

1. URL input field in Content Queue (or standalone "Quick Generate" tool)
2. Backend: fetch URL → extract text/meta → GPT analysis
3. Show extracted info for user review/edit
4. Select output formats (multi-select)
5. Generate all formats in parallel
6. Review/edit → send to Ready to Post or Editor

### Tier Access

| Feature | Free | Core+ |
|---------|------|-------|
| URL Analysis | 3/month | Unlimited |
| Single Format Output | ✓ | ✓ |
| Multi-Format Output | ✗ | ✓ |
| Image Extraction | ✗ | ✓ |

---

## AI Motion Transfer (Photo + Reference Video)

### Concept
Upload a photo + reference video → AI transfers the motion onto your photo character. Perfect for recreating viral dances/gestures with your own AI influencer.

**Flow:**
```
1. Upload Photo (your character/influencer)
2. Upload Motion Reference Video (max 30s)
3. Optional: Keep original sound toggle
4. Generate → AI maps motion onto your photo
5. Output: Your character moving like the reference video
```

### Use Cases
- Recreate viral TikTok dances with AI influencer
- Copy competitor's video style with your character
- Animate product mascots
- Create consistent character across multiple motions

### APIs We Can Use

**Primary: A2E (Already Integrated)**
| Endpoint | Capability |
|----------|------------|
| `/api/v1/actor_swap/start` | Viggle-style actor replacement |
| Actor Animation | Animate image with motion reference |

**Alternative APIs:**

| Platform | API? | Best For | Pricing |
|----------|------|----------|---------|
| **MagicAnimate (Replicate)** | ✅ Yes | Open-source, developer-friendly | Pay-per-use |
| **Runway Act-Two** | ✅ Yes | Pro filmmaking, facial gestures | Enterprise |
| **Wonder Studio** | ✅ Yes | Full VFX replacement | Pro tier |
| **DomoAI** | ❌ No | Stylized/anime animation | Subscription |
| **Kling AI** | ✅ Yes | High-fidelity cinematic | Credits |
| **Krikey AI** | ✅ Yes | 3D character rigging | Freemium |

### MagicAnimate Integration (Backup via Replicate)

```javascript
const output = await replicate.run(
  "lucataco/magic-animate:e24ad72cc67dd2a365b5b909aca70371bba62b685019f4e96317e59d4ace6714",
  {
    input: {
      image: "character.png",
      video: "dance-reference.mp4",
      num_inference_steps: 25,
      guidance_scale: 7.5
    }
  }
);
```

### Implementation
1. Photo upload (JPG/PNG, full body or mid-shot works best)
2. Video upload (max 30s, MP4/MOV)
3. "Keep original sound" toggle
4. Call A2E actor_swap or MagicAnimate API
5. Poll for completion
6. Return animated video

---

## UGC Avatar Video Library

### Concept
Library of pre-made AI avatars (diverse appearances, styles) that users can select to create talking head videos. Like HeyGen/Creatify but integrated into SocialCommand.

### Avatar Categories

| Category | Examples |
|----------|----------|
| **Professional** | Business attire, office backgrounds |
| **Casual/UGC** | iPhone-filmed look, casual clothing |
| **Diverse Demographics** | Age, ethnicity, gender variety |
| **Stylized** | Animated, illustrated avatars |
| **Custom** | User uploads their own photo/video |

### UGC Avatar API Comparison

| Platform | API? | Price | Avatars | Best For |
|----------|------|-------|---------|----------|
| **A2E** (primary) | ✅ | Pay-per-use | Custom upload | Talking photo/video |
| **HeyGen** | ✅ Enterprise | $29+/mo | 100+ | Multilingual, polished |
| **Creatify** | ✅ $99/mo | $39+/mo | 75+ | URL-to-video, e-commerce |
| **Arcads** | ❓ Limited | ~$110/mo | Many | Ultra-realistic UGC style |
| **Synthesia** | ✅ | $22+/mo | 160+ | Corporate, training |
| **Argil** | ✅ | Custom | High quality | Creator-focused |
| **JoggAI** | ✅ | Custom | 450+ | Story-based campaigns |

### A2E Avatar Capabilities (Already Have)

| Feature | Endpoint |
|---------|----------|
| Talking Photo | `/api/v1/talking_photo/start` |
| Talking Video | `/api/v1/talking_video/start` |
| Voice Clone | `/api/v1/voice_clone/train` |
| Lip Sync | `/api/v1/lipsync/start` |
| Face Swap | `/api/v1/face_swap/start` |

### What To Build

**Phase 1: Avatar Library UI**
1. Gallery of pre-selected avatar images/videos
2. Filter by: gender, style (pro/casual), ethnicity, age
3. Preview with sample speech
4. "Create your own" option (upload photo)

**Phase 2: Script + Generate**
1. Select avatar
2. Enter script (text or paste from Content Queue)
3. Select voice (from voice library or clone)
4. Generate via A2E talking_photo or talking_video

**Phase 3: Action/Gesture Control (Like Impresso)**
1. Add "Action" field for gesture direction
2. "Lean toward camera, nod, smile"
3. Requires motion-capable model (A2E actor animation or MagicAnimate)

### Tier Access

| Feature | Free | Core | Premium+ |
|---------|------|------|----------|
| Browse Avatar Library | ✓ | ✓ | ✓ |
| Use Avatars | ✗ | 5/month | Unlimited |
| Custom Avatar (upload) | ✗ | ✗ | ✓ |
| Voice Clone | ✗ | ✗ | Premium+ |
| Motion Transfer | ✗ | ✗ | Pro+ |

---

## Multi-Provider AI Strategy

### Why Multiple Providers?
- **Redundancy**: If A2E goes down, fallback to alternatives
- **Best-of-breed**: Some models better for specific tasks
- **Cost optimization**: Route to cheapest provider per task
- **Feature coverage**: Not all providers have all features

### Provider Matrix

| Capability | Primary | Fallback 1 | Fallback 2 |
|------------|---------|------------|------------|
| Talking Head | A2E | HeyGen API | D-ID |
| Motion Transfer | A2E Actor Swap | MagicAnimate (Replicate) | Runway |
| Voice Clone | A2E | ElevenLabs | - |
| Lip Sync | A2E | Sync Labs | - |
| Face Swap | A2E | - | - |
| Text-to-Video | **Sora 2 (default)** | Kling, Veo 3.1 | Fal.ai, Runway |
| Text-to-Image | gpt-image-1.5 | A2E (Flux) | Fal.ai |

### Smart Routing Logic
```
IF user.tier === "Studio":
  use highestQualityProvider
ELSE IF primaryProvider.isDown:
  use fallbackProvider
ELSE IF task.priority === "speed":
  use fastestProvider
ELSE:
  use cheapestProvider
```

---

## Landing Page Branding — AI Engines, Not Providers

### Concept
On landing pages and marketing, showcase the **actual AI models** users get access to, not the aggregator/provider name. Users recognize Sora, Flux, DALL-E — they don't know what "A2E" means.

### What We Say vs What's Behind It

| User Sees | Actual Provider | Engine |
|-----------|-----------------|--------|
| **Sora 2** ⭐ | A2E | OpenAI Sora 2 (DEFAULT for video) |
| **Flux Pro** | A2E | Black Forest Labs Flux |
| **Kling** | A2E | Kuaishou Kling |
| **Veo 3.1** | A2E | Google Veo |
| **DALL-E 3** | OpenAI Direct | OpenAI DALL-E |
| **gpt-image-1.5** | OpenAI Direct | OpenAI Image Gen |
| **ElevenLabs** | ElevenLabs Direct | ElevenLabs |
| **Seedance** | A2E | Seedance 1.5 Pro |
| **Wan 2.6** | A2E | Alibaba Wan |

### Landing Page Copy Example

**❌ Don't say:**
> "Powered by A2E video generation"

**✅ Do say:**
> "Create videos with Sora 2, Flux Pro, Kling & more"
> "AI-powered by OpenAI, ElevenLabs, Google Veo"

### Where to Apply

| Location | Show |
|----------|------|
| **Homepage hero** | "Powered by Sora 2, DALL-E, ElevenLabs" with logos |
| **Pricing page** | Engine access per tier (Core = Flux, Premium = Sora 2) |
| **Feature cards** | Engine name + capability |
| **Generation UI** | Model selector shows engine names |
| **Footer** | "Integrates with OpenAI, Google, ElevenLabs" |

### Engine Logos to Source
- OpenAI (Sora, DALL-E, GPT-4)
- ElevenLabs
- Google (Veo)
- Flux / Black Forest Labs
- Kling / Kuaishou

### Tier-Based Engine Access (Marketing)

| Tier | Engines Included |
|------|------------------|
| **Free** | gpt-image-1.5 (BYOK) |
| **Core** | + Flux Pro, Wan 2.6 |
| **Premium** | + Sora 2, Kling, ElevenLabs |
| **Pro** | + Veo 3.1, Seedance Pro |
| **Studio** | All engines + priority queue |

---

## Ava AI — Active Workflow Guide

### Core Concept
Ava is NOT just an advisor - she **actively guides and moves users through the workflow**:
- Presents decision cards at each step
- Moves user to next step on selection
- Shows progress (Step 1/3)
- User can ALWAYS access any section via dropdown menu (not locked in)
- Review/feedback only mode available

### Ava Behaviors

**Active Guidance:**
```
Ava: "Great choice! Let's pick a format for your Reel."
[Shows format cards]
[User taps Carousel]
Ava: "Perfect! Carousels get 3x more saves. Template or scratch?"
```

**Progress Awareness:**
- Shows step indicator (1/3, 2/3, 3/3)
- Can go back to previous steps
- Remembers selections

**Smart Suggestions:**
- Recommends formats based on brand brief
- Suggests templates matching brand voice
- Flags potential issues before publishing

**Escape Hatch:**
- Dropdown menu always visible
- User can jump to any section
- "Skip" option on non-critical steps

---

## SINGLE CONTENT WORKFLOW

### Brand Brief → Generate

**Step 1: Decision Card**
> "What do you want to create?"
- Quick Post *(visual card)*

**Step 2: Decision Card**
> "Choose format"
- Reel *(video preview)*
- Carousel *(visual preview)*
- Story *(visual preview)*
- Ad *(visual preview)*
- Video *(video preview)*

**Step 3: Decision Card**
> "How should it be created?"
- From Scratch *(icon/visual)*
- Use Template *(icon/visual)*

---

### IF: Use Template

**Step 4: Template Grid**
- 2-column visual cards with video previews
- Filter tabs: By Platform | By Duration | By Style
- Metadata: clips count, duration, song name
- "New!" badges on recent templates

**Step 5: Template Populate**
- Script + structure prefilled from template
- Edit placeholders with brand voice

**Step 6: Decision Card — Content Creator**
> "Who creates the content?"
- Platform AI *(included in tier)*
- Your OpenAI Key *(BYOK)*
- Your ElevenLabs *(voice only)*
- Your A2E Key *(video)*

**Step 7: Editor (CapCut-style)**
- Timeline with clips
- Edit / Merge / Adjust
- Add text, music, effects

**Step 8: Review & Score**
- AI quality score
- Improvement suggestions as visual cards
- Compare with similar content

**Step 9: Schedule**
- Board view → drag to calendar
- Calendar view → select date/time
- Options: Schedule | Post Now | Export

---

### IF: From Scratch

**Step 4: AI Content Cards**
- 💡 Idea *(generates concepts)*
- 🎣 Hook *(attention grabbers)*
- 📝 Script *(full script)*
- 🎙️ Voiceover *(audio)*
- ✍️ Caption *(platform-optimized)*
- #️⃣ Hashtags *(trending + niche)*

**Step 5: Decision Card — Content Creator**
> "Who creates the content?"
- Platform AI | Your OpenAI | Your ElevenLabs | Your A2E

**Step 6: Decision Card — Visuals**
> "Choose visuals"
- Upload | Google Drive | Stock (Pexels) | AI Generate

**Step 7-9: Same as Template path**
- Editor → Review & Score → Schedule

---

## BATCH CONTENT WORKFLOW

### Brand Brief → Generate

**Step 1: Decision Card**
> "What do you want to create?"
- Content Plan *(visual card showing calendar preview)*

**Step 2: Decision Card**
> "How should it be planned?"
- AI Builds Plan *(visual showing AI analyzing)*
- Manual Plan *(visual showing blank calendar)*

---

### IF: AI Builds Plan

**Step 3: AI Planning (background)**
- Analyzing niche + trends + brand
- Progress indicator with animation
- "Ava is building your content plan..."

**Step 4: Content Plan Board**
Visual cards showing:
- Platform icon
- Format type (Reel/Carousel/etc)
- Topic/Theme
- Goal (Engage/Convert/Educate)

Each card has toggle:
- Generate | Library | Upload

**Step 5: Decision Card — Content Creator**
> "Who creates the content?"
- Platform AI *(batch pricing)*
- Your API Keys *(BYOK - no platform cost)*

**Step 6: Batch Generate (async)**
- Progress cards showing generation status
- Background processing notification
- Overnight batch option

**Step 7: Generated Content Board**
Visual cards showing:
- Video/image thumbnail
- AI quality score badge
- Status: Ready | Needs Edit | Regenerate

**Step 8: Bulk Schedule**
- Board view → Calendar view
- Auto-post where supported
- Manual queue for others

---

### IF: Manual Plan

**Step 3: Plan Builder (cards)**
- Format quantities selection
- Platform distribution
- Date range picker

**Step 4-8: Same as AI Plan path**

---

## GLOBAL UI RULES

| Rule | Implementation |
|------|----------------|
| All decisions = visual cards | Images/video previews, not text lists |
| Early flow = Decision Tree | Ava guides step-by-step |
| Templates = Grid | 2-column with video previews, metadata |
| Editing = CapCut-style | Timeline, layers, preview |
| Content Review = Visual Cards | Thumbnails with scores, actions |
| Scheduling = Board + Calendar | Kanban → Calendar dual view |
| Tier gates = Silent | Features disabled, upgrade on hover/tap |
| Navigation = Always accessible | Dropdown menu to jump anywhere |
| Content source = User choice | Platform AI vs BYOK at generation step |

---

## Visual Card Components

### Decision Card
```
┌─────────────────────────────┐
│  [Image/Video Preview]      │
│                             │
│  Title                      │
│  Subtitle/description       │
│  [Selected indicator ✓]     │
└─────────────────────────────┘
```

### Template Card
```
┌─────────────────────────────┐
│  [Video Thumbnail ▶]        │
│  Template Name              │
│  🎬 4 clips | ⏱ 15s | 🎵 Beat│
│  [New!] badge               │
└─────────────────────────────┘
```

### Content Card (Generated)
```
┌─────────────────────────────┐
│  [Thumbnail]     [Score 8.5]│
│  Caption preview...         │
│  📱 Instagram | 🎬 Reel     │
│  [Edit] [Regenerate] [✓]    │
└─────────────────────────────┘
```

### Schedule Card (Board)
```
┌─────────────────────────────┐
│  [Thumbnail]                │
│  Mon 10:00 AM               │
│  📱 Instagram [Auto-post ✓] │
└─────────────────────────────┘
```

---

## BYOK API Connections — Bring Your Own Keys

### Concept
Allow users to connect their own API keys for AI services, bypassing platform quotas and costs. This is essential for power users and agencies managing high volumes.

---

### Currently Integrated ✅

| Service | Category | File | Status |
|---------|----------|------|--------|
| **OpenAI** | Text/Image | `server/openai.ts` | ✅ Full (GPT-4, DALL-E, TTS) |
| **ElevenLabs** | Voice | `server/elevenlabs.ts` | ✅ Full (TTS, voice clone) |
| **A2E** | Video/Avatar | `server/a2e.ts` | ✅ Full (lip-sync, avatars, video) |
| **Fal.ai** | Video/Image | `server/fal.ts` | ✅ Partial |
| **Pexels** | Stock Media | `server/pexels.ts` | ✅ Full |
| **Getty** | Stock Media | `server/getty.ts` | ✅ Partial |
| **Sora 2 (OpenAI)** | Video | `server/soraService.ts` | ✅ DEFAULT via A2E |
| **Steve AI** | Video | `server/steveai.ts` | ✅ Studio tier |

---

### APIs to Add for BYOK 🔄

#### **LLM / Text Generation**

| Service | API Available | Pricing | Priority | Notes |
|---------|---------------|---------|----------|-------|
| **Grok (xAI)** | ✅ Yes | ~$0.39/1M tokens | HIGH | X/Twitter integration, real-time data, OpenAI-compatible |
| **Claude (Anthropic)** | ✅ Yes | $3-15/1M tokens | HIGH | Best for long-form, coding |
| **Gemini (Google)** | ✅ Yes | Free tier available | HIGH | Multimodal, free tier |
| **Perplexity** | ✅ Yes | Pay-per-query | MEDIUM | Real-time web search |
| **DeepSeek** | ✅ Yes | Very cheap | MEDIUM | Strong reasoning |
| **Groq** | ✅ Yes | Fast inference | LOW | Speed-focused |

#### **Image Generation**

| Service | API Available | Cost/Image | Priority | Notes |
|---------|---------------|------------|----------|-------|
| **Midjourney** | ❌ No official | N/A | LOW | Discord-only, unofficial wrappers violate TOS |
| **Stability AI (SDXL)** | ✅ Yes | $0.03-0.04 | HIGH | Self-host option free |
| **Ideogram** | ✅ Yes | Free tier | MEDIUM | Great text-in-image |
| **Leonardo AI** | ✅ Yes | Credits-based | LOW | Art-focused |
| **Recraft V3** | ✅ Via Replicate | Pay-per-use | MEDIUM | SVG/logo generation |

#### **Video Generation**

| Service | API Available | Pricing | Priority | Notes |
|---------|---------------|---------|----------|-------|
| **Runway (Gen-4.5)** | ✅ Yes | Enterprise | HIGH | Adobe partner, production-ready |
| **Pika 2.2** | ✅ Via Fal.ai | Pay-per-use | HIGH | Pikascenes, Pikaframes |
| **Luma Dream Machine** | ⚠️ Limited | Enterprise | MEDIUM | Contact directly |
| **Kling** | ✅ Via A2E/Replicate | Credits | ✅ Already have |
| **Veo 3.1 (Google)** | ✅ Via A2E | Credits | ✅ Already have |

#### **Avatar / Talking Head**

| Service | API Available | Min Price | Priority | Notes |
|---------|---------------|-----------|----------|-------|
| **HeyGen** | ✅ Yes | $99/mo | MEDIUM | 100+ avatars, polished but expensive |
| **D-ID** | ✅ Yes | $18/mo | MEDIUM | Real-time streaming, cheap |
| **Synthesia** | ✅ Yes ($89+) | $89/mo | LOW | Training/explainer focused |
| **Creatify** | ✅ Yes | $49/mo | HIGH | UGC style, 1500+ avatars, best value |
| **Arcads** | ⚠️ Limited | ~$110/mo | LOW | Ultra-realistic UGC |
| **Zeely** | ❌ No API | $25/mo | N/A | 30+ UGC avatars, web only |
| **HyperUGC** | ❌ No API | $9/mo | N/A | Cheap but no integration |

#### **Voice / Audio**

| Service | API Available | Pricing | Priority | Notes |
|---------|---------------|---------|----------|-------|
| **Play.ht** | ✅ Yes | Pay-per-char | MEDIUM | 900+ voices |
| **Murf.ai** | ✅ Yes | Subscription | LOW | Studio voices |
| **Resemble AI** | ✅ Yes | Pay-per-use | LOW | Voice cloning |
| **Descript** | ⚠️ Limited | Subscription | LOW | Overdub feature |

#### **Aggregator APIs (Multi-Model Access)**

| Service | What It Provides | Pricing | Priority |
|---------|------------------|---------|----------|
| **Replicate** | 100+ models (Flux, SDXL, Kling, Wan, etc.) | Pay-per-use | HIGH |
| **OpenRouter** | 100+ LLMs (GPT, Claude, Gemini, etc.) | Pay-per-token | HIGH |
| **Together AI** | LLMs + embeddings | Pay-per-token | MEDIUM |
| **Fal.ai** | Video/image models | Pay-per-use | ✅ Already have |

---

### Implementation: BYOK Settings Page

```
┌─────────────────────────────────────────────────────────┐
│  🔑 API Connections                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  TEXT GENERATION                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ OpenAI          [●] Connected      [Test] [Remove] ││
│  │ Claude          [ ] Not connected  [Add Key]       ││
│  │ Gemini          [ ] Not connected  [Add Key]       ││
│  │ Grok (xAI)      [ ] Not connected  [Add Key]       ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  IMAGE GENERATION                                        │
│  ┌─────────────────────────────────────────────────────┐│
│  │ OpenAI DALL-E   [●] Connected      [Test] [Remove] ││
│  │ Stability AI    [ ] Not connected  [Add Key]       ││
│  │ Replicate       [ ] Not connected  [Add Key]       ││
│  │ Ideogram        [ ] Not connected  [Add Key]       ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  VIDEO GENERATION                                        │
│  ┌─────────────────────────────────────────────────────┐│
│  │ A2E             [●] Connected      [Test] [Remove] ││
│  │ Runway          [ ] Not connected  [Add Key]       ││
│  │ HeyGen          [ ] Not connected  [Add Key]       ││
│  │ Pika (Fal.ai)   [ ] Not connected  [Add Key]       ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  VOICE                                                   │
│  ┌─────────────────────────────────────────────────────┐│
│  │ ElevenLabs      [●] Connected      [Test] [Remove] ││
│  │ Play.ht         [ ] Not connected  [Add Key]       ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

### Priority Implementation Order

**Phase 1: LLM Alternatives (1-2 days each)**
1. Grok (xAI) — OpenAI-compatible, easy swap
2. Claude (Anthropic) — Popular alternative
3. Gemini (Google) — Free tier attractive

**Phase 2: Video Providers (2-3 days each)**
4. HeyGen API — Avatar videos
5. Runway API — Premium video gen
6. Pika via Fal.ai — Already have Fal.ai

**Phase 3: Image Providers (1-2 days each)**
7. Stability AI — SDXL direct
8. Replicate — Multi-model access
9. Ideogram — Text-in-image

**Phase 4: Aggregators (1 day each)**
10. OpenRouter — Route to any LLM
11. Together AI — Fast inference

---

### Tier Access for BYOK

| Feature | Free | Core | Premium+ |
|---------|------|------|----------|
| Connect OpenAI | ✓ | ✓ | ✓ |
| Connect other LLMs | ✗ | ✓ | ✓ |
| Connect image APIs | ✗ | ✓ | ✓ |
| Connect video APIs | ✗ | ✗ | ✓ |
| Connect avatar APIs | ✗ | ✗ | ✓ |
| Max connections | 1 | 5 | Unlimited |

---

### Technical Notes

**OpenAI-Compatible APIs (Easy to Add):**
- Grok: `base_url = "https://api.x.ai/v1"`
- OpenRouter: `base_url = "https://openrouter.ai/api/v1"`
- Together: `base_url = "https://api.together.xyz/v1"`
- Groq: `base_url = "https://api.groq.com/openai/v1"`

These can use the existing OpenAI client with just a base URL change.

**Replicate Integration:**
```javascript
import Replicate from "replicate";
const replicate = new Replicate({ auth: userApiKey });

// Run any model
const output = await replicate.run("black-forest-labs/flux-1.1-pro", {
  input: { prompt: "..." }
});
```

**HeyGen Integration:**
```javascript
const response = await fetch("https://api.heygen.com/v2/video/generate", {
  method: "POST",
  headers: {
    "X-Api-Key": userApiKey,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    video_inputs: [{
      character: { type: "avatar", avatar_id: "..." },
      voice: { type: "text", input_text: "..." }
    }]
  })
});
```

**Creatify Integration (Best Value UGC):**
```javascript
const response = await fetch("https://api.creatify.ai/v1/videos", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${userApiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    avatar_id: "ugc_avatar_123",
    script: "Your product is amazing...",
    voice_id: "casual_female_01",
    style: "ugc_bedroom"  // UGC presets like Mintly
  })
});
```

**D-ID Integration (Cheapest API):**
```javascript
const response = await fetch("https://api.d-id.com/talks", {
  method: "POST",
  headers: {
    "Authorization": `Basic ${Buffer.from(userApiKey + ":").toString("base64")}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    source_url: "https://example.com/avatar.jpg",
    script: { type: "text", input: "Hello world" }
  })
});
```

---

## UGC Stock Avatar Library (Build Our Own)

### Why Build Our Own?
- A2E doesn't have stock avatars (talking photo/video only)
- HeyGen API too expensive ($99/mo)
- Creatify cheaper ($49/mo) but still adds cost
- **Solution:** Generate diverse AI character images, store as reusable library

### How It Works

```
1. GENERATE CHARACTERS
   Use gpt-image-1.5 / Flux to create diverse UGC-style portraits
   → 20-30 diverse characters (age, gender, ethnicity, style)
   
2. STORE AS "STOCK ACTORS"
   Save to database with metadata:
   - Gender, Age range, Ethnicity
   - Style (casual, professional, UGC bedroom, street)
   - Background type
   
3. USER SELECTS ACTOR
   Browse 2-column grid like Mintly shows
   Filter by: Male | Female | Style | Age
   
4. GENERATE VIDEO
   Feed selected character image + script to A2E Talking Photo
   Cost: ~$0.01/second (no monthly subscription!)
   
5. "CREATE YOUR OWN" OPTION
   User uploads their own photo for custom avatar
```

### Stock Actor Categories (Like Mintly)

| Category | Description | Examples |
|----------|-------------|----------|
| **UGC Bedroom** | Casual home setting, phone-filmed look | Cozy lighting, natural pose |
| **Influencer Review** | Professional but relatable | Clean background, good lighting |
| **Street Interview** | Outdoor, casual encounter | Urban backdrop, natural |
| **Podcast Mention** | Studio/desk setting | Microphone visible, warm tones |
| **Product Hold** | Person holding product space | Hands visible, product focus |
| **Testimonial** | Direct-to-camera authentic | Living room, kitchen settings |

### AI Image Prompt Templates

**UGC Bedroom Style:**
```
Professional photograph of a [age] year old [ethnicity] [gender], 
casual home setting, warm bedroom lighting, wearing casual clothes, 
looking directly at camera with friendly expression, 
iPhone selfie style, authentic UGC aesthetic, 
upper body shot, soft natural lighting
```

**Influencer Review Style:**
```
Professional photograph of a [age] year old [ethnicity] [gender],
clean minimal background, ring light reflection in eyes,
wearing smart casual outfit, confident friendly expression,
YouTube thumbnail style, high quality, upper body portrait
```

### Implementation Steps

**Phase 1: Generate Initial Library (1 day)**
1. Create 30 diverse character images using gpt-image-1.5
2. Mix of genders, ages, ethnicities, styles
3. Store in object storage with metadata

**Phase 2: Actor Selection UI (2 days)**
4. 2-column grid with video/image previews
5. Filter tabs: All | Male | Female | UGC | Professional
6. "Create your own" card at top
7. Select → shows script input

**Phase 3: Video Generation (1 day)**
8. Connect to A2E Talking Photo API
9. Feed selected actor image + script + voice
10. Poll for completion, show in review

**Phase 4: User Custom Actors (1 day)**
11. Upload photo → validate face detected
12. Save to "My Actors" library
13. Reuse across multiple videos

### Database Schema

```sql
CREATE TABLE stock_actors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  gender VARCHAR(20),         -- male, female, non-binary
  age_range VARCHAR(20),      -- 20s, 30s, 40s, 50s+
  ethnicity VARCHAR(50),
  style VARCHAR(50),          -- ugc_bedroom, influencer, street, podcast
  is_stock BOOLEAN DEFAULT true,
  user_id INTEGER,            -- null for stock, set for custom
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_actors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(100),
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Cost Comparison

| Approach | Monthly Cost | Per Video (1 min) |
|----------|--------------|-------------------|
| **HeyGen API** | $99/mo base | ~$1.00 |
| **Creatify Pro** | $49/mo base | Included in credits |
| **Our Stock Library + A2E** | $0/mo base | ~$0.60 |
| **D-ID API** | $18/mo base | ~$0.56 |

**Winner:** Build stock library + use A2E or D-ID for cheapest per-video cost!

### UGC BYOK Options

Users who want more avatars can connect their own:

| Service | What They Get | Cost to User |
|---------|---------------|--------------|
| **Creatify** | 1500+ UGC avatars | $49/mo |
| **HeyGen** | 100+ polished avatars | $99/mo |
| **D-ID** | Talking photo/video | $18/mo |
| **Arcads** | Ultra-realistic UGC | $110/mo |

All integrate via same pattern: user adds API key → we call their API → they pay provider directly.
