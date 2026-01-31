# SocialCommand UI/UX Workflow Specification

## Ava AI Assistant - Active Workflow Guide

Ava is NOT just an advisor - she **actively guides and moves users through the workflow**:
- Presents decision cards at each step
- Moves user to next step on selection
- Shows progress (Step 1/3)
- User can ALWAYS access any section via dropdown menu (not locked in)
- Review/feedback only mode available

---

## SINGLE CONTENT WORKFLOW

### Brand Brief → Generate

**Step 1: Decision Card**
> "What do you want to create?"
- Quick Post *(visual card)*
- [Continue to Step 2]

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
- Select template → Continue

**Step 5: Template Populate**
- Script + structure prefilled from template
- Edit placeholders with brand voice
- AI suggestions for customization

**Step 6: Decision Card**
> "Who creates the content?"
- Platform AI *(included in tier)*
- Your OpenAI Key *(BYOK)*
- Your ElevenLabs *(voice only)*
- Your A2E Key *(video)*

**Step 7: Editor (CapCut-style)**
- Timeline with clips
- Edit / Merge / Adjust
- Add text, music, effects
- Preview playback

**Step 8: Review & Score**
- AI quality score
- Improvement suggestions as visual cards
- Compare with similar content (visual side-by-side)
- "Ready" confirmation

**Step 9: Schedule**
- Board view → drag to calendar
- Calendar view → select date/time
- Options: Schedule | Post Now | Export

---

### IF: From Scratch

**Step 4: AI Content Cards**
Visual cards for each generation type:
- 💡 Idea *(generates concepts)*
- 🎣 Hook *(attention grabbers)*
- 📝 Script *(full script)*
- 🎙️ Voiceover *(audio)*
- ✍️ Caption *(platform-optimized)*
- #️⃣ Hashtags *(trending + niche)*

**Step 5: Decision Card**
> "Who creates the content?"
- Platform AI *(included in tier)*
- Your OpenAI Key *(BYOK)*
- Your ElevenLabs *(voice only)*
- Your A2E Key *(video)*

**Step 6: Decision Card**
> "Choose visuals"
- Upload *(from device)*
- Google Drive *(connected)*
- Stock (Pexels) *(free library)*
- AI Generate *(DALL-E / A2E)*

**Step 7: Editor (CapCut-style)**
- Same as template path

**Step 8: Review & Score**
- Same as template path

**Step 9: Schedule**
- Same as template path

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
- Analyzing niche + trends
- Reading brand brief
- Progress indicator with animation
- "Ava is building your content plan..."

**Step 4: Content Plan Board**
Visual cards showing:
- Platform icon
- Format type (Reel/Carousel/etc)
- Topic/Theme
- Goal (Engage/Convert/Educate)

Each card has toggle:
- Generate *(AI creates)*
- Library *(use existing)*
- Upload *(add your own)*

Edit scripts / add references inline

**Step 5: Decision Card**
> "Who creates the content?"
- Platform AI *(batch pricing)*
- Your API Keys *(BYOK - no platform cost)*

**Step 6: Batch Generate (async)**
- Progress cards showing generation status
- "Generating 12 pieces... 4/12 complete"
- Background processing notification
- Overnight batch option

**Step 7: Generated Content Board**
Visual cards showing:
- Video/image thumbnail
- AI quality score badge
- Platform icon
- Status: Ready | Needs Edit | Regenerate

Actions per card:
- Preview (tap to play)
- Edit (opens editor)
- Regenerate (new version)
- Score details

**Step 8: Bulk Schedule**
- Board view → drag cards to calendar
- Calendar view → batch select dates
- Auto-post toggle (where supported)
- Manual queue for platforms requiring approval

---

### IF: Manual Plan

**Step 3: Plan Builder**
Visual cards for selecting:
- Format quantities (3 Reels, 5 Carousels, etc)
- Platform distribution
- Date range

**Step 4-8: Same as AI Plan path**
- Content Plan Board
- Content Creator Selection
- Batch Generate
- Generated Content Board
- Bulk Schedule

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

## AVA BEHAVIORS

### Active Guidance
```
Ava: "Great choice! Let's pick a format for your Reel."
[Shows format cards]
[User taps Carousel]
Ava: "Perfect! Carousels get 3x more saves. Template or scratch?"
```

### Progress Awareness
- Shows step indicator (1/3, 2/3, 3/3)
- Can go back to previous steps
- Remembers selections

### Smart Suggestions
- Recommends formats based on brand brief
- Suggests templates matching brand voice
- Flags potential issues before publishing

### Escape Hatch
- Dropdown menu always visible
- User can jump to any section
- "Skip" option on non-critical steps

---

## VISUAL CARD COMPONENTS

### Decision Card
```
┌─────────────────────────────┐
│  [Image/Video Preview]      │
│                             │
│  Title                      │
│  Subtitle/description       │
│                             │
│  [Selected indicator ✓]     │
└─────────────────────────────┘
```

### Template Card
```
┌─────────────────────────────┐
│  [Video Thumbnail]          │
│  [▶ Play preview]           │
│                             │
│  Template Name              │
│  🎬 4 clips | ⏱ 15s | 🎵 Beat│
│  [New!] badge (if recent)   │
└─────────────────────────────┘
```

### Content Card (Generated)
```
┌─────────────────────────────┐
│  [Thumbnail]     [Score 8.5]│
│                             │
│  Caption preview...         │
│  📱 Instagram | 🎬 Reel     │
│                             │
│  [Edit] [Regenerate] [✓]    │
└─────────────────────────────┘
```

### Schedule Card (Board View)
```
┌─────────────────────────────┐
│  [Thumbnail]                │
│  Mon 10:00 AM               │
│  📱 Instagram               │
│  [Auto-post ✓]              │
└─────────────────────────────┘
```

---

## CONTENT SOURCE SELECTION

Critical step added to workflow - user chooses WHO creates content:

### Platform AI (Included)
- Uses SocialCommand's API credits
- Tier quota applies
- Fastest option

### BYOK (Bring Your Own Keys)
- OpenAI API Key → Scripts, captions, ideas
- ElevenLabs Key → Voice synthesis
- A2E Key → Video generation
- No platform usage counted

### Visual Presentation
```
┌─────────────────────────────┐
│ "Who creates your content?" │
├─────────────────────────────┤
│ [⚡ Platform AI]            │
│   Included • Uses quota     │
├─────────────────────────────┤
│ [🔑 Your OpenAI]            │
│   Connected ✓               │
├─────────────────────────────┤
│ [🎙️ Your ElevenLabs]        │
│   Not connected             │
├─────────────────────────────┤
│ [🎬 Your A2E]               │
│   Connected ✓               │
└─────────────────────────────┘
```

---

## REFERENCE SCREENSHOTS

Based on competitor analysis:
- **HeyGen**: Clean decision cards with 3 options
- **Impresso**: 2-col visual grid of AI tools
- **Mintly**: Step wizard (1/3) with visual templates
- **Templify**: Template library with metadata, dark theme editor
- **Visual style cards**: Retro, Aesthetic, Minimalistic, Cinematic
