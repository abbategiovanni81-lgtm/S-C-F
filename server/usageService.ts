import { db } from "./db";
import { users, usagePeriods, usageTopups, TIER_LIMITS, type TierType } from "@shared/models/auth";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export type UsageType = "brandBriefs" | "scripts" | "voiceovers" | "a2eVideos" | "lipsync" | "avatars" | "dalleImages" | "soraVideos" | "socialListening";

const usageColumnMap = {
  brandBriefs: "brandBriefsUsed",
  scripts: "scriptsUsed",
  voiceovers: "voiceoversUsed",
  a2eVideos: "a2eVideosUsed",
  lipsync: "lipsyncUsed",
  avatars: "avatarsUsed",
  dalleImages: "dalleImagesUsed",
  soraVideos: "soraVideosUsed",
  socialListening: "socialListeningUsed",
} as const;

const limitKeyMap = {
  brandBriefs: "brandBriefs",
  scripts: "scripts",
  voiceovers: "voiceovers",
  a2eVideos: "a2eVideos",
  lipsync: "lipsync",
  avatars: "avatars",
  dalleImages: "dalleImages",
  soraVideos: "soraVideos",
  socialListening: "socialListeningKeywords",
} as const;

export async function getCurrentPeriod(userId: string) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [existing] = await db
    .select()
    .from(usagePeriods)
    .where(
      and(
        eq(usagePeriods.userId, userId),
        lte(usagePeriods.periodStart, now),
        gte(usagePeriods.periodEnd, now)
      )
    );

  if (existing) {
    return existing;
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const tierSnapshot = user?.tier || "free";

  const [newPeriod] = await db
    .insert(usagePeriods)
    .values({
      userId,
      periodStart,
      periodEnd,
      tierSnapshot,
    })
    .returning();

  return newPeriod;
}

export async function getUsageStats(userId: string) {
  const period = await getCurrentPeriod(userId);
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const tier = (user?.tier || "free") as TierType;
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  const topupMultiplier = period.topupMultiplier || 0;

  const getLimit = (base: number) => {
    if (base === -1) return -1; // Unlimited
    return Math.floor(base * (1 + topupMultiplier));
  };

  return {
    period: {
      start: period.periodStart,
      end: period.periodEnd,
    },
    tier,
    topupMultiplier,
    usage: {
      brandBriefs: { used: period.brandBriefsUsed, limit: getLimit(limits.brandBriefs) },
      scripts: { used: period.scriptsUsed, limit: getLimit(limits.scripts) },
      voiceovers: { used: period.voiceoversUsed, limit: getLimit(limits.voiceovers) },
      a2eVideos: { used: period.a2eVideosUsed, limit: getLimit(limits.a2eVideos) },
      lipsync: { used: period.lipsyncUsed, limit: getLimit(limits.lipsync) },
      avatars: { used: period.avatarsUsed, limit: getLimit(limits.avatars) },
      dalleImages: { used: period.dalleImagesUsed, limit: getLimit(limits.dalleImages) },
      soraVideos: { used: period.soraVideosUsed, limit: getLimit(limits.soraVideos) },
      socialListening: { used: period.socialListeningUsed, limit: getLimit(limits.socialListeningKeywords) },
    },
    usesAppApis: limits.usesAppApis,
  };
}

export async function checkQuota(userId: string, usageType: UsageType, count: number = 1): Promise<{ allowed: boolean; remaining: number; limit: number; used: number }> {
  const stats = await getUsageStats(userId);
  const usage = stats.usage[usageType];

  if (!stats.usesAppApis && usageType !== "brandBriefs") {
    return { allowed: false, remaining: 0, limit: 0, used: 0 };
  }

  // -1 means unlimited
  if (usage.limit === -1) {
    return { allowed: true, remaining: Infinity, limit: -1, used: usage.used };
  }

  const remaining = usage.limit - usage.used;
  const allowed = remaining >= count;

  return {
    allowed,
    remaining,
    limit: usage.limit,
    used: usage.used,
  };
}

export async function incrementUsage(userId: string, usageType: UsageType, count: number = 1): Promise<void> {
  const period = await getCurrentPeriod(userId);

  const columnName = usageColumnMap[usageType];
  
  await db
    .update(usagePeriods)
    .set({
      [columnName]: sql`${usagePeriods[columnName]} + ${count}`,
    })
    .where(eq(usagePeriods.id, period.id));
}

export async function applyTopup(userId: string, stripeSessionId: string, amount: number = 1000): Promise<boolean> {
  const period = await getCurrentPeriod(userId);

  const [existingTopup] = await db
    .select()
    .from(usageTopups)
    .where(eq(usageTopups.stripeSessionId, stripeSessionId));

  if (existingTopup) {
    console.log(`Top-up already processed for session: ${stripeSessionId}`);
    return false;
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const multiplier = user?.tier === "pro" ? 0.2 : 0.4;

  const [topup] = await db
    .insert(usageTopups)
    .values({
      usagePeriodId: period.id,
      userId,
      amount,
      multiplier,
      stripeSessionId,
      status: "completed",
    })
    .returning();

  await db
    .update(usagePeriods)
    .set({
      topupMultiplier: sql`${usagePeriods.topupMultiplier} + ${multiplier}`,
    })
    .where(eq(usagePeriods.id, period.id));

  return true;
}

export async function assertQuota(userId: string, usageType: UsageType, count: number = 1): Promise<void> {
  const check = await checkQuota(userId, usageType, count);
  
  if (!check.allowed) {
    const tierName = usageType === "brandBriefs" ? "brand brief" : usageType;
    throw new QuotaExceededError(
      `Monthly ${tierName} limit reached (${check.used}/${check.limit}). Top up or wait until next month.`,
      usageType,
      check
    );
  }
}

export class QuotaExceededError extends Error {
  constructor(
    message: string,
    public usageType: UsageType,
    public quota: { remaining: number; limit: number; used: number }
  ) {
    super(message);
    this.name = "QuotaExceededError";
  }
}
