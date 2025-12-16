import type { InsertListeningHit } from "@shared/schema";

const APIFY_API_BASE = "https://api.apify.com/v2";

export interface ApifyActorConfig {
  actorId: string;
  platform: string;
  searchField: string;
}

export const APIFY_ACTORS: Record<string, ApifyActorConfig> = {
  instagram: {
    actorId: "apify/instagram-scraper",
    platform: "instagram",
    searchField: "search",
  },
  instagramReels: {
    actorId: "apify/instagram-reel-scraper",
    platform: "instagram",
    searchField: "urls",
  },
  tiktokComments: {
    actorId: "clockworks/tiktok-comments-scraper",
    platform: "tiktok",
    searchField: "postURLs",
  },
  tiktokSearch: {
    actorId: "clockworks/tiktok-scraper",
    platform: "tiktok",
    searchField: "searchQueries",
  },
  reddit: {
    actorId: "trudax/reddit-scraper",
    platform: "reddit",
    searchField: "searches",
  },
  youtube: {
    actorId: "bernardo/youtube-scraper",
    platform: "youtube",
    searchField: "searchKeywords",
  },
};

export interface ApifyRunResult {
  runId: string;
  status: string;
  datasetId?: string;
}

export interface ApifyDatasetItem {
  [key: string]: any;
}

class ApifyService {
  private apiToken: string | null = null;

  isConfigured(): boolean {
    this.apiToken = process.env.APIFY_API_TOKEN || null;
    return !!this.apiToken;
  }

  async runActor(
    actorId: string,
    input: Record<string, any>
  ): Promise<ApifyRunResult> {
    if (!this.isConfigured()) {
      throw new Error("Apify API token not configured");
    }

    const response = await fetch(
      `${APIFY_API_BASE}/acts/${encodeURIComponent(actorId)}/runs?token=${this.apiToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Apify run failed: ${response.status} - ${text}`);
    }

    const data = await response.json();
    return {
      runId: data.data.id,
      status: data.data.status,
      datasetId: data.data.defaultDatasetId,
    };
  }

  async getRunStatus(runId: string): Promise<{ status: string; datasetId?: string }> {
    if (!this.isConfigured()) {
      throw new Error("Apify API token not configured");
    }

    const response = await fetch(
      `${APIFY_API_BASE}/actor-runs/${runId}?token=${this.apiToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get run status: ${response.status}`);
    }

    const data = await response.json();
    return {
      status: data.data.status,
      datasetId: data.data.defaultDatasetId,
    };
  }

  async fetchDatasetItems(datasetId: string): Promise<ApifyDatasetItem[]> {
    if (!this.isConfigured()) {
      throw new Error("Apify API token not configured");
    }

    const response = await fetch(
      `${APIFY_API_BASE}/datasets/${datasetId}/items?token=${this.apiToken}&format=json`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.status}`);
    }

    return response.json();
  }

  async runActorAndWait(
    actorId: string,
    input: Record<string, any>,
    timeoutMs: number = 300000
  ): Promise<ApifyDatasetItem[]> {
    const run = await this.runActor(actorId, input);
    
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getRunStatus(run.runId);
      
      if (status.status === "SUCCEEDED" && status.datasetId) {
        return this.fetchDatasetItems(status.datasetId);
      }
      
      if (status.status === "FAILED" || status.status === "ABORTED") {
        throw new Error(`Actor run ${status.status}`);
      }
      
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    
    throw new Error("Actor run timed out");
  }
}

export function normalizeInstagramItem(
  item: ApifyDatasetItem,
  keywords: string[],
  briefId: string | null
): Partial<InsertListeningHit> {
  const text = item.caption || item.text || "";
  const matchedKeywords = keywords.filter((kw) =>
    text.toLowerCase().includes(kw.toLowerCase())
  );

  return {
    platform: "instagram",
    postId: item.id || item.shortCode || null,
    postUrl: item.url || item.displayUrl || null,
    postContent: text,
    authorName: item.ownerFullName || item.ownerUsername || null,
    authorHandle: item.ownerUsername || null,
    authorProfileUrl: item.ownerProfilePicUrl || null,
    postType: item.type === "Video" ? "post" : item.type === "Sidecar" ? "post" : "post",
    matchedKeywords,
    likes: item.likesCount || null,
    comments: item.commentsCount || null,
    shares: null,
    engagementScore: (item.likesCount || 0) + (item.commentsCount || 0),
    postedAt: item.timestamp ? new Date(item.timestamp) : null,
    briefId,
  };
}

export function normalizeTiktokItem(
  item: ApifyDatasetItem,
  keywords: string[],
  briefId: string | null
): Partial<InsertListeningHit> {
  const text = item.text || item.description || item.comment || "";
  const matchedKeywords = keywords.filter((kw) =>
    text.toLowerCase().includes(kw.toLowerCase())
  );

  const isComment = !!item.comment || item.type === "comment";

  return {
    platform: "tiktok",
    postId: item.id || item.videoId || null,
    postUrl: item.webVideoUrl || item.url || null,
    postContent: text,
    authorName: item.authorMeta?.name || item.nickname || null,
    authorHandle: item.authorMeta?.name || item.uniqueId || null,
    authorProfileUrl: item.authorMeta?.avatar || null,
    postType: isComment ? "comment" : "post",
    matchedKeywords,
    likes: item.diggCount || item.likes || null,
    comments: item.commentCount || null,
    shares: item.shareCount || null,
    engagementScore:
      (item.diggCount || 0) + (item.commentCount || 0) + (item.shareCount || 0),
    postedAt: item.createTime ? new Date(item.createTime * 1000) : null,
    briefId,
  };
}

export function normalizeRedditItem(
  item: ApifyDatasetItem,
  keywords: string[],
  briefId: string | null
): Partial<InsertListeningHit> {
  const text = item.title
    ? `${item.title}\n\n${item.selftext || ""}`
    : item.body || "";
  const matchedKeywords = keywords.filter((kw) =>
    text.toLowerCase().includes(kw.toLowerCase())
  );

  const isComment = !!item.body && !item.title;

  return {
    platform: "reddit",
    postId: item.id || null,
    postUrl: item.permalink ? `https://reddit.com${item.permalink}` : null,
    postContent: text,
    authorName: item.author || null,
    authorHandle: item.author || null,
    authorProfileUrl: null,
    postType: isComment ? "comment" : "post",
    matchedKeywords,
    likes: item.score || item.ups || null,
    comments: item.num_comments || null,
    shares: null,
    engagementScore: (item.score || 0) + (item.num_comments || 0),
    postedAt: item.created_utc ? new Date(item.created_utc * 1000) : null,
    briefId,
  };
}

export function normalizeYoutubeItem(
  item: ApifyDatasetItem,
  keywords: string[],
  briefId: string | null
): Partial<InsertListeningHit> {
  const text = item.text || item.title || item.description || "";
  const matchedKeywords = keywords.filter((kw) =>
    text.toLowerCase().includes(kw.toLowerCase())
  );

  const isComment = !!item.text && !item.title;

  return {
    platform: "youtube",
    postId: item.id || item.videoId || null,
    postUrl: item.url || (item.videoId ? `https://youtube.com/watch?v=${item.videoId}` : null),
    postContent: text,
    authorName: item.author || item.channelName || null,
    authorHandle: item.channelId || null,
    authorProfileUrl: item.authorThumbnail || null,
    postType: isComment ? "comment" : "post",
    matchedKeywords,
    likes: item.likes || item.viewCount || null,
    comments: item.numberOfComments || null,
    shares: null,
    engagementScore: (item.likes || 0) + (item.numberOfComments || 0),
    postedAt: item.publishedAt ? new Date(item.publishedAt) : null,
    briefId,
  };
}

export function normalizeApifyItem(
  platform: string,
  item: ApifyDatasetItem,
  keywords: string[],
  briefId: string | null
): Partial<InsertListeningHit> | null {
  try {
    switch (platform) {
      case "instagram":
        return normalizeInstagramItem(item, keywords, briefId);
      case "tiktok":
        return normalizeTiktokItem(item, keywords, briefId);
      case "reddit":
        return normalizeRedditItem(item, keywords, briefId);
      case "youtube":
        return normalizeYoutubeItem(item, keywords, briefId);
      default:
        console.warn(`Unknown platform: ${platform}`);
        return null;
    }
  } catch (error) {
    console.error(`Error normalizing ${platform} item:`, error);
    return null;
  }
}

export function extractKeywordsFromBrief(brief: {
  brandVoice: string;
  targetAudience: string;
  contentGoals: string;
}): string[] {
  const allText = `${brief.brandVoice} ${brief.targetAudience} ${brief.contentGoals}`;
  const words = allText
    .toLowerCase()
    .split(/[\s,;.!?]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 3)
    .filter((w) => !["and", "the", "for", "with", "that", "this", "from", "are", "will", "have", "been"].includes(w));
  
  return Array.from(new Set(words)).slice(0, 15);
}

export const apifyService = new ApifyService();
