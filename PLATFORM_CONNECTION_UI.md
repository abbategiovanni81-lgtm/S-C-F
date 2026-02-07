# Brand Brief Platform Connection UI - Implementation Summary

## Overview
The Brand Brief creation/edit flow now includes social platform connection directly inside it, eliminating the need for a separate Accounts page flow. Users can select platforms, connect accounts via OAuth, configure posting preferences, and set platform-specific settings all within the Brand Brief interface.

## New UI Components

### 1. "Platforms & Posting Schedule" Section
Located after the existing brand brief fields (Brand Voice, Target Audience, Content Goals, etc.)

#### Visual Layout:
```
┌─────────────────────────────────────────────────────────────────┐
│ Platforms & Posting Schedule                                    │
│ Select platforms, connect accounts, and set posting frequency   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────┐   │
│  │ [📷] Instagram           │  │ [🎵] TikTok              │   │
│  │ ✓ Selected               │  │ ✓ Selected               │   │
│  │ ✓ Connected @mybrand     │  │ [Connect]                │   │
│  │                          │  │                          │   │
│  │ Frequency: [Daily ▼]     │  │ Frequency: [Daily ▼]     │   │
│  │ Times: [Morning][Noon]   │  │ Times: [Evening]         │   │
│  │ ▼ Format Settings        │  │ ▼ Post Settings          │   │
│  │   [x] Feed               │  │   ( ) Auto-post          │   │
│  │   [x] Reels              │  │   (•) Save as Draft      │   │
│  │   [ ] Stories            │  │                          │   │
│  └──────────────────────────┘  └──────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────┐   │
│  │ [▶️] YouTube             │  │ [f] Facebook             │   │
│  │ ✓ Selected               │  │ (Click to enable)        │   │
│  │ ✓ Connected              │  │                          │   │
│  │ @mychannel               │  │                          │   │
│  │                          │  │                          │   │
│  │ Frequency: [Weekly ▼]    │  │                          │   │
│  │ Times: [Morning]         │  │                          │   │
│  │ ▼ Format Settings        │  │                          │   │
│  │   [x] Shorts             │  │                          │   │
│  │   [x] Long-form          │  │                          │   │
│  └──────────────────────────┘  └──────────────────────────┘   │
│                                                                  │
│  (Similar cards for LinkedIn, Twitter, Threads, Pinterest,      │
│   Bluesky, Reddit, Google Business)                             │
│                                                                  │
│  [Click platforms above to enable them]                         │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Platform Card Details

Each platform card includes:

#### **Unselected State:**
- Platform icon (Instagram, TikTok, YouTube, etc.)
- Platform name
- Faded appearance
- Click to enable

#### **Selected but Not Connected:**
- Platform icon (colored)
- Platform name
- ✓ Selected indicator
- **[Connect]** button
- Posting frequency dropdown
- Preferred times (Morning/Afternoon/Evening/Custom) as badges
- Platform-specific settings (collapsible)

#### **Selected and Connected:**
- Platform icon (colored)
- Platform name
- ✓ Selected indicator
- ✓ Connected badge with handle (@mybrand)
- Posting frequency dropdown
- Preferred times badges
- Platform-specific settings (collapsible)
- Disconnect option (subtle)

### 3. Platform-Specific Settings

#### **Instagram:**
- Format toggles:
  - [x] Feed
  - [x] Reels
  - [x] Stories

#### **YouTube:**
- Format toggles:
  - [x] Shorts
  - [x] Long-form

#### **TikTok:**
- Post mode:
  - ( ) Auto-post
  - (•) Save as Draft

### 4. OAuth Connection Flow

When user clicks **[Connect]** button:
1. Form state is saved to sessionStorage
2. User is redirected to OAuth provider (e.g., `/api/auth/facebook` for Instagram)
3. User authorizes in provider's interface
4. Provider redirects back to callback URL (`/api/auth/facebook/callback`)
5. Server exchanges code for tokens and stores in `socialAccounts` table
6. User is redirected back to Brand Briefs page
7. Form state is restored from sessionStorage
8. Platform card updates to show "Connected" status with handle

## Technical Implementation

### Database Schema
```typescript
// brandBriefs table now includes:
platformConfigs: jsonb("platform_configs")

// Structure:
interface PlatformConfig {
  platform: string;              // "Instagram", "TikTok", etc.
  enabled: boolean;              // Is this platform selected?
  connected: boolean;            // Is OAuth connected?
  accountId?: string;            // socialAccounts.id if connected
  accountHandle?: string;        // Display name like "@mybrand"
  frequency?: 'Daily' | 'Weekly' | '3x per week' | 'Bi-weekly' | 'Monthly';
  times?: string[];              // ['Morning', 'Afternoon']
  settings?: {
    instagramFormats?: ('Feed' | 'Reels' | 'Stories')[];
    youtubeFormats?: ('Shorts' | 'Long-form')[];
    tiktokMode?: 'auto-post' | 'draft';
  };
}
```

### Key Features

1. **Responsive Design:**
   - 2-column grid on desktop
   - 1-column on mobile
   - Cards expand to show settings when platform is enabled

2. **State Management:**
   - `platformConfigs` array tracks all platform settings
   - `connectedAccounts` query fetches existing OAuth connections
   - Helper functions: `togglePlatformConfig()`, `updatePlatformConfig()`, `isPlatformConnected()`

3. **OAuth Integration:**
   - Reuses existing OAuth patterns from Accounts page
   - Supports: YouTube (Google), Facebook/Instagram, Twitter, LinkedIn, TikTok, Pinterest, Reddit
   - Bluesky uses password auth (not OAuth)

4. **Backwards Compatibility:**
   - Legacy `platforms` array field still populated
   - Legacy `postingFrequency` field still saved
   - Old briefs without `platformConfigs` get auto-migrated on edit

## Accounts Page Migration

The legacy Accounts page now shows:

```
┌─────────────────────────────────────────────────────────────────┐
│ ℹ️ Platform Connections Now Part of Brand Briefs                │
│                                                                  │
│ Connect your social accounts directly when creating or editing  │
│ Brand Briefs. This provides better context for content          │
│ generation and scheduling.                                       │
│                                                                  │
│ [Go to Brand Briefs]                                            │
└─────────────────────────────────────────────────────────────────┘

Social Channels (Legacy)
Manage your existing social media channels. New connections should 
be made in Brand Briefs.

[Existing account cards...]
```

Navigation sidebar shows:
- ✅ Brand Briefs
- 👤 Accounts (Legacy)

## Benefits of This Approach

1. **Single Source of Truth:** Platform settings live with the brand brief
2. **Better Context:** Content generation knows which platforms are active
3. **Simpler UX:** No need to jump between pages to connect accounts
4. **Auto-Fill Calendar:** Posting frequency feeds directly into Content Calendar
5. **Platform-Specific Content:** AI knows which formats to generate (Reels vs. Feed)

## Next Steps

Once the database is available:
1. Run `npm run db:push` to apply schema changes
2. Test OAuth connections in brand brief dialog
3. Verify platform settings save correctly
4. Test responsive design on mobile
5. Take screenshots of the UI for documentation
