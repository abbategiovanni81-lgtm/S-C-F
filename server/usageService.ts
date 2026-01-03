import { db } from "./db";
import { users, usagePeriods, usageTopups, TIER_LIMITS, CREATOR_STUDIO_LIMITS, type TierType } from "@shared/models/auth";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export type UsageType = "brandBriefs" | "scripts" | "voiceovers" | "a2eVideos" | "lipsync" | "avatars" | "dalleImages" | "soraVideos" | "socialListening" | "contentComparisons" | "steveAIVideos" | "steveAIGenerative" | "steveAIImages";

export type CreatorStudioUsageType = "voiceClones" | "talkingPhotos" | "talkingVideos" | "faceSwaps" | "aiDubbing" | "imageToVideo" | "captionRemoval" | "videoToVideo" | "virtualTryOn" | "imageReformat";

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
  contentComparisons: "contentComparisonsUsed",
  steveAIVideos: "steveAIVideosUsed",
  steveAIGenerative: "steveAIGenerativeUsed",
  steveAIImages: "steveAIImagesUsed",
} as const;

const creatorStudioColumnMap = {
  voiceClones: "voiceClonesUsed",
  talkingPhotos: "talkingPhotosUsed",
  talkingVideos: "talkingVideosUsed",
  faceSwaps: "faceSwapsUsed",
  aiDubbing: "aiDubbingUsed",
  imageToVideo: "imageToVideoUsed",
  captionRemoval: "captionRemovalUsed",
  videoToVideo: "videoToVideoUsed",
  virtualTryOn: "virtualTryOnUsed",
  imageReformat: "imageReformatUsed",
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
  contentComparisons: "contentComparisons",
  steveAIVideos: "steveAIVideos",
  steveAIGenerative: "steveAIGenerative",
  steveAIImages: "steveAIImages",
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
  const hasCreatorStudio = user?.creatorStudioAccess || false;

  const topupMultiplier = period.topupMultiplier || 0;

  const getLimit = (base: number) => {
    if (base === -1) return -1; // Unlimited
    return Math.floor(base * (1 + topupMultiplier));
  };

  // Studio tier always has Creator Studio access
  const effectiveCreatorStudio = tier === "studio" || hasCreatorStudio;
  
  return {
    period: {
      start: period.periodStart,
      end: period.periodEnd,
    },
    tier,
    topupMultiplier,
    hasCreatorStudio: effectiveCreatorStudio,
    socialChannels: (limits as any).socialChannels || 0,
    allowedApis: (limits as any).allowedApis || ["all"],
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
      contentComparisons: { used: (period as any).contentComparisonsUsed || 0, limit: getLimit((limits as any).contentComparisons || 0) },
      // Steve AI usage (Studio tier only)
      steveAIVideos: { used: (period as any).steveAIVideosUsed || 0, limit: getLimit((limits as any).steveAIVideos || 0) },
      steveAIGenerative: { used: (period as any).steveAIGenerativeUsed || 0, limit: getLimit((limits as any).steveAIGenerative || 0) },
      steveAIImages: { used: (period as any).steveAIImagesUsed || 0, limit: getLimit((limits as any).steveAIImages || 0) },
    },
    creatorStudioUsage: effectiveCreatorStudio ? {
      voiceClones: { used: period.voiceClonesUsed || 0, limit: CREATOR_STUDIO_LIMITS.voiceClones },
      talkingPhotos: { used: period.talkingPhotosUsed || 0, limit: CREATOR_STUDIO_LIMITS.talkingPhotos },
      talkingVideos: { used: period.talkingVideosUsed || 0, limit: CREATOR_STUDIO_LIMITS.talkingVideos },
      faceSwaps: { used: period.faceSwapsUsed || 0, limit: CREATOR_STUDIO_LIMITS.faceSwaps },
      aiDubbing: { used: period.aiDubbingUsed || 0, limit: CREATOR_STUDIO_LIMITS.aiDubbing },
      imageToVideo: { used: period.imageToVideoUsed || 0, limit: CREATOR_STUDIO_LIMITS.imageToVideo },
      captionRemoval: { used: period.captionRemovalUsed || 0, limit: CREATOR_STUDIO_LIMITS.captionRemoval },
      videoToVideo: { used: period.videoToVideoUsed || 0, limit: CREATOR_STUDIO_LIMITS.videoToVideo },
      virtualTryOn: { used: period.virtualTryOnUsed || 0, limit: CREATOR_STUDIO_LIMITS.virtualTryOn },
      imageReformat: { used: (period as any).imageReformatUsed || 0, limit: CREATOR_STUDIO_LIMITS.imageReformat },
    } : null,
    usesAppApis: limits.usesAppApis,
  };
}

export async function checkQuota(userId: string, usageType: UsageType, count: number = 1): Promise<{ allowed: boolean; remaining: number; limit: number; used: number; tierBlocked?: boolean }> {
  const stats = await getUsageStats(userId);
  const usage = stats.usage[usageType];

  // Free tier can only use scripts and images (dalleImages with own API)
  if (stats.tier === "free") {
    const freeAllowed = ["brandBriefs", "scripts", "dalleImages"];
    if (!freeAllowed.includes(usageType)) {
      return { allowed: false, remaining: 0, limit: 0, used: 0, tierBlocked: true };
    }
  }

  // Steve AI features only for Studio tier
  if (usageType.startsWith("steveAI") && stats.tier !== "studio") {
    return { allowed: false, remaining: 0, limit: 0, used: 0, tierBlocked: true };
  }

  // Core tier must use own APIs for most features
  // But some features like contentComparisons have explicit quotas even for Core
  if (stats.tier === "core" && !stats.usesAppApis && usageType !== "brandBriefs") {
    // Core has -1 (unlimited) for most things when using own APIs
    if (usage.limit === -1) {
      return { allowed: true, remaining: Infinity, limit: -1, used: usage.used };
    }
    // Core tier can still use features with explicit finite quotas (like contentComparisons)
    if (usage.limit > 0) {
      const remaining = usage.limit - usage.used;
      return { allowed: remaining >= count, remaining, limit: usage.limit, used: usage.used };
    }
  }

  // Premium/Pro/Studio use platform APIs with quotas
  if (!stats.usesAppApis && usageType !== "brandBriefs" && stats.tier !== "core") {
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

// Check social channel limit for a user's tier
export async function checkSocialChannelLimit(userId: string): Promise<{ allowed: boolean; limit: number; used: number }> {
  const stats = await getUsageStats(userId);
  const limit = stats.socialChannels;
  
  // Count existing social accounts
  const { socialAccounts } = await import("@shared/schema");
  const accounts = await db.select().from(socialAccounts).where(eq(socialAccounts.userId, userId));
  const used = accounts.length;
  
  return {
    allowed: used < limit,
    limit,
    used,
  };
}

// Creator Studio quota checking
export async function checkCreatorStudioQuota(userId: string, usageType: CreatorStudioUsageType, count: number = 1): Promise<{ allowed: boolean; remaining: number; limit: number; used: number; hasAccess: boolean }> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  // Studio tier has Creator Studio included
  const hasAccess = user?.tier === "studio" || user?.creatorStudioAccess;
  
  if (!hasAccess) {
    return { allowed: false, remaining: 0, limit: 0, used: 0, hasAccess: false };
  }

  const period = await getCurrentPeriod(userId);
  const limit = CREATOR_STUDIO_LIMITS[usageType];
  const columnName = creatorStudioColumnMap[usageType];
  const used = (period as any)[columnName] || 0;
  const remaining = limit - used;
  const allowed = remaining >= count;

  return { allowed, remaining, limit, used, hasAccess: true };
}

export async function incrementCreatorStudioUsage(userId: string, usageType: CreatorStudioUsageType, count: number = 1): Promise<void> {
  const period = await getCurrentPeriod(userId);
  const columnName = creatorStudioColumnMap[usageType];
  
  await db
    .update(usagePeriods)
    .set({
      [columnName]: sql`${usagePeriods[columnName]} + ${count}`,
    })
    .where(eq(usagePeriods.id, period.id));
}

export async function assertCreatorStudioQuota(userId: string, usageType: CreatorStudioUsageType, count: number = 1): Promise<void> {
  const check = await checkCreatorStudioQuota(userId, usageType, count);
  
  if (!check.hasAccess) {
    throw new CreatorStudioAccessError("Creator Studio access required. Subscribe for £20/month to unlock these features.");
  }
  
  if (!check.allowed) {
    throw new QuotaExceededError(
      `Monthly ${usageType} limit reached (${check.used}/${check.limit}). Wait until next month.`,
      usageType as any,
      check
    );
  }
}

export class CreatorStudioAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreatorStudioAccessError";
  }
}

// Get total Creator Studio users for capacity planning
export async function getCreatorStudioUserCount(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.creatorStudioAccess, true));
  return result[0]?.count || 0;
}

// A2E capacity check for admin alerts (5,400 credits per account)
export async function getA2ECapacityStatus(): Promise<{
  creatorStudioUsers: number;
  creditsPerUser: number;
  totalCreditsNeeded: number;
  accountsNeeded: number;
  capacityWarning: boolean;
}> {
  const userCount = await getCreatorStudioUserCount();
  const creditsPerUser = 1300; // Based on CREATOR_STUDIO_LIMITS
  const creditsPerAccount = 5400;
  const totalCreditsNeeded = userCount * creditsPerUser;
  const accountsNeeded = Math.ceil(totalCreditsNeeded / creditsPerAccount);
  
  // Warning if we need more than 1 account (adjustable threshold)
  const capacityWarning = accountsNeeded > 1;
  
  return {
    creatorStudioUsers: userCount,
    creditsPerUser,
    totalCreditsNeeded,
    accountsNeeded,
    capacityWarning,
  };
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
