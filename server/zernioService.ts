/**
 * Zernio API service (Zernio is the renamed Late.dev; the old
 * api.getlate.dev host no longer resolves).
 *
 * Aggregator posting path for the platforms that are painful to run via
 * direct APIs (X, Instagram, Facebook, TikTok, Threads). BYOK: the key is
 * the user's own Zernio API key.
 *
 * API reference: https://docs.zernio.com (OpenAPI: https://zernio.com/openapi.yaml)
 * Base URL: https://zernio.com/api/v1
 * Auth: Authorization: Bearer <API key>
 *
 * NO SIMULATION BRANCH. No key -> the caller must not call this at all;
 * a failed request throws; a post with no id receipt is treated as failed.
 */

const ZERNIO_API_BASE_URL = "https://zernio.com/api/v1";

export interface ZernioMediaItem {
  type: "image" | "video";
  url: string;
}

export interface ZernioPlatformTarget {
  platform: string; // "twitter", "instagram", "facebook", "tiktok", "threads", ...
  accountId: string;
  customContent?: string;
  platformSpecificData?: Record<string, unknown>;
}

export interface ZernioPostRequest {
  content: string;
  mediaItems?: ZernioMediaItem[];
  /** ISO 8601. Omit and set publishNow for immediate posting. */
  scheduledFor?: string;
  timezone?: string;
  publishNow?: boolean;
  platforms: ZernioPlatformTarget[];
}

export interface ZernioPlatformStatus {
  platform: string;
  accountId: string | { _id: string; platform: string; username?: string };
  status: string; // "pending" | "published" | "failed" (per platform)
  publishedAt?: string;
  platformPostId?: string; // Receipt: the platform's own post id
  platformPostUrl?: string; // Receipt: public permalink
  error?: string;
}

export interface ZernioPost {
  _id: string;
  status: "draft" | "scheduled" | "published" | "failed" | string;
  scheduledFor?: string;
  platforms?: ZernioPlatformStatus[];
}

export interface ZernioAccount {
  _id: string;
  platform: string;
  profileId?: string;
  username?: string;
  displayName?: string;
  isActive?: boolean;
}

async function zernioFetch(apiKey: string, path: string, init?: RequestInit): Promise<any> {
  const response = await fetch(`${ZERNIO_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err: any = new Error(body.error || body.message || `Zernio API error ${response.status}`);
    err.status = response.status;
    err.existingPostId = body.existingPostId; // 409 content-hash dedup
    throw err;
  }
  return body;
}

/**
 * Create a post (immediate with publishNow, or scheduled via scheduledFor).
 *
 * Duplicate-safety (per Zernio's idempotency contract):
 * - requestId (pass a stable id per logical post, e.g. our scheduled-post
 *   row id) is sent as x-request-id: retries within ~5 min return the
 *   original post instead of double-posting.
 * - A 409 means Zernio's 24h content-hash dedup caught an identical post
 *   (e.g. our attempt 1 posted but we crashed before recording it). We
 *   recover the existing post and return it as the receipt.
 */
export async function createZernioPost(
  apiKey: string,
  request: ZernioPostRequest,
  requestId?: string
): Promise<ZernioPost> {
  let body: any;
  try {
    body = await zernioFetch(apiKey, "/posts", {
      method: "POST",
      body: JSON.stringify(request),
      headers: requestId ? { "x-request-id": requestId } : undefined,
    });
  } catch (error: any) {
    if (error.status === 409 && error.existingPostId) {
      return getZernioPostStatus(apiKey, error.existingPostId);
    }
    throw error;
  }
  const post: ZernioPost | undefined = body.existingPost ?? body.post ?? body;
  if (!post || !post._id) {
    throw new Error("Zernio returned no post id receipt");
  }
  return post;
}

/** Fetch a post with per-platform statuses. */
export async function getZernioPostStatus(apiKey: string, postId: string): Promise<ZernioPost> {
  const body = await zernioFetch(apiKey, `/posts/${postId}`);
  return (body.post ?? body) as ZernioPost;
}

/** List the user's connected Zernio accounts (for linking to our channels). */
export async function listZernioAccounts(apiKey: string): Promise<ZernioAccount[]> {
  const body = await zernioFetch(apiKey, "/accounts");
  return (body.accounts ?? []) as ZernioAccount[];
}

/** Cheap authed call for the verify-key preflight. Throws on bad key. */
export async function verifyZernioKey(apiKey: string): Promise<{ ok: true; accounts: number }> {
  const accounts = await listZernioAccounts(apiKey);
  return { ok: true, accounts: accounts.length };
}

/** Map our platform display names to Zernio platform slugs. */
export function mapPlatformToZernioName(platform: string): string {
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

export function inferMediaItems(mediaUrl?: string | null, mediaType?: string | null): ZernioMediaItem[] | undefined {
  if (!mediaUrl) return undefined;
  const type: "image" | "video" =
    mediaType === "video" || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(mediaUrl) ? "video" : "image";
  return [{ type, url: mediaUrl }];
}
