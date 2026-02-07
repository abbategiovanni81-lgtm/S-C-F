/**
 * Late.dev API Integration
 * Unified social media posting API - supports 11 platforms
 * $19/mo for 120 posts across all platforms
 * 
 * Platforms: Facebook, Instagram, TikTok, X/Twitter, LinkedIn, 
 * YouTube, Threads, Reddit, Pinterest, Bluesky, Google Business
 */

const LATE_API_KEY = process.env.LATE_API_KEY;
const LATE_BASE_URL = "https://api.getlate.dev";

export interface LatePlatformAccount {
  id: string;
  platform: "facebook" | "instagram" | "tiktok" | "twitter" | "linkedin" | "youtube" | "threads" | "reddit" | "pinterest" | "bluesky" | "google_business";
  accountId: string;
  accountName?: string;
  accountHandle?: string;
}

export interface LatePostRequest {
  content: string;
  mediaUrls?: string[];
  scheduledFor?: string; // ISO 8601 timestamp
  timezone?: string;
  platforms: LatePlatformAccount[];
}

export interface LatePostResult {
  postId: string;
  status: "scheduled" | "publishing" | "published" | "failed";
  platforms: Array<{
    platform: string;
    accountId: string;
    status: "pending" | "published" | "failed";
    postUrl?: string;
    error?: string;
  }>;
}

class LateService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = LATE_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private getHeaders() {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Create a social media post
   */
  async createPost(request: LatePostRequest): Promise<LatePostResult> {
    if (!this.isConfigured()) {
      throw new Error("Late.dev API key not configured");
    }

    try {
      const response = await fetch(`${LATE_BASE_URL}/api/v1/posts`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          content: request.content,
          media_urls: request.mediaUrls,
          scheduled_for: request.scheduledFor,
          timezone: request.timezone || "UTC",
          platforms: request.platforms.map((p) => ({
            platform: p.platform,
            account_id: p.accountId,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Late.dev API error: ${response.statusText} - ${errorData.message || ""}`
        );
      }

      const data = await response.json();
      return {
        postId: data.post_id,
        status: data.status,
        platforms: data.platforms || [],
      };
    } catch (error) {
      console.error("Failed to create Late.dev post:", error);
      throw error;
    }
  }

  /**
   * Get post status
   */
  async getPostStatus(postId: string): Promise<LatePostResult> {
    if (!this.isConfigured()) {
      throw new Error("Late.dev API key not configured");
    }

    try {
      const response = await fetch(`${LATE_BASE_URL}/api/v1/posts/${postId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Late.dev API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        postId: data.post_id,
        status: data.status,
        platforms: data.platforms || [],
      };
    } catch (error) {
      console.error("Failed to get Late.dev post status:", error);
      throw error;
    }
  }

  /**
   * Delete/cancel a scheduled post
   */
  async deletePost(postId: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error("Late.dev API key not configured");
    }

    try {
      const response = await fetch(`${LATE_BASE_URL}/api/v1/posts/${postId}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Late.dev API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to delete Late.dev post:", error);
      throw error;
    }
  }

  /**
   * List connected accounts
   */
  async listAccounts(): Promise<LatePlatformAccount[]> {
    if (!this.isConfigured()) {
      throw new Error("Late.dev API key not configured");
    }

    try {
      const response = await fetch(`${LATE_BASE_URL}/api/v1/accounts`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Late.dev API error: ${response.statusText}`);
      }

      const data = await response.json();
      return (data.accounts || []).map((acc: any) => ({
        id: acc.id,
        platform: acc.platform,
        accountId: acc.account_id,
        accountName: acc.account_name,
        accountHandle: acc.account_handle,
      }));
    } catch (error) {
      console.error("Failed to list Late.dev accounts:", error);
      throw error;
    }
  }

  /**
   * Get supported platforms
   */
  getSupportedPlatforms(): Array<{ id: string; name: string; supportsVideo: boolean }> {
    return [
      { id: "facebook", name: "Facebook", supportsVideo: true },
      { id: "instagram", name: "Instagram", supportsVideo: true },
      { id: "tiktok", name: "TikTok", supportsVideo: true },
      { id: "twitter", name: "X (Twitter)", supportsVideo: true },
      { id: "linkedin", name: "LinkedIn", supportsVideo: true },
      { id: "youtube", name: "YouTube", supportsVideo: true },
      { id: "threads", name: "Threads", supportsVideo: false },
      { id: "reddit", name: "Reddit", supportsVideo: true },
      { id: "pinterest", name: "Pinterest", supportsVideo: true },
      { id: "bluesky", name: "Bluesky", supportsVideo: true },
      { id: "google_business", name: "Google Business", supportsVideo: false },
    ];
  }
}

export const lateService = new LateService();
