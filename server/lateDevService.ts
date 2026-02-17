/**
 * Late.dev API Service
 * Integration with Late.dev for unified social media posting
 * API Documentation: https://getlate.dev/api/v1/
 */

const LATE_API_BASE_URL = "https://api.getlate.dev/api/v1";

export interface LateDevPostRequest {
  content: string;
  mediaUrls?: string[];
  scheduledFor?: string; // ISO 8601 datetime
  timezone?: string;
  platforms: {
    platform: string; // "instagram", "facebook", "tiktok", "twitter", "linkedin", etc.
    accountId: string;
  }[];
}

export interface LateDevPostResponse {
  id: string;
  status: "scheduled" | "published" | "failed";
  url?: string;
  platformResults?: {
    platform: string;
    status: "success" | "failed";
    postId?: string;
    postUrl?: string;
    error?: string;
  }[];
}

export interface LateDevStatusResponse {
  id: string;
  status: "scheduled" | "published" | "failed" | "processing";
  url?: string;
  platformResults?: {
    platform: string;
    status: "success" | "failed";
    postId?: string;
    postUrl?: string;
    error?: string;
  }[];
}

/**
 * Create a new post via Late.dev API
 */
export async function createLateDevPost(
  apiKey: string,
  request: LateDevPostRequest
): Promise<LateDevPostResponse> {
  const response = await fetch(`${LATE_API_BASE_URL}/posts`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || `Late.dev API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Check the status of a post
 */
export async function getLateDevPostStatus(
  apiKey: string,
  postId: string
): Promise<LateDevStatusResponse> {
  const response = await fetch(`${LATE_API_BASE_URL}/posts/${postId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || `Late.dev API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Map platform names from our system to Late.dev platform names
 */
export function mapPlatformToLateDevName(platform: string): string {
  const mapping: Record<string, string> = {
    "Twitter": "twitter",
    "Instagram": "instagram",
    "Facebook": "facebook",
    "TikTok": "tiktok",
    "LinkedIn": "linkedin",
    "YouTube": "youtube",
    "Threads": "threads",
    "Pinterest": "pinterest",
    "Reddit": "reddit",
    "Bluesky": "bluesky",
    "Google Business": "google_business",
  };
  
  return mapping[platform] || platform.toLowerCase();
}
