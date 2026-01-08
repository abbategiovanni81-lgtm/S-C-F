import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models (users and sessions tables)
export * from "./models/auth";
import { users } from "./models/auth";

export interface ScenePrompt {
  sceneNumber: number;
  duration: number;
  visualPrompt: string;
  sceneDescription: string;
}

export const ACCOUNT_TYPES = ["brand", "influencer", "ugc", "educator"] as const;
export type AccountType = typeof ACCOUNT_TYPES[number];

export const brandBriefs = pgTable("brand_briefs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  accountType: text("account_type").notNull().default("brand"),
  brandVoice: text("brand_voice").notNull(),
  targetAudience: text("target_audience").notNull(),
  contentGoals: text("content_goals").notNull(),
  linksToInclude: text("links_to_include"),
  postingFrequency: text("posting_frequency").notNull(),
  platforms: text("platforms").array().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ASSET_TYPES = ["screenshot", "product", "logo", "headshot", "lifestyle", "testimonial", "other"] as const;
export type AssetType = typeof ASSET_TYPES[number];

export const brandAssets = pgTable("brand_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  briefId: varchar("brief_id").notNull().references(() => brandBriefs.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  assetType: text("asset_type").notNull().default("other"),
  name: text("name").notNull(),
  referenceSlug: text("reference_slug"),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBrandAssetSchema = createInsertSchema(brandAssets).omit({
  id: true,
  createdAt: true,
});

export type InsertBrandAsset = z.infer<typeof insertBrandAssetSchema>;
export type BrandAsset = typeof brandAssets.$inferSelect;

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
  archivedAt: timestamp("archived_at"), // Null = not archived, timestamp = archived
  deletedAt: timestamp("deleted_at"), // Null = not deleted, timestamp = soft deleted
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

export const userApiKeys = pgTable("user_api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  openaiKey: text("openai_key"),
  anthropicKey: text("anthropic_key"),
  elevenlabsKey: text("elevenlabs_key"),
  a2eKey: text("a2e_key"),
  falKey: text("fal_key"),
  pexelsKey: text("pexels_key"),
  steveaiKey: text("steveai_key"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserApiKeysSchema = createInsertSchema(userApiKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserApiKeys = z.infer<typeof insertUserApiKeysSchema>;
export type UserApiKeys = typeof userApiKeys.$inferSelect;

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
  sourceUrl: text("source_url"), // Original viral post URL this comment came from
  sourceTitle: text("source_title"), // Title of the source video/post
  sourceChannel: text("source_channel"), // Channel/account name of source
  opportunityScore: integer("opportunity_score"), // AI-calculated engagement opportunity (0-100)
  scanType: text("scan_type").default("keyword"), // "keyword", "viral_url", "manual"
  commentTypes: text("comment_types").array(), // AI-classified: "question", "disagreeing", "wants_info", "expert", "most_liked"
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

// Listening scan runs - tracks Apify scraper runs
export const listeningScanRuns = pgTable("listening_scan_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  briefId: varchar("brief_id").references(() => brandBriefs.id),
  platform: text("platform").notNull(), // instagram, tiktok, reddit, youtube
  actorId: text("actor_id").notNull(), // Apify actor ID used
  apifyRunId: text("apify_run_id"), // Run ID from Apify
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  keywords: text("keywords").array(), // Keywords used for this scan
  itemsFound: integer("items_found").default(0),
  itemsImported: integer("items_imported").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertListeningScanRunSchema = createInsertSchema(listeningScanRuns).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export type InsertListeningScanRun = z.infer<typeof insertListeningScanRunSchema>;
export type ListeningScanRun = typeof listeningScanRuns.$inferSelect;

// Scheduled posts - for both YouTube auto-posting and manual platform tracking
export const scheduledPosts = pgTable("scheduled_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  contentId: varchar("content_id").references(() => generatedContent.id), // Optional link to generated content
  accountId: varchar("account_id").references(() => socialAccounts.id), // Optional link to connected account
  
  // Core scheduling info
  platform: text("platform").notNull(), // "youtube", "instagram", "tiktok", "twitter", "linkedin", "facebook"
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
  timezone: text("timezone").notNull().default("UTC"), // IANA timezone string
  
  // Content info (can be from generated content or manual entry)
  title: text("title"),
  description: text("description"),
  hashtags: text("hashtags").array(),
  mediaUrl: text("media_url"), // Video/image URL if available
  mediaType: text("media_type"), // "video", "image", "carousel", "text"
  
  // Status tracking
  status: text("status").notNull().default("planned"), // "planned", "scheduled", "uploading", "published", "failed", "cancelled"
  postType: text("post_type").notNull().default("manual"), // "auto" (YouTube scheduled), "manual" (tracking only)
  
  // YouTube-specific fields (for auto-posting)
  youtubeVideoId: text("youtube_video_id"), // Set after upload
  youtubePrivacyStatus: text("youtube_privacy_status"), // "private", "unlisted", "public"
  uploadError: text("upload_error"), // Error message if failed
  
  // Notes for manual tracking
  notes: text("notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  publishedAt: timestamp("published_at"), // When actually posted
});

export const insertScheduledPostSchema = createInsertSchema(scheduledPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export type InsertScheduledPost = z.infer<typeof insertScheduledPostSchema>;
export type ScheduledPost = typeof scheduledPosts.$inferSelect;

export type InsertBrandBrief = z.infer<typeof insertBrandBriefSchema>;
export type BrandBrief = typeof brandBriefs.$inferSelect;
export type InsertGeneratedContent = z.infer<typeof insertGeneratedContentSchema>;
export type GeneratedContent = typeof generatedContent.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;

// Reddit Subreddits for auto-posting
export const redditSubreddits = pgTable("reddit_subreddits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(), // subreddit name without r/
  displayName: text("display_name"),
  description: text("description"),
  subscribers: integer("subscribers"),
  isActive: text("is_active").notNull().default("true"), // Whether to include in auto-posting
  postFrequency: text("post_frequency").default("daily"), // "daily", "weekly", "custom"
  lastPostedAt: timestamp("last_posted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRedditSubredditSchema = createInsertSchema(redditSubreddits).omit({
  id: true,
  createdAt: true,
});

export type InsertRedditSubreddit = z.infer<typeof insertRedditSubredditSchema>;
export type RedditSubreddit = typeof redditSubreddits.$inferSelect;

// Reddit Posts tracking for A2E SEO Bonus
export const redditPosts = pgTable("reddit_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subredditId: varchar("subreddit_id").references(() => redditSubreddits.id),
  subredditName: text("subreddit_name").notNull(),
  redditPostId: text("reddit_post_id"), // Reddit's post ID after submission
  title: text("title").notNull(),
  body: text("body").notNull(),
  referralLink: text("referral_link").notNull(), // A2E referral link
  postUrl: text("post_url"), // Full URL to the post
  status: text("status").notNull().default("pending"), // "pending", "posted", "failed", "deleted"
  errorMessage: text("error_message"),
  creditsEarned: integer("credits_earned").default(0), // Tracking A2E credits
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRedditPostSchema = createInsertSchema(redditPosts).omit({
  id: true,
  createdAt: true,
});

export type InsertRedditPost = z.infer<typeof insertRedditPostSchema>;
export type RedditPost = typeof redditPosts.$inferSelect;

// Video to Clips - Processing Jobs
export const VIDEO_JOB_STATUS = ["pending", "downloading", "transcribing", "analyzing", "extracting", "completed", "failed"] as const;
export type VideoJobStatus = typeof VIDEO_JOB_STATUS[number];

export const videoJobs = pgTable("video_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  sourceType: text("source_type").notNull(), // "upload" or "url"
  sourceUrl: text("source_url"), // Original URL if from URL source
  videoPath: text("video_path"), // Cloud storage path to uploaded/downloaded video
  status: text("status").notNull().default("pending"),
  progress: integer("progress").default(0), // 0-100
  errorMessage: text("error_message"),
  transcript: text("transcript"), // Full transcript from Whisper
  transcriptSegments: jsonb("transcript_segments"), // Timestamped segments
  suggestions: text("suggestions").array(), // User-selected suggestion IDs
  customPrompt: text("custom_prompt"), // User's custom prompt
  duration: integer("duration"), // Video duration in seconds
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertVideoJobSchema = createInsertSchema(videoJobs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertVideoJob = z.infer<typeof insertVideoJobSchema>;
export type VideoJob = typeof videoJobs.$inferSelect;

// Video to Clips - Generated Clips
export const videoClips = pgTable("video_clips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => videoJobs.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  transcript: text("transcript").notNull(),
  startTime: integer("start_time").notNull(), // Start time in seconds
  endTime: integer("end_time").notNull(), // End time in seconds
  score: integer("score").default(0), // AI confidence score 0-100
  clipPath: text("clip_path"), // Cloud storage path to extracted clip
  thumbnailPath: text("thumbnail_path"), // Thumbnail image path
  status: text("status").notNull().default("pending"), // "pending", "extracting", "ready", "failed"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVideoClipSchema = createInsertSchema(videoClips).omit({
  id: true,
  createdAt: true,
});

export type InsertVideoClip = z.infer<typeof insertVideoClipSchema>;
export type VideoClip = typeof videoClips.$inferSelect;
