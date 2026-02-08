# Backend Features Implementation Guide

This document describes the new backend features added to the S-C-F platform.

## Overview

This implementation adds 14 major backend features to enable advanced content creation capabilities:

1. BeatSync Engine
2. Virality Scoring Backend
3. Auto B-Roll Insertion
4. Reel-to-Template Generator
5. Smart Engine Routing
6. Content Calendar Auto-Fill
7. Text-Based Video Editing
8. UGC Ad Creator
9. Brand Tracking
10. Character Consistency
11. Webhook Queue System
12. D-ID Integration
13. Creatify Integration
14. OpenRouter & Together AI Integrations

## Database Schema Changes

### New Tables

#### `beat_sync_analysis`
Stores audio analysis results including beats, tempo, and energy segments.
- `id`: Primary key
- `user_id`: Foreign key to users
- `audio_url`: URL of analyzed audio
- `duration`: Audio duration in seconds
- `tempo`: BPM (beats per minute)
- `beats`: JSONB array of beat timestamps
- `segments`: JSONB array of energy segments
- `analysis_metadata`: FFmpeg output metadata

#### `virality_scores`
Stores virality predictions for content.
- `id`: Primary key
- `user_id`: Foreign key to users
- `content_id`: Optional foreign key to generated_content
- `predicted_ctr`: Click-through rate (0-100)
- `engagement_score`: Overall engagement (0-100)
- `hook_score`: First 3 seconds effectiveness (0-100)
- `retention_score`: Predicted retention (0-100)
- `virality_factors`: JSONB with detailed scoring
- `recommendations`: Array of improvement suggestions

#### `reel_templates`
Stores extracted viral content templates.
- `id`: Primary key
- `user_id`: Foreign key to users
- `name`: Template name
- `source_video_url`: Original viral video
- `duration`: Total duration
- `structure`: JSONB scene breakdown
- `transitions`: JSONB transition data
- `audio_timing`: JSONB beat markers
- `visual_style`: JSONB styling info
- `text_overlays`: JSONB overlay data
- `pacing`: Fast/medium/slow
- `is_public`: Shareable template
- `times_used`: Usage counter

#### `content_plans`
Stores weekly content calendars.
- `id`: Primary key
- `user_id`: Foreign key to users
- `brief_id`: Foreign key to brand_briefs
- `week_start_date`: Week start
- `week_end_date`: Week end
- `plan_data`: JSONB with daily content
- `auto_filled`: AI-generated flag
- `status`: draft/active/completed

#### `ugc_ad_projects` & `ugc_ad_scenes`
Multi-scene UGC video ad projects.
- Projects track overall ad campaigns
- Scenes store individual ad segments
- Supports hook/problem/solution/cta structure

#### `brand_tracking_scores`
Brand consistency monitoring.
- Voice, visual, messaging consistency scores
- Deviation tracking
- Improvement recommendations

#### `brand_characters`
Brand-consistent character definitions.
- Visual prompts for consistency
- Style guides
- Reference image tracking

#### `webhook_queue`
Database-backed webhook processing.
- Supports multiple webhook types
- Automatic retry logic
- Status tracking

#### `engine_routing_config`
Smart AI model routing configuration.
- Engine availability by tier
- Cost and quality scoring
- Priority settings

## Service Documentation

### 1. BeatSync Engine (`server/beatSync.ts`)

**Purpose**: Analyze audio for music beats and create beat-synced video edits.

**Key Methods**:
```typescript
analyzeAudio(audioPath: string): Promise<BeatSyncResult>
generateBeatSyncedCuts(audioPath, targetDuration): Promise<number[]>
createBeatMatchedVideo(videoPath, audioPath, outputPath): Promise<void>
```

**API Endpoint**: `POST /api/beatsync/analyze`

**Request**:
```json
{
  "audioPath": "/path/to/audio.mp3"
}
```

**Response**:
```json
{
  "id": "uuid",
  "duration": 180,
  "tempo": 120,
  "beats": [{"time": 0.5, "strength": 0.8}, ...],
  "segments": [{"start": 0, "end": 5, "energy": "high", "avgAmplitude": 0.6}]
}
```

### 2. Virality Scoring Backend (`server/viralityScoring.ts`)

**Purpose**: Predict content virality using AI analysis.

**Key Methods**:
```typescript
scoreVideo(videoUrl, transcript?, thumbnailUrl?): Promise<ViralityAnalysis>
scoreTextContent(content, contentType): Promise<object>
predictCTR(title, thumbnailUrl?): Promise<object>
```

**API Endpoint**: `POST /api/virality/score`

**Request**:
```json
{
  "videoUrl": "https://...",
  "transcript": "Video transcript...",
  "thumbnailUrl": "https://..."
}
```

**Response**:
```json
{
  "predictedCTR": 75,
  "engagementScore": 82,
  "hookScore": 88,
  "retentionScore": 70,
  "viralityFactors": {
    "pacing": 85,
    "editing": 80,
    "audio": 75,
    "visuals": 90,
    "storytelling": 78,
    "emotion": 82
  },
  "recommendations": ["Improve opening hook", "Add more visual variety"]
}
```

### 3. Auto B-Roll Insertion (`server/brollInsertion.ts`)

**Purpose**: AI-powered B-roll footage selection and insertion planning.

**Key Methods**:
```typescript
generateBRollPlan(script, videoDuration, transcript?): Promise<BRollInsertionPlan>
searchBRollSources(query): Promise<BRollSuggestion["sources"]>
selectBestBRoll(suggestions, context): Promise<Array<object>>
```

**API Endpoint**: `POST /api/broll/generate-plan`

**Request**:
```json
{
  "script": "Video script text...",
  "videoDuration": 60,
  "transcript": [{"start": 0, "end": 5, "text": "..."}]
}
```

**Response**:
```json
{
  "suggestions": [
    {
      "query": "person typing on laptop",
      "timestamp": 15.5,
      "duration": 3,
      "reason": "Visualize remote work concept",
      "sources": [
        {
          "url": "https://...",
          "provider": "pexels",
          "thumbnailUrl": "https://...",
          "videoUrl": "https://..."
        }
      ]
    }
  ],
  "totalBRollDuration": 12,
  "coverage": 20
}
```

### 4. Reel Template Generator (`server/reelTemplateGenerator.ts`)

**Purpose**: Extract reusable templates from viral content.

**Key Methods**:
```typescript
analyzeReelForTemplate(videoUrl, videoPath?, transcript?): Promise<ReelTemplate>
applyTemplate(template, newContent): Promise<object>
```

**API Endpoint**: `POST /api/reel-templates/analyze`

**Request**:
```json
{
  "videoUrl": "https://...",
  "videoPath": "/local/path",
  "transcript": "Video transcript..."
}
```

**Response**:
```json
{
  "id": "uuid",
  "name": "Reel Template - 2024-01-01",
  "duration": 30,
  "structure": [
    {"scene": 1, "start": 0, "end": 3, "type": "hook", "description": "Attention grabber"}
  ],
  "transitions": [{"at": 3, "type": "cut", "style": "hard"}],
  "pacing": "fast"
}
```

### 5. Smart Engine Routing (`server/smartEngineRouter.ts`)

**Purpose**: Select optimal AI model based on tier, cost, and quality requirements.

**Key Methods**:
```typescript
selectEngine(requirements: TaskRequirements): RoutingDecision
updateEngineConfig(config: EngineConfig): void
```

**API Endpoint**: `POST /api/engine-routing/select`

**Request**:
```json
{
  "taskType": "video_generation",
  "prioritizeQuality": true,
  "prioritizeSpeed": false,
  "prioritizeCost": false
}
```

**Response**:
```json
{
  "selectedEngine": "sora",
  "reason": "Best quality for video_generation. Premium tier engine.",
  "estimatedCost": 500,
  "estimatedQuality": 95,
  "estimatedSpeed": 60,
  "alternatives": [
    {"engine": "steveai", "score": 250}
  ]
}
```

### 6. Content Calendar Auto-Fill (`server/contentCalendar.ts`)

**Purpose**: Generate weekly content plans using AI.

**Key Methods**:
```typescript
generateWeeklyPlan(brandBrief, weekStartDate): Promise<WeeklyContentPlan>
generateDayContent(brandBrief, date, contentType, platform): Promise<ContentPlanDay>
optimizePlan(currentPlan, analytics): Promise<WeeklyContentPlan>
```

**API Endpoint**: `POST /api/content-calendar/generate`

**Request**:
```json
{
  "briefId": "uuid",
  "weekStartDate": "2024-01-01"
}
```

**Response**:
```json
{
  "id": "uuid",
  "weekStartDate": "2024-01-01T00:00:00Z",
  "weekEndDate": "2024-01-07T23:59:59Z",
  "planData": {
    "days": [
      {
        "date": "2024-01-01",
        "platform": "instagram",
        "contentType": "reel",
        "topic": "Product launch",
        "hook": "You won't believe what we just launched!",
        "keyPoints": ["Feature 1", "Feature 2", "Limited time offer"],
        "cta": "Link in bio",
        "hashtags": ["#product", "#launch"]
      }
    ],
    "theme": "Product Launch Week",
    "brandFocus": "Increase awareness"
  }
}
```

### 7. Text-Based Video Editing (`server/textBasedVideoEditor.ts`)

**Purpose**: Edit videos through transcript manipulation.

**Key Methods**:
```typescript
editByTranscript(videoPath, transcript, selectedText, outputPath): Promise<void>
removeFillerAndSilence(videoPath, transcript, outputPath): Promise<void>
createHighlightReel(videoPath, transcript, keywords, outputPath): Promise<void>
aiTrimVideo(videoPath, transcript, targetDuration, outputPath): Promise<void>
```

**API Endpoint**: `POST /api/video-editing/text-based`

**Request**:
```json
{
  "videoPath": "/path/to/video.mp4",
  "transcript": [{"start": 0, "end": 5, "text": "..."}],
  "selectedText": ["important phrase", "key message"],
  "outputPath": "/path/to/output.mp4"
}
```

### 8. UGC Ad Creator (`server/ugcAdCreator.ts`)

**Purpose**: Create multi-scene UGC video ads with AI.

**Key Methods**:
```typescript
generateAdStructure(productName, productDescription, targetAudience, adGoal): Promise<UGCAdProject>
generateAdVariations(productName, productDescription, targetAudience, count): Promise<UGCAdProject[]>
optimizeForPlatform(adProject, platform): Promise<UGCAdProject>
```

**API Endpoint**: `POST /api/ugc-ads/generate`

**Request**:
```json
{
  "productName": "SuperApp",
  "productDescription": "The best productivity app",
  "targetAudience": "Busy professionals",
  "adGoal": "conversion",
  "briefId": "uuid"
}
```

**Response**:
```json
{
  "id": "uuid",
  "name": "UGC Ad - SuperApp",
  "productName": "SuperApp",
  "scenes": [
    {
      "sceneNumber": 1,
      "sceneType": "hook",
      "duration": 3,
      "script": "Ever feel overwhelmed by tasks?",
      "visualPrompt": "Person stressed at desk",
      "avatarMode": "talking_head"
    }
  ]
}
```

### 9. Brand Tracking (`server/brandTracking.ts`)

**Purpose**: Monitor brand consistency using LLM analysis.

**Key Methods**:
```typescript
analyzeContentConsistency(content, brandBrief): Promise<BrandConsistencyAnalysis>
trackBrandOverTime(contentHistory, brandBrief): Promise<object>
compareWithCompetitors(yourContent, competitorContent, brandBrief): Promise<object>
```

**API Endpoint**: `POST /api/brand-tracking/analyze`

**Request**:
```json
{
  "contentId": "uuid",
  "briefId": "uuid"
}
```

**Response**:
```json
{
  "voiceConsistencyScore": 85,
  "visualConsistencyScore": 78,
  "messagingAlignmentScore": 92,
  "overallBrandScore": 85,
  "deviations": [
    {
      "category": "voice",
      "issue": "Tone too formal",
      "severity": "medium"
    }
  ],
  "recommendations": ["Use more conversational language"]
}
```

### 10. Character Consistency (`server/characterConsistency.ts`)

**Purpose**: Create and maintain brand-consistent characters.

**Key Methods**:
```typescript
createCharacterFromBrief(brandBrief, characterType): Promise<CharacterDefinition>
generateConsistentPrompt(character, scenario, emotion?): string
checkImageConsistency(character, generatedImageUrl, prompt): Promise<ConsistencyCheckResult>
```

**API Endpoint**: `POST /api/characters/create`

**Request**:
```json
{
  "briefId": "uuid",
  "characterType": "mascot"
}
```

**Response**:
```json
{
  "id": "uuid",
  "name": "Buddy",
  "description": "Friendly brand mascot",
  "visualPrompt": "Cartoon character with blue fur, big smile...",
  "styleGuide": {
    "clothing": ["blue t-shirt"],
    "colors": ["#0066FF", "#FFFFFF"],
    "accessories": ["cap"],
    "pose": "standing",
    "expression": "friendly smile",
    "environment": "studio background"
  }
}
```

### 11. Webhook Queue System (`server/webhookQueue.ts`)

**Purpose**: Reliable webhook processing with database backing.

**Key Methods**:
```typescript
enqueue(webhookType, payload): Promise<string>
processPending(): Promise<void>
getStatus(jobId): Promise<WebhookJob | null>
retryFailed(jobId): Promise<void>
cleanup(olderThanDays): Promise<number>
```

**Usage**:
```typescript
// Enqueue webhook
await webhookQueueService.enqueue('stripe', stripeEvent);

// Start processor
startWebhookProcessor(30000); // Poll every 30 seconds
```

### 12. New AI Integrations

#### D-ID (`server/did.ts`)
Talking avatars from photos.

```typescript
createTalkingPhoto(request: DIDTalkingPhotoRequest): Promise<DIDVideoResponse>
getVideoStatus(videoId): Promise<DIDVideoResponse>
createAvatarVideo(imageUrl, audioUrl): Promise<DIDVideoResponse>
```

#### Creatify (`server/creatify.ts`)
AI video ad generation.

```typescript
createVideoAd(request: CreatifyAdRequest): Promise<CreatifyVideoResponse>
createUGCAd(productName, script, avatarImageUrl): Promise<CreatifyVideoResponse>
```

#### OpenRouter (`server/openrouter.ts`)
Universal LLM routing.

```typescript
chatCompletion(request: OpenRouterRequest): Promise<OpenRouterResponse>
listModels(): Promise<Array<object>>
compareModels(messages, models): Promise<Array<object>>
```

#### Together AI (`server/togetherai.ts`)
Fast AI inference.

```typescript
chatCompletion(request: TogetherRequest): Promise<TogetherResponse>
generateImage(request: TogetherImageRequest): Promise<object>
fastCompletion(prompt): Promise<string>
qualityCompletion(prompt): Promise<string>
```

## Tier-Based Access Control

All new features respect the existing tier system:

- **Free**: Limited access, requires own API keys
- **Core**: Basic features with own API keys
- **Premium**: Advanced features, included credits
- **Pro**: Enhanced limits and features
- **Studio**: Full access to all features

To add tier restrictions to endpoints, use the existing `assertQuota` system:

```typescript
await assertQuota(req.user!.id, 'feature_name', 1);
```

## Environment Variables

Required for new integrations:

```bash
# Core (existing)
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...

# New integrations
DID_API_KEY=...
CREATIFY_API_KEY=...
OPENROUTER_API_KEY=...
TOGETHER_API_KEY=...

# Stock media (existing)
PEXELS_API_KEY=...
GETTY_API_KEY=...
```

## Testing

To test the new endpoints:

```bash
# Start the server
npm run dev

# Test BeatSync
curl -X POST http://localhost:5000/api/beatsync/analyze \
  -H "Content-Type: application/json" \
  -d '{"audioPath": "/path/to/audio.mp3"}'

# Test Virality Scoring
curl -X POST http://localhost:5000/api/virality/score \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://...", "transcript": "..."}'
```

## Database Migration

To apply the new schema:

```bash
npm run db:push
```

This will create all new tables in your PostgreSQL database.

## Error Handling

All services include comprehensive error handling:

```typescript
try {
  // Service call
} catch (error: any) {
  console.error("Service error:", error);
  throw new Error(`Failed to process: ${error.message}`);
}
```

API endpoints return appropriate HTTP status codes:
- 200: Success
- 400: Bad request (missing parameters)
- 404: Resource not found
- 500: Server error

## Performance Considerations

1. **BeatSync Engine**: Audio analysis can take 10-30 seconds for longer files
2. **AI Services**: GPT-4 calls typically take 3-10 seconds
3. **Video Processing**: FFmpeg operations vary by file size
4. **Webhook Queue**: Processes 10 jobs per batch with 30-second intervals

## Future Enhancements

Potential improvements:
- Add caching for repeated analyses
- Implement job queue for long-running tasks
- Add WebSocket support for real-time updates
- Create admin dashboard for engine routing
- Add A/B testing for UGC ad variations
- Implement template marketplace

## Support

For issues or questions:
1. Check the error logs in the server console
2. Verify all required environment variables are set
3. Ensure database migrations have been applied
4. Check that API keys are valid and have sufficient quota

## License

All code follows the existing project license.
