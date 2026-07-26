/**
 * Shared direct-publish service.
 * One code path for immediate posting (/api/social/post) and the
 * scheduler worker. Refreshes expired tokens where the platform supports
 * it, publishes, and returns a receipt (platform post id/url) so "posted"
 * in the UI always maps to a real platform post.
 */
import * as socialPlatforms from "./socialPlatforms";
import { storage } from "./storage";
import type { SocialAccount } from "@shared/schema";

export interface PublishContent {
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  title?: string;
  description?: string;
}

export interface PublishResult {
  postId?: string;
  postUrl?: string;
  raw?: any;
}

/** Refresh an expired access token where the platform supports it. */
async function ensureFreshToken(account: SocialAccount): Promise<SocialAccount> {
  const expired = account.tokenExpiry && new Date(account.tokenExpiry) < new Date();
  if (!expired || !account.refreshToken) return account;

  let tokens: { accessToken: string; refreshToken?: string; expiresIn?: number } | null = null;

  if (account.platform === "Twitter") {
    const t = await socialPlatforms.refreshTwitterToken(account.refreshToken);
    tokens = { accessToken: t.access_token, refreshToken: t.refresh_token, expiresIn: t.expires_in };
  } else if (account.platform === "TikTok") {
    const t = await socialPlatforms.refreshTikTokToken(account.refreshToken);
    tokens = { accessToken: t.access_token, refreshToken: t.refresh_token, expiresIn: t.expires_in };
  } else if (account.platform === "Bluesky") {
    const s = await socialPlatforms.refreshBlueskySession(account.refreshToken);
    tokens = { accessToken: s.accessJwt, refreshToken: s.refreshJwt };
  }

  if (!tokens) return account; // Platform token doesn't expire or has no refresher

  const updated = await storage.updateSocialAccount(account.id, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken || account.refreshToken,
    tokenExpiry: tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : account.tokenExpiry,
  });
  return updated || { ...account, accessToken: tokens.accessToken };
}

function firstDefined(...vals: any[]): string | undefined {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return String(v);
  return undefined;
}

/** Publish immediately to the account's platform via its direct API. */
export async function publishDirect(rawAccount: SocialAccount, content: PublishContent): Promise<PublishResult> {
  if (!rawAccount.accessToken) {
    throw new Error("Account not connected. Please reconnect.");
  }
  const account = await ensureFreshToken(rawAccount);
  const { text, imageUrl, videoUrl, title, description } = content;
  let result: any;
  let postId: string | undefined;
  let postUrl: string | undefined;

  switch (account.platform) {
    case "Twitter":
      result = await socialPlatforms.postToTwitter(account.accessToken!, text);
      postId = firstDefined(result?.data?.id, result?.id);
      if (postId) postUrl = `https://x.com/i/web/status/${postId}`;
      break;

    case "LinkedIn": {
      const authorUrn = `urn:li:person:${account.platformAccountId}`;
      result = await socialPlatforms.postToLinkedIn(account.accessToken!, authorUrn, text, imageUrl);
      postId = firstDefined(result?.id);
      break;
    }

    case "Bluesky":
      result = await socialPlatforms.postToBluesky(account.accessToken!, account.platformAccountId!, text);
      postId = firstDefined(result?.uri, result?.cid);
      break;

    case "Facebook":
      result = await socialPlatforms.postToFacebookPage(account.accessToken!, account.platformAccountId!, text, imageUrl);
      postId = firstDefined(result?.post_id, result?.id);
      break;

    case "Instagram":
      if (!imageUrl) throw new Error("Instagram requires an image");
      result = await socialPlatforms.postToInstagram(account.accessToken!, account.platformAccountId!, text, imageUrl);
      postId = firstDefined(result?.id);
      break;

    case "TikTok":
      if (!videoUrl) throw new Error("TikTok requires a video URL");
      result = await socialPlatforms.initTikTokVideoUpload(account.accessToken!, videoUrl, title || text);
      postId = firstDefined(result?.data?.publish_id, result?.publish_id);
      break;

    case "Threads":
      result = await socialPlatforms.postToThreads(account.accessToken!, account.platformAccountId!, text, imageUrl);
      postId = firstDefined(result?.id);
      break;

    case "Pinterest": {
      if (!imageUrl) throw new Error("Pinterest requires an image");
      const boards = await socialPlatforms.getPinterestBoards(account.accessToken!);
      const defaultBoard = boards.items?.[0];
      if (!defaultBoard) throw new Error("No Pinterest boards found");
      result = await socialPlatforms.postToPinterest(
        account.accessToken!,
        defaultBoard.id,
        title || "Pin",
        text || description || "",
        imageUrl
      );
      postId = firstDefined(result?.id);
      if (postId) postUrl = `https://www.pinterest.com/pin/${postId}/`;
      break;
    }

    default:
      throw new Error(`Posting to ${account.platform} not supported`);
  }

  return { postId, postUrl, raw: result };
}
