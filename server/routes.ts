import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBrandBriefSchema, insertGeneratedContentSchema, insertSocialAccountSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { generateSocialContent, generateContentIdeas, analyzeViralContent, extractAnalyticsFromScreenshot, type ContentGenerationRequest } from "./openai";
import { elevenlabsService } from "./elevenlabs";
import { falService } from "./fal";
import { getAuthUrl, getTokensFromCode, getChannelInfo, getChannelAnalytics, getRecentVideos, uploadVideo, refreshAccessToken } from "./youtube";
import multer from "multer";
import path from "path";
import fs from "fs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Serve merged videos from public directory
  const mergedVideosDir = path.join(process.cwd(), "public", "merged-videos");
  if (!fs.existsSync(mergedVideosDir)) {
    fs.mkdirSync(mergedVideosDir, { recursive: true });
  }
  app.use("/merged-videos", express.static(mergedVideosDir));
  
  // Health check endpoint for deployment
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

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

  app.patch("/api/content/:id/posted", async (req, res) => {
    try {
      const content = await storage.updateGeneratedContent(req.params.id, { status: "posted" });
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Error marking content as posted:", error);
      res.status(500).json({ error: "Failed to mark content as posted" });
    }
  });

  // AI Content Generation endpoints
  app.post("/api/generate-content", async (req, res) => {
    try {
      const { briefId, contentType = "both", contentFormat = "video", topic } = req.body;
      
      if (!briefId) {
        return res.status(400).json({ error: "briefId is required" });
      }

      const brief = await storage.getBrandBrief(briefId);
      if (!brief) {
        return res.status(404).json({ error: "Brand brief not found" });
      }

      const avoidPatterns = await storage.getAvoidPatternsForBrief(briefId);
      const topPerformingPosts = await storage.getTopPerformingPatterns(brief.userId);

      const request: ContentGenerationRequest = {
        briefId,
        brandVoice: brief.brandVoice,
        targetAudience: brief.targetAudience,
        contentGoals: brief.contentGoals,
        platforms: brief.platforms,
        contentType,
        contentFormat,
        topic,
        avoidPatterns,
        topPerformingPosts,
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
          contentType: contentFormat,
          videoPrompts: result.videoPrompts,
          imagePrompts: result.imagePrompts,
          carouselPrompts: result.carouselPrompts,
          tiktokTextPost: result.tiktokTextPost,
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

  // Image upload endpoint
  const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
  
  app.post("/api/upload/image", imageUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Upload to Fal.ai storage for hosting
      if (falService.isConfigured()) {
        const result = await falService.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
        return res.json({ url: result.url, fileName: result.fileName });
      }

      // Fallback: save to local uploads directory
      const fs = await import("fs/promises");
      const uploadsDir = path.join(process.cwd(), "server", "uploads", "images");
      await fs.mkdir(uploadsDir, { recursive: true });
      
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const filePath = path.join(uploadsDir, fileName);
      await fs.writeFile(filePath, req.file.buffer);
      
      res.json({ url: `/uploads/images/${fileName}`, fileName });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: error.message || "Failed to upload image" });
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

  // Lip-sync with file upload - accepts video file and optional audio file
  const lipSyncUpload = multer({ storage: multer.memoryStorage() }).fields([
    { name: 'video', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ]);

  app.post("/api/fal/lipsync-upload", lipSyncUpload, async (req, res) => {
    try {
      const files = req.files as { video?: Express.Multer.File[], audio?: Express.Multer.File[] };
      const { audioUrl } = req.body; // Can pass existing audio URL instead of file
      
      if (!files?.video?.[0]) {
        return res.status(400).json({ error: "Video file is required" });
      }
      
      if (!files?.audio?.[0] && !audioUrl) {
        return res.status(400).json({ error: "Audio file or audioUrl is required" });
      }

      // Upload video to Fal.ai storage
      const videoFile = files.video[0];
      const uploadedVideo = await falService.uploadFile(
        videoFile.buffer,
        videoFile.originalname,
        videoFile.mimetype
      );

      // Either use existing audioUrl or upload audio file
      let finalAudioUrl = audioUrl;
      if (files?.audio?.[0]) {
        const audioFile = files.audio[0];
        const uploadedAudio = await falService.uploadFile(
          audioFile.buffer,
          audioFile.originalname,
          audioFile.mimetype
        );
        finalAudioUrl = uploadedAudio.url;
      }

      // Submit lip-sync job
      const result = await falService.submitLipSync({
        videoUrl: uploadedVideo.url,
        audioUrl: finalAudioUrl,
      });

      res.json({
        ...result,
        uploadedVideoUrl: uploadedVideo.url,
        audioUrl: finalAudioUrl,
      });
    } catch (error: any) {
      console.error("Lip-sync upload error:", error);
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

  app.post("/api/fal/generate-video", async (req, res) => {
    try {
      const { prompt, negativePrompt, aspectRatio, duration, contentId } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "prompt is required" });
      }
      const result = await falService.generateVideo({ prompt, negativePrompt, aspectRatio, duration });
      
      // Save the request ID to the content for resume polling
      if (contentId && result.requestId) {
        await storage.updateGeneratedContent(contentId, {
          videoRequestId: result.requestId,
          videoRequestStatus: "processing",
        });
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/fal/video-status/:requestId", async (req, res) => {
    try {
      const contentId = req.query.contentId as string | undefined;
      const result = await falService.checkVideoStatus(req.params.requestId);
      
      // Update content status when video is completed or failed
      if (contentId && result.status === "completed" && result.videoUrl) {
        const existingContent = await storage.getGeneratedContent(contentId);
        const existingMetadata = (existingContent?.generationMetadata as any) || {};
        await storage.updateGeneratedContent(contentId, {
          videoRequestStatus: "completed",
          generationMetadata: { ...existingMetadata, generatedVideoUrl: result.videoUrl },
        });
      } else if (contentId && result.status === "failed") {
        await storage.updateGeneratedContent(contentId, {
          videoRequestStatus: "failed",
        });
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/fal/generate-image", async (req, res) => {
    try {
      const { prompt, negativePrompt, aspectRatio, style } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "prompt is required" });
      }
      const result = await falService.generateImage({ prompt, negativePrompt, aspectRatio, style });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/fal/image-status/:requestId", async (req, res) => {
    try {
      const result = await falService.checkImageStatus(req.params.requestId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Video merge endpoint - combines clips with optional voiceover using ffmpeg
  app.post("/api/video/merge", async (req, res) => {
    try {
      const { contentId, clipUrls, voiceoverUrl } = req.body;
      if (!contentId || !clipUrls || clipUrls.length === 0) {
        return res.status(400).json({ error: "contentId and clipUrls are required" });
      }
      
      const existingContent = await storage.getGeneratedContent(contentId);
      if (!existingContent) {
        return res.status(404).json({ error: "Content not found" });
      }
      
      const { mergeVideosWithAudio } = await import("./videoMerge");
      const result = await mergeVideosWithAudio(clipUrls, voiceoverUrl || null);
      
      const existingMetadata = (existingContent.generationMetadata as any) || {};
      
      await storage.updateGeneratedContent(contentId, {
        generationMetadata: {
          ...existingMetadata,
          mergedVideoUrl: result.mergedVideoUrl,
          mergeConfig: {
            clipUrls,
            voiceoverUrl,
            mergedAt: new Date().toISOString(),
          },
        },
      });
      
      res.json({ 
        success: true, 
        message: "Clips merged with voiceover successfully", 
        mergedVideoUrl: result.mergedVideoUrl 
      });
    } catch (error: any) {
      console.error("Video merge error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Video clip upload endpoint
  const clipUpload = multer({ 
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), "public", "uploaded-clips");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    }),
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
  });
  
  app.use("/uploaded-clips", express.static(path.join(process.cwd(), "public", "uploaded-clips")));

  app.post("/api/video/upload-clip", clipUpload.single("video"), async (req, res) => {
    try {
      const file = req.file;
      const { contentId } = req.body;
      
      if (!file) {
        return res.status(400).json({ error: "No video file provided" });
      }
      
      const videoUrl = `/uploaded-clips/${file.filename}`;
      
      // Save to content metadata if contentId provided
      if (contentId) {
        const existingContent = await storage.getGeneratedContent(contentId);
        if (existingContent) {
          const existingMetadata = (existingContent.generationMetadata as any) || {};
          const uploadedClips = existingMetadata.uploadedClips || [];
          uploadedClips.push({
            id: `uploaded-${Date.now()}`,
            videoUrl,
            fileName: file.originalname,
            uploadedAt: new Date().toISOString(),
          });
          await storage.updateGeneratedContent(contentId, {
            generationMetadata: { ...existingMetadata, uploadedClips },
          });
        }
      }
      
      res.json({ success: true, videoUrl, fileName: file.originalname });
    } catch (error: any) {
      console.error("Clip upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Prompt Feedback endpoints
  app.post("/api/prompt-feedback", async (req, res) => {
    try {
      const { briefId, contentId, feedbackType, originalPrompt, negativePrompt, rejectionReason, avoidPatterns } = req.body;
      if (!rejectionReason || !feedbackType) {
        return res.status(400).json({ error: "feedbackType and rejectionReason are required" });
      }
      const feedback = await storage.createPromptFeedback({
        briefId: briefId || null,
        contentId: contentId || null,
        feedbackType,
        originalPrompt,
        negativePrompt,
        rejectionReason,
        avoidPatterns: avoidPatterns || [],
      });
      res.status(201).json(feedback);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/prompt-feedback/avoid-patterns", async (req, res) => {
    try {
      const briefId = req.query.briefId as string | null;
      const patterns = await storage.getAvoidPatternsForBrief(briefId || null);
      res.json({ patterns });
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
      const { accountId, videoUrl } = req.body;
      
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
      
      let videoBuffer: Buffer;
      let mimeType = "video/mp4";
      
      if (videoUrl) {
        // Download video from URL
        console.log("Downloading video from URL:", videoUrl);
        const videoResponse = await fetch(videoUrl);
        if (!videoResponse.ok) {
          return res.status(400).json({ error: "Failed to download video from URL" });
        }
        const arrayBuffer = await videoResponse.arrayBuffer();
        videoBuffer = Buffer.from(arrayBuffer);
        mimeType = videoResponse.headers.get("content-type") || "video/mp4";
      } else if (req.file) {
        videoBuffer = req.file.buffer;
        mimeType = req.file.mimetype;
      } else {
        return res.status(400).json({ error: "No video file or URL provided" });
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
        videoBuffer,
        mimeType,
      });

      res.json(result);
    } catch (error: any) {
      console.error("YouTube upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload video" });
    }
  });

  // Analytics screenshot upload and processing
  const analyticsUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"));
      }
    },
  });

  app.post("/api/analytics/upload", analyticsUpload.single("screenshot"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No screenshot file provided" });
      }

      const imageBase64 = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype;

      // Extract analytics data using GPT-4 Vision
      const extracted = await extractAnalyticsFromScreenshot(imageBase64, mimeType);

      // Store the snapshot in the database
      const snapshot = await storage.createAnalyticsSnapshot({
        userId: req.body.userId || null,
        accountId: req.body.accountId || null,
        platform: extracted.platform,
        sourceType: "upload",
        reportingRange: extracted.reportingRange || null,
        capturedAt: new Date(),
        postViews: extracted.overview?.postViews || null,
        profileViews: extracted.overview?.profileViews || null,
        likes: extracted.overview?.likes || null,
        comments: extracted.overview?.comments || null,
        shares: extracted.overview?.shares || null,
        followers: extracted.overview?.followers || null,
        followersChange: extracted.overview?.followersChange || null,
        audienceData: extracted.audienceData || null,
        topPosts: extracted.topPosts || null,
        trafficSources: extracted.trafficSources || null,
        searchQueries: extracted.searchQueries || null,
        bestTimes: extracted.bestTimes || null,
        rawExtraction: extracted,
        confidenceScore: extracted.confidenceScore || null,
      });

      res.json({
        success: true,
        snapshot,
        extracted,
      });
    } catch (error: any) {
      console.error("Analytics upload error:", error);
      res.status(500).json({ error: error.message || "Failed to process analytics screenshot" });
    }
  });

  // Get all analytics snapshots
  app.get("/api/analytics/snapshots", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const snapshots = await storage.getAnalyticsSnapshots(userId);
      res.json(snapshots);
    } catch (error: any) {
      console.error("Error fetching analytics snapshots:", error);
      res.status(500).json({ error: "Failed to fetch analytics snapshots" });
    }
  });

  // Get top performing patterns (for AI learning)
  app.get("/api/analytics/top-patterns", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const patterns = await storage.getTopPerformingPatterns(userId);
      res.json(patterns);
    } catch (error: any) {
      console.error("Error fetching top patterns:", error);
      res.status(500).json({ error: "Failed to fetch top patterns" });
    }
  });

  return httpServer;
}
