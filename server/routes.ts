import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBrandBriefSchema, insertGeneratedContentSchema, insertSocialAccountSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { generateSocialContent, generateContentIdeas, analyzeViralContent, type ContentGenerationRequest } from "./openai";
import { elevenlabsService } from "./elevenlabs";
import { falService } from "./fal";
import { getAuthUrl, getTokensFromCode, getChannelInfo, getChannelAnalytics, getRecentVideos, uploadVideo, refreshAccessToken } from "./youtube";
import multer from "multer";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Brand Brief endpoints
  app.get("/api/brand-briefs", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId query parameter is required" });
      }
      const briefs = await storage.getBrandBriefsByUser(userId);
      res.json(briefs);
    } catch (error) {
      console.error("Error fetching brand briefs:", error);
      res.status(500).json({ error: "Failed to fetch brand briefs" });
    }
  });

  app.get("/api/brand-briefs/:id", async (req, res) => {
    try {
      const brief = await storage.getBrandBrief(req.params.id);
      if (!brief) {
        return res.status(404).json({ error: "Brand brief not found" });
      }
      res.json(brief);
    } catch (error) {
      console.error("Error fetching brand brief:", error);
      res.status(500).json({ error: "Failed to fetch brand brief" });
    }
  });

  app.post("/api/brand-briefs", async (req, res) => {
    try {
      const result = insertBrandBriefSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      // Ensure user exists (create demo user if needed)
      await storage.ensureUser(result.data.userId);
      
      const brief = await storage.createBrandBrief(result.data);
      res.status(201).json(brief);
    } catch (error) {
      console.error("Error creating brand brief:", error);
      res.status(500).json({ error: "Failed to create brand brief" });
    }
  });

  app.patch("/api/brand-briefs/:id", async (req, res) => {
    try {
      const partialSchema = insertBrandBriefSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const brief = await storage.updateBrandBrief(req.params.id, result.data);
      if (!brief) {
        return res.status(404).json({ error: "Brand brief not found" });
      }
      res.json(brief);
    } catch (error) {
      console.error("Error updating brand brief:", error);
      res.status(500).json({ error: "Failed to update brand brief" });
    }
  });

  // Generated Content endpoints
  app.get("/api/content", async (req, res) => {
    try {
      const { briefId, status } = req.query;
      let content;
      if (briefId) {
        content = await storage.getContentByBrief(briefId as string);
      } else if (status) {
        content = await storage.getContentByStatus(status as string);
      } else {
        content = await storage.getContentByStatus("pending");
      }
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  app.get("/api/content/:id", async (req, res) => {
    try {
      const content = await storage.getGeneratedContent(req.params.id);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  app.post("/api/content", async (req, res) => {
    try {
      const result = insertGeneratedContentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const content = await storage.createGeneratedContent(result.data);
      res.status(201).json(content);
    } catch (error) {
      console.error("Error creating content:", error);
      res.status(500).json({ error: "Failed to create content" });
    }
  });

  app.patch("/api/content/:id", async (req, res) => {
    try {
      const partialSchema = insertGeneratedContentSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const content = await storage.updateGeneratedContent(req.params.id, result.data);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ error: "Failed to update content" });
    }
  });

  app.patch("/api/content/:id/approve", async (req, res) => {
    try {
      const content = await storage.updateGeneratedContent(req.params.id, { status: "approved" });
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Error approving content:", error);
      res.status(500).json({ error: "Failed to approve content" });
    }
  });

  app.patch("/api/content/:id/reject", async (req, res) => {
    try {
      const content = await storage.updateGeneratedContent(req.params.id, { status: "rejected" });
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Error rejecting content:", error);
      res.status(500).json({ error: "Failed to reject content" });
    }
  });

  // AI Content Generation endpoints
  app.post("/api/generate-content", async (req, res) => {
    try {
      const { briefId, contentType = "both", topic } = req.body;
      
      if (!briefId) {
        return res.status(400).json({ error: "briefId is required" });
      }

      const brief = await storage.getBrandBrief(briefId);
      if (!brief) {
        return res.status(404).json({ error: "Brand brief not found" });
      }

      const request: ContentGenerationRequest = {
        briefId,
        brandVoice: brief.brandVoice,
        targetAudience: brief.targetAudience,
        contentGoals: brief.contentGoals,
        platforms: brief.platforms,
        contentType,
        topic,
      };

      const result = await generateSocialContent(request);

      const content = await storage.createGeneratedContent({
        briefId,
        status: "pending",
        contentType,
        script: result.script || null,
        caption: result.caption || null,
        hashtags: result.hashtags || null,
        platforms: brief.platforms,
        generationMetadata: { 
          contentIdeas: result.contentIdeas,
          videoPrompts: result.videoPrompts,
        },
      });

      res.status(201).json({ content, generatedResult: result });
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  app.post("/api/generate-ideas", async (req, res) => {
    try {
      const { briefId, count = 5 } = req.body;
      
      if (!briefId) {
        return res.status(400).json({ error: "briefId is required" });
      }

      const brief = await storage.getBrandBrief(briefId);
      if (!brief) {
        return res.status(404).json({ error: "Brand brief not found" });
      }

      const ideas = await generateContentIdeas(
        brief.brandVoice,
        brief.targetAudience,
        brief.contentGoals,
        count
      );

      res.json({ ideas });
    } catch (error) {
      console.error("Error generating ideas:", error);
      res.status(500).json({ error: "Failed to generate content ideas" });
    }
  });

  // Content Analysis endpoint (OpenAI Vision)
  const analyzeUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  
  app.post("/api/analyze-content", analyzeUpload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const { briefId } = req.body;
      let brandBrief = undefined;

      if (briefId) {
        const brief = await storage.getBrandBrief(briefId);
        if (brief) {
          brandBrief = {
            brandVoice: brief.brandVoice,
            targetAudience: brief.targetAudience,
            contentGoals: brief.contentGoals,
          };
        }
      }

      const imageBase64 = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype;

      const analysis = await analyzeViralContent(imageBase64, mimeType, brandBrief);
      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing content:", error);
      res.status(500).json({ error: error.message || "Failed to analyze content" });
    }
  });

  // AI Engine Status endpoints
  app.get("/api/ai-engines/status", async (req, res) => {
    res.json({
      openai: { configured: true, name: "OpenAI GPT-4" },
      elevenlabs: { configured: elevenlabsService.isConfigured(), name: "ElevenLabs Studio" },
      fal: { configured: falService.isConfigured(), name: "Fal.ai Lip-Sync" },
    });
  });

  app.get("/api/elevenlabs/voices", async (req, res) => {
    try {
      const voices = await elevenlabsService.getVoices();
      res.json(voices);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/elevenlabs/voiceover", async (req, res) => {
    try {
      const { text, voiceId } = req.body;
      if (!text) {
        return res.status(400).json({ error: "text is required" });
      }
      const result = await elevenlabsService.generateVoiceover({ text, voiceId });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/fal/lipsync", async (req, res) => {
    try {
      const { videoUrl, audioUrl } = req.body;
      if (!videoUrl || !audioUrl) {
        return res.status(400).json({ error: "videoUrl and audioUrl are required" });
      }
      const result = await falService.submitLipSync({ videoUrl, audioUrl });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/fal/status/:requestId", async (req, res) => {
    try {
      const result = await falService.checkStatus(req.params.requestId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User endpoints (for demo purposes - create a default user)
  app.post("/api/users", async (req, res) => {
    try {
      const existing = await storage.getUserByUsername(req.body.username);
      if (existing) {
        return res.json(existing);
      }
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Social Accounts endpoints
  app.get("/api/social-accounts", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId query parameter is required" });
      }
      const accounts = await storage.getSocialAccountsByUser(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching social accounts:", error);
      res.status(500).json({ error: "Failed to fetch social accounts" });
    }
  });

  app.post("/api/social-accounts", async (req, res) => {
    try {
      const result = insertSocialAccountSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      await storage.ensureUser(result.data.userId);
      const account = await storage.createSocialAccount(result.data);
      res.status(201).json(account);
    } catch (error) {
      console.error("Error creating social account:", error);
      res.status(500).json({ error: "Failed to create social account" });
    }
  });

  app.delete("/api/social-accounts/:id", async (req, res) => {
    try {
      await storage.deleteSocialAccount(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting social account:", error);
      res.status(500).json({ error: "Failed to delete social account" });
    }
  });

  // Google/YouTube OAuth endpoints
  app.get("/api/auth/google", (req, res) => {
    const authUrl = getAuthUrl();
    res.redirect(authUrl);
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) {
        return res.redirect("/accounts?error=no_code");
      }

      const tokens = await getTokensFromCode(code);
      const channelInfo = await getChannelInfo(tokens.access_token!);

      // Store or update the connected YouTube account (supports multiple channels)
      const userId = "demo-user";
      await storage.ensureUser(userId);
      
      const existingAccount = channelInfo.channelId 
        ? await storage.getSocialAccountByPlatformAccountId(userId, "YouTube", channelInfo.channelId)
        : null;
      
      if (existingAccount) {
        await storage.updateSocialAccount(existingAccount.id, {
          accountName: channelInfo.title || "YouTube Channel",
          accountHandle: channelInfo.customUrl || channelInfo.channelId || null,
          profileUrl: channelInfo.thumbnailUrl || null,
          isConnected: "connected",
          accessToken: tokens.access_token || null,
          refreshToken: tokens.refresh_token || existingAccount.refreshToken,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        });
      } else {
        await storage.createSocialAccount({
          userId,
          platform: "YouTube",
          accountName: channelInfo.title || "YouTube Channel",
          accountHandle: channelInfo.customUrl || channelInfo.channelId || null,
          profileUrl: channelInfo.thumbnailUrl || null,
          isConnected: "connected",
          accessToken: tokens.access_token || null,
          refreshToken: tokens.refresh_token || null,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          platformAccountId: channelInfo.channelId || null,
        });
      }

      // Store tokens in a cookie/session for API calls (simplified for demo)
      res.cookie("youtube_access_token", tokens.access_token, { httpOnly: true, maxAge: 3600000 });
      res.cookie("youtube_refresh_token", tokens.refresh_token, { httpOnly: true, maxAge: 30 * 24 * 3600000 });
      res.cookie("youtube_channel_id", channelInfo.channelId, { httpOnly: true, maxAge: 30 * 24 * 3600000 });

      res.redirect("/accounts?connected=youtube");
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect("/accounts?error=oauth_failed");
    }
  });

  app.get("/api/youtube/channel", async (req, res) => {
    try {
      const accessToken = req.cookies?.youtube_access_token;
      if (!accessToken) {
        return res.status(401).json({ error: "Not connected to YouTube" });
      }
      const info = await getChannelInfo(accessToken);
      res.json(info);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/youtube/analytics", async (req, res) => {
    try {
      const accessToken = req.cookies?.youtube_access_token;
      const channelId = req.cookies?.youtube_channel_id;
      if (!accessToken || !channelId) {
        return res.status(401).json({ error: "Not connected to YouTube" });
      }
      const analytics = await getChannelAnalytics(accessToken, channelId);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/youtube/videos", async (req, res) => {
    try {
      const accessToken = req.cookies?.youtube_access_token;
      if (!accessToken) {
        return res.status(401).json({ error: "Not connected to YouTube" });
      }
      const videos = await getRecentVideos(accessToken);
      res.json(videos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 256 * 1024 * 1024 } });

  app.post("/api/youtube/upload", upload.single("video"), async (req, res) => {
    try {
      const userId = "demo-user";
      const { accountId } = req.body;
      
      let account;
      if (accountId) {
        const accounts = await storage.getSocialAccountsByUser(userId);
        account = accounts.find(a => a.id === accountId && a.platform === "YouTube");
      } else {
        account = await storage.getSocialAccountByPlatform(userId, "YouTube");
      }
      
      if (!account?.accessToken) {
        return res.status(401).json({ error: "YouTube not connected or tokens expired. Please reconnect your YouTube account." });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }

      const { title, description, tags, privacyStatus } = req.body;
      
      let accessToken = account.accessToken;
      
      if (account.tokenExpiry && new Date(account.tokenExpiry) < new Date()) {
        if (!account.refreshToken) {
          return res.status(401).json({ error: "Token expired and no refresh token available. Please reconnect your YouTube account." });
        }
        const newTokens = await refreshAccessToken(account.refreshToken);
        accessToken = newTokens.accessToken!;
        await storage.updateSocialAccount(account.id, {
          accessToken: newTokens.accessToken,
          tokenExpiry: newTokens.expiryDate ? new Date(newTokens.expiryDate) : null,
        });
      }

      let parsedTags: string[] = [];
      if (tags) {
        try {
          parsedTags = JSON.parse(tags);
        } catch {
          parsedTags = tags.split(",").map((t: string) => t.trim()).filter(Boolean);
        }
      }

      const result = await uploadVideo({
        accessToken,
        title: title || "Untitled Video",
        description: description || "",
        tags: parsedTags,
        privacyStatus: privacyStatus || "private",
        videoBuffer: req.file.buffer,
        mimeType: req.file.mimetype,
      });

      res.json(result);
    } catch (error: any) {
      console.error("YouTube upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload video" });
    }
  });

  return httpServer;
}
