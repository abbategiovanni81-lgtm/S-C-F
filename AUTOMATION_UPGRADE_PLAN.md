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
| Text-to-Video | A2E (Sora 2, Kling) | Fal.ai | Runway |
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
