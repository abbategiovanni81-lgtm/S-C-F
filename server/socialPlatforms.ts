/**
 * Social Platform OAuth & Posting Services
 * Handles authentication and content posting for multiple social media platforms
 */

// ============================================
// REDIRECT URI HELPER
// ============================================

function getRedirectUri(platform: string): string {
  let baseUrl = process.env.APP_URL;
  
  if (!baseUrl) {
    if (process.env.NODE_ENV === "production" && process.env.REPLIT_DOMAINS) {
      const domains = process.env.REPLIT_DOMAINS.split(",");
      const productionDomain = domains.find(d => d.endsWith(".replit.app")) || domains[0];
      baseUrl = `https://${productionDomain}`;
    } else if (process.env.REPLIT_DEV_DOMAIN) {
      baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    } else {
      baseUrl = `https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.replit.app`;
    }
  }
  
  return `${baseUrl}/api/auth/${platform}/callback`;
}

// ============================================
// TWITTER/X - OAuth 2.0 with PKCE
// ============================================

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

export function isTwitterConfigured(): boolean {
  return !!(TWITTER_CLIENT_ID && TWITTER_CLIENT_SECRET);
}

export function getTwitterAuthUrl(state: string, codeVerifier: string): string {
  if (!TWITTER_CLIENT_ID) throw new Error("Twitter API not configured");
  
  const redirectUri = getRedirectUri("twitter");

  // Generate code challenge from verifier (S256)
  const crypto = require("crypto");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

export async function getTwitterTokens(code: string, codeVerifier: string) {
  if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
    throw new Error("Twitter API not configured");
  }

  const redirectUri = getRedirectUri("twitter");

  const credentials = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64");

  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twitter token error: ${error}`);
  }

  return response.json();
}

export async function refreshTwitterToken(refreshToken: string) {
  if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
    throw new Error("Twitter API not configured");
  }

  const credentials = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64");

  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Twitter token");
  }

  return response.json();
}

export async function getTwitterUserInfo(accessToken: string) {
  const response = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get Twitter user info");
  }

  const data = await response.json();
  return {
    id: data.data.id,
    username: data.data.username,
    name: data.data.name,
    profileImageUrl: data.data.profile_image_url,
  };
}

export async function postToTwitter(accessToken: string, text: string, mediaIds?: string[]) {
  const body: any = { text };
  if (mediaIds && mediaIds.length > 0) {
    body.media = { media_ids: mediaIds };
  }

  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twitter post failed: ${error}`);
  }

  return response.json();
}

// ============================================
// LINKEDIN - OAuth 2.0
// ============================================

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

export function isLinkedInConfigured(): boolean {
  return !!(LINKEDIN_CLIENT_ID && LINKEDIN_CLIENT_SECRET);
}

export function getLinkedInAuthUrl(state: string): string {
  if (!LINKEDIN_CLIENT_ID) throw new Error("LinkedIn API not configured");

  const redirectUri = getRedirectUri("linkedin");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "openid profile email w_member_social",
    state,
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

export async function getLinkedInTokens(code: string) {
  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
    throw new Error("LinkedIn API not configured");
  }

  const redirectUri = getRedirectUri("linkedin");

  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn token error: ${error}`);
  }

  return response.json();
}

export async function getLinkedInUserInfo(accessToken: string) {
  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get LinkedIn user info");
  }

  return response.json();
}

export async function postToLinkedIn(accessToken: string, authorUrn: string, text: string, mediaUrl?: string) {
  const body: any = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: mediaUrl ? "IMAGE" : "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  if (mediaUrl) {
    body.specificContent["com.linkedin.ugc.ShareContent"].media = [{
      status: "READY",
      originalUrl: mediaUrl,
    }];
  }

  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn post failed: ${error}`);
  }

  return response.json();
}

// ============================================
// BLUESKY - AT Protocol (username/app password)
// ============================================

export interface BlueskySession {
  did: string;
  handle: string;
  accessJwt: string;
  refreshJwt: string;
}

export async function loginToBluesky(identifier: string, password: string): Promise<BlueskySession> {
  const response = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Bluesky login failed: ${error}`);
  }

  return response.json();
}

export async function refreshBlueskySession(refreshJwt: string): Promise<BlueskySession> {
  const response = await fetch("https://bsky.social/xrpc/com.atproto.server.refreshSession", {
    method: "POST",
    headers: { Authorization: `Bearer ${refreshJwt}` },
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Bluesky session");
  }

  return response.json();
}

export async function postToBluesky(accessJwt: string, did: string, text: string, imageBlob?: any) {
  const record: any = {
    $type: "app.bsky.feed.post",
    text,
    createdAt: new Date().toISOString(),
  };

  if (imageBlob) {
    record.embed = {
      $type: "app.bsky.embed.images",
      images: [{ image: imageBlob, alt: "" }],
    };
  }

  const response = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessJwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repo: did,
      collection: "app.bsky.feed.post",
      record,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Bluesky post failed: ${error}`);
  }

  return response.json();
}

export async function uploadBlobToBluesky(accessJwt: string, imageBuffer: Buffer, mimeType: string) {
  const response = await fetch("https://bsky.social/xrpc/com.atproto.repo.uploadBlob", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessJwt}`,
      "Content-Type": mimeType,
    },
    body: imageBuffer,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image to Bluesky");
  }

  const data = await response.json();
  return data.blob;
}

// ============================================
// INSTAGRAM/FACEBOOK - Graph API
// ============================================

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

export function isFacebookConfigured(): boolean {
  return !!(FACEBOOK_APP_ID && FACEBOOK_APP_SECRET);
}

export function getFacebookAuthUrl(state: string): string {
  if (!FACEBOOK_APP_ID) throw new Error("Facebook API not configured");

  const redirectUri = getRedirectUri("facebook");

  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: redirectUri,
    scope: "pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,pages_show_list",
    state,
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

export async function getFacebookTokens(code: string) {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    throw new Error("Facebook API not configured");
  }

  const redirectUri = getRedirectUri("facebook");

  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Facebook token error: ${error}`);
  }

  return response.json();
}

export async function getFacebookLongLivedToken(shortLivedToken: string) {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    throw new Error("Facebook API not configured");
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}` +
    `&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${shortLivedToken}`
  );

  if (!response.ok) {
    throw new Error("Failed to get long-lived token");
  }

  return response.json();
}

export async function getFacebookPages(accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
  );

  if (!response.ok) {
    throw new Error("Failed to get Facebook pages");
  }

  return response.json();
}

export async function getInstagramAccounts(pageId: string, pageAccessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
  );

  if (!response.ok) {
    throw new Error("Failed to get Instagram account");
  }

  return response.json();
}

export async function postToFacebookPage(pageAccessToken: string, pageId: string, message: string, imageUrl?: string) {
  let url = `https://graph.facebook.com/v18.0/${pageId}/`;
  const params = new URLSearchParams({ access_token: pageAccessToken, message });

  if (imageUrl) {
    url += "photos";
    params.append("url", imageUrl);
  } else {
    url += "feed";
  }

  const response = await fetch(url, {
    method: "POST",
    body: params,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Facebook post failed: ${error}`);
  }

  return response.json();
}

export async function postToInstagram(accessToken: string, igUserId: string, caption: string, imageUrl: string) {
  // Step 1: Create media container
  const createResponse = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media`,
    {
      method: "POST",
      body: new URLSearchParams({
        access_token: accessToken,
        image_url: imageUrl,
        caption,
      }),
    }
  );

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Instagram media creation failed: ${error}`);
  }

  const { id: creationId } = await createResponse.json();

  // Step 2: Publish the container
  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
    {
      method: "POST",
      body: new URLSearchParams({
        access_token: accessToken,
        creation_id: creationId,
      }),
    }
  );

  if (!publishResponse.ok) {
    const error = await publishResponse.text();
    throw new Error(`Instagram publish failed: ${error}`);
  }

  return publishResponse.json();
}

// ============================================
// TIKTOK - Content Posting API
// ============================================

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;

export function isTikTokConfigured(): boolean {
  return !!(TIKTOK_CLIENT_KEY && TIKTOK_CLIENT_SECRET);
}

export function getTikTokAuthUrl(state: string): string {
  if (!TIKTOK_CLIENT_KEY) throw new Error("TikTok API not configured");

  const redirectUri = getRedirectUri("tiktok");

  const params = new URLSearchParams({
    client_key: TIKTOK_CLIENT_KEY,
    scope: "user.info.basic,video.publish,video.upload",
    response_type: "code",
    redirect_uri: redirectUri,
    state,
  });

  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

export async function getTikTokTokens(code: string) {
  if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
    throw new Error("TikTok API not configured");
  }

  const redirectUri = getRedirectUri("tiktok");

  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TikTok token error: ${error}`);
  }

  return response.json();
}

export async function refreshTikTokToken(refreshToken: string) {
  if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
    throw new Error("TikTok API not configured");
  }

  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh TikTok token");
  }

  return response.json();
}

export async function getTikTokUserInfo(accessToken: string) {
  const response = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get TikTok user info");
  }

  return response.json();
}

export async function initTikTokVideoUpload(accessToken: string, videoUrl: string, title: string) {
  const response = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: {
        title,
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TikTok upload init failed: ${error}`);
  }

  return response.json();
}

// ============================================
// THREADS - Meta API
// ============================================

export function getThreadsAuthUrl(state: string): string {
  if (!FACEBOOK_APP_ID) throw new Error("Facebook/Threads API not configured");

  const redirectUri = getRedirectUri("threads");

  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: redirectUri,
    scope: "threads_basic,threads_content_publish",
    response_type: "code",
    state,
  });

  return `https://threads.net/oauth/authorize?${params.toString()}`;
}

export async function getThreadsTokens(code: string) {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    throw new Error("Threads API not configured");
  }

  const redirectUri = getRedirectUri("threads");

  const response = await fetch("https://graph.threads.net/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      client_secret: FACEBOOK_APP_SECRET,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Threads token error: ${error}`);
  }

  return response.json();
}

export async function getThreadsUserInfo(accessToken: string, userId: string) {
  const response = await fetch(
    `https://graph.threads.net/v1.0/${userId}?fields=id,username,threads_profile_picture_url&access_token=${accessToken}`
  );

  if (!response.ok) {
    throw new Error("Failed to get Threads user info");
  }

  return response.json();
}

export async function postToThreads(accessToken: string, userId: string, text: string, imageUrl?: string) {
  // Step 1: Create container
  const params: any = {
    access_token: accessToken,
    media_type: imageUrl ? "IMAGE" : "TEXT",
    text,
  };

  if (imageUrl) {
    params.image_url = imageUrl;
  }

  const createResponse = await fetch(
    `https://graph.threads.net/v1.0/${userId}/threads`,
    {
      method: "POST",
      body: new URLSearchParams(params),
    }
  );

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Threads container creation failed: ${error}`);
  }

  const { id: creationId } = await createResponse.json();

  // Step 2: Publish
  const publishResponse = await fetch(
    `https://graph.threads.net/v1.0/${userId}/threads_publish`,
    {
      method: "POST",
      body: new URLSearchParams({
        access_token: accessToken,
        creation_id: creationId,
      }),
    }
  );

  if (!publishResponse.ok) {
    const error = await publishResponse.text();
    throw new Error(`Threads publish failed: ${error}`);
  }

  return publishResponse.json();
}

// ============================================
// PINTEREST - API v5
// ============================================

const PINTEREST_APP_ID = process.env.PINTEREST_APP_ID;
const PINTEREST_APP_SECRET = process.env.PINTEREST_APP_SECRET;

export function isPinterestConfigured(): boolean {
  return !!(PINTEREST_APP_ID && PINTEREST_APP_SECRET);
}

export function getPinterestAuthUrl(state: string): string {
  if (!PINTEREST_APP_ID) throw new Error("Pinterest API not configured");

  const redirectUri = getRedirectUri("pinterest");

  const params = new URLSearchParams({
    client_id: PINTEREST_APP_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "pins:read,pins:write,boards:read,boards:write,user_accounts:read",
    state,
  });

  return `https://www.pinterest.com/oauth/?${params.toString()}`;
}

export async function getPinterestTokens(code: string) {
  if (!PINTEREST_APP_ID || !PINTEREST_APP_SECRET) {
    throw new Error("Pinterest API not configured");
  }

  const redirectUri = getRedirectUri("pinterest");

  const credentials = Buffer.from(`${PINTEREST_APP_ID}:${PINTEREST_APP_SECRET}`).toString("base64");

  const response = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinterest token error: ${error}`);
  }

  return response.json();
}

export async function getPinterestUserInfo(accessToken: string) {
  const response = await fetch("https://api.pinterest.com/v5/user_account", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get Pinterest user info");
  }

  return response.json();
}

export async function getPinterestBoards(accessToken: string) {
  const response = await fetch("https://api.pinterest.com/v5/boards", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get Pinterest boards");
  }

  return response.json();
}

export async function postToPinterest(accessToken: string, boardId: string, title: string, description: string, imageUrl: string, link?: string) {
  const body: any = {
    board_id: boardId,
    media_source: {
      source_type: "image_url",
      url: imageUrl,
    },
    title,
    description,
  };

  if (link) {
    body.link = link;
  }

  const response = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinterest post failed: ${error}`);
  }

  return response.json();
}

// ============================================
// PLATFORM STATUS CHECK
// ============================================

export function getSocialPlatformStatus() {
  return {
    twitter: isTwitterConfigured(),
    linkedin: isLinkedInConfigured(),
    bluesky: true, // Always available (uses user credentials)
    facebook: isFacebookConfigured(),
    instagram: isFacebookConfigured(), // Uses same app as Facebook
    tiktok: isTikTokConfigured(),
    threads: isFacebookConfigured(), // Uses same app as Facebook
    pinterest: isPinterestConfigured(),
    youtube: true, // Already configured via GOOGLE_CLIENT_ID
  };
}

// Helper to generate random state for OAuth
export function generateOAuthState(): string {
  return require("crypto").randomBytes(16).toString("hex");
}

// Helper to generate PKCE code verifier
export function generateCodeVerifier(): string {
  return require("crypto").randomBytes(32).toString("base64url");
}
