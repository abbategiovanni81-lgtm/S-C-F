import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NODE_ENV === "production"
    ? "https://channel-commander--abbategiovanni8.replit.app/api/auth/google/callback"
    : `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback`
);

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export function setCredentials(tokens: any) {
  oauth2Client.setCredentials(tokens);
}

export async function getChannelInfo(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  
  const youtube = google.youtube({ version: "v3", auth });
  
  const response = await youtube.channels.list({
    part: ["snippet", "statistics"],
    mine: true,
  });

  const channel = response.data.items?.[0];
  if (!channel) {
    throw new Error("No YouTube channel found");
  }

  return {
    channelId: channel.id,
    title: channel.snippet?.title,
    description: channel.snippet?.description,
    customUrl: channel.snippet?.customUrl,
    thumbnailUrl: channel.snippet?.thumbnails?.default?.url,
    subscriberCount: channel.statistics?.subscriberCount,
    viewCount: channel.statistics?.viewCount,
    videoCount: channel.statistics?.videoCount,
  };
}

export async function getChannelAnalytics(accessToken: string, channelId: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth });

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  try {
    const response = await youtubeAnalytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched,averageViewDuration,likes,comments,shares,subscribersGained",
    });

    const row = response.data.rows?.[0] || [];
    return {
      views: row[0] || 0,
      watchTimeMinutes: row[1] || 0,
      avgViewDuration: row[2] || 0,
      likes: row[3] || 0,
      comments: row[4] || 0,
      shares: row[5] || 0,
      subscribersGained: row[6] || 0,
      period: { startDate, endDate },
    };
  } catch (error) {
    console.error("Analytics API error:", error);
    return null;
  }
}

export async function getRecentVideos(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  
  const youtube = google.youtube({ version: "v3", auth });
  
  const response = await youtube.search.list({
    part: ["snippet"],
    forMine: true,
    type: ["video"],
    maxResults: 10,
    order: "date",
  });

  return response.data.items?.map(item => ({
    videoId: item.id?.videoId,
    title: item.snippet?.title,
    description: item.snippet?.description,
    thumbnailUrl: item.snippet?.thumbnails?.medium?.url,
    publishedAt: item.snippet?.publishedAt,
  })) || [];
}

export async function refreshAccessToken(refreshToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: refreshToken });
  
  const { credentials } = await auth.refreshAccessToken();
  return {
    accessToken: credentials.access_token,
    expiryDate: credentials.expiry_date,
  };
}

export interface VideoUploadParams {
  accessToken: string;
  title: string;
  description: string;
  tags?: string[];
  privacyStatus?: "private" | "unlisted" | "public";
  videoBuffer: Buffer;
  mimeType?: string;
}

export async function uploadVideo(params: VideoUploadParams) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: params.accessToken });
  
  const youtube = google.youtube({ version: "v3", auth });

  const { Readable } = await import("stream");
  const videoStream = Readable.from(params.videoBuffer);

  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: params.title,
        description: params.description,
        tags: params.tags || [],
      },
      status: {
        privacyStatus: params.privacyStatus || "private",
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      mimeType: params.mimeType || "video/mp4",
      body: videoStream,
    },
  });

  return {
    videoId: response.data.id,
    title: response.data.snippet?.title,
    channelId: response.data.snippet?.channelId,
    publishedAt: response.data.snippet?.publishedAt,
    status: response.data.status?.privacyStatus,
    url: `https://www.youtube.com/watch?v=${response.data.id}`,
  };
}
