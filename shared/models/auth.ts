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

// Owner email - this account always gets pro access with owner privileges
export const OWNER_EMAIL = "gio.abbate@hotmail.com";

// Tier limits configuration
// A2E Max ($39.90/mo): 5,400 credits/month - Videos 30cr, Lipsync 5cr/5s, Avatars 100cr
// ElevenLabs Pro ($99/mo): 500k credits = 1,000 min voiceover
// OpenAI API ($200/mo): DALL-E $0.04/img, Sora $0.10/sec
// Total cost: £310/mo for 20 users
export const TIER_LIMITS = {
  free: {
    brandBriefs: 1,
    scripts: 0,
    voiceovers: 0,        // minutes
    a2eVideos: 0,         // A2E video clips (30 credits each)
    lipsync: 0,           // A2E lipsync videos (5 credits per 5-sec)
    avatars: 0,           // A2E avatars (100 credits each)
    dalleImages: 0,       // OpenAI DALL-E images
    soraVideos: 0,        // OpenAI Sora videos
    socialListeningKeywords: 0,
    usesAppApis: false,
  },
  premium: {
    brandBriefs: 5,
    scripts: -1,          // Unlimited
    voiceovers: 25,       // 25 min voiceover
    a2eVideos: 10,        // 10 A2E video clips
    lipsync: 30,          // 30 lipsync videos
    avatars: 1,           // 1 avatar
    dalleImages: 150,     // 150 DALL-E images
    soraVideos: 10,       // 10 Sora videos
    socialListeningKeywords: 3,
    usesAppApis: true,
  },
  pro: {
    brandBriefs: 10,
    scripts: -1,          // Unlimited
    voiceovers: 60,       // 60 min voiceover
    a2eVideos: 24,        // 24 A2E video clips
    lipsync: 75,          // 75 lipsync videos
    avatars: 3,           // 3 avatars
    dalleImages: 400,     // 400 DALL-E images
    soraVideos: 30,       // 30 Sora videos
    socialListeningKeywords: 6,
    usesAppApis: true,
  },
} as const;

export type TierType = "free" | "premium" | "pro";

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
  tier: varchar("tier").notNull().default("free"), // "free", "premium", "pro"
  isOwner: boolean("is_owner").notNull().default(false), // Admin privileges
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
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
