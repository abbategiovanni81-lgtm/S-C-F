import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBrandBriefSchema, insertGeneratedContentSchema, insertSocialAccountSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { generateSocialContent, generateContentIdeas, analyzeViralContent, extractAnalyticsFromScreenshot, generateReply, analyzePostForListening, generateDalleImage, isDalleConfigured, type ContentGenerationRequest } from "./openai";
import { apifyService, APIFY_ACTORS, normalizeApifyItem, extractKeywordsFromBrief } from "./apify";
import { elevenlabsService } from "./elevenlabs";
import { falService } from "./fal";
import { a2eService } from "./a2e";
import { pexelsService } from "./pexels";
import { getAuthUrl, getTokensFromCode, getChannelInfo, getChannelAnalytics, getRecentVideos, uploadVideo, refreshAccessToken, getTrafficSources, getDeviceAnalytics, getGeographicAnalytics, getViewerRetention, getPeakViewingTimes, getTopVideos } from "./youtube";
import { ObjectStorageService, objectStorageClient } from "./objectStorage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

const objectStorageService = new ObjectStorageService();

// Helper to download external URLs and save locally
async function downloadAndSaveMedia(externalUrl: string, type: "video" | "image" | "audio"): Promise<string> {
  const response = await fetch(externalUrl);
  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.status}`);
  }
  
  const buffer = await response.arrayBuffer();
  const ext = type === "video" ? ".mp4" : type === "audio" ? ".mp3" : ".png";
  const filename = `${type}-${randomUUID()}${ext}`;
  
  // Save to public directory for serving
  const mediaDir = path.join(process.cwd(), "public", "generated-media");
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }
  
  const filePath = path.join(mediaDir, filename);
  fs.writeFileSync(filePath, Buffer.from(buffer));
  
  // Return the local URL
  return `/generated-media/${filename}`;
}

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
  
  // Serve generated media from public directory
  const generatedMediaDir = path.join(process.cwd(), "public", "generated-media");
  if (!fs.existsSync(generatedMediaDir)) {
    fs.mkdirSync(generatedMediaDir, { recursive: true });
  }
  app.use("/generated-media", express.static(generatedMediaDir));
  
  // Serve objects from cloud storage
  app.get("/objects/*", async (req, res) => {
    try {
      const objectPath = req.path;
      const file = await objectStorageService.getObjectEntityFile(objectPath);
      await objectStorageService.downloadObject(file, res);
    } catch (error: any) {
      if (error.name === "ObjectNotFoundError") {
        return res.status(404).json({ error: "Object not found" });
      }
      console.error("Error serving object:", error);
      res.status(500).json({ error: "Failed to serve object" });
    }
  });
  
  // Health check endpoint for deployment
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Brand Brief endpoints
  app.get("/api/brand-briefs", async (req, res) => {
    try {
      const userId = (req.query.userId as string) || "demo-user";
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
        linksToInclude: brief.linksToInclude,
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
          contentFormat: contentFormat,
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
      dalle: { configured: isDalleConfigured(), name: "DALL-E 3 Images" },
      elevenlabs: { configured: elevenlabsService.isConfigured(), name: "ElevenLabs Voice" },
      a2e: { configured: a2eService.isConfigured(), name: "A2E Avatar Video" },
      fal: { configured: falService.isConfigured(), name: "Fal.ai Video/Image" },
      pexels: { configured: pexelsService.isConfigured(), name: "Pexels B-Roll" },
    });
  });

  // DALL-E Image Generation
  app.post("/api/dalle/generate-image", async (req, res) => {
    try {
      const { prompt, size, quality, style } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "prompt is required" });
      }
      
      // Map aspect ratio to DALL-E size
      let dalleSize: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024";
      if (req.body.aspectRatio === "16:9") dalleSize = "1792x1024";
      else if (req.body.aspectRatio === "9:16") dalleSize = "1024x1792";
      
      const result = await generateDalleImage({ 
        prompt, 
        size: size || dalleSize, 
        quality: quality || "standard",
        style: style || "vivid"
      });
      
      // DALL-E URLs expire, so download and save locally
      let localImageUrl = result.imageUrl;
      try {
        localImageUrl = await downloadAndSaveMedia(result.imageUrl, "image");
        console.log(`Downloaded DALL-E image to ${localImageUrl}`);
      } catch (downloadError) {
        console.error("Failed to download DALL-E image:", downloadError);
      }
      
      res.json({ imageUrl: localImageUrl, revisedPrompt: result.revisedPrompt });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // A2E API routes
  app.get("/api/a2e/status", async (req, res) => {
    res.json({ configured: a2eService.isConfigured() });
  });

  app.get("/api/a2e/avatars", async (req, res) => {
    try {
      if (!a2eService.isConfigured()) {
        return res.status(400).json({ error: "A2E API not configured" });
      }
      const avatars = await a2eService.listAvatars();
      res.json({ avatars });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/a2e/generate", async (req, res) => {
    try {
      if (!a2eService.isConfigured()) {
        return res.status(400).json({ error: "A2E API not configured" });
      }

      const { text, creatorId, aspectRatio, voiceId } = req.body;

      if (!text || !creatorId) {
        return res.status(400).json({ error: "Text and creatorId are required" });
      }

      const lipSyncId = await a2eService.generateLipSync({
        text,
        creatorId,
        aspectRatio,
        voiceId,
      });

      res.json({ lipSyncId, status: "processing" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/a2e/status/:id", async (req, res) => {
    try {
      if (!a2eService.isConfigured()) {
        return res.status(400).json({ error: "A2E API not configured" });
      }

      const status = await a2eService.checkLipSyncStatus(req.params.id);
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/a2e/image-to-video", async (req, res) => {
    try {
      if (!a2eService.isConfigured()) {
        return res.status(400).json({ error: "A2E API not configured" });
      }

      const { imageUrl, text } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ error: "imageUrl is required" });
      }

      const taskId = await a2eService.generateImageToVideo({ imageUrl, text });
      res.json({ taskId, status: "processing" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/pexels/status", async (req, res) => {
    res.json({ configured: pexelsService.isConfigured() });
  });

  app.get("/api/pexels/search", async (req, res) => {
    try {
      const query = req.query.query as string;
      const mediaType = (req.query.type as "photos" | "videos" | "both") || "both";
      const perPage = parseInt(req.query.perPage as string) || 12;

      if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
      }

      const results = await pexelsService.searchBRoll(query, mediaType, perPage);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/pexels/curated", async (req, res) => {
    try {
      const perPage = parseInt(req.query.perPage as string) || 12;
      const photos = await pexelsService.getCuratedPhotos(perPage);
      res.json(photos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/pexels/popular-videos", async (req, res) => {
    try {
      const perPage = parseInt(req.query.perPage as string) || 12;
      const videos = await pexelsService.getPopularVideos(perPage);
      res.json(videos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
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
      
      if (result.status === "completed" && result.videoUrl) {
        // Download video from Fal.ai and save locally
        let localVideoUrl = result.videoUrl;
        try {
          if (result.videoUrl.includes("fal.media") || result.videoUrl.includes("fal.run")) {
            localVideoUrl = await downloadAndSaveMedia(result.videoUrl, "video");
            console.log(`Downloaded lip-sync video from Fal.ai to ${localVideoUrl}`);
          }
        } catch (downloadError) {
          console.error("Failed to download lip-sync video from Fal.ai:", downloadError);
        }
        res.json({ ...result, videoUrl: localVideoUrl });
      } else {
        res.json(result);
      }
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
      if (result.status === "completed" && result.videoUrl) {
        // Download video from Fal.ai and save locally
        let localVideoUrl = result.videoUrl;
        try {
          if (result.videoUrl.includes("fal.media") || result.videoUrl.includes("fal.run")) {
            localVideoUrl = await downloadAndSaveMedia(result.videoUrl, "video");
            console.log(`Downloaded video from Fal.ai to ${localVideoUrl}`);
          }
        } catch (downloadError) {
          console.error("Failed to download video from Fal.ai:", downloadError);
          // Keep the original URL if download fails
        }
        
        if (contentId) {
          const existingContent = await storage.getGeneratedContent(contentId);
          const existingMetadata = (existingContent?.generationMetadata as any) || {};
          await storage.updateGeneratedContent(contentId, {
            videoRequestStatus: "completed",
            generationMetadata: { ...existingMetadata, generatedVideoUrl: localVideoUrl },
          });
        }
        
        res.json({ ...result, videoUrl: localVideoUrl });
      } else if (result.status === "failed") {
        if (contentId) {
          await storage.updateGeneratedContent(contentId, {
            videoRequestStatus: "failed",
          });
        }
        res.json(result);
      } else {
        res.json(result);
      }
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
      
      // Poll for completion (Fal.ai is async)
      if (result.requestId && result.status === "processing") {
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds max wait
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const status = await falService.checkImageStatus(result.requestId);
          
          if (status.status === "completed" && status.imageUrl) {
            // Download and save locally
            let localImageUrl = status.imageUrl;
            try {
              if (status.imageUrl.includes("fal.media") || status.imageUrl.includes("fal.run")) {
                localImageUrl = await downloadAndSaveMedia(status.imageUrl, "image");
                console.log(`Downloaded Fal.ai image to ${localImageUrl}`);
              }
            } catch (downloadError) {
              console.error("Failed to download Fal.ai image:", downloadError);
            }
            return res.json({ imageUrl: localImageUrl, status: "completed" });
          } else if (status.status === "failed") {
            return res.status(500).json({ error: "Image generation failed" });
          }
          attempts++;
        }
        return res.status(500).json({ error: "Image generation timed out" });
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/fal/image-status/:requestId", async (req, res) => {
    try {
      const result = await falService.checkImageStatus(req.params.requestId);
      
      if (result.status === "completed" && result.imageUrl) {
        // Download image from Fal.ai and save locally
        let localImageUrl = result.imageUrl;
        try {
          if (result.imageUrl.includes("fal.media") || result.imageUrl.includes("fal.run")) {
            localImageUrl = await downloadAndSaveMedia(result.imageUrl, "image");
            console.log(`Downloaded image from Fal.ai to ${localImageUrl}`);
          }
        } catch (downloadError) {
          console.error("Failed to download image from Fal.ai:", downloadError);
        }
        res.json({ ...result, imageUrl: localImageUrl });
      } else {
        res.json(result);
      }
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

  // Image upload
  const uploadedImagesDir = path.join(process.cwd(), "public", "uploaded-images");
  if (!fs.existsSync(uploadedImagesDir)) {
    fs.mkdirSync(uploadedImagesDir, { recursive: true });
  }
  app.use("/uploaded-images", express.static(uploadedImagesDir));

  const contentImageUpload = multer({
    storage: multer.diskStorage({
      destination: uploadedImagesDir,
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`);
      },
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"));
      }
    },
  });

  app.post("/api/image/upload", contentImageUpload.single("image"), async (req, res) => {
    try {
      const file = req.file;
      const { contentId } = req.body;
      
      if (!file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      
      const imageUrl = `/uploaded-images/${file.filename}`;
      
      if (contentId) {
        const existingContent = await storage.getGeneratedContent(contentId);
        if (existingContent) {
          const existingMetadata = (existingContent.generationMetadata as any) || {};
          await storage.updateGeneratedContent(contentId, {
            generationMetadata: { ...existingMetadata, uploadedImageUrl: imageUrl },
          });
        }
      }
      
      res.json({ success: true, imageUrl, fileName: file.originalname });
    } catch (error: any) {
      console.error("Image upload error:", error);
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
      const accountId = req.query.accountId as string;
      let accessToken = req.cookies?.youtube_access_token;
      
      // If accountId provided, use that account's token instead of cookie
      if (accountId) {
        const account = await storage.getSocialAccount(accountId);
        if (account && account.accessToken) {
          // Check if token needs refresh
          if (account.tokenExpiry && new Date(account.tokenExpiry) < new Date()) {
            if (account.refreshToken) {
              const newTokens = await refreshAccessToken(account.refreshToken);
              await storage.updateSocialAccount(accountId, {
                accessToken: newTokens.accessToken,
                tokenExpiry: newTokens.expiryDate ? new Date(newTokens.expiryDate) : null,
              });
              accessToken = newTokens.accessToken;
            }
          } else {
            accessToken = account.accessToken;
          }
        }
      }
      
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
      const accountId = req.query.accountId as string;
      let accessToken = req.cookies?.youtube_access_token;
      let channelId = req.cookies?.youtube_channel_id;
      
      // If accountId provided, use that account's token and channel instead of cookie
      if (accountId) {
        const account = await storage.getSocialAccount(accountId);
        if (account && account.accessToken) {
          // Check if token needs refresh
          if (account.tokenExpiry && new Date(account.tokenExpiry) < new Date()) {
            if (account.refreshToken) {
              const newTokens = await refreshAccessToken(account.refreshToken);
              await storage.updateSocialAccount(accountId, {
                accessToken: newTokens.accessToken,
                tokenExpiry: newTokens.expiryDate ? new Date(newTokens.expiryDate) : null,
              });
              accessToken = newTokens.accessToken;
            }
          } else {
            accessToken = account.accessToken;
          }
          channelId = account.platformAccountId || undefined;
        }
      }
      
      if (!accessToken || !channelId) {
        return res.status(401).json({ error: "Not connected to YouTube" });
      }
      const analytics = await getChannelAnalytics(accessToken, channelId);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Helper function to get YouTube credentials with token refresh
  async function getYouTubeCredentials(req: any, accountId?: string) {
    let accessToken = req.cookies?.youtube_access_token;
    let channelId = req.cookies?.youtube_channel_id;
    
    if (accountId) {
      const account = await storage.getSocialAccount(accountId);
      if (account && account.accessToken) {
        // Check if token needs refresh
        if (account.tokenExpiry && new Date(account.tokenExpiry) < new Date()) {
          if (account.refreshToken) {
            const newTokens = await refreshAccessToken(account.refreshToken);
            await storage.updateSocialAccount(accountId, {
              accessToken: newTokens.accessToken,
              tokenExpiry: newTokens.expiryDate ? new Date(newTokens.expiryDate) : null,
            });
            accessToken = newTokens.accessToken;
          }
        } else {
          accessToken = account.accessToken;
        }
        channelId = account.platformAccountId || undefined;
      }
    }
    
    return { accessToken, channelId };
  }

  // Advanced YouTube Analytics endpoints
  app.get("/api/youtube/analytics/traffic-sources", async (req, res) => {
    try {
      const accountId = req.query.accountId as string;
      const { accessToken, channelId } = await getYouTubeCredentials(req, accountId);
      
      if (!accessToken || !channelId) {
        return res.status(401).json({ error: "Not connected to YouTube" });
      }
      const data = await getTrafficSources(accessToken, channelId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/youtube/analytics/devices", async (req, res) => {
    try {
      const accountId = req.query.accountId as string;
      const { accessToken, channelId } = await getYouTubeCredentials(req, accountId);
      
      if (!accessToken || !channelId) {
        return res.status(401).json({ error: "Not connected to YouTube" });
      }
      const data = await getDeviceAnalytics(accessToken, channelId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/youtube/analytics/geography", async (req, res) => {
    try {
      const accountId = req.query.accountId as string;
      const { accessToken, channelId } = await getYouTubeCredentials(req, accountId);
      
      if (!accessToken || !channelId) {
        return res.status(401).json({ error: "Not connected to YouTube" });
      }
      const data = await getGeographicAnalytics(accessToken, channelId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/youtube/analytics/retention", async (req, res) => {
    try {
      const accountId = req.query.accountId as string;
      const { accessToken, channelId } = await getYouTubeCredentials(req, accountId);
      
      if (!accessToken || !channelId) {
        return res.status(401).json({ error: "Not connected to YouTube" });
      }
      const data = await getViewerRetention(accessToken, channelId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/youtube/analytics/peak-times", async (req, res) => {
    try {
      const accountId = req.query.accountId as string;
      const { accessToken, channelId } = await getYouTubeCredentials(req, accountId);
      
      if (!accessToken || !channelId) {
        return res.status(401).json({ error: "Not connected to YouTube" });
      }
      const data = await getPeakViewingTimes(accessToken, channelId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/youtube/analytics/top-videos", async (req, res) => {
    try {
      const accountId = req.query.accountId as string;
      const { accessToken, channelId } = await getYouTubeCredentials(req, accountId);
      
      if (!accessToken || !channelId) {
        return res.status(401).json({ error: "Not connected to YouTube" });
      }
      const data = await getTopVideos(accessToken, channelId);
      res.json(data);
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
        // Check if it's a cloud storage path
        if (videoUrl.startsWith("/objects/")) {
          console.log("Reading video from cloud storage:", videoUrl);
          try {
            const file = await objectStorageService.getObjectEntityFile(videoUrl);
            const [buffer] = await file.download();
            videoBuffer = buffer;
            mimeType = "video/mp4";
          } catch (error) {
            console.error("Failed to read from cloud storage:", error);
            return res.status(400).json({ error: `Video file not found in cloud storage: ${videoUrl}` });
          }
        } else if (videoUrl.startsWith("/")) {
          // Read from local file system
          const localPath = path.join(process.cwd(), "public", videoUrl);
          console.log("Reading video from local path:", localPath);
          if (!fs.existsSync(localPath)) {
            return res.status(400).json({ error: `Video file not found: ${videoUrl}` });
          }
          videoBuffer = fs.readFileSync(localPath);
          mimeType = "video/mp4";
        } else {
          // Download video from URL
          console.log("Downloading video from URL:", videoUrl);
          const videoResponse = await fetch(videoUrl);
          if (!videoResponse.ok) {
            return res.status(400).json({ error: "Failed to download video from URL" });
          }
          const arrayBuffer = await videoResponse.arrayBuffer();
          videoBuffer = Buffer.from(arrayBuffer);
          mimeType = videoResponse.headers.get("content-type") || "video/mp4";
        }
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

  // ===== Social Listening Endpoints =====
  
  // Get listening hits (posts found matching keywords)
  app.get("/api/listening/hits", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const status = req.query.status as string | undefined;
      const hits = await storage.getListeningHits(userId, status);
      res.json(hits);
    } catch (error: any) {
      console.error("Error fetching listening hits:", error);
      res.status(500).json({ error: "Failed to fetch listening hits" });
    }
  });

  // Create a listening hit (manual entry or from external source)
  app.post("/api/listening/hits", async (req, res) => {
    try {
      const { userId, briefId, platform, postContent, postUrl, authorName, authorHandle, postType } = req.body;
      
      if (!platform || !postContent) {
        return res.status(400).json({ error: "platform and postContent are required" });
      }

      // Get brand brief for keyword matching
      let brandKeywords: string[] = [];
      if (briefId) {
        const brief = await storage.getBrandBrief(briefId);
        if (brief) {
          // Extract keywords from brand voice, target audience, and goals
          brandKeywords = [
            ...(brief.brandVoice?.split(/[,\s]+/) || []),
            ...(brief.targetAudience?.split(/[,\s]+/) || []),
          ].filter(k => k.length > 3).slice(0, 20);
        }
      }

      // Analyze the post with AI
      const analysis = await analyzePostForListening(postContent, brandKeywords);

      const hit = await storage.createListeningHit({
        userId: userId || "demo-user",
        briefId: briefId || null,
        platform,
        postContent,
        postUrl: postUrl || null,
        postId: null,
        authorName: authorName || null,
        authorHandle: authorHandle || null,
        authorProfileUrl: null,
        postType: postType || "comment",
        matchedKeywords: analysis.keywords,
        sentiment: analysis.sentiment,
        engagementScore: null,
        likes: null,
        comments: null,
        shares: null,
        isQuestion: analysis.isQuestion ? "yes" : "no",
        isTrending: "no",
        replyStatus: "pending",
        postedAt: null,
      });

      res.status(201).json({ hit, analysis });
    } catch (error: any) {
      console.error("Error creating listening hit:", error);
      res.status(500).json({ error: error.message || "Failed to create listening hit" });
    }
  });

  // Update a listening hit status
  app.patch("/api/listening/hits/:id", async (req, res) => {
    try {
      const hit = await storage.updateListeningHit(req.params.id, req.body);
      if (!hit) {
        return res.status(404).json({ error: "Listening hit not found" });
      }
      res.json(hit);
    } catch (error: any) {
      console.error("Error updating listening hit:", error);
      res.status(500).json({ error: "Failed to update listening hit" });
    }
  });

  // Generate an AI reply for a listening hit
  app.post("/api/listening/generate-reply", async (req, res) => {
    try {
      const { hitId, briefId, replyTone } = req.body;

      if (!hitId) {
        return res.status(400).json({ error: "hitId is required" });
      }

      // Get the listening hit
      const hits = await storage.getListeningHits();
      const hit = hits.find(h => h.id === hitId);
      if (!hit) {
        return res.status(404).json({ error: "Listening hit not found" });
      }

      // Get brand brief for context
      const useBriefId = briefId || hit.briefId;
      if (!useBriefId) {
        return res.status(400).json({ error: "No brand brief associated with this hit" });
      }

      const brief = await storage.getBrandBrief(useBriefId);
      if (!brief) {
        return res.status(404).json({ error: "Brand brief not found" });
      }

      // Generate reply using AI
      const result = await generateReply({
        postContent: hit.postContent,
        postAuthor: hit.authorHandle || hit.authorName || undefined,
        platform: hit.platform,
        brandVoice: brief.brandVoice,
        targetAudience: brief.targetAudience,
        contentGoals: brief.contentGoals,
        replyTone: replyTone || "helpful",
      });

      // Save the reply draft
      const draft = await storage.createReplyDraft({
        userId: hit.userId,
        listeningHitId: hitId,
        briefId: useBriefId,
        replyContent: result.replyContent,
        replyTone: result.replyTone,
        status: "draft",
        generationMetadata: {
          alternativeReplies: result.alternativeReplies,
          keyPointsAddressed: result.keyPointsAddressed,
        },
      });

      // Update hit status
      await storage.updateListeningHit(hitId, { replyStatus: "drafted" });

      res.json({ draft, result });
    } catch (error: any) {
      console.error("Error generating reply:", error);
      res.status(500).json({ error: error.message || "Failed to generate reply" });
    }
  });

  // Get reply drafts
  app.get("/api/listening/drafts", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const status = req.query.status as string | undefined;
      const drafts = await storage.getReplyDrafts(userId, status);
      res.json(drafts);
    } catch (error: any) {
      console.error("Error fetching reply drafts:", error);
      res.status(500).json({ error: "Failed to fetch reply drafts" });
    }
  });

  // Update a reply draft
  app.patch("/api/listening/drafts/:id", async (req, res) => {
    try {
      const draft = await storage.updateReplyDraft(req.params.id, req.body);
      if (!draft) {
        return res.status(404).json({ error: "Reply draft not found" });
      }
      res.json(draft);
    } catch (error: any) {
      console.error("Error updating reply draft:", error);
      res.status(500).json({ error: "Failed to update reply draft" });
    }
  });

  // Get trending topics
  app.get("/api/listening/trending", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const briefId = req.query.briefId as string | undefined;
      const topics = await storage.getTrendingTopics(userId, briefId);
      res.json(topics);
    } catch (error: any) {
      console.error("Error fetching trending topics:", error);
      res.status(500).json({ error: "Failed to fetch trending topics" });
    }
  });

  // Create/update a trending topic
  app.post("/api/listening/trending", async (req, res) => {
    try {
      const { userId, briefId, topic, keywords, platform, mentionCount, engagementTotal, sentiment } = req.body;
      
      if (!topic) {
        return res.status(400).json({ error: "topic is required" });
      }

      const trendingTopic = await storage.createTrendingTopic({
        userId: userId || "demo-user",
        briefId: briefId || null,
        topic,
        keywords: keywords || [],
        platform: platform || null,
        mentionCount: mentionCount || 1,
        engagementTotal: engagementTotal || 0,
        sentiment: sentiment || "neutral",
        trendScore: 0,
        examplePosts: null,
      });

      res.status(201).json(trendingTopic);
    } catch (error: any) {
      console.error("Error creating trending topic:", error);
      res.status(500).json({ error: error.message || "Failed to create trending topic" });
    }
  });

  // Check Apify status
  app.get("/api/listening/apify-status", async (req, res) => {
    res.json({
      configured: apifyService.isConfigured(),
      availableActors: Object.keys(APIFY_ACTORS),
    });
  });

  // Start a scan using Apify scrapers
  app.post("/api/listening/scan", async (req, res) => {
    try {
      const { briefId, platforms, maxItems = 20 } = req.body;

      if (!apifyService.isConfigured()) {
        return res.status(400).json({ 
          error: "Apify not configured", 
          message: "Please add your APIFY_API_TOKEN to use automated scanning" 
        });
      }

      if (!briefId) {
        return res.status(400).json({ error: "briefId is required" });
      }

      const brief = await storage.getBrandBrief(briefId);
      if (!brief) {
        return res.status(404).json({ error: "Brand brief not found" });
      }

      const keywords = extractKeywordsFromBrief({
        brandVoice: brief.brandVoice,
        targetAudience: brief.targetAudience,
        contentGoals: brief.contentGoals,
      });

      if (keywords.length === 0) {
        return res.status(400).json({ error: "No keywords could be extracted from the brand brief" });
      }

      const platformsToScan = platforms || ["reddit"];
      const results: { platform: string; itemsFound: number; itemsImported: number }[] = [];

      for (const platform of platformsToScan) {
        const actorConfig = APIFY_ACTORS[platform];
        if (!actorConfig) {
          console.warn(`No actor configured for platform: ${platform}`);
          continue;
        }

        const scanRun = await storage.createScanRun({
          userId: brief.userId,
          briefId,
          platform,
          actorId: actorConfig.actorId,
          status: "running",
          keywords,
        });

        try {
          const input: Record<string, any> = {
            [actorConfig.searchField]: platform === "reddit" 
              ? keywords.slice(0, 5).map(kw => ({ term: kw, sort: "relevance" }))
              : keywords.slice(0, 5),
            maxItems,
          };

          const items = await apifyService.runActorAndWait(actorConfig.actorId, input, 180000);
          let imported = 0;

          for (const item of items) {
            const normalized = normalizeApifyItem(platform, item, keywords, briefId);
            if (!normalized || !normalized.postContent) continue;

            const postId = normalized.postId || `${platform}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const isDuplicate = await storage.checkDuplicateHit(platform, postId);
            if (isDuplicate) continue;

            await storage.createListeningHit({
              userId: brief.userId,
              briefId,
              platform: normalized.platform || platform,
              postId,
              postUrl: normalized.postUrl || null,
              postContent: normalized.postContent,
              authorName: normalized.authorName || null,
              authorHandle: normalized.authorHandle || null,
              authorProfileUrl: normalized.authorProfileUrl || null,
              postType: normalized.postType || "post",
              matchedKeywords: normalized.matchedKeywords || [],
              sentiment: null,
              engagementScore: normalized.engagementScore || null,
              likes: normalized.likes || null,
              comments: normalized.comments || null,
              shares: normalized.shares || null,
              isQuestion: null,
              isTrending: null,
              replyStatus: "pending",
              postedAt: normalized.postedAt || null,
            });
            imported++;
          }

          await storage.updateScanRun(scanRun.id, {
            status: "completed",
            itemsFound: items.length,
            itemsImported: imported,
          });

          results.push({ platform, itemsFound: items.length, itemsImported: imported });
        } catch (error: any) {
          console.error(`Scan failed for ${platform}:`, error);
          await storage.updateScanRun(scanRun.id, {
            status: "failed",
            errorMessage: error.message,
          });
          results.push({ platform, itemsFound: 0, itemsImported: 0 });
        }
      }

      res.json({
        success: true,
        briefId,
        keywords,
        results,
        totalImported: results.reduce((sum, r) => sum + r.itemsImported, 0),
      });
    } catch (error: any) {
      console.error("Scan error:", error);
      res.status(500).json({ error: error.message || "Failed to run scan" });
    }
  });

  // Get scan history
  app.get("/api/listening/scans", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const briefId = req.query.briefId as string | undefined;
      const scans = await storage.getScanRuns(userId, briefId);
      res.json(scans);
    } catch (error: any) {
      console.error("Error fetching scan runs:", error);
      res.status(500).json({ error: "Failed to fetch scan runs" });
    }
  });

  return httpServer;
}
