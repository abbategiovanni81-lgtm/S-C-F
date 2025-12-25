import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, real, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for authentication, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Owner email - this account always gets studio access with owner privileges
export const OWNER_EMAIL = "gio.abbate@hotmail.com";

// Tier limits configuration
// A2E Max ($39.90/mo): 5,400 credits/month - Videos 30cr, Lipsync 1cr/sec, Avatars 100cr
// ElevenLabs Pro ($99/mo): 500k credits = 1,000 min voiceover
// OpenAI API ($200/mo): DALL-E $0.04/img, Sora $0.10/sec
// Steve AI Generative ($129/mo): 400 min video, 3200 img credits, 15 min generative
// Total cost: £310/mo for 20 users (base) + Steve AI for Studio
export const TIER_LIMITS = {
  free: {
    brandBriefs: 1,
    scripts: -1,          // Unlimited scripts
    voiceovers: 0,        // minutes - blocked
    a2eVideos: 0,         // blocked
    lipsync: 0,           // blocked
    avatars: 0,           // blocked
    dalleImages: -1,      // Unlimited with own API key
    soraVideos: 0,        // blocked
    socialListeningKeywords: 0,
    socialChannels: 0,    // No social channels
    usesAppApis: false,
    allowedApis: ["openai", "claude", "pexels"], // Only these APIs
    steveAIVideos: 0,
    steveAIGenerative: 0,
    steveAIImages: 0,
  },
  core: {
    brandBriefs: 1,
    scripts: -1,          // Unlimited
    voiceovers: -1,       // Unlimited with own API
    a2eVideos: -1,        // Unlimited with own API
    lipsync: -1,          // Unlimited with own API
    avatars: -1,          // Unlimited with own API
    dalleImages: -1,      // Unlimited with own API
    soraVideos: -1,       // Unlimited with own API
    socialListeningKeywords: -1,
    socialChannels: 1,    // 1 social channel
    usesAppApis: false,   // Must use own APIs
    allowedApis: ["all"], // All APIs allowed
    steveAIVideos: 0,     // Own API if they get one
    steveAIGenerative: 0,
    steveAIImages: 0,
  },
  premium: {
    brandBriefs: 5,
    scripts: -1,          // Unlimited
    voiceovers: 25,       // 25 min voiceover
    a2eVideos: 16,        // 16 A2E video clips
    lipsync: 120,         // 120 lipsync
    avatars: 4,           // 4 avatars
    dalleImages: 150,     // 150 DALL-E images
    soraVideos: 12,       // 12 Sora videos
    socialListeningKeywords: 3,
    socialChannels: 3,    // 3 social channels
    usesAppApis: true,
    allowedApis: ["all"],
    steveAIVideos: 0,
    steveAIGenerative: 0,
    steveAIImages: 0,
  },
  pro: {
    brandBriefs: 10,
    scripts: -1,          // Unlimited
    voiceovers: 60,       // 60 min voiceover
    a2eVideos: 32,        // 32 A2E video clips
    lipsync: 300,         // 300 lipsync
    avatars: 8,           // 8 avatars
    dalleImages: 400,     // 400 DALL-E images
    soraVideos: 30,       // 30 Sora videos
    socialListeningKeywords: 6,
    socialChannels: 5,    // 5 social channels
    usesAppApis: true,
    allowedApis: ["all"],
    steveAIVideos: 0,
    steveAIGenerative: 0,
    steveAIImages: 0,
  },
  studio: {
    brandBriefs: 10,
    scripts: -1,          // Unlimited
    voiceovers: 75,       // 3x Premium (25 * 3)
    a2eVideos: 48,        // 3x Premium (16 * 3)
    lipsync: 360,         // 3x Premium (120 * 3)
    avatars: 12,          // 3x Premium (4 * 3)
    dalleImages: 450,     // 3x Premium (150 * 3)
    soraVideos: 36,       // 3x Premium (12 * 3)
    socialListeningKeywords: 9,
    socialChannels: 9,    // All 9 social channels
    usesAppApis: true,
    allowedApis: ["all"],
    steveAIVideos: 200,   // Half of $129 plan (400/2)
    steveAIGenerative: 7.5, // Half of 15 min
    steveAIImages: 1600,  // Half of 3200
    includesCreatorStudio: true, // Built-in
    maxSessions: 5,       // Multi-login support
  },
} as const;

export type TierType = "free" | "core" | "premium" | "pro" | "studio";

// Creator Studio Add-on (£20/month) - requires Premium or Pro subscription
// Uses separate A2E account pool (~1,300 credits per user per month)
export const CREATOR_STUDIO_LIMITS = {
  voiceClones: 2,       // ~50 credits each = 100
  talkingPhotos: 10,    // ~30 credits each = 300
  talkingVideos: 5,     // ~30 credits each = 150
  faceSwaps: 8,         // ~20 credits each = 160
  aiDubbing: 3,         // ~50 credits each = 150
  imageToVideo: 5,      // ~30 credits each = 150
  captionRemoval: 10,   // ~10 credits each = 100
  videoToVideo: 3,      // ~30 credits each = 90
  virtualTryOn: 5,      // ~20 credits each = 100
  imageReformat: 10,    // Uses DALL-E to change image aspect ratio
  // Total: ~1,300 credits per user per month
} as const;

// User storage table.
// (IMPORTANT) This table is mandatory for authentication, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: text("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  googleId: varchar("google_id"),
  tier: varchar("tier").notNull().default("free"), // "free", "core", "premium", "pro", "studio"
  isOwner: boolean("is_owner").notNull().default(false), // Admin privileges
  creatorStudioAccess: boolean("creator_studio_access").notNull().default(false), // £20/mo add-on (auto-true for studio)
  creatorStudioStripeId: varchar("creator_studio_stripe_id"), // Separate subscription ID
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  maxSessions: integer("max_sessions").notNull().default(1), // Multi-login for Studio (5)
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Monthly usage tracking
export const usagePeriods = pgTable("usage_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  tierSnapshot: varchar("tier_snapshot").notNull(), // Tier at start of period
  brandBriefsUsed: integer("brand_briefs_used").notNull().default(0),
  scriptsUsed: integer("scripts_used").notNull().default(0),
  voiceoversUsed: integer("voiceovers_used").notNull().default(0),
  a2eVideosUsed: integer("a2e_videos_used").notNull().default(0),       // A2E video clips
  lipsyncUsed: integer("lipsync_used").notNull().default(0),            // A2E lipsync videos
  avatarsUsed: integer("avatars_used").notNull().default(0),            // A2E avatars
  dalleImagesUsed: integer("dalle_images_used").notNull().default(0),   // OpenAI DALL-E images
  soraVideosUsed: integer("sora_videos_used").notNull().default(0),     // OpenAI Sora videos
  socialListeningUsed: integer("social_listening_used").notNull().default(0),
  topupMultiplier: real("topup_multiplier").notNull().default(0), // Sum of all top-ups (0.4 per £10)
  // Creator Studio usage
  voiceClonesUsed: integer("voice_clones_used").notNull().default(0),
  talkingPhotosUsed: integer("talking_photos_used").notNull().default(0),
  talkingVideosUsed: integer("talking_videos_used").notNull().default(0),
  faceSwapsUsed: integer("face_swaps_used").notNull().default(0),
  aiDubbingUsed: integer("ai_dubbing_used").notNull().default(0),
  imageToVideoUsed: integer("image_to_video_used").notNull().default(0),
  captionRemovalUsed: integer("caption_removal_used").notNull().default(0),
  videoToVideoUsed: integer("video_to_video_used").notNull().default(0),
  virtualTryOnUsed: integer("virtual_try_on_used").notNull().default(0),
  imageReformatUsed: integer("image_reformat_used").notNull().default(0),
  // Steve AI usage (Studio tier only)
  steveAIVideosUsed: integer("steve_ai_videos_used").notNull().default(0),      // Minutes of AI video
  steveAIGenerativeUsed: real("steve_ai_generative_used").notNull().default(0), // Minutes of generative AI
  steveAIImagesUsed: integer("steve_ai_images_used").notNull().default(0),      // Image credits
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Top-up purchase records
export const usageTopups = pgTable("usage_topups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usagePeriodId: varchar("usage_period_id").notNull().references(() => usagePeriods.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // In pence (1000 = £10)
  multiplier: real("multiplier").notNull().default(0.4), // 40% extra
  stripeSessionId: varchar("stripe_session_id"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  status: varchar("status").notNull().default("pending"), // pending, completed, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UsagePeriod = typeof usagePeriods.$inferSelect;
export type UsageTopup = typeof usageTopups.$inferSelect;
