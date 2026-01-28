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
