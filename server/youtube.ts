import { google } from "googleapis";

function getYouTubeRedirectUri(): string {
  let uri: string;
  if (process.env.APP_URL) {
    uri = `${process.env.APP_URL}/api/youtube/callback`;
  } else if (process.env.NODE_ENV === "production" && process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(",");
    const productionDomain = domains.find(d => d.endsWith(".replit.app") || d.endsWith(".com")) || domains[0];
    uri = `https://${productionDomain}/api/youtube/callback`;
  } else {
    uri = `https://${process.env.REPLIT_DEV_DOMAIN}/api/youtube/callback`;
  }
  console.log("[YouTube OAuth] Using redirect URI:", uri);
  return uri;
}

// Create OAuth client dynamically to pick up current env vars
function getOAuth2Client() {
  const redirectUri = getYouTubeRedirectUri();
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export function setCredentials(tokens: any) {
  const oauth2Client = getOAuth2Client();
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
  publishAt?: string; // ISO 8601 datetime for scheduled publishing
  videoBuffer: Buffer;
  mimeType?: string;
}

export async function uploadVideo(params: VideoUploadParams) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: params.accessToken });
  
  const youtube = google.youtube({ version: "v3", auth });

  const { Readable } = await import("stream");
  const videoStream = Readable.from(params.videoBuffer);

  // Build status object - YouTube requires private status for scheduled videos
  const status: any = {
    selfDeclaredMadeForKids: false,
  };

  if (params.publishAt) {
    // For scheduled publishing, video must be private initially
    // YouTube will auto-publish at the specified time
    status.privacyStatus = "private";
    status.publishAt = params.publishAt;
  } else {
    status.privacyStatus = params.privacyStatus || "private";
  }

  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: params.title,
        description: params.description,
        tags: params.tags || [],
      },
      status,
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
    scheduledPublishAt: params.publishAt || null,
    status: response.data.status?.privacyStatus,
    url: `https://www.youtube.com/watch?v=${response.data.id}`,
  };
}

// Advanced Analytics Functions

export async function getTrafficSources(accessToken: string, channelId: string) {
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
      metrics: "views,estimatedMinutesWatched",
      dimensions: "insightTrafficSourceType",
      sort: "-views",
    });

    const trafficSources = (response.data.rows || []).map((row: any) => ({
      source: row[0],
      views: row[1],
      watchTimeMinutes: row[2],
    }));

    return { trafficSources, period: { startDate, endDate } };
  } catch (error) {
    console.error("Traffic sources API error:", error);
    return null;
  }
}

export async function getDeviceAnalytics(accessToken: string, channelId: string) {
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
      metrics: "views,estimatedMinutesWatched",
      dimensions: "deviceType",
      sort: "-views",
    });

    const devices = (response.data.rows || []).map((row: any) => ({
      device: row[0],
      views: row[1],
      watchTimeMinutes: row[2],
    }));

    return { devices, period: { startDate, endDate } };
  } catch (error) {
    console.error("Device analytics API error:", error);
    return null;
  }
}

export async function getGeographicAnalytics(accessToken: string, channelId: string) {
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
      metrics: "views,estimatedMinutesWatched",
      dimensions: "country",
      sort: "-views",
      maxResults: 10,
    });

    const countries = (response.data.rows || []).map((row: any) => ({
      country: row[0],
      views: row[1],
      watchTimeMinutes: row[2],
    }));

    return { countries, period: { startDate, endDate } };
  } catch (error) {
    console.error("Geographic analytics API error:", error);
    return null;
  }
}

export async function getViewerRetention(accessToken: string, channelId: string, videoId?: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth });

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  try {
    // Get overall retention metrics
    const response = await youtubeAnalytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views,averageViewDuration,averageViewPercentage",
      dimensions: "video",
      sort: "-views",
      maxResults: 10,
    });

    const videos = (response.data.rows || []).map((row: any) => ({
      videoId: row[0],
      views: row[1],
      avgDuration: row[2],
      avgPercentage: row[3],
    }));

    return { videos, period: { startDate, endDate } };
  } catch (error) {
    console.error("Viewer retention API error:", error);
    return null;
  }
}

export async function getPeakViewingTimes(accessToken: string, channelId: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth });

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  try {
    // Get views by day
    const dayResponse = await youtubeAnalytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views",
      dimensions: "day",
      sort: "day",
    });

    const viewsByDay = (dayResponse.data.rows || []).map((row: any) => ({
      date: row[0],
      views: row[1],
    }));

    // Aggregate by day of week
    const dayOfWeekViews: Record<string, number> = {};
    viewsByDay.forEach((item: any) => {
      const date = new Date(item.date);
      const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
      dayOfWeekViews[dayName] = (dayOfWeekViews[dayName] || 0) + item.views;
    });

    const byDayOfWeek = Object.entries(dayOfWeekViews).map(([day, views]) => ({ day, views }));
    byDayOfWeek.sort((a, b) => b.views - a.views);

    return { 
      viewsByDay, 
      byDayOfWeek,
      bestDay: byDayOfWeek[0]?.day || "Unknown",
      period: { startDate, endDate } 
    };
  } catch (error) {
    console.error("Peak viewing times API error:", error);
    return null;
  }
}

export async function getTopVideos(accessToken: string, channelId: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth });
  const youtube = google.youtube({ version: "v3", auth });

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  try {
    const response = await youtubeAnalytics.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views,estimatedMinutesWatched,averageViewDuration,likes,comments",
      dimensions: "video",
      sort: "-views",
      maxResults: 10,
    });

    const videoIds = (response.data.rows || []).map((row: any) => row[0]);
    
    // Get video details
    let videoDetails: Record<string, any> = {};
    if (videoIds.length > 0) {
      const detailsResponse = await youtube.videos.list({
        part: ["snippet"],
        id: videoIds,
      });
      
      (detailsResponse.data.items || []).forEach((item: any) => {
        videoDetails[item.id] = {
          title: item.snippet?.title,
          thumbnail: item.snippet?.thumbnails?.medium?.url,
        };
      });
    }

    const topVideos = (response.data.rows || []).map((row: any) => ({
      videoId: row[0],
      title: videoDetails[row[0]]?.title || "Unknown",
      thumbnail: videoDetails[row[0]]?.thumbnail,
      views: row[1],
      watchTimeMinutes: row[2],
      avgDuration: row[3],
      likes: row[4],
      comments: row[5],
    }));

    return { topVideos, period: { startDate, endDate } };
  } catch (error) {
    console.error("Top videos API error:", error);
    return null;
  }
}
