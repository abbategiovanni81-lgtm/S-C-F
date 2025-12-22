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
export const TIER_LIMITS = {
  free: {
    brandBriefs: 1,
    scripts: 0,
    voiceovers: 0,
    videos: 0,
    images: 0,
    socialListeningKeywords: 0,
    usesAppApis: false,
  },
  premium: {
    brandBriefs: 10,
    scripts: 500,
    voiceovers: 300,
    videos: 50,
    images: 500,
    socialListeningKeywords: 5,
    usesAppApis: true,
  },
  pro: {
    brandBriefs: 20,
    scripts: 1000,
    voiceovers: 600,
    videos: 100,
    images: 1000,
    socialListeningKeywords: 10,
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
  videosUsed: integer("videos_used").notNull().default(0),
  imagesUsed: integer("images_used").notNull().default(0),
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
