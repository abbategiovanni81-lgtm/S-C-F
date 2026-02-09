# Ava AI Tools Documentation

## Overview

Ava AI is an intelligent content creation assistant that helps creators generate viral-ready content across multiple platforms. This integration adds 8 AI-powered tools directly into the Ava workflow, plus 3 standalone research tools.

## Features

### 🎣 Integrated AI Tools (Within Ava Workflow)

#### 1. Hooks Generation
Generate 3 attention-grabbing hook variations for your content.

**Endpoint**: `POST /api/ava/generate-hooks`

**Request**:
```json
{
  "topic": "productivity tips for remote workers",
  "platform": "instagram",
  "tone": "engaging",
  "targetAudience": "millennials"
}
```

**Response**:
```json
{
  "hooks": [
    {
      "text": "Stop wasting 3 hours a day...",
      "type": "pattern interrupt",
      "estimatedEngagement": 8
    }
  ]
}
```

**UI Component**: `<HookCards />` - Displays hooks with engagement scores and regenerate button

---

#### 2. Script Generation
Generate full timed scripts with 5 sections: Hook, Introduction, Build-up, Punchline, Call to Action.

**Endpoint**: `POST /api/ava/generate-script`

**Request**:
```json
{
  "topic": "morning routine for productivity",
  "platform": "youtube",
  "length": "medium",
  "tone": "motivational"
}
```

**Lengths**:
- `short`: 30s (3s hook, 5s intro, 15s buildup, 5s punchline, 2s cta)
- `medium`: 60s (5s hook, 8s intro, 35s buildup, 8s punchline, 4s cta)
- `long`: 90s (7s hook, 12s intro, 55s buildup, 12s punchline, 4s cta)

**UI Component**: `<ScriptCard />` - Shows timed sections with duration indicators

---

#### 3. Caption Generation
Generate 3 caption variations with hashtags: Short & Punchy, Storytelling, Value-Focused.

**Endpoint**: `POST /api/ava/generate-captions`

**Request**:
```json
{
  "contentTopic": "healthy meal prep",
  "contentType": "video",
  "platform": "instagram",
  "includeHashtags": true
}
```

**UI Component**: `<CaptionCards />` - Displays variations with character counts

---

#### 4. Hashtag Generation
Generate niche and topic-based hashtags with reach estimates.

**Endpoint**: `POST /api/ava/generate-hashtags`

**Request**:
```json
{
  "topic": "fitness motivation",
  "niche": "bodybuilding",
  "platform": "instagram",
  "count": 15,
  "style": "balanced"
}
```

**Styles**:
- `niche`: Specific, targeted hashtags with smaller engaged audiences
- `trending`: Popular, high-reach hashtags with broader appeal
- `balanced`: Mix of niche-specific and trending hashtags

---

#### 5. Content Ideas Generation
Generate content ideas with engagement estimates and trend alignment.

**Endpoint**: `POST /api/ava/generate-ideas`

**Request**:
```json
{
  "niche": "personal finance",
  "platform": "tiktok",
  "count": 5,
  "trendingTopics": ["inflation", "saving money"]
}
```

**Response** includes:
- Title (catchy, clickable)
- Description
- Estimated Engagement (1-10)
- Difficulty (Easy/Medium/Hard)
- Trend Alignment (1-10)

**UI Component**: `<IdeaCards />` - Interactive cards with "Create" button

---

#### 6. Carousel Generation
Generate Instagram/LinkedIn carousel slides with image descriptions.

**Endpoint**: `POST /api/ava/generate-carousel`

**Request**:
```json
{
  "topic": "social media growth strategies",
  "slideCount": 5,
  "tone": "professional"
}
```

Each slide includes:
- Title
- Content (bullet points)
- Image description (for AI image generation)
- Design tips (colors, layout, typography)

**UI Component**: `<CarouselPreview />` - Interactive slide preview with navigation

---

#### 7. Best Time to Post
Get optimal posting time recommendations based on platform algorithms.

**Endpoint**: `POST /api/ava/best-time-to-post`

**Request**:
```json
{
  "platform": "instagram",
  "targetAudience": "entrepreneurs",
  "contentType": "reel",
  "timezone": "America/New_York"
}
```

---

### 🔬 Standalone Research Tools

#### 1. Viral Forecaster
Validate content ideas before creation with AI-powered viral potential analysis.

**Page**: `/tools/viral-forecaster`

**Features**:
- Viral Potential Score (1-10)
- Audience Size Estimate
- Demographics (age, gender, interests)
- Competition Level
- Recommendations
- Best Time to Post

**Use Case**: Research content ideas before investing time in creation

---

#### 2. Keywords & Trends
Discover trending keywords with popularity and competition scores.

**Page**: `/tools/keywords-trends`

**Features**:
- Search by topic/niche
- Popularity scores (visual bars)
- Competition ratings
- Trend indicators (Rising/Stable)
- Category tags
- Bulk copy selected keywords

**Use Case**: SEO optimization and content discovery

---

#### 3. Ava Tools Demo
Interactive demo page showcasing all Ava tools in action.

**Page**: `/tools/ava-demo`

**Features**:
- Tabbed interface for all tools
- Live generation with visual feedback
- Copy and export functionality

---

## UI Components

All Ava UI components are located in `client/src/components/ava/`:

```typescript
import { 
  HookCards, 
  ScriptCard, 
  CaptionCards, 
  IdeaCards, 
  CarouselPreview 
} from '@/components/ava';
```

### Usage Example

```tsx
import { HookCards } from '@/components/ava';

function MyComponent() {
  const [hooks, setHooks] = useState([]);

  const handleRegenerate = async () => {
    const response = await fetch('/api/ava/generate-hooks', {
      method: 'POST',
      body: JSON.stringify({ topic: 'fitness', platform: 'instagram' })
    });
    const data = await response.json();
    setHooks(data.hooks);
  };

  return (
    <HookCards 
      hooks={hooks} 
      onRegenerate={handleRegenerate}
      loading={false}
    />
  );
}
```

---

## Backend Service

The Ava service is located at `server/avaService.ts` and exports:

```typescript
import { 
  generateHooks,
  generateScript,
  generateCaptions,
  generateHashtags,
  generateIdeas,
  generateCarouselSlides,
  getViralForecast,
  getBestTimeToPost,
  isAvaConfigured
} from './avaService';
```

### Configuration

Set the OpenAI API key:
```bash
export OPENAI_API_KEY="sk-..."
```

Check if configured:
```typescript
if (!isAvaConfigured()) {
  console.error("OpenAI API key not configured");
}
```

---

## Error Handling

All Ava functions include comprehensive error handling:

1. **API Key Validation**: Checks for OpenAI key before making calls
2. **Safe JSON Parsing**: Handles malformed AI responses gracefully
3. **Try-Catch Blocks**: Catches and logs all errors
4. **User-Friendly Messages**: Returns clear error messages to UI

Example error response:
```json
{
  "error": "Failed to generate hooks: OpenAI API key is not configured"
}
```

---

## Cost Optimization

### Caching Recommendations
Consider implementing caching to reduce API costs:

```typescript
const cacheKey = `ava:hooks:${hash(topic, platform)}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

const result = await generateHooks(request);
await cache.set(cacheKey, result, 3600); // 1 hour TTL
```

### Rate Limiting
See `SECURITY_SUMMARY.md` for rate limiting recommendations.

---

## Platform Support

Supported platforms for content generation:
- Instagram (Reels, Posts, Carousels)
- TikTok (Videos, Text Posts)
- YouTube (Videos, Shorts)
- LinkedIn (Posts, Carousels)
- Twitter/X (Text Posts)
- Facebook (Posts, Videos)

---

## Future Enhancements

Potential improvements for Ava AI tools:

1. **Chat Integration**: Integrate tools directly into a conversational Ava chat interface
2. **Content Templates**: Pre-built templates for common content types
3. **Multi-Language**: Support for content generation in multiple languages
4. **A/B Testing**: Generate multiple variations for testing
5. **Analytics Integration**: Track which AI-generated content performs best
6. **Voice Integration**: Generate voiceover scripts with timing
7. **Image Generation**: Auto-generate images for carousel slides
8. **Scheduling**: Direct integration with content scheduling

---

## Contributing

When adding new Ava tools:

1. Add function to `server/avaService.ts`
2. Add API route to `server/routes.ts`
3. Create UI component in `client/src/components/ava/`
4. Add page route to `client/src/App.tsx`
5. Update this documentation

---

## Support

For issues or questions:
- Check `SECURITY_SUMMARY.md` for security best practices
- Review error logs for troubleshooting
- Ensure OpenAI API key is configured
- Verify authentication middleware is working

---

## License

This project is licensed under MIT License.
