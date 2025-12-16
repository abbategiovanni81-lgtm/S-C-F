import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export interface ScenePrompt {
  sceneNumber: number;
  duration: number;
  visualPrompt: string;
  sceneDescription: string;
}

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const brandBriefs = pgTable("brand_briefs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  brandVoice: text("brand_voice").notNull(),
  targetAudience: text("target_audience").notNull(),
  contentGoals: text("content_goals").notNull(),
  postingFrequency: text("posting_frequency").notNull(),
  platforms: text("platforms").array().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const generatedContent = pgTable("generated_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  briefId: varchar("brief_id").notNull().references(() => brandBriefs.id),
  status: text("status").notNull().default("draft"),
  contentType: text("content_type").notNull(),
  script: text("script"),
  caption: text("caption"),
  hashtags: text("hashtags").array(),
  platforms: text("platforms").array().notNull(),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  generationMetadata: jsonb("generation_metadata"),
  videoRequestId: text("video_request_id"), // Fal.ai request ID for resuming polling
  videoRequestStatus: text("video_request_status"), // "processing", "completed", "failed"
  scheduledFor: timestamp("scheduled_for"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  platform: text("platform").notNull(),
  accountName: text("account_name").notNull(),
  accountHandle: text("account_handle"),
  profileUrl: text("profile_url"),
  isConnected: text("is_connected").notNull().default("pending"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  platformAccountId: text("platform_account_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBrandBriefSchema = createInsertSchema(brandBriefs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeneratedContentSchema = createInsertSchema(generatedContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({
  id: true,
  createdAt: true,
});

export const promptFeedback = pgTable("prompt_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  briefId: varchar("brief_id").references(() => brandBriefs.id),
  contentId: varchar("content_id").references(() => generatedContent.id),
  feedbackType: text("feedback_type").notNull(), // "video_rejection", "content_rejection", "image_rejection"
  originalPrompt: text("original_prompt"),
  negativePrompt: text("negative_prompt"),
  rejectionReason: text("rejection_reason").notNull(),
  avoidPatterns: text("avoid_patterns").array(), // Extracted patterns to avoid
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPromptFeedbackSchema = createInsertSchema(promptFeedback).omit({
  id: true,
  createdAt: true,
});

export type InsertPromptFeedback = z.infer<typeof insertPromptFeedbackSchema>;
export type PromptFeedback = typeof promptFeedback.$inferSelect;

// Analytics snapshots from uploaded screenshots
export const analyticsSnapshots = pgTable("analytics_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  accountId: varchar("account_id").references(() => socialAccounts.id), // Which specific account this snapshot belongs to
  platform: text("platform").notNull(), // "tiktok", "instagram", "youtube"
  sourceType: text("source_type").notNull().default("upload"), // "upload" or "api"
  reportingRange: text("reporting_range"), // "7 days", "28 days", "60 days", etc.
  capturedAt: timestamp("captured_at"), // When the screenshot was taken
  imageUrl: text("image_url"), // Stored screenshot URL
  
  // Overview metrics
  postViews: integer("post_views"),
  profileViews: integer("profile_views"),
  likes: integer("likes"),
  comments: integer("comments"),
  shares: integer("shares"),
  followers: integer("followers"),
  followersChange: integer("followers_change"),
  
  // Audience demographics
  audienceData: jsonb("audience_data"), // { gender: {male: 52, female: 45, other: 3}, age: {...}, locations: [...] }
  
  // Top performing posts
  topPosts: jsonb("top_posts"), // [{ title, views, likes, postedOn, rank }, ...]
  
  // Traffic sources
  trafficSources: jsonb("traffic_sources"), // { forYou: 92.2, search: 4.3, ... }
  
  // Search queries that led to discovery
  searchQueries: jsonb("search_queries"), // [{ query: "...", percentage: 0.2 }, ...]
  
  // Best times to post
  bestTimes: jsonb("best_times"), // { day: "Monday", time: "8pm-9pm", hourlyData: [...] }
  
  // Raw AI extraction for debugging
  rawExtraction: jsonb("raw_extraction"),
  confidenceScore: integer("confidence_score"), // 0-100
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAnalyticsSnapshotSchema = createInsertSchema(analyticsSnapshots).omit({
  id: true,
  createdAt: true,
});

export type InsertAnalyticsSnapshot = z.infer<typeof insertAnalyticsSnapshotSchema>;
export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;

// Social listening - posts found matching keywords
export const listeningHits = pgTable("listening_hits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  briefId: varchar("brief_id").references(() => brandBriefs.id),
  platform: text("platform").notNull(), // "youtube", "tiktok", "instagram", "reddit", "twitter"
  postUrl: text("post_url"),
  postId: text("post_id"), // Platform-specific post ID
  authorName: text("author_name"),
  authorHandle: text("author_handle"),
  authorProfileUrl: text("author_profile_url"),
  postContent: text("post_content").notNull(),
  postType: text("post_type").notNull().default("comment"), // "comment", "post", "question", "mention"
  matchedKeywords: text("matched_keywords").array(),
  sentiment: text("sentiment"), // "positive", "negative", "neutral", "question"
  engagementScore: integer("engagement_score"), // likes + comments + shares
  likes: integer("likes"),
  comments: integer("comments"),
  shares: integer("shares"),
  isQuestion: text("is_question").default("no"), // "yes", "no"
  isTrending: text("is_trending").default("no"), // "yes", "no"
  replyStatus: text("reply_status").default("pending"), // "pending", "drafted", "replied", "ignored"
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertListeningHitSchema = createInsertSchema(listeningHits).omit({
  id: true,
  createdAt: true,
});

export type InsertListeningHit = z.infer<typeof insertListeningHitSchema>;
export type ListeningHit = typeof listeningHits.$inferSelect;

// AI-generated reply drafts
export const replyDrafts = pgTable("reply_drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  listeningHitId: varchar("listening_hit_id").references(() => listeningHits.id),
  briefId: varchar("brief_id").references(() => brandBriefs.id),
  replyContent: text("reply_content").notNull(),
  replyTone: text("reply_tone"), // "helpful", "promotional", "educational", "friendly"
  status: text("status").default("draft"), // "draft", "approved", "posted", "rejected"
  generationMetadata: jsonb("generation_metadata"), // AI model info, prompt used, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertReplyDraftSchema = createInsertSchema(replyDrafts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReplyDraft = z.infer<typeof insertReplyDraftSchema>;
export type ReplyDraft = typeof replyDrafts.$inferSelect;

// Trending topics in niche
export const trendingTopics = pgTable("trending_topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  briefId: varchar("brief_id").references(() => brandBriefs.id),
  topic: text("topic").notNull(),
  keywords: text("keywords").array(),
  platform: text("platform"), // null = all platforms
  mentionCount: integer("mention_count").default(0),
  engagementTotal: integer("engagement_total").default(0),
  sentiment: text("sentiment"), // "positive", "negative", "neutral", "mixed"
  trendScore: integer("trend_score").default(0), // Calculated virality score
  examplePosts: jsonb("example_posts"), // Sample posts for this topic
  discoveredAt: timestamp("discovered_at").notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
});

export const insertTrendingTopicSchema = createInsertSchema(trendingTopics).omit({
  id: true,
  discoveredAt: true,
  lastSeenAt: true,
});

export type InsertTrendingTopic = z.infer<typeof insertTrendingTopicSchema>;
export type TrendingTopic = typeof trendingTopics.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBrandBrief = z.infer<typeof insertBrandBriefSchema>;
export type BrandBrief = typeof brandBriefs.$inferSelect;
export type InsertGeneratedContent = z.infer<typeof insertGeneratedContentSchema>;
export type GeneratedContent = typeof generatedContent.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;
