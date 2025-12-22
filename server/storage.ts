import { db } from "./db";
import { users, brandBriefs, generatedContent, socialAccounts, promptFeedback, analyticsSnapshots, listeningHits, replyDrafts, trendingTopics, listeningScanRuns, scheduledPosts } from "@shared/schema";
import type { 
  User, 
  UpsertUser, 
  BrandBrief, 
  InsertBrandBrief,
  GeneratedContent,
  InsertGeneratedContent,
  SocialAccount,
  InsertSocialAccount,
  PromptFeedback,
  InsertPromptFeedback,
  AnalyticsSnapshot,
  InsertAnalyticsSnapshot,
  ListeningHit,
  InsertListeningHit,
  ReplyDraft,
  InsertReplyDraft,
  TrendingTopic,
  InsertTrendingTopic,
  ListeningScanRun,
  InsertListeningScanRun,
  ScheduledPost,
  InsertScheduledPost
} from "@shared/schema";
import { eq, and, desc, gte, lte, between } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  
  getBrandBrief(id: string): Promise<BrandBrief | undefined>;
  getBrandBriefsByUser(userId: string): Promise<BrandBrief[]>;
  createBrandBrief(brief: InsertBrandBrief): Promise<BrandBrief>;
  updateBrandBrief(id: string, brief: Partial<InsertBrandBrief>): Promise<BrandBrief | undefined>;
  
  getGeneratedContent(id: string): Promise<GeneratedContent | undefined>;
  getContentByBrief(briefId: string): Promise<GeneratedContent[]>;
  getContentByStatus(status: string): Promise<GeneratedContent[]>;
  createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent>;
  updateGeneratedContent(id: string, content: Partial<InsertGeneratedContent>): Promise<GeneratedContent | undefined>;

  getSocialAccount(id: string): Promise<SocialAccount | undefined>;
  getSocialAccountsByUser(userId: string): Promise<SocialAccount[]>;
  getSocialAccountByPlatform(userId: string, platform: string): Promise<SocialAccount | undefined>;
  getSocialAccountByPlatformAccountId(userId: string, platform: string, platformAccountId: string): Promise<SocialAccount | undefined>;
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  updateSocialAccount(id: string, data: Partial<InsertSocialAccount>): Promise<SocialAccount | undefined>;
  deleteSocialAccount(id: string): Promise<void>;

  createPromptFeedback(feedback: InsertPromptFeedback): Promise<PromptFeedback>;
  getPromptFeedbackByBrief(briefId: string): Promise<PromptFeedback[]>;
  getGlobalPromptFeedback(): Promise<PromptFeedback[]>;
  getAvoidPatternsForBrief(briefId: string | null): Promise<string[]>;

  createAnalyticsSnapshot(snapshot: InsertAnalyticsSnapshot): Promise<AnalyticsSnapshot>;
  getAnalyticsSnapshots(userId?: string): Promise<AnalyticsSnapshot[]>;
  getAnalyticsSnapshotsByPlatform(platform: string, userId?: string): Promise<AnalyticsSnapshot[]>;
  getTopPerformingPatterns(userId?: string): Promise<{ title: string; views: number; postedOn?: string }[]>;

  // Social Listening
  createListeningHit(hit: InsertListeningHit): Promise<ListeningHit>;
  getListeningHits(userId?: string, status?: string): Promise<ListeningHit[]>;
  getListeningHitsByBrief(briefId: string): Promise<ListeningHit[]>;
  updateListeningHit(id: string, data: Partial<InsertListeningHit>): Promise<ListeningHit | undefined>;
  
  createReplyDraft(draft: InsertReplyDraft): Promise<ReplyDraft>;
  getReplyDrafts(userId?: string, status?: string): Promise<ReplyDraft[]>;
  getReplyDraftByHit(hitId: string): Promise<ReplyDraft | undefined>;
  updateReplyDraft(id: string, data: Partial<InsertReplyDraft>): Promise<ReplyDraft | undefined>;
  
  createTrendingTopic(topic: InsertTrendingTopic): Promise<TrendingTopic>;
  getTrendingTopics(userId?: string, briefId?: string): Promise<TrendingTopic[]>;
  updateTrendingTopic(id: string, data: Partial<InsertTrendingTopic>): Promise<TrendingTopic | undefined>;

  // Scan runs
  createScanRun(run: InsertListeningScanRun): Promise<ListeningScanRun>;
  getScanRuns(userId?: string, briefId?: string): Promise<ListeningScanRun[]>;
  updateScanRun(id: string, data: Partial<InsertListeningScanRun>): Promise<ListeningScanRun | undefined>;
  checkDuplicateHit(platform: string, postId: string): Promise<boolean>;

  // Scheduled posts
  createScheduledPost(post: InsertScheduledPost): Promise<ScheduledPost>;
  getScheduledPost(id: string): Promise<ScheduledPost | undefined>;
  getScheduledPostsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<ScheduledPost[]>;
  getScheduledPostsByStatus(status: string): Promise<ScheduledPost[]>;
  getPendingYouTubeUploads(): Promise<ScheduledPost[]>;
  updateScheduledPost(id: string, data: Partial<InsertScheduledPost>): Promise<ScheduledPost | undefined>;
  deleteScheduledPost(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: UpsertUser): Promise<User> {
    // Automatically assign "owner" tier to the owner email
    const tier = insertUser.email === "gio.abbate@hotmail.com" ? "owner" : (insertUser.tier || "free");
    const result = await db.insert(users).values({ ...insertUser, tier }).returning();
    return result[0];
  }
  
  async ensureUser(userId: string): Promise<User> {
    let user = await this.getUser(userId);
    if (!user) {
      const result = await db.insert(users).values({ 
        id: userId, 
        email: `${userId}@demo.local`
      }).returning();
      user = result[0];
    }
    return user;
  }

  async getBrandBrief(id: string): Promise<BrandBrief | undefined> {
    const result = await db.select().from(brandBriefs).where(eq(brandBriefs.id, id)).limit(1);
    return result[0];
  }

  async getBrandBriefsByUser(userId: string): Promise<BrandBrief[]> {
    return await db.select().from(brandBriefs).where(eq(brandBriefs.userId, userId));
  }

  async createBrandBrief(brief: InsertBrandBrief): Promise<BrandBrief> {
    const result = await db.insert(brandBriefs).values(brief).returning();
    return result[0];
  }

  async updateBrandBrief(id: string, brief: Partial<InsertBrandBrief>): Promise<BrandBrief | undefined> {
    const result = await db.update(brandBriefs)
      .set({ ...brief, updatedAt: new Date() })
      .where(eq(brandBriefs.id, id))
      .returning();
    return result[0];
  }

  async getGeneratedContent(id: string): Promise<GeneratedContent | undefined> {
    const result = await db.select().from(generatedContent).where(eq(generatedContent.id, id)).limit(1);
    return result[0];
  }

  async getContentByBrief(briefId: string): Promise<GeneratedContent[]> {
    return await db.select().from(generatedContent).where(eq(generatedContent.briefId, briefId));
  }

  async getContentByStatus(status: string): Promise<GeneratedContent[]> {
    return await db.select().from(generatedContent).where(eq(generatedContent.status, status));
  }

  async createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent> {
    const result = await db.insert(generatedContent).values(content).returning();
    return result[0];
  }

  async updateGeneratedContent(id: string, content: Partial<InsertGeneratedContent>): Promise<GeneratedContent | undefined> {
    const result = await db.update(generatedContent)
      .set({ ...content, updatedAt: new Date() })
      .where(eq(generatedContent.id, id))
      .returning();
    return result[0];
  }

  async getSocialAccount(id: string): Promise<SocialAccount | undefined> {
    const result = await db.select().from(socialAccounts).where(eq(socialAccounts.id, id)).limit(1);
    return result[0];
  }

  async getSocialAccountsByUser(userId: string): Promise<SocialAccount[]> {
    return await db.select().from(socialAccounts).where(eq(socialAccounts.userId, userId));
  }

  async getSocialAccountByPlatform(userId: string, platform: string): Promise<SocialAccount | undefined> {
    const result = await db.select().from(socialAccounts)
      .where(and(eq(socialAccounts.userId, userId), eq(socialAccounts.platform, platform)))
      .limit(1);
    return result[0];
  }

  async getSocialAccountByPlatformAccountId(userId: string, platform: string, platformAccountId: string): Promise<SocialAccount | undefined> {
    const result = await db.select().from(socialAccounts)
      .where(and(
        eq(socialAccounts.userId, userId), 
        eq(socialAccounts.platform, platform),
        eq(socialAccounts.platformAccountId, platformAccountId)
      ))
      .limit(1);
    return result[0];
  }

  async createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount> {
    const result = await db.insert(socialAccounts).values(account).returning();
    return result[0];
  }

  async updateSocialAccount(id: string, data: Partial<InsertSocialAccount>): Promise<SocialAccount | undefined> {
    const result = await db.update(socialAccounts)
      .set(data)
      .where(eq(socialAccounts.id, id))
      .returning();
    return result[0];
  }

  async deleteSocialAccount(id: string): Promise<void> {
    await db.delete(socialAccounts).where(eq(socialAccounts.id, id));
  }

  async createPromptFeedback(feedback: InsertPromptFeedback): Promise<PromptFeedback> {
    const result = await db.insert(promptFeedback).values(feedback).returning();
    return result[0];
  }

  async getPromptFeedbackByBrief(briefId: string): Promise<PromptFeedback[]> {
    return await db.select().from(promptFeedback)
      .where(eq(promptFeedback.briefId, briefId))
      .orderBy(desc(promptFeedback.createdAt));
  }

  async getGlobalPromptFeedback(): Promise<PromptFeedback[]> {
    return await db.select().from(promptFeedback)
      .orderBy(desc(promptFeedback.createdAt))
      .limit(50);
  }

  async getAvoidPatternsForBrief(briefId: string | null): Promise<string[]> {
    let feedbackList: PromptFeedback[];
    if (briefId) {
      feedbackList = await db.select().from(promptFeedback)
        .where(eq(promptFeedback.briefId, briefId))
        .orderBy(desc(promptFeedback.createdAt))
        .limit(20);
    } else {
      feedbackList = await db.select().from(promptFeedback)
        .orderBy(desc(promptFeedback.createdAt))
        .limit(20);
    }
    
    const patterns = new Set<string>();
    for (const fb of feedbackList) {
      if (fb.avoidPatterns) {
        fb.avoidPatterns.forEach(p => patterns.add(p));
      }
    }
    return Array.from(patterns);
  }

  async createAnalyticsSnapshot(snapshot: InsertAnalyticsSnapshot): Promise<AnalyticsSnapshot> {
    const result = await db.insert(analyticsSnapshots).values(snapshot).returning();
    return result[0];
  }

  async getAnalyticsSnapshots(userId?: string): Promise<AnalyticsSnapshot[]> {
    if (userId) {
      return await db.select().from(analyticsSnapshots)
        .where(eq(analyticsSnapshots.userId, userId))
        .orderBy(desc(analyticsSnapshots.createdAt));
    }
    return await db.select().from(analyticsSnapshots)
      .orderBy(desc(analyticsSnapshots.createdAt));
  }

  async getAnalyticsSnapshotsByPlatform(platform: string, userId?: string): Promise<AnalyticsSnapshot[]> {
    if (userId) {
      return await db.select().from(analyticsSnapshots)
        .where(and(eq(analyticsSnapshots.platform, platform), eq(analyticsSnapshots.userId, userId)))
        .orderBy(desc(analyticsSnapshots.createdAt));
    }
    return await db.select().from(analyticsSnapshots)
      .where(eq(analyticsSnapshots.platform, platform))
      .orderBy(desc(analyticsSnapshots.createdAt));
  }

  async getTopPerformingPatterns(userId?: string): Promise<{ title: string; views: number; postedOn?: string }[]> {
    const snapshots = await this.getAnalyticsSnapshots(userId);
    const allPosts: { title: string; views: number; postedOn?: string }[] = [];
    
    for (const snapshot of snapshots) {
      if (snapshot.topPosts && Array.isArray(snapshot.topPosts)) {
        for (const post of snapshot.topPosts as any[]) {
          if (post.title && post.views) {
            allPosts.push({
              title: post.title,
              views: post.views,
              postedOn: post.postedOn
            });
          }
        }
      }
    }
    
    return allPosts.sort((a, b) => b.views - a.views).slice(0, 10);
  }

  // Social Listening
  async createListeningHit(hit: InsertListeningHit): Promise<ListeningHit> {
    const result = await db.insert(listeningHits).values(hit).returning();
    return result[0];
  }

  async getListeningHits(userId?: string, status?: string): Promise<ListeningHit[]> {
    if (userId && status) {
      return await db.select().from(listeningHits)
        .where(and(eq(listeningHits.userId, userId), eq(listeningHits.replyStatus, status)))
        .orderBy(desc(listeningHits.createdAt));
    }
    if (userId) {
      return await db.select().from(listeningHits)
        .where(eq(listeningHits.userId, userId))
        .orderBy(desc(listeningHits.createdAt));
    }
    if (status) {
      return await db.select().from(listeningHits)
        .where(eq(listeningHits.replyStatus, status))
        .orderBy(desc(listeningHits.createdAt));
    }
    return await db.select().from(listeningHits).orderBy(desc(listeningHits.createdAt));
  }

  async getListeningHitsByBrief(briefId: string): Promise<ListeningHit[]> {
    return await db.select().from(listeningHits)
      .where(eq(listeningHits.briefId, briefId))
      .orderBy(desc(listeningHits.createdAt));
  }

  async updateListeningHit(id: string, data: Partial<InsertListeningHit>): Promise<ListeningHit | undefined> {
    const result = await db.update(listeningHits)
      .set(data)
      .where(eq(listeningHits.id, id))
      .returning();
    return result[0];
  }

  async createReplyDraft(draft: InsertReplyDraft): Promise<ReplyDraft> {
    const result = await db.insert(replyDrafts).values(draft).returning();
    return result[0];
  }

  async getReplyDrafts(userId?: string, status?: string): Promise<ReplyDraft[]> {
    if (userId && status) {
      return await db.select().from(replyDrafts)
        .where(and(eq(replyDrafts.userId, userId), eq(replyDrafts.status, status)))
        .orderBy(desc(replyDrafts.createdAt));
    }
    if (userId) {
      return await db.select().from(replyDrafts)
        .where(eq(replyDrafts.userId, userId))
        .orderBy(desc(replyDrafts.createdAt));
    }
    if (status) {
      return await db.select().from(replyDrafts)
        .where(eq(replyDrafts.status, status))
        .orderBy(desc(replyDrafts.createdAt));
    }
    return await db.select().from(replyDrafts).orderBy(desc(replyDrafts.createdAt));
  }

  async getReplyDraftByHit(hitId: string): Promise<ReplyDraft | undefined> {
    const result = await db.select().from(replyDrafts)
      .where(eq(replyDrafts.listeningHitId, hitId))
      .limit(1);
    return result[0];
  }

  async updateReplyDraft(id: string, data: Partial<InsertReplyDraft>): Promise<ReplyDraft | undefined> {
    const result = await db.update(replyDrafts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(replyDrafts.id, id))
      .returning();
    return result[0];
  }

  async createTrendingTopic(topic: InsertTrendingTopic): Promise<TrendingTopic> {
    const result = await db.insert(trendingTopics).values(topic).returning();
    return result[0];
  }

  async getTrendingTopics(userId?: string, briefId?: string): Promise<TrendingTopic[]> {
    if (userId && briefId) {
      return await db.select().from(trendingTopics)
        .where(and(eq(trendingTopics.userId, userId), eq(trendingTopics.briefId, briefId)))
        .orderBy(desc(trendingTopics.trendScore));
    }
    if (userId) {
      return await db.select().from(trendingTopics)
        .where(eq(trendingTopics.userId, userId))
        .orderBy(desc(trendingTopics.trendScore));
    }
    if (briefId) {
      return await db.select().from(trendingTopics)
        .where(eq(trendingTopics.briefId, briefId))
        .orderBy(desc(trendingTopics.trendScore));
    }
    return await db.select().from(trendingTopics).orderBy(desc(trendingTopics.trendScore));
  }

  async updateTrendingTopic(id: string, data: Partial<InsertTrendingTopic>): Promise<TrendingTopic | undefined> {
    const result = await db.update(trendingTopics)
      .set({ ...data, lastSeenAt: new Date() })
      .where(eq(trendingTopics.id, id))
      .returning();
    return result[0];
  }

  async createScanRun(run: InsertListeningScanRun): Promise<ListeningScanRun> {
    const result = await db.insert(listeningScanRuns).values(run).returning();
    return result[0];
  }

  async getScanRuns(userId?: string, briefId?: string): Promise<ListeningScanRun[]> {
    if (userId && briefId) {
      return await db.select().from(listeningScanRuns)
        .where(and(eq(listeningScanRuns.userId, userId), eq(listeningScanRuns.briefId, briefId)))
        .orderBy(desc(listeningScanRuns.startedAt));
    }
    if (userId) {
      return await db.select().from(listeningScanRuns)
        .where(eq(listeningScanRuns.userId, userId))
        .orderBy(desc(listeningScanRuns.startedAt));
    }
    if (briefId) {
      return await db.select().from(listeningScanRuns)
        .where(eq(listeningScanRuns.briefId, briefId))
        .orderBy(desc(listeningScanRuns.startedAt));
    }
    return await db.select().from(listeningScanRuns).orderBy(desc(listeningScanRuns.startedAt));
  }

  async updateScanRun(id: string, data: Partial<InsertListeningScanRun>): Promise<ListeningScanRun | undefined> {
    const result = await db.update(listeningScanRuns)
      .set(data)
      .where(eq(listeningScanRuns.id, id))
      .returning();
    return result[0];
  }

  async checkDuplicateHit(platform: string, postId: string): Promise<boolean> {
    const result = await db.select({ id: listeningHits.id }).from(listeningHits)
      .where(and(eq(listeningHits.platform, platform), eq(listeningHits.postId, postId)))
      .limit(1);
    return result.length > 0;
  }

  // Scheduled posts implementation
  async createScheduledPost(post: InsertScheduledPost): Promise<ScheduledPost> {
    const result = await db.insert(scheduledPosts).values(post).returning();
    return result[0];
  }

  async getScheduledPost(id: string): Promise<ScheduledPost | undefined> {
    const result = await db.select().from(scheduledPosts).where(eq(scheduledPosts.id, id)).limit(1);
    return result[0];
  }

  async getScheduledPostsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<ScheduledPost[]> {
    if (startDate && endDate) {
      return await db.select().from(scheduledPosts)
        .where(and(
          eq(scheduledPosts.userId, userId),
          gte(scheduledPosts.scheduledFor, startDate),
          lte(scheduledPosts.scheduledFor, endDate)
        ))
        .orderBy(scheduledPosts.scheduledFor);
    }
    return await db.select().from(scheduledPosts)
      .where(eq(scheduledPosts.userId, userId))
      .orderBy(scheduledPosts.scheduledFor);
  }

  async getScheduledPostsByStatus(status: string): Promise<ScheduledPost[]> {
    return await db.select().from(scheduledPosts)
      .where(eq(scheduledPosts.status, status))
      .orderBy(scheduledPosts.scheduledFor);
  }

  async getPendingYouTubeUploads(): Promise<ScheduledPost[]> {
    return await db.select().from(scheduledPosts)
      .where(and(
        eq(scheduledPosts.platform, "youtube"),
        eq(scheduledPosts.postType, "auto"),
        eq(scheduledPosts.status, "scheduled"),
        lte(scheduledPosts.scheduledFor, new Date())
      ))
      .orderBy(scheduledPosts.scheduledFor);
  }

  async updateScheduledPost(id: string, data: Partial<InsertScheduledPost>): Promise<ScheduledPost | undefined> {
    const result = await db.update(scheduledPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(scheduledPosts.id, id))
      .returning();
    return result[0];
  }

  async deleteScheduledPost(id: string): Promise<void> {
    await db.delete(scheduledPosts).where(eq(scheduledPosts.id, id));
  }
}

export const storage = new DatabaseStorage();
