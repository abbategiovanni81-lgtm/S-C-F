import { db } from "./db";
import { users, brandBriefs, generatedContent, socialAccounts, promptFeedback } from "@shared/schema";
import type { 
  User, 
  InsertUser, 
  BrandBrief, 
  InsertBrandBrief,
  GeneratedContent,
  InsertGeneratedContent,
  SocialAccount,
  InsertSocialAccount,
  PromptFeedback,
  InsertPromptFeedback
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getBrandBrief(id: string): Promise<BrandBrief | undefined>;
  getBrandBriefsByUser(userId: string): Promise<BrandBrief[]>;
  createBrandBrief(brief: InsertBrandBrief): Promise<BrandBrief>;
  updateBrandBrief(id: string, brief: Partial<InsertBrandBrief>): Promise<BrandBrief | undefined>;
  
  getGeneratedContent(id: string): Promise<GeneratedContent | undefined>;
  getContentByBrief(briefId: string): Promise<GeneratedContent[]>;
  getContentByStatus(status: string): Promise<GeneratedContent[]>;
  createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent>;
  updateGeneratedContent(id: string, content: Partial<InsertGeneratedContent>): Promise<GeneratedContent | undefined>;

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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser & { id?: string }): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  async ensureUser(userId: string): Promise<User> {
    let user = await this.getUser(userId);
    if (!user) {
      const result = await db.insert(users).values({ 
        id: userId, 
        username: userId, 
        password: "demo" 
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
}

export const storage = new DatabaseStorage();
