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
  instagramComments: {
    actorId: "apify/instagram-comment-scraper",
    platform: "instagram",
    searchField: "directUrls",
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
    actorId: "backhoe/reddit-search-scraper",
    platform: "reddit",
    searchField: "searches",
  },
  youtube: {
    actorId: "scraper_one/youtube-search-scraper",
    platform: "youtube",
    searchField: "query",
  },
  youtubeComments: {
    actorId: "streamers/youtube-comments-scraper",
    platform: "youtube",
    searchField: "startUrls",
  },
  redditComments: {
    actorId: "trudax/reddit-scraper-lite",
    platform: "reddit",
    searchField: "startUrls",
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

  // Handle different Reddit URL formats from various actors
  let postUrl: string | null = null;
  if (item.url && item.url.includes("reddit.com")) {
    postUrl = item.url;
  } else if (item.permalink) {
    // Some actors return relative permalink
    postUrl = item.permalink.startsWith("http") ? item.permalink : `https://reddit.com${item.permalink}`;
  } else if (item.id) {
    // Fallback: construct URL from subreddit and id
    const subreddit = item.subreddit || item.subredditName || "unknown";
    postUrl = `https://reddit.com/r/${subreddit}/comments/${item.id}`;
  }

  return {
    platform: "reddit",
    postId: item.id || null,
    postUrl,
    postContent: text,
    authorName: item.author || null,
    authorHandle: item.author || null,
    authorProfileUrl: null,
    postType: isComment ? "comment" : "post",
    matchedKeywords,
    likes: item.score || item.ups || null,
    comments: item.num_comments || item.numComments || null,
    shares: null,
    engagementScore: (item.score || 0) + (item.num_comments || item.numComments || 0),
    postedAt: item.created_utc ? new Date(item.created_utc * 1000) : (item.createdAt ? new Date(item.createdAt) : null),
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

export interface WebsiteScrapedData {
  url: string;
  title: string;
  description: string;
  text: string;
  headings: string[];
  keywords: string[];
}

export async function scrapeWebsiteForBrandAnalysis(url: string): Promise<WebsiteScrapedData> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    throw new Error("Apify API token not configured");
  }

  const actorId = "apify/website-content-crawler";
  
  const response = await fetch(
    `${APIFY_API_BASE}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${apiToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startUrls: [{ url }],
        maxCrawlPages: 3,
        maxCrawlDepth: 1,
        crawlerType: "cheerio",
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Website scrape failed: ${response.status} - ${text}`);
  }

  const items = await response.json();
  
  if (!items || items.length === 0) {
    throw new Error("No content scraped from website");
  }

  const mainPage = items[0];
  const allText = items.map((item: any) => item.text || "").join("\n\n").slice(0, 15000);
  const allHeadings = items.flatMap((item: any) => {
    const headings: string[] = [];
    if (item.metadata?.title) headings.push(item.metadata.title);
    return headings;
  });

  return {
    url,
    title: mainPage.metadata?.title || "",
    description: mainPage.metadata?.description || "",
    text: allText,
    headings: allHeadings.slice(0, 20),
    keywords: (mainPage.metadata?.keywords || "").split(",").map((k: string) => k.trim()).filter(Boolean),
  };
}

export const apifyService = new ApifyService();

// Social Profile Scraping for Brand Brief Generation

export interface SocialProfileData {
  platform: "instagram" | "tiktok" | "youtube" | "twitter";
  url: string;
  username: string;
  displayName: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  recentPosts: {
    caption: string;
    likes: number;
    comments: number;
    date?: string;
  }[];
  profileImageUrl?: string;
  isVerified?: boolean;
  category?: string;
}

export function detectSocialPlatform(url: string): "instagram" | "tiktok" | "youtube" | "twitter" | "website" | null {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("instagram.com") || lowerUrl.includes("instagr.am")) {
    return "instagram";
  }
  if (lowerUrl.includes("tiktok.com")) {
    return "tiktok";
  }
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    return "youtube";
  }
  if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
    return "twitter";
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return "website";
  }
  return null;
}

export function extractUsernameFromUrl(url: string, platform: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.replace(/^\/+|\/+$/g, "");
    
    if (platform === "instagram" || platform === "tiktok" || platform === "twitter") {
      // Handle @username format and path format
      const parts = pathname.split("/");
      let username = parts[0];
      if (username.startsWith("@")) {
        username = username.slice(1);
      }
      return username;
    }
    
    if (platform === "youtube") {
      // Handle /channel/, /@username, /c/ formats
      const parts = pathname.split("/");
      if (parts[0] === "channel") {
        return parts[1] || "";
      }
      if (parts[0] === "c" || parts[0] === "user") {
        return parts[1] || "";
      }
      if (parts[0].startsWith("@")) {
        return parts[0].slice(1);
      }
      return parts[0] || "";
    }
    
    return pathname;
  } catch {
    return url;
  }
}

export async function scrapeInstagramProfile(url: string): Promise<SocialProfileData> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    throw new Error("Apify API token not configured");
  }

  const username = extractUsernameFromUrl(url, "instagram");
  
  const response = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${apiToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: [username],
        resultsLimit: 12,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Instagram scrape failed: ${response.status}`);
  }

  const items = await response.json();
  if (!items || items.length === 0) {
    throw new Error("No Instagram profile data found");
  }

  const profile = items[0];
  
  return {
    platform: "instagram",
    url,
    username: profile.username || username,
    displayName: profile.fullName || profile.username || username,
    bio: profile.biography || "",
    followerCount: profile.followersCount || 0,
    followingCount: profile.followingCount || 0,
    postCount: profile.postsCount || 0,
    recentPosts: (profile.latestPosts || []).slice(0, 10).map((post: any) => ({
      caption: post.caption || "",
      likes: post.likesCount || 0,
      comments: post.commentsCount || 0,
      date: post.timestamp,
    })),
    profileImageUrl: profile.profilePicUrl,
    isVerified: profile.verified,
    category: profile.businessCategoryName,
  };
}

export async function scrapeTikTokProfile(url: string): Promise<SocialProfileData> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    throw new Error("Apify API token not configured");
  }

  const username = extractUsernameFromUrl(url, "tiktok");
  
  const response = await fetch(
    `https://api.apify.com/v2/acts/clockworks~tiktok-profile-scraper/run-sync-get-dataset-items?token=${apiToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profiles: [username.startsWith("@") ? username : `@${username}`],
        resultsPerPage: 12,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`TikTok scrape failed: ${response.status}`);
  }

  const items = await response.json();
  if (!items || items.length === 0) {
    throw new Error("No TikTok profile data found");
  }

  const profile = items[0];
  
  return {
    platform: "tiktok",
    url,
    username: profile.uniqueId || username,
    displayName: profile.nickname || profile.uniqueId || username,
    bio: profile.signature || "",
    followerCount: profile.followerCount || profile.fans || 0,
    followingCount: profile.followingCount || 0,
    postCount: profile.videoCount || 0,
    recentPosts: (profile.latestVideos || items.slice(1) || []).slice(0, 10).map((video: any) => ({
      caption: video.desc || video.text || "",
      likes: video.diggCount || video.likes || 0,
      comments: video.commentCount || video.comments || 0,
      date: video.createTime,
    })),
    profileImageUrl: profile.avatarLarger || profile.avatarMedium,
    isVerified: profile.verified,
  };
}

export async function scrapeYouTubeChannel(url: string): Promise<SocialProfileData> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    throw new Error("Apify API token not configured");
  }

  console.log(`Scraping YouTube channel: ${url}`);
  
  const response = await fetch(
    `https://api.apify.com/v2/acts/streamers~youtube-channel-scraper/run-sync-get-dataset-items?token=${apiToken}&timeout=120`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startUrls: [{ url }],
        maxResults: 15,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error(`YouTube scrape failed: ${response.status} - ${errorText}`);
    throw new Error(`Unable to access YouTube channel. Please check the URL and try again.`);
  }

  let items;
  try {
    items = await response.json();
  } catch (parseError) {
    console.error("Failed to parse YouTube scraper response:", parseError);
    throw new Error("YouTube channel data could not be processed. Please try again.");
  }
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error("No YouTube channel data found. The channel may be private or the URL may be incorrect.");
  }

  const channel = items[0];
  
  if (!channel || (!channel.channelName && !channel.channelHandle)) {
    throw new Error("Could not find channel information. Please check the URL format.");
  }
  
  let videos: any[] = [];
  if (items.length > 1) {
    videos = items.slice(1);
  } else if (channel.videos && Array.isArray(channel.videos)) {
    videos = channel.videos;
  } else if (channel.latestVideos && Array.isArray(channel.latestVideos)) {
    videos = channel.latestVideos;
  }
  
  console.log(`YouTube scrape complete: ${channel.channelName}, ${videos.length} videos found`);
  
  return {
    platform: "youtube",
    url,
    username: channel.channelHandle || channel.channelName || "",
    displayName: channel.channelName || channel.channelHandle || "",
    bio: channel.channelDescription || channel.description || "",
    followerCount: channel.numberOfSubscribers || channel.subscriberCount || 0,
    followingCount: 0,
    postCount: channel.numberOfVideos || channel.videoCount || 0,
    recentPosts: videos.slice(0, 10).map((video: any) => ({
      caption: video.title || video.text || "",
      likes: video.likes || video.likeCount || 0,
      comments: video.commentsCount || video.commentCount || 0,
      date: video.date || video.publishedAt,
    })),
    profileImageUrl: channel.channelLogoUrl || channel.thumbnailUrl,
    isVerified: channel.isVerified || channel.verified || false,
  };
}

export async function scrapeTwitterProfile(url: string): Promise<SocialProfileData> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    throw new Error("Apify API token not configured");
  }

  const username = extractUsernameFromUrl(url, "twitter");
  
  const response = await fetch(
    `https://api.apify.com/v2/acts/apidojo~twitter-user-scraper/run-sync-get-dataset-items?token=${apiToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handles: [username],
        tweetsDesired: 12,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Twitter scrape failed: ${response.status}`);
  }

  const items = await response.json();
  if (!items || items.length === 0) {
    throw new Error("No Twitter profile data found");
  }

  const profile = items[0];
  
  return {
    platform: "twitter",
    url,
    username: profile.userName || profile.screen_name || username,
    displayName: profile.name || profile.userName || username,
    bio: profile.description || "",
    followerCount: profile.followers || profile.followers_count || 0,
    followingCount: profile.following || profile.friends_count || 0,
    postCount: profile.statusesCount || profile.statuses_count || 0,
    recentPosts: (profile.tweets || []).slice(0, 10).map((tweet: any) => ({
      caption: tweet.full_text || tweet.text || "",
      likes: tweet.favorite_count || 0,
      comments: tweet.reply_count || 0,
      date: tweet.created_at,
    })),
    profileImageUrl: profile.profileImageUrl || profile.profile_image_url_https,
    isVerified: profile.verified || profile.isBlueVerified,
  };
}

export async function scrapeSocialProfile(url: string): Promise<SocialProfileData> {
  const platform = detectSocialPlatform(url);
  
  switch (platform) {
    case "instagram":
      return scrapeInstagramProfile(url);
    case "tiktok":
      return scrapeTikTokProfile(url);
    case "youtube":
      return scrapeYouTubeChannel(url);
    case "twitter":
      return scrapeTwitterProfile(url);
    default:
      throw new Error(`Unsupported platform or invalid URL: ${url}`);
  }
}
