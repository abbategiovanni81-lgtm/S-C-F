import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBrandBriefSchema, insertGeneratedContentSchema, insertSocialAccountSchema, userApiKeys, brandBriefs, generatedContent, socialAccounts, scheduledPosts } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { db } from "./db";
import { eq, sql, inArray } from "drizzle-orm";
import { users, OWNER_EMAIL, TIER_LIMITS, usagePeriods, usageTopups, type TierType } from "@shared/models/auth";
import { getUncachableStripeClient, getStripePublishableKey, getStripeSync } from "./stripeClient";
import { WebhookHandlers } from "./webhookHandlers";
import { runMigrations } from "stripe-replit-sync";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { openai, generateSocialContent, generateContentIdeas, analyzeViralContent, extractAnalyticsFromScreenshot, generateReply, analyzePostForListening, generateDalleImage, generateCarouselImage, isDalleConfigured, compareContentToViral, analyzeBrandFromWebsite, analyzeBrandFromSocialProfile, parseAssetTokens, removeAssetTokens, analyzeCarouselStyle, type ContentGenerationRequest, type ContentComparisonRequest, type CarouselImageRequest, type TrendingContext } from "./openai";
import { apifyService, APIFY_ACTORS, normalizeApifyItem, extractKeywordsFromBrief, scrapeWebsiteForBrandAnalysis, detectSocialPlatform, scrapeSocialProfile } from "./apify";
import { elevenlabsService } from "./elevenlabs";
import { falService } from "./fal";
import { a2eService } from "./a2e";
import { pexelsService } from "./pexels";
import { steveAIService } from "./steveai";
import { gettyService } from "./getty";
import { redditService } from "./reddit";
import { getAuthUrl, getTokensFromCode, getChannelInfo, getChannelAnalytics, getRecentVideos, uploadVideo, refreshAccessToken, revokeToken, getTrafficSources, getDeviceAnalytics, getGeographicAnalytics, getViewerRetention, getPeakViewingTimes, getTopVideos } from "./youtube";
import * as socialPlatforms from "./socialPlatforms";
import { ObjectStorageService, objectStorageClient } from "./objectStorage";
import { getUsageStats, checkQuota, incrementUsage, assertQuota, QuotaExceededError, checkCreatorStudioQuota, incrementCreatorStudioUsage, assertCreatorStudioQuota, CreatorStudioAccessError, getA2ECapacityStatus } from "./usageService";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { processVideoForClips, extractAndUploadClip } from "./videoProcessing";

const objectStorageService = new ObjectStorageService();

// Helper to download external URLs and save to cloud storage for persistence
async function downloadAndSaveMedia(externalUrl: string, type: "video" | "image" | "audio"): Promise<string> {
  const response = await fetch(externalUrl);
  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.status}`);
  }
  
  const buffer = Buffer.from(await response.arrayBuffer());
  const ext = type === "video" ? ".mp4" : type === "audio" ? ".mp3" : ".png";
  const mimeType = type === "video" ? "video/mp4" : type === "audio" ? "audio/mpeg" : "image/png";
  const filename = `generated-${type}-${randomUUID()}${ext}`;
  
  // Save to cloud storage for persistence in production
  try {
    const result = await objectStorageService.uploadBuffer(buffer, filename, mimeType, true);
    console.log(`Saved ${type} to cloud storage: ${result.objectPath}`);
    return result.objectPath;
  } catch (cloudError) {
    console.error("Failed to save to cloud storage, falling back to local:", cloudError);
    
    // Fallback to local storage (for dev only)
    const mediaDir = path.join(process.cwd(), "public", "generated-media");
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }
    const filePath = path.join(mediaDir, filename);
    fs.writeFileSync(filePath, buffer);
    return `/generated-media/${filename}`;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup authentication (must be before other routes)
  await setupAuth(app);

  // TikTok domain verification file
  app.get("/tiktokflGMKAz0e5DhGPBYtGheu6I4jtpHnLHs.txt", (req, res) => {
    res.type("text/plain").send("tiktok-developers-site-verification=flGMKAz0e5DhGPBYtGheu6I4jtpHnLHs");
  });
  
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

  // Helper to get user ID from authenticated session - requires authentication
  const getUserId = (req: any): string | null => {
    // Only return user ID if properly authenticated
    if (req.isAuthenticated && req.isAuthenticated()) {
      // Support both Replit auth (claims.sub) and Passport auth (user.id)
      return req.user?.claims?.sub || req.user?.id || null;
    }
    return null;
  };
  
  // Middleware to require authentication
  const requireAuth = (req: any, res: any, next: any) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    req.userId = userId;
    next();
  };

  // Brand Brief endpoints
  app.get("/api/brand-briefs", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const briefs = await storage.getBrandBriefsByUser(userId);
      res.json(briefs);
    } catch (error) {
      console.error("Error fetching brand briefs:", error);
      res.status(500).json({ error: "Failed to fetch brand briefs" });
    }
  });

  app.get("/api/brand-briefs/:id", requireAuth, async (req: any, res) => {
    try {
      const brief = await storage.getBrandBrief(req.params.id);
      if (!brief) {
        return res.status(404).json({ error: "Brand brief not found" });
      }
      // Check ownership
      if (brief.userId !== req.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(brief);
    } catch (error) {
      console.error("Error fetching brand brief:", error);
      res.status(500).json({ error: "Failed to fetch brand brief" });
    }
  });

  app.post("/api/brand-briefs", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const result = insertBrandBriefSchema.safeParse({ ...req.body, userId });
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      // Ensure user exists
      await storage.ensureUser(userId);
      
      // Check tier limit for brand briefs
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (user) {
        const tierLimits = TIER_LIMITS[user.tier as TierType] || TIER_LIMITS.free;
        const existingBriefs = await storage.getBrandBriefsByUser(userId);
        if (existingBriefs.length >= tierLimits.brandBriefs) {
          return res.status(403).json({ 
            error: "Tier limit reached", 
            message: `Your ${user.tier} plan is limited to ${tierLimits.brandBriefs} brand brief${tierLimits.brandBriefs > 1 ? 's' : ''}. Upgrade to increase your limit.` 
          });
        }
      }
      
      const brief = await storage.createBrandBrief(result.data);
      res.status(201).json(brief);
    } catch (error) {
      console.error("Error creating brand brief:", error);
      res.status(500).json({ error: "Failed to create brand brief" });
    }
  });

  app.post("/api/brand-briefs/generate-from-url", requireAuth, async (req: any, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL is required" });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      // Detect if this is a social media profile URL
      const platform = detectSocialPlatform(url);
      console.log(`Detected platform: ${platform} for URL: ${url}`);
      
      let brandAnalysis;
      
      if (platform && platform !== "website") {
        // Handle social media profile URL
        console.log(`Scraping ${platform} profile: ${url}`);
        let profileData;
        try {
          profileData = await scrapeSocialProfile(url);
        } catch (scrapeError: any) {
          console.error(`Failed to scrape ${platform} profile:`, scrapeError);
          return res.status(400).json({ 
            error: `Unable to access this ${platform} profile. The account may be private, have restricted access, or the platform may be temporarily unavailable. Please try again or enter your brand details manually.` 
          });
        }
        
        // Validate we have enough data to analyze
        const hasContent = profileData.bio || 
          (profileData.recentPosts && profileData.recentPosts.length > 0) ||
          profileData.displayName;
        
        if (!hasContent) {
          return res.status(400).json({
            error: `This ${platform} profile doesn't have enough public content to analyze. Please ensure the account is public and has some posts, or enter your brand details manually.`
          });
        }
        
        console.log(`Analyzing ${platform} profile for brand brief...`);
        brandAnalysis = await analyzeBrandFromSocialProfile({
          platform: profileData.platform,
          username: profileData.username,
          displayName: profileData.displayName,
          bio: profileData.bio,
          followerCount: profileData.followerCount,
          postCount: profileData.postCount,
          recentPosts: profileData.recentPosts || [],
          isVerified: profileData.isVerified,
          category: profileData.category,
        });
        
        // Validate we got a proper analysis result
        if (!brandAnalysis || typeof brandAnalysis !== 'object' || !brandAnalysis.name) {
          return res.status(400).json({
            error: `Could not generate brand analysis from this profile. Please try again or enter your brand details manually.`
          });
        }
      } else {
        // Handle regular website URL
        console.log(`Scraping website: ${url}`);
        const scrapedData = await scrapeWebsiteForBrandAnalysis(url);

        console.log("Analyzing brand from website content...");
        brandAnalysis = await analyzeBrandFromWebsite(scrapedData);
      }

      res.json({
        success: true,
        data: brandAnalysis,
        sourceType: platform && platform !== "website" ? platform : "website",
      });
    } catch (error: any) {
      console.error("Error generating brand brief from URL:", error);
      res.status(500).json({ error: error.message || "Failed to analyze URL" });
    }
  });

  app.patch("/api/brand-briefs/:id", requireAuth, async (req: any, res) => {
    try {
      // Check ownership first
      const existingBrief = await storage.getBrandBrief(req.params.id);
      if (!existingBrief) {
        return res.status(404).json({ error: "Brand brief not found" });
      }
      if (existingBrief.userId !== req.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const partialSchema = insertBrandBriefSchema.partial();
      const result = partialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const brief = await storage.updateBrandBrief(req.params.id, result.data);
      res.json(brief);
    } catch (error) {
      console.error("Error updating brand brief:", error);
      res.status(500).json({ error: "Failed to update brand brief" });
    }
  });

  // Brand Assets endpoints
  const assetUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  app.get("/api/brand-assets/:briefId", requireAuth, async (req: any, res) => {
    try {
      // Check if user owns the brief
      const brief = await storage.getBrandBrief(req.params.briefId);
      if (!brief) {
        return res.status(404).json({ error: "Brand brief not found" });
      }
      if (brief.userId !== req.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const assets = await storage.getBrandAssetsByBrief(req.params.briefId);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching brand assets:", error);
      res.status(500).json({ error: "Failed to fetch brand assets" });
    }
  });

  app.post("/api/brand-assets", requireAuth, assetUpload.single("file"), async (req: any, res) => {
    try {
      const { briefId, assetType, name, description, referenceSlug } = req.body;
      
      if (!briefId || !name) {
        return res.status(400).json({ error: "briefId and name are required" });
      }
      
      // Check if user owns the brief
      const brief = await storage.getBrandBrief(briefId);
      if (!brief) {
        return res.status(404).json({ error: "Brand brief not found" });
      }
      if (brief.userId !== req.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      let imageUrl = req.body.imageUrl;
      
      // If a file was uploaded, upload to cloud storage
      if (req.file) {
        const result = await objectStorageService.uploadBuffer(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          true
        );
        imageUrl = result.objectPath;
      }
      
      if (!imageUrl) {
        return res.status(400).json({ error: "Either file or imageUrl is required" });
      }
      
      const asset = await storage.createBrandAsset({
        briefId,
        userId: req.userId,
        assetType: assetType || "other",
        name,
        referenceSlug: referenceSlug || null,
        description: description || null,
        imageUrl,
      });
      
      res.status(201).json(asset);
    } catch (error) {
      console.error("Error creating brand asset:", error);
      res.status(500).json({ error: "Failed to create brand asset" });
    }
  });

  app.delete("/api/brand-assets/:id", requireAuth, async (req: any, res) => {
    try {
      // Get asset to check ownership
      const assets = await storage.getBrandAssetsByUser(req.userId);
      const asset = assets.find(a => a.id === req.params.id);
      
      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }
      
      await storage.deleteBrandAsset(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting brand asset:", error);
      res.status(500).json({ error: "Failed to delete brand asset" });
    }
  });

  // Helper to check content ownership via brand brief
  const checkContentOwnership = async (contentId: string, userId: string): Promise<boolean> => {
    const content = await storage.getGeneratedContent(contentId);
    if (!content || !content.briefId) return false;
    const brief = await storage.getBrandBrief(content.briefId);
    return brief?.userId === userId;
  };

  // Generated Content endpoints
  app.get("/api/content", requireAuth, async (req: any, res) => {
    try {
      const { briefId, status } = req.query;
      const userId = req.userId;
      
      // Get user's brand briefs to filter content
      const userBriefs = await storage.getBrandBriefsByUser(userId);
      const userBriefIds = new Set(userBriefs.map(b => b.id));
      
      let content;
      if (briefId) {
        // Check if user owns this brief
        if (!userBriefIds.has(briefId as string)) {
          return res.status(403).json({ error: "Access denied" });
        }
        content = await storage.getContentByBrief(briefId as string);
      } else if (status) {
        // Get all content with status and filter by user's briefs
        const allContent = await storage.getContentByStatus(status as string);
        content = allContent.filter((c: any) => c.briefId && userBriefIds.has(c.briefId));
      } else {
        const allContent = await storage.getContentByStatus("pending");
        content = allContent.filter((c: any) => c.briefId && userBriefIds.has(c.briefId));
      }
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  app.get("/api/content/:id", requireAuth, async (req: any, res) => {
    try {
      const content = await storage.getGeneratedContent(req.params.id);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      // Check ownership via brand brief
      if (content.briefId) {
        const brief = await storage.getBrandBrief(content.briefId);
        if (!brief || brief.userId !== req.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  app.post("/api/content", requireAuth, async (req: any, res) => {
    try {
      const result = insertGeneratedContentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      // Check if user owns the brand brief
      if (result.data.briefId) {
        const brief = await storage.getBrandBrief(result.data.briefId);
        if (!brief || brief.userId !== req.userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      const content = await storage.createGeneratedContent(result.data);
      res.status(201).json(content);
    } catch (error) {
      console.error("Error creating content:", error);
      res.status(500).json({ error: "Failed to create content" });
    }
  });

  app.patch("/api/content/:id", requireAuth, async (req: any, res) => {
    try {
      // Check ownership
      if (!await checkContentOwnership(req.params.id, req.userId)) {
        return res.status(403).json({ error: "Access denied" });
      }
      
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

  app.patch("/api/content/:id/approve", requireAuth, async (req: any, res) => {
    try {
      if (!await checkContentOwnership(req.params.id, req.userId)) {
        return res.status(403).json({ error: "Access denied" });
      }
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

  app.patch("/api/content/:id/reject", requireAuth, async (req: any, res) => {
    try {
      if (!await checkContentOwnership(req.params.id, req.userId)) {
        return res.status(403).json({ error: "Access denied" });
      }
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

  app.patch("/api/content/:id/posted", requireAuth, async (req: any, res) => {
    try {
      if (!await checkContentOwnership(req.params.id, req.userId)) {
        return res.status(403).json({ error: "Access denied" });
      }
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

  // Archive content
  app.patch("/api/content/:id/archive", requireAuth, async (req: any, res) => {
    try {
      if (!await checkContentOwnership(req.params.id, req.userId)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const content = await storage.archiveContent(req.params.id);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Error archiving content:", error);
      res.status(500).json({ error: "Failed to archive content" });
    }
  });

  // Restore archived content
  app.patch("/api/content/:id/restore", requireAuth, async (req: any, res) => {
    try {
      if (!await checkContentOwnership(req.params.id, req.userId)) {
        return res.status(403).json({ error: "Access denied" });
      }
      const content = await storage.unarchiveContent(req.params.id);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Error restoring content:", error);
      res.status(500).json({ error: "Failed to restore content" });
    }
  });

  // Delete content (soft delete)
  app.delete("/api/content/:id", requireAuth, async (req: any, res) => {
    try {
      if (!await checkContentOwnership(req.params.id, req.userId)) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteContent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting content:", error);
      res.status(500).json({ error: "Failed to delete content" });
    }
  });

  // Get archived content
  app.get("/api/content/archived", requireAuth, async (req: any, res) => {
    try {
      const archived = await storage.getArchivedContent();
      res.json(archived);
    } catch (error) {
      console.error("Error getting archived content:", error);
      res.status(500).json({ error: "Failed to get archived content" });
    }
  });

  // AI Content Generation endpoints
  app.post("/api/generate-content", async (req, res) => {
    try {
      const { briefId, contentType = "both", contentFormat = "video", topic, sceneCount, optimizationGoal, carouselMode, extractedStyle, referenceImageUrl } = req.body;
      
      if (!briefId) {
        return res.status(400).json({ error: "briefId is required" });
      }

      const brief = await storage.getBrandBrief(briefId);
      if (!brief) {
        return res.status(404).json({ error: "Brand brief not found" });
      }

      // Check quota for scripts (only for premium/pro users)
      const [user] = await db.select().from(users).where(eq(users.id, brief.userId));
      if (user && (user.tier === "premium" || user.tier === "pro")) {
        try {
          await assertQuota(brief.userId, "scripts", 1);
        } catch (error) {
          if (error instanceof QuotaExceededError) {
            return res.status(429).json({ 
              error: error.message, 
              quotaExceeded: true,
              usageType: error.usageType,
              quota: error.quota 
            });
          }
          throw error;
        }
      }

      const avoidPatterns = await storage.getAvoidPatternsForBrief(briefId);
      const topPerformingPosts = await storage.getTopPerformingPatterns(brief.userId);
      const brandAssets = await storage.getBrandAssetsByBrief(briefId);

      const request: ContentGenerationRequest = {
        briefId,
        brandVoice: brief.brandVoice,
        targetAudience: brief.targetAudience,
        contentGoals: brief.contentGoals,
        linksToInclude: brief.linksToInclude,
        platforms: brief.platforms,
        contentType,
        contentFormat,
        accountType: (brief as any).accountType || "brand",
        optimizationGoal: optimizationGoal || undefined,
        topic,
        avoidPatterns,
        topPerformingPosts,
        sceneCount: contentFormat === "video" ? (sceneCount || 3) : undefined,
        brandAssets: brandAssets.map(a => ({
          name: a.name,
          assetType: a.assetType,
          description: a.description,
          imageUrl: a.imageUrl,
        })),
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
          carouselMode: carouselMode || "from_scratch",
          extractedStyle: extractedStyle || null,
          referenceImageUrl: referenceImageUrl || null,
        },
      });

      // Increment usage after successful generation
      if (user && (user.tier === "premium" || user.tier === "pro")) {
        await incrementUsage(brief.userId, "scripts", 1);
      }

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

  // Content Analysis endpoint (OpenAI Vision) - supports up to 10 images
  const analyzeUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  
  app.post("/api/analyze-content", analyzeUpload.array("images", 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No image files provided" });
      }

      const { briefId } = req.body;
      let brandBrief = undefined;
      let trendingContext: TrendingContext | undefined = undefined;

      if (briefId) {
        const brief = await storage.getBrandBrief(briefId);
        if (brief) {
          brandBrief = {
            name: brief.name,
            brandVoice: brief.brandVoice,
            targetAudience: brief.targetAudience,
            contentGoals: brief.contentGoals,
          };
          
          // Fetch trending topics for this specific brief
          const trendingTopics = await storage.getTrendingTopics(undefined, briefId);
          
          // Fetch recent listening hits for this brief
          const listeningHits = await storage.getListeningHitsByBrief(briefId);
          
          // Extract high-engagement themes from listening hits
          const highEngagementThemes: string[] = [];
          const keywordCounts: Record<string, number> = {};
          
          // Sort by engagement and take top hits
          const sortedHits = [...listeningHits]
            .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
            .slice(0, 30);
          
          for (const hit of sortedHits) {
            // Use matchedKeywords if available
            if (hit.matchedKeywords && hit.matchedKeywords.length > 0) {
              for (const keyword of hit.matchedKeywords) {
                keywordCounts[keyword] = (keywordCounts[keyword] || 0) + (hit.engagementScore || 1);
              }
            } else if (hit.postContent) {
              // Fallback: extract key phrases from post content
              const words = hit.postContent.toLowerCase()
                .replace(/[^a-z0-9\s]/g, " ")
                .split(/\s+/)
                .filter(w => w.length > 4);
              const uniqueWords = [...new Set(words)].slice(0, 5);
              for (const word of uniqueWords) {
                keywordCounts[word] = (keywordCounts[word] || 0) + (hit.engagementScore || 1);
              }
            }
          }
          
          // Get top 5 themes weighted by engagement
          const sortedThemes = Object.entries(keywordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([keyword]) => keyword);
          highEngagementThemes.push(...sortedThemes);
          
          // Also use brand brief content pillars if no listening data
          if (highEngagementThemes.length === 0 && brief.contentGoals) {
            const goalWords = brief.contentGoals.toLowerCase()
              .replace(/[^a-z0-9\s]/g, " ")
              .split(/\s+/)
              .filter(w => w.length > 4)
              .slice(0, 3);
            highEngagementThemes.push(...goalWords);
          }
          
          // Build trending context - always include if brief is selected
          trendingContext = {
            topics: trendingTopics.slice(0, 5).map(t => ({
              topic: t.topic,
              keywords: t.keywords || undefined,
              engagement: t.engagementTotal || undefined,
            })),
            highEngagementThemes,
          };
        }
      }

      // Analyze all images and combine insights
      const allImagesBase64 = files.map(f => ({
        base64: f.buffer.toString("base64"),
        mimeType: f.mimetype,
      }));

      // Analyze the first image as primary, pass all images for comprehensive analysis
      const primaryImage = allImagesBase64[0];
      const analysis = await analyzeViralContent(
        primaryImage.base64, 
        primaryImage.mimeType, 
        brandBrief, 
        trendingContext,
        allImagesBase64.length > 1 ? allImagesBase64.slice(1) : undefined
      );
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

      // Upload to Replit App Storage (cloud storage)
      try {
        const result = await objectStorageService.uploadBuffer(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          true
        );
        return res.json({ url: result.objectPath, fileName: req.file.originalname });
      } catch (storageError: any) {
        console.error("Cloud storage upload failed:", storageError);
        // If App Storage fails, try Fal.ai as fallback
        if (falService.isConfigured()) {
          const result = await falService.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
          return res.json({ url: result.url, fileName: result.fileName });
        }
        throw storageError;
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: error.message || "Failed to upload image" });
    }
  });

  // AI Engine Status endpoints
  app.get("/api/ai-engines/status", async (req: any, res) => {
    try {
      // Get authenticated user if available
      const userId = getUserId(req);
      
      // Check user tier - Premium/Pro/Studio users get platform API keys
      let usesPlatformKeys = false;
      let isStudioTier = false;
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro" || user.tier === "studio")) {
          usesPlatformKeys = true;
          isStudioTier = user.tier === "studio";
        }
      }
      
      if (usesPlatformKeys) {
        // Premium/Pro/Studio users see platform API key status
        const baseEngines: any = {
          openai: { configured: true, name: "OpenAI GPT-4" },
          anthropic: { configured: !!process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY, name: "Claude (Anthropic)" },
          dalle: { configured: isDalleConfigured(), name: "DALL-E 3 Images" },
          a2e: { configured: a2eService.isConfigured(), name: "A2E Avatar Video & Images" },
          elevenlabs: { configured: elevenlabsService.isConfigured(), name: "ElevenLabs Voice" },
          fal: { configured: falService.isConfigured(), name: "Fal.ai Video/Image" },
          pexels: { configured: pexelsService.isConfigured(), name: "Pexels B-Roll" },
          steveai: { configured: isStudioTier && steveAIService.isConfigured(), name: "Steve AI Video" },
        };
        
        // Studio tier gets Getty Images
        if (isStudioTier) {
          baseEngines.getty = { configured: gettyService.isConfigured(), name: "Getty Images" };
        }
        
        res.json(baseEngines);
      } else if (userId) {
        // Free tier users see their own API key status
        const [keys] = await db.select().from(userApiKeys).where(eq(userApiKeys.userId, userId));
        res.json({
          openai: { configured: !!keys?.openaiKey, name: "OpenAI GPT-4" },
          anthropic: { configured: !!keys?.anthropicKey, name: "Claude (Anthropic)" },
          dalle: { configured: !!keys?.openaiKey, name: "DALL-E 3 Images" },
          a2e: { configured: !!keys?.a2eKey, name: "A2E Avatar Video & Images" },
          elevenlabs: { configured: !!keys?.elevenlabsKey, name: "ElevenLabs Voice" },
          fal: { configured: !!keys?.falKey, name: "Fal.ai Video/Image" },
          pexels: { configured: !!keys?.pexelsKey, name: "Pexels B-Roll" },
          steveai: { configured: !!keys?.steveaiKey, name: "Steve AI Video" },
        });
      } else {
        // Not authenticated - show all as not configured
        res.json({
          openai: { configured: false, name: "OpenAI GPT-4" },
          anthropic: { configured: false, name: "Claude (Anthropic)" },
          dalle: { configured: false, name: "DALL-E 3 Images" },
          a2e: { configured: false, name: "A2E Avatar Video & Images" },
          elevenlabs: { configured: false, name: "ElevenLabs Voice" },
          fal: { configured: false, name: "Fal.ai Video/Image" },
          pexels: { configured: false, name: "Pexels B-Roll" },
          steveai: { configured: false, name: "Steve AI Video" },
        });
      }
    } catch (error: any) {
      console.error("Error fetching AI engine status:", error);
      res.status(500).json({ error: "Failed to fetch AI engine status" });
    }
  });

  // User API Keys endpoints
  app.get("/api/user/api-keys", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const [keys] = await db.select().from(userApiKeys).where(eq(userApiKeys.userId, userId));
      
      // Return masked keys (only show if set or not)
      res.json({
        hasOpenai: !!keys?.openaiKey,
        hasAnthropic: !!keys?.anthropicKey,
        hasElevenlabs: !!keys?.elevenlabsKey,
        hasA2e: !!keys?.a2eKey,
        hasFal: !!keys?.falKey,
        hasPexels: !!keys?.pexelsKey,
        hasSteveai: !!keys?.steveaiKey,
      });
    } catch (error: any) {
      console.error("Error fetching user API keys:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  app.post("/api/user/api-keys", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { openaiKey, anthropicKey, elevenlabsKey, a2eKey, falKey, pexelsKey } = req.body;
      
      // Check if user already has keys
      const [existing] = await db.select().from(userApiKeys).where(eq(userApiKeys.userId, userId));
      
      if (existing) {
        // Update existing keys (only update fields that are provided)
        const updates: any = { updatedAt: new Date() };
        if (openaiKey !== undefined) updates.openaiKey = openaiKey || null;
        if (anthropicKey !== undefined) updates.anthropicKey = anthropicKey || null;
        if (elevenlabsKey !== undefined) updates.elevenlabsKey = elevenlabsKey || null;
        if (a2eKey !== undefined) updates.a2eKey = a2eKey || null;
        if (falKey !== undefined) updates.falKey = falKey || null;
        if (pexelsKey !== undefined) updates.pexelsKey = pexelsKey || null;
        
        await db.update(userApiKeys).set(updates).where(eq(userApiKeys.id, existing.id));
      } else {
        // Create new keys entry
        await db.insert(userApiKeys).values({
          userId,
          openaiKey: openaiKey || null,
          anthropicKey: anthropicKey || null,
          elevenlabsKey: elevenlabsKey || null,
          a2eKey: a2eKey || null,
          falKey: falKey || null,
          pexelsKey: pexelsKey || null,
        });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving user API keys:", error);
      res.status(500).json({ error: "Failed to save API keys" });
    }
  });

  // ==================== STRIPE ENDPOINTS ====================
  
  // Get Stripe publishable key
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error: any) {
      res.status(500).json({ error: "Stripe not configured" });
    }
  });

  // Get subscription products/prices - uses live price IDs from environment
  app.get("/api/stripe/products", async (req, res) => {
    try {
      const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID;
      const proPriceId = process.env.STRIPE_PRO_PRICE_ID;

      if (!premiumPriceId || !proPriceId) {
        console.error("Stripe price IDs not configured in environment");
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const products = [
        {
          product_id: "prod_socialcommand",
          name: "SocialCommand Premium",
          description: "Full access to all AI features",
          price_id: premiumPriceId,
          unit_amount: 2999,
          currency: "gbp",
          recurring: { interval: "month", interval_count: 1 },
          metadata: { tier: "premium" },
        },
        {
          product_id: "prod_socialcommand_pro",
          name: "SocialCommand Pro",
          description: "Double quotas on all AI features",
          price_id: proPriceId,
          unit_amount: 4999,
          currency: "gbp",
          recurring: { interval: "month", interval_count: 1 },
          metadata: { tier: "pro" },
        },
      ];

      res.json({ products });
    } catch (error: any) {
      console.error("Error fetching Stripe products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Create checkout session
  app.post("/api/stripe/checkout", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { priceId } = req.body;

      if (!priceId) {
        return res.status(400).json({ error: "priceId is required" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const stripe = await getUncachableStripeClient();

      // Create or get customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: { userId: user.id }
        });
        await db.update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, userId));
        customerId = customer.id;
      }

      // Create checkout session
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl}/settings?success=true`,
        cancel_url: `${baseUrl}/settings?canceled=true`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create top-up checkout session (one-time payment for extra quota)
  app.post("/api/stripe/topup", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Only allow premium/pro users to top up
      if (user.tier !== "premium" && user.tier !== "pro") {
        return res.status(400).json({ error: "Top-up is only available for Premium and Pro users" });
      }

      const stripe = await getUncachableStripeClient();

      // Create or get customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: { userId: user.id }
        });
        await db.update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, userId));
        customerId = customer.id;
      }

      // Create checkout session for one-time payment (£10 = 1000 pence)
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Quota Top-Up',
              description: 'Add 40% extra to your monthly quota limits',
            },
            unit_amount: 1000, // £10.00
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${baseUrl}/settings?topup=success`,
        cancel_url: `${baseUrl}/settings?topup=canceled`,
        metadata: {
          userId: user.id,
          type: 'topup',
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating top-up session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create Creator Studio checkout session (£20/month add-on)
  app.post("/api/stripe/creator-studio", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Only allow premium/pro users to subscribe to Creator Studio
      if (user.tier !== "premium" && user.tier !== "pro") {
        return res.status(400).json({ error: "Creator Studio requires a Premium or Pro subscription first" });
      }

      // Check if already has Creator Studio
      if (user.creatorStudioAccess) {
        return res.status(400).json({ error: "You already have Creator Studio access" });
      }

      const stripe = await getUncachableStripeClient();

      // Create or get customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: { userId: user.id }
        });
        await db.update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, userId));
        customerId = customer.id;
      }

      const creatorStudioPriceId = process.env.STRIPE_CREATOR_STUDIO_PRICE_ID;
      
      // If no price ID configured, create inline price
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      
      const sessionConfig: any = {
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        success_url: `${baseUrl}/creator-studio?success=true`,
        cancel_url: `${baseUrl}/settings?creator_studio=canceled`,
        metadata: {
          userId: user.id,
          type: 'creator_studio',
        },
      };

      if (creatorStudioPriceId) {
        sessionConfig.line_items = [{ price: creatorStudioPriceId, quantity: 1 }];
      } else {
        sessionConfig.line_items = [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Creator Studio',
              description: 'Advanced AI creation tools: Voice cloning, talking photos, face swap, dubbing, and more',
            },
            unit_amount: 2000, // £20.00
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }];
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating Creator Studio checkout:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create customer portal session (manage subscription)
  app.post("/api/stripe/portal", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: "No subscription found" });
      }

      const stripe = await getUncachableStripeClient();
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${baseUrl}/settings`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ADMIN ENDPOINTS ====================

  // Middleware to check if user is owner (has admin privileges)
  const isOwnerMiddleware = async (req: any, res: any, next: any) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.isOwner) {
      return res.status(403).json({ error: "Forbidden - Owner access required" });
    }
    next();
  };

  // Get all users with stats (admin only)
  app.get("/api/admin/users", isAuthenticated, isOwnerMiddleware, async (req, res) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        tier: users.tier,
        creatorStudioAccess: users.creatorStudioAccess,
        stripeCustomerId: users.stripeCustomerId,
        stripeSubscriptionId: users.stripeSubscriptionId,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
      }).from(users).orderBy(users.createdAt);

      // Get usage stats for each user
      const usersWithStats = await Promise.all(allUsers.map(async (u) => {
        // Get brand briefs count
        const briefsResult = await db.select({ count: sql<number>`count(*)` })
          .from(brandBriefs)
          .where(eq(brandBriefs.userId, u.id));
        const briefsCount = briefsResult[0]?.count || 0;

        // Get content by user (via brand briefs)
        const userBriefs = await db.select({ id: brandBriefs.id })
          .from(brandBriefs)
          .where(eq(brandBriefs.userId, u.id));
        const briefIds = userBriefs.map(b => b.id);

        let scriptsCount = 0;
        let voiceoversCount = 0;
        let a2eVideosCount = 0;
        let lipsyncCount = 0;
        let avatarsCount = 0;
        let dalleImagesCount = 0;
        let soraVideosCount = 0;

        if (briefIds.length > 0) {
          const content = await db.select({
            videoUrl: generatedContent.videoUrl,
            thumbnailUrl: generatedContent.thumbnailUrl,
            generationMetadata: generatedContent.generationMetadata,
            script: generatedContent.script,
          }).from(generatedContent)
            .where(inArray(generatedContent.briefId, briefIds));

          for (const c of content) {
            if (c.script) scriptsCount++;
            const meta = c.generationMetadata as any;
            if (meta?.voiceGenerated || meta?.audioUrl) voiceoversCount++;
            if (meta?.a2eVideo) a2eVideosCount++;
            if (meta?.lipsync) lipsyncCount++;
            if (meta?.avatar) avatarsCount++;
            if (meta?.dalleImage || c.thumbnailUrl) dalleImagesCount++;
            if (meta?.soraVideo) soraVideosCount++;
          }
        }

        // Get connected accounts
        const accountsResult = await db.select({ count: sql<number>`count(*)` })
          .from(socialAccounts)
          .where(eq(socialAccounts.userId, u.id));
        const accountsCount = accountsResult[0]?.count || 0;

        // Get scheduled posts
        const postsResult = await db.select({ count: sql<number>`count(*)` })
          .from(scheduledPosts)
          .where(eq(scheduledPosts.userId, u.id));
        const postsCount = postsResult[0]?.count || 0;

        // Calculate estimated AI costs (only for premium/pro users using app keys)
        // A2E video: $1.00, Lipsync: $0.50, Avatar: $2.00, DALL-E: $0.04, Sora: $0.50, Voice: $0.03
        const estimatedCost = u.tier === "premium" || u.tier === "pro"
          ? (scriptsCount * 0.01) + (voiceoversCount * 0.03) + (a2eVideosCount * 1.00) + 
            (lipsyncCount * 0.50) + (avatarsCount * 2.00) + (dalleImagesCount * 0.04) + (soraVideosCount * 0.50)
          : 0;

        return {
          ...u,
          stats: {
            brandBriefs: briefsCount,
            scripts: scriptsCount,
            voiceovers: voiceoversCount,
            a2eVideos: a2eVideosCount,
            lipsync: lipsyncCount,
            avatars: avatarsCount,
            dalleImages: dalleImagesCount,
            soraVideos: soraVideosCount,
            connectedAccounts: accountsCount,
            scheduledPosts: postsCount,
            estimatedCost: Math.round(estimatedCost * 100) / 100,
          }
        };
      }));
      
      res.json({ users: usersWithStats });
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Update user tier (admin only)
  app.patch("/api/admin/users/:userId/tier", isAuthenticated, isOwnerMiddleware, async (req, res) => {
    try {
      const { userId } = req.params;
      const { tier } = req.body;

      if (!["free", "core", "premium", "pro", "studio"].includes(tier)) {
        return res.status(400).json({ error: "Invalid tier. Must be 'free', 'core', 'premium', 'pro', or 'studio'" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't allow changing owner's tier
      if (user.email === OWNER_EMAIL) {
        return res.status(400).json({ error: "Cannot change owner's tier" });
      }

      await db.update(users).set({ tier, updatedAt: new Date() }).where(eq(users.id, userId));
      
      res.json({ success: true, message: `User tier updated to ${tier}` });
    } catch (error: any) {
      console.error("Error updating user tier:", error);
      res.status(500).json({ error: "Failed to update user tier" });
    }
  });

  // Get A2E capacity status (admin only) - for capacity planning alerts
  app.get("/api/admin/a2e-capacity", isAuthenticated, isOwnerMiddleware, async (req, res) => {
    try {
      const capacity = await getA2ECapacityStatus();
      res.json(capacity);
    } catch (error: any) {
      console.error("Error fetching A2E capacity:", error);
      res.status(500).json({ error: "Failed to fetch A2E capacity" });
    }
  });

  // Toggle Creator Studio access for a user (admin only)
  app.patch("/api/admin/users/:userId/creator-studio", isAuthenticated, isOwnerMiddleware, async (req, res) => {
    try {
      const { userId } = req.params;
      const { enabled } = req.body;

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await db.update(users)
        .set({ creatorStudioAccess: enabled, updatedAt: new Date() })
        .where(eq(users.id, userId));
      
      res.json({ success: true, message: `Creator Studio ${enabled ? 'enabled' : 'disabled'} for user` });
    } catch (error: any) {
      console.error("Error toggling Creator Studio:", error);
      res.status(500).json({ error: "Failed to toggle Creator Studio" });
    }
  });

  // ==================== USAGE STATS ENDPOINTS ====================

  // Get current user's usage stats
  app.get("/api/usage/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const stats = await getUsageStats(userId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching usage stats:", error);
      res.status(500).json({ error: "Failed to fetch usage stats" });
    }
  });

  // ==================== AI GENERATION ENDPOINTS ====================

  // A2E Image Generation
  app.post("/api/a2e/generate-image", async (req, res) => {
    try {
      const { prompt, aspectRatio, style } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "prompt is required" });
      }

      // Check quota for images (for premium/pro users)
      const userId = (req.user as any)?.id;
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          try {
            await assertQuota(userId, "dalleImages", 1);
          } catch (error) {
            if (error instanceof QuotaExceededError) {
              return res.status(429).json({ 
                error: error.message, 
                quotaExceeded: true,
                usageType: error.usageType,
                quota: error.quota 
              });
            }
            throw error;
          }
        }
      }
      
      // Map aspect ratio to width/height
      let width = 1024, height = 1024;
      if (aspectRatio === "16:9") { width = 1024; height = 576; }
      else if (aspectRatio === "9:16") { width = 576; height = 1024; }
      else if (aspectRatio === "4:5") { width = 768; height = 960; }
      
      const result = await a2eService.generateImage({ 
        prompt, 
        width, 
        height,
        style: style || "general"
      });
      
      // Download and save locally for persistence
      let localImageUrl = result.imageUrl;
      try {
        localImageUrl = await downloadAndSaveMedia(result.imageUrl, "image");
        console.log(`Downloaded A2E image to ${localImageUrl}`);
      } catch (downloadError) {
        console.error("Failed to download A2E image:", downloadError);
      }

      // Increment usage after successful generation
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          await incrementUsage(userId, "dalleImages", 1);
        }
      }
      
      res.json({ imageUrl: localImageUrl, taskId: result.taskId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Carousel Style Analysis - analyze uploaded image to extract visual style
  const carouselStyleUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  
  app.post("/api/carousel/analyze-style", carouselStyleUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Convert image buffer to base64
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      
      // Analyze the style using GPT-4 Vision
      const styleAnalysis = await analyzeCarouselStyle(base64Image);
      
      // Upload the reference image to cloud storage for later use
      let referenceImageUrl: string | undefined;
      try {
        const filename = `carousel-reference-${Date.now()}.${req.file.originalname.split('.').pop() || 'png'}`;
        const result = await objectStorageService.uploadBuffer(req.file.buffer, filename, req.file.mimetype, true);
        referenceImageUrl = result.publicUrl || `/objects/${result.objectPath}`;
      } catch (uploadError) {
        console.error("Failed to upload reference image:", uploadError);
        // Continue without saving - the style analysis is the main value
      }

      res.json({
        extractedStyle: styleAnalysis.stylePrompt,
        styleDetails: {
          colorPalette: styleAnalysis.colorPalette,
          typography: styleAnalysis.typography,
          layout: styleAnalysis.layout,
          mood: styleAnalysis.mood,
          visualElements: styleAnalysis.visualElements,
        },
        referenceImageUrl,
      });
    } catch (error: any) {
      console.error("Carousel style analysis error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze image style" });
    }
  });

  // DALL-E Image Generation
  app.post("/api/dalle/generate-image", async (req, res) => {
    try {
      const { prompt, size, quality, style } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "prompt is required" });
      }

      // Check quota for images (for premium/pro users)
      const userId = (req.user as any)?.id;
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          try {
            await assertQuota(userId, "dalleImages", 1);
          } catch (error) {
            if (error instanceof QuotaExceededError) {
              return res.status(429).json({ 
                error: error.message, 
                quotaExceeded: true,
                usageType: error.usageType,
                quota: error.quota 
              });
            }
            throw error;
          }
        }
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

      // Increment usage after successful generation
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          await incrementUsage(userId, "dalleImages", 1);
        }
      }
      
      res.json({ imageUrl: localImageUrl, revisedPrompt: result.revisedPrompt });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Carousel Image Generation (with brand assets support)
  app.post("/api/dalle/generate-carousel-image", async (req, res) => {
    try {
      const { slideNumber, totalSlides, textOverlay, brandName, colorScheme, style, brandAssetUrl, aspectRatio, extractedStyle, referenceImageUrl } = req.body;
      
      if (!textOverlay || !brandName) {
        return res.status(400).json({ error: "textOverlay and brandName are required" });
      }

      // Check quota for images (for premium/pro users)
      const userId = (req.user as any)?.id;
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          try {
            await assertQuota(userId, "dalleImages", 1);
          } catch (error) {
            if (error instanceof QuotaExceededError) {
              return res.status(429).json({ 
                error: error.message, 
                quotaExceeded: true,
                usageType: error.usageType,
                quota: error.quota 
              });
            }
            throw error;
          }
        }
      }

      const result = await generateCarouselImage({
        slideNumber: slideNumber || 1,
        totalSlides: totalSlides || 4,
        textOverlay,
        brandName,
        colorScheme,
        style: extractedStyle || style, // Use extracted style from reference image if available
        brandAssetUrl: referenceImageUrl || brandAssetUrl,
        aspectRatio: aspectRatio || "square",
      });
      
      // Save to cloud storage for persistence
      let localImageUrl = result.imageUrl;
      try {
        localImageUrl = await downloadAndSaveMedia(result.imageUrl, "image");
        console.log(`Downloaded carousel image to ${localImageUrl}`);
      } catch (downloadError) {
        console.error("Failed to download carousel image:", downloadError);
      }

      // Increment usage after successful generation
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          await incrementUsage(userId, "dalleImages", 1);
        }
      }
      
      res.json({ imageUrl: localImageUrl, revisedPrompt: result.revisedPrompt });
    } catch (error: any) {
      console.error("Carousel image generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Enhanced carousel image generation with asset token resolution
  app.post("/api/dalle/generate-carousel-image-with-assets", async (req, res) => {
    try {
      const { slideNumber, totalSlides, textOverlay, brandName, colorScheme, style, aspectRatio, imagePrompt, briefId, extractedStyle, referenceImageUrl } = req.body;
      
      if (!textOverlay || !brandName) {
        return res.status(400).json({ error: "textOverlay and brandName are required" });
      }

      // Check quota for images (for premium/pro users)
      const userId = (req.user as any)?.id;
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          try {
            await assertQuota(userId, "dalleImages", 1);
          } catch (error) {
            if (error instanceof QuotaExceededError) {
              return res.status(429).json({ 
                error: error.message, 
                quotaExceeded: true,
                usageType: error.usageType,
                quota: error.quota 
              });
            }
            throw error;
          }
        }
      }

      // Parse asset tokens from the image prompt
      let brandAssetUrl: string | undefined;
      if (imagePrompt && briefId) {
        const assetSlugs = parseAssetTokens(imagePrompt);
        if (assetSlugs.length > 0) {
          // Look up the first asset by slug
          const asset = await storage.getBrandAssetBySlug(briefId, assetSlugs[0]);
          if (asset) {
            brandAssetUrl = asset.imageUrl;
            console.log(`Resolved asset token [asset:${assetSlugs[0]}] to ${brandAssetUrl}`);
          }
        }
      }

      const result = await generateCarouselImage({
        slideNumber: slideNumber || 1,
        totalSlides: totalSlides || 7,
        textOverlay,
        brandName,
        colorScheme,
        style: extractedStyle || style, // Use extracted style from "match my style" mode if available
        brandAssetUrl: referenceImageUrl || brandAssetUrl,
        aspectRatio: aspectRatio || "portrait",
      });
      
      // Save to cloud storage for persistence
      let localImageUrl = result.imageUrl;
      try {
        localImageUrl = await downloadAndSaveMedia(result.imageUrl, "image");
        console.log(`Downloaded carousel image to ${localImageUrl}`);
      } catch (downloadError) {
        console.error("Failed to download carousel image:", downloadError);
      }

      // Increment usage after successful generation
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          await incrementUsage(userId, "dalleImages", 1);
        }
      }
      
      res.json({ 
        imageUrl: localImageUrl, 
        revisedPrompt: result.revisedPrompt,
        assetResolved: !!brandAssetUrl 
      });
    } catch (error: any) {
      console.error("Enhanced carousel image generation error:", error);
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

      // Check quota for videos (for premium/pro users)
      const userId = (req.user as any)?.id;
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          try {
            await assertQuota(userId, "a2eVideos", 1);
          } catch (error) {
            if (error instanceof QuotaExceededError) {
              return res.status(429).json({ 
                error: error.message, 
                quotaExceeded: true,
                usageType: error.usageType,
                quota: error.quota 
              });
            }
            throw error;
          }
        }
      }

      const lipSyncId = await a2eService.generateLipSync({
        text,
        creatorId,
        aspectRatio,
        voiceId,
      });

      // Increment usage after successful generation
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          await incrementUsage(userId, "a2eVideos", 1);
        }
      }

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
      
      // If video is done, download and save to cloud storage for persistence
      if (status.status === "done" && status.output) {
        try {
          const savedUrl = await downloadAndSaveMedia(status.output, "video");
          console.log(`Saved A2E video to cloud storage: ${savedUrl}`);
          status.output = savedUrl;
        } catch (downloadError) {
          console.error("Failed to save A2E video to cloud storage:", downloadError);
          // Keep original URL if download fails
        }
      }
      
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

      // Check quota for videos (for premium/pro users)
      const userId = (req.user as any)?.id;
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          try {
            await assertQuota(userId, "a2eVideos", 1);
          } catch (error) {
            if (error instanceof QuotaExceededError) {
              return res.status(429).json({ 
                error: error.message, 
                quotaExceeded: true,
                usageType: error.usageType,
                quota: error.quota 
              });
            }
            throw error;
          }
        }
      }

      const taskId = await a2eService.generateImageToVideo({ imageUrl, prompt: text });

      // Increment usage after successful generation
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          await incrementUsage(userId, "a2eVideos", 1);
        }
      }

      res.json({ taskId, status: "processing" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // A2E Scene Video Generation (text-to-image → image-to-video combined)
  app.post("/api/a2e/generate-scene-video", async (req, res) => {
    try {
      if (!a2eService.isConfigured()) {
        return res.status(400).json({ error: "A2E API not configured" });
      }

      const { prompt, aspectRatio } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "prompt is required" });
      }

      // Check quota for videos
      const userId = (req.user as any)?.id;
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          try {
            await assertQuota(userId, "a2eVideos", 1);
          } catch (error) {
            if (error instanceof QuotaExceededError) {
              return res.status(429).json({ 
                error: error.message, 
                quotaExceeded: true,
                usageType: error.usageType,
                quota: error.quota 
              });
            }
            throw error;
          }
        }
      }

      // Step 1: Generate image from text using A2E
      const imageWidth = aspectRatio === "9:16" ? 720 : 1280;
      const imageHeight = aspectRatio === "9:16" ? 1280 : 720;
      
      const imageResult = await a2eService.generateImage({
        prompt,
        width: imageWidth,
        height: imageHeight,
      });

      if (!imageResult.imageUrl) {
        return res.status(500).json({ error: "Failed to generate image from prompt" });
      }

      // Step 2: Convert image to video using A2E
      const taskId = await a2eService.generateImageToVideo({ 
        imageUrl: imageResult.imageUrl,
        prompt: `${prompt}, smooth motion, cinematic scene` 
      });

      // Increment usage after successful generation
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          await incrementUsage(userId, "a2eVideos", 1);
        }
      }

      res.json({ 
        taskId, 
        status: "processing",
        imageUrl: imageResult.imageUrl,
        engine: "a2e-scene"
      });
    } catch (error: any) {
      console.error("A2E scene video generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // A2E Scene Video Status Check
  app.get("/api/a2e/scene-video-status/:taskId", async (req, res) => {
    try {
      if (!a2eService.isConfigured()) {
        return res.status(400).json({ error: "A2E API not configured" });
      }

      const status = await a2eService.checkImageToVideoStatus(req.params.taskId);
      
      // If video is done, download and save to cloud storage for persistence
      if (status.status === "done" && status.output) {
        try {
          const savedUrl = await downloadAndSaveMedia(status.output, "video");
          console.log(`Saved A2E scene video to cloud storage: ${savedUrl}`);
          status.output = savedUrl;
        } catch (downloadError) {
          console.error("Failed to save A2E scene video to cloud storage:", downloadError);
        }
      }
      
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Steve AI API routes
  app.get("/api/steveai/status", async (req, res) => {
    res.json({ configured: steveAIService.isConfigured() });
  });

  app.get("/api/steveai/styles", async (req, res) => {
    const styles = steveAIService.getVideoStyles();
    res.json({ styles });
  });

  app.get("/api/steveai/voices", async (req, res) => {
    try {
      const voices = await steveAIService.getVoices();
      res.json({ voices });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/steveai/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check Studio tier - Steve AI is only available for Studio tier
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || user.tier !== "studio") {
        return res.status(403).json({ error: "Steve AI video generation is only available for Studio tier users" });
      }

      if (!steveAIService.isConfigured()) {
        return res.status(400).json({ 
          error: "Steve AI API not configured. Contact team@steve.ai for Enterprise API access.",
          needsConfig: true 
        });
      }

      const { script, style, aspectRatio, duration, voiceId, language } = req.body;

      if (!script) {
        return res.status(400).json({ error: "Script is required" });
      }

      const result = await steveAIService.generateVideo({
        script,
        style: style || "animation",
        aspectRatio: aspectRatio || "16:9",
        duration: duration || 60,
        voiceId,
        language,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/steveai/status/:requestId", async (req, res) => {
    try {
      if (!steveAIService.isConfigured()) {
        return res.status(400).json({ error: "Steve AI API not configured" });
      }

      const status = await steveAIService.checkStatus(req.params.requestId);
      
      // If video is completed, save to cloud storage for persistence
      if (status.status === "completed" && status.videoUrl) {
        try {
          const savedUrl = await downloadAndSaveMedia(status.videoUrl, "video");
          console.log(`Saved Steve AI video to cloud storage: ${savedUrl}`);
          status.videoUrl = savedUrl;
        } catch (downloadError) {
          console.error("Failed to save Steve AI video to cloud storage:", downloadError);
        }
      }
      
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/steveai/result/:requestId", async (req, res) => {
    try {
      if (!steveAIService.isConfigured()) {
        return res.status(400).json({ error: "Steve AI API not configured" });
      }

      const result = await steveAIService.getResult(req.params.requestId);
      
      // If video result has URL, save to cloud storage for persistence
      if (result.videoUrl) {
        try {
          const savedUrl = await downloadAndSaveMedia(result.videoUrl, "video");
          console.log(`Saved Steve AI result video to cloud storage: ${savedUrl}`);
          result.videoUrl = savedUrl;
        } catch (downloadError) {
          console.error("Failed to save Steve AI result video to cloud storage:", downloadError);
        }
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Steve AI Generative Video routes
  app.get("/api/steveai/generative/styles", async (req, res) => {
    const styles = steveAIService.getGenerativeStyles();
    res.json({ styles });
  });

  app.post("/api/steveai/generative/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check Studio tier - Steve AI Generative is only available for Studio tier
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || user.tier !== "studio") {
        return res.status(403).json({ error: "Steve AI Generative is only available for Studio tier users" });
      }

      if (!steveAIService.isConfigured()) {
        return res.status(400).json({ 
          error: "Steve AI API not configured. Contact team@steve.ai for Enterprise API access.",
          needsConfig: true 
        });
      }

      const { prompt, aspectRatio, duration, style } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const result = await steveAIService.generateGenerativeVideo({
        prompt,
        aspectRatio: aspectRatio || "16:9",
        duration: duration || 10,
        style: style || "cinematic",
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/steveai/generative/status/:requestId", async (req, res) => {
    try {
      if (!steveAIService.isConfigured()) {
        return res.status(400).json({ error: "Steve AI API not configured" });
      }

      const status = await steveAIService.checkGenerativeStatus(req.params.requestId);
      
      // If generative video is completed, save to cloud storage for persistence
      if (status.status === "completed" && status.videoUrl) {
        try {
          const savedUrl = await downloadAndSaveMedia(status.videoUrl, "video");
          console.log(`Saved Steve AI generative video to cloud storage: ${savedUrl}`);
          status.videoUrl = savedUrl;
        } catch (downloadError) {
          console.error("Failed to save Steve AI generative video to cloud storage:", downloadError);
        }
      }
      
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Steve AI Image Generation routes
  app.get("/api/steveai/images/styles", async (req, res) => {
    const styles = steveAIService.getImageStyles();
    res.json({ styles });
  });

  app.post("/api/steveai/images/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check Studio tier - Steve AI Images is only available for Studio tier
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || user.tier !== "studio") {
        return res.status(403).json({ error: "Steve AI Images is only available for Studio tier users" });
      }

      if (!steveAIService.isConfigured()) {
        return res.status(400).json({ 
          error: "Steve AI API not configured. Contact team@steve.ai for Enterprise API access.",
          needsConfig: true 
        });
      }

      const { prompt, aspectRatio, style, count } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const result = await steveAIService.generateImages({
        prompt,
        aspectRatio: aspectRatio || "1:1",
        style: style || "photorealistic",
        count: count || 1,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Steve AI URL-to-Video (Blog/Article to Video)
  app.post("/api/steveai/url-to-video", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || user.tier !== "studio") {
        return res.status(403).json({ error: "Steve AI URL-to-Video is only available for Studio tier users" });
      }

      if (!steveAIService.isConfigured()) {
        return res.status(400).json({ error: "Steve AI API not configured", needsConfig: true });
      }

      const { url, style, aspectRatio, voiceId, language } = req.body;

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const result = await steveAIService.generateVideoFromUrl({
        url,
        style: style || "documentary",
        aspectRatio: aspectRatio || "16:9",
        voiceId,
        language,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Steve AI Voice-to-Video
  app.post("/api/steveai/voice-to-video", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || user.tier !== "studio") {
        return res.status(403).json({ error: "Steve AI Voice-to-Video is only available for Studio tier users" });
      }

      if (!steveAIService.isConfigured()) {
        return res.status(400).json({ error: "Steve AI API not configured", needsConfig: true });
      }

      const { audioUrl, style, aspectRatio } = req.body;

      if (!audioUrl) {
        return res.status(400).json({ error: "Audio URL is required" });
      }

      const result = await steveAIService.generateVideoFromVoice({
        audioUrl,
        style: style || "documentary",
        aspectRatio: aspectRatio || "16:9",
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Steve AI Multi-Voice Scenes
  app.post("/api/steveai/multi-voice", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || user.tier !== "studio") {
        return res.status(403).json({ error: "Steve AI Multi-Voice is only available for Studio tier users" });
      }

      if (!steveAIService.isConfigured()) {
        return res.status(400).json({ error: "Steve AI API not configured", needsConfig: true });
      }

      const { scenes, style, aspectRatio } = req.body;

      if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
        return res.status(400).json({ error: "At least one scene is required" });
      }

      const result = await steveAIService.generateMultiVoiceVideo({
        scenes,
        style: style || "animation",
        aspectRatio: aspectRatio || "16:9",
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Steve AI Scene Properties Options
  app.get("/api/steveai/scene-properties", async (req, res) => {
    const options = steveAIService.getScenePropertyOptions();
    res.json(options);
  });

  // Steve AI Getty Images Search
  app.get("/api/steveai/getty/search", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || user.tier !== "studio") {
        return res.status(403).json({ error: "Getty Images is only available for Studio tier users" });
      }

      if (!steveAIService.isConfigured()) {
        return res.status(400).json({ error: "Steve AI API not configured", needsConfig: true });
      }

      const query = req.query.query as string;
      const type = (req.query.type as "image" | "video") || "image";
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const assets = await steveAIService.searchGettyAssets({ query, type, limit });
      res.json({ assets });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/pexels/status", async (req, res) => {
    res.json({ configured: pexelsService.isConfigured() });
  });

  // Pexels Image Search for content generation (returns first matching image)
  app.post("/api/pexels/search-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "prompt is required" });
      }

      const results = await pexelsService.searchBRoll(prompt, "photos", 1);
      if (results && results.length > 0) {
        const photo = results[0];
        // Download and save locally for persistence
        let localImageUrl = photo.downloadUrl || photo.url;
        try {
          localImageUrl = await downloadAndSaveMedia(localImageUrl, "image");
          console.log(`Downloaded Pexels image to ${localImageUrl}`);
        } catch (downloadError) {
          console.error("Failed to download Pexels image:", downloadError);
        }
        res.json({ imageUrl: localImageUrl, attribution: photo.attribution });
      } else {
        res.status(404).json({ error: "No matching images found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
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

  // Getty Images endpoints (Studio tier only)
  app.get("/api/getty/status", async (req, res) => {
    res.json({ configured: gettyService.isConfigured() });
  });

  app.post("/api/getty/search-image", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check Studio tier
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || user.tier !== "studio") {
        return res.status(403).json({ error: "Getty Images is only available for Studio tier users" });
      }

      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "prompt is required" });
      }

      if (!gettyService.isConfigured()) {
        return res.status(400).json({ error: "Getty Images API not configured" });
      }

      const results = await gettyService.searchImages(prompt, { limit: 1 });
      if (results.images && results.images.length > 0) {
        const image = results.images[0];
        // Return preview URL - download requires license
        res.json({ 
          imageUrl: image.previewUri || image.thumbUri, 
          imageId: image.id,
          title: image.title,
          attribution: `Getty Images - ${image.title}`
        });
      } else {
        res.status(404).json({ error: "No matching images found" });
      }
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

      // Check quota for voiceovers (for premium/pro users)
      const userId = (req.user as any)?.id;
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          try {
            await assertQuota(userId, "voiceovers", 1);
          } catch (error) {
            if (error instanceof QuotaExceededError) {
              return res.status(429).json({ 
                error: error.message, 
                quotaExceeded: true,
                usageType: error.usageType,
                quota: error.quota 
              });
            }
            throw error;
          }
        }
      }

      const result = await elevenlabsService.generateVoiceover({ text, voiceId });

      // Increment usage after successful generation
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          await incrementUsage(userId, "voiceovers", 1);
        }
      }

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

      // Check quota for videos (for premium/pro users)
      const userId = (req.user as any)?.id;
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          try {
            await assertQuota(userId, "a2eVideos", 1);
          } catch (error) {
            if (error instanceof QuotaExceededError) {
              return res.status(429).json({ 
                error: error.message, 
                quotaExceeded: true,
                usageType: error.usageType,
                quota: error.quota 
              });
            }
            throw error;
          }
        }
      }

      const result = await falService.submitLipSync({ videoUrl, audioUrl });

      // Increment usage after successful generation
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          await incrementUsage(userId, "a2eVideos", 1);
        }
      }

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

      // Check quota for videos (for premium/pro users)
      const userId = (req.user as any)?.id;
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          try {
            await assertQuota(userId, "a2eVideos", 1);
          } catch (error) {
            if (error instanceof QuotaExceededError) {
              return res.status(429).json({ 
                error: error.message, 
                quotaExceeded: true,
                usageType: error.usageType,
                quota: error.quota 
              });
            }
            throw error;
          }
        }
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

      // Increment usage after successful generation
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          await incrementUsage(userId, "a2eVideos", 1);
        }
      }

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

      // Check quota for videos (for premium/pro users)
      const userId = (req.user as any)?.id;
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          try {
            await assertQuota(userId, "a2eVideos", 1);
          } catch (error) {
            if (error instanceof QuotaExceededError) {
              return res.status(429).json({ 
                error: error.message, 
                quotaExceeded: true,
                usageType: error.usageType,
                quota: error.quota 
              });
            }
            throw error;
          }
        }
      }

      const result = await falService.generateVideo({ prompt, negativePrompt, aspectRatio, duration });
      
      // Increment usage after successful generation
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          await incrementUsage(userId, "a2eVideos", 1);
        }
      }
      
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

      // Check quota for images (for premium/pro users)
      const userId = (req.user as any)?.id;
      if (userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && (user.tier === "premium" || user.tier === "pro")) {
          try {
            await assertQuota(userId, "dalleImages", 1);
          } catch (error) {
            if (error instanceof QuotaExceededError) {
              return res.status(429).json({ 
                error: error.message, 
                quotaExceeded: true,
                usageType: error.usageType,
                quota: error.quota 
              });
            }
            throw error;
          }
        }
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
            
            // Increment usage after successful generation
            if (userId) {
              const [user] = await db.select().from(users).where(eq(users.id, userId));
              if (user && (user.tier === "premium" || user.tier === "pro")) {
                await incrementUsage(userId, "dalleImages", 1);
              }
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

  // Video clip upload endpoint - uses cloud storage
  const clipUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
  });

  app.post("/api/video/upload-clip", clipUpload.single("video"), async (req, res) => {
    try {
      const file = req.file;
      const { contentId } = req.body;
      
      if (!file) {
        return res.status(400).json({ error: "No video file provided" });
      }
      
      // Upload to cloud storage
      const result = await objectStorageService.uploadBuffer(
        file.buffer,
        file.originalname,
        file.mimetype,
        true
      );
      const videoUrl = result.objectPath;
      
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

  // Image upload - uses cloud storage
  const contentImageUpload = multer({
    storage: multer.memoryStorage(),
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
      const { contentId, slideIndex } = req.body;
      
      if (!file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      
      // Upload to cloud storage
      const result = await objectStorageService.uploadBuffer(
        file.buffer,
        file.originalname,
        file.mimetype,
        true
      );
      const imageUrl = result.objectPath;
      
      if (contentId) {
        const existingContent = await storage.getGeneratedContent(contentId);
        if (existingContent) {
          const existingMetadata = (existingContent.generationMetadata as any) || {};
          
          // Check if this is a carousel slide replacement/addition
          if (slideIndex !== undefined && slideIndex !== null) {
            const slideIdx = parseInt(slideIndex, 10);
            const carouselImages = existingMetadata.generatedCarouselImages || [];
            
            if (slideIdx === -1) {
              // Add as new slide at the end
              const maxIndex = carouselImages.length > 0 
                ? Math.max(...carouselImages.map((s: any) => s.slideIndex)) 
                : -1;
              carouselImages.push({ slideIndex: maxIndex + 1, imageUrl });
            } else {
              // Find if this slide already exists and replace, or add new at specific index
              const existingSlideIndex = carouselImages.findIndex((s: any) => s.slideIndex === slideIdx);
              if (existingSlideIndex >= 0) {
                carouselImages[existingSlideIndex] = { slideIndex: slideIdx, imageUrl };
              } else {
                carouselImages.push({ slideIndex: slideIdx, imageUrl });
              }
            }
            
            // Sort by slideIndex
            carouselImages.sort((a: any, b: any) => a.slideIndex - b.slideIndex);
            
            await storage.updateGeneratedContent(contentId, {
              generationMetadata: { ...existingMetadata, generatedCarouselImages: carouselImages },
            });
          } else {
            // Regular single image upload
            await storage.updateGeneratedContent(contentId, {
              generationMetadata: { ...existingMetadata, uploadedImageUrl: imageUrl },
            });
          }
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
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Social Accounts endpoints
  app.get("/api/social-accounts", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const accounts = await storage.getSocialAccountsByUser(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching social accounts:", error);
      res.status(500).json({ error: "Failed to fetch social accounts" });
    }
  });

  app.post("/api/social-accounts", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const result = insertSocialAccountSchema.safeParse({ ...req.body, userId });
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      // Check social channel limit before creating account
      const { checkSocialChannelLimit } = await import("./usageService");
      const channelCheck = await checkSocialChannelLimit(userId);
      if (!channelCheck.allowed) {
        return res.status(403).json({ 
          error: `Social channel limit reached (${channelCheck.used}/${channelCheck.limit}). Upgrade your plan to connect more channels.`
        });
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

  // YouTube OAuth endpoints (separate from Google Login OAuth)
  app.get("/api/youtube/connect", (req, res) => {
    const authUrl = getAuthUrl();
    console.log("[YouTube OAuth] Redirecting to:", authUrl);
    res.redirect(authUrl);
  });

  // Revoke YouTube tokens and reconnect (to get new scopes)
  app.post("/api/youtube/revoke-and-reconnect/:accountId", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const account = await storage.getSocialAccount(req.params.accountId);
      if (!account || account.userId !== userId) {
        return res.status(404).json({ error: "Account not found" });
      }

      // Try to revoke the token if we have one
      if (account.accessToken || account.refreshToken) {
        try {
          const tokenToRevoke = account.accessToken || account.refreshToken;
          if (tokenToRevoke) {
            await revokeToken(tokenToRevoke);
            console.log("[YouTube] Token revoked successfully");
          }
        } catch (revokeError: any) {
          console.log("[YouTube] Token revoke failed (may already be revoked):", revokeError.message);
        }
      }

      // Clear the tokens from the account so next OAuth will create fresh ones
      await storage.updateSocialAccount(account.id, {
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
        isConnected: "pending_reauth",
      });

      // Return the OAuth URL for the frontend to redirect
      const authUrl = getAuthUrl();
      res.json({ authUrl });
    } catch (error: any) {
      console.error("[YouTube] Revoke error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/youtube/callback", async (req: any, res) => {
    console.log("[YouTube OAuth] Callback received, query:", JSON.stringify(req.query));
    try {
      const code = req.query.code as string;
      const error = req.query.error as string;
      
      if (error) {
        console.error("[YouTube OAuth] Google returned error:", error);
        return res.redirect(`/accounts?error=${error}`);
      }
      
      if (!code) {
        console.error("[YouTube OAuth] No code received");
        return res.redirect("/accounts?error=no_code");
      }

      // Get authenticated user
      const userId = getUserId(req);
      if (!userId) {
        return res.redirect("/accounts?error=not_authenticated");
      }

      const tokens = await getTokensFromCode(code);
      const channelInfo = await getChannelInfo(tokens.access_token!);

      // Store or update the connected YouTube account (supports multiple channels)
      await storage.ensureUser(userId);
      
      const existingAccount = channelInfo.channelId 
        ? await storage.getSocialAccountByPlatformAccountId(userId, "YouTube", channelInfo.channelId)
        : null;
      
      // Check social channel limit for new accounts
      if (!existingAccount) {
        const { checkSocialChannelLimit } = await import("./usageService");
        const channelCheck = await checkSocialChannelLimit(userId);
        if (!channelCheck.allowed) {
          return res.redirect(`/accounts?error=channel_limit&limit=${channelCheck.limit}&used=${channelCheck.used}`);
        }
      }
      
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
    } catch (error: any) {
      console.error("[YouTube OAuth] Callback error:", error?.message || error);
      console.error("[YouTube OAuth] Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
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

  app.post("/api/youtube/upload", upload.single("video"), requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
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

      const { title, description, tags, privacyStatus, publishAt } = req.body;
      
      // Validate publishAt if provided (YouTube scheduling constraints)
      let validatedPublishAt: string | undefined;
      if (publishAt) {
        const scheduledDate = new Date(publishAt);
        const now = new Date();
        const minTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes minimum
        const maxTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days maximum
        
        if (isNaN(scheduledDate.getTime())) {
          return res.status(400).json({ error: "Invalid schedule date format. Please use ISO 8601 format." });
        }
        if (scheduledDate < minTime) {
          return res.status(400).json({ error: "Scheduled time must be at least 15 minutes from now." });
        }
        if (scheduledDate > maxTime) {
          return res.status(400).json({ error: "Scheduled time must be within 30 days from now." });
        }
        validatedPublishAt = scheduledDate.toISOString();
      }
      
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
        privacyStatus: validatedPublishAt ? "private" : (privacyStatus || "private"),
        publishAt: validatedPublishAt,
        videoBuffer,
        mimeType,
      });

      // If scheduled, also create a scheduled post record for tracking
      if (validatedPublishAt && result.videoId) {
        await storage.createScheduledPost({
          userId: userId,
          platform: "youtube",
          scheduledFor: new Date(validatedPublishAt),
          timezone: "UTC",
          title: title || "Untitled Video",
          description: description || "",
          mediaUrl: result.url,
          mediaType: "video",
          status: "scheduled",
          postType: "auto",
          youtubeVideoId: result.videoId,
          youtubePrivacyStatus: "private", // Always private for scheduled uploads
        });
      }

      res.json(result);
    } catch (error: any) {
      console.error("YouTube upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload video" });
    }
  });

  // ============================================
  // SOCIAL PLATFORM OAUTH & POSTING ENDPOINTS
  // ============================================

  // Get available platforms status
  app.get("/api/social-platforms/status", (req, res) => {
    res.json(socialPlatforms.getSocialPlatformStatus());
  });

  // --- TWITTER/X OAuth ---
  app.get("/api/auth/twitter", requireAuth, (req: any, res) => {
    if (!socialPlatforms.isTwitterConfigured()) {
      return res.redirect("/accounts?error=twitter_not_configured");
    }
    const state = socialPlatforms.generateOAuthState();
    const codeVerifier = socialPlatforms.generateCodeVerifier();
    
    // Store state and verifier in session (sessions are configured via express-session + pg-simple)
    req.session.twitterState = state;
    req.session.twitterCodeVerifier = codeVerifier;
    req.session.save(() => {
      const authUrl = socialPlatforms.getTwitterAuthUrl(state, codeVerifier);
      res.redirect(authUrl);
    });
  });

  app.get("/api/auth/twitter/callback", async (req: any, res) => {
    try {
      const { code, state } = req.query;
      const userId = getUserId(req);
      
      if (!userId) {
        return res.redirect("/accounts?error=not_authenticated");
      }
      
      const storedState = req.session?.twitterState;
      const codeVerifier = req.session?.twitterCodeVerifier;
      
      if (!code || !storedState || state !== storedState || !codeVerifier) {
        return res.redirect("/accounts?error=twitter_invalid_state");
      }

      const tokens = await socialPlatforms.getTwitterTokens(code, codeVerifier);
      const userInfo = await socialPlatforms.getTwitterUserInfo(tokens.access_token);

      await storage.ensureUser(userId);
      const existingAccount = await storage.getSocialAccountByPlatformAccountId(userId, "Twitter", userInfo.id);

      // Check social channel limit for new accounts
      if (!existingAccount) {
        const { checkSocialChannelLimit } = await import("./usageService");
        const channelCheck = await checkSocialChannelLimit(userId);
        if (!channelCheck.allowed) {
          return res.redirect(`/accounts?error=channel_limit&limit=${channelCheck.limit}&used=${channelCheck.used}`);
        }
      }

      if (existingAccount) {
        await storage.updateSocialAccount(existingAccount.id, {
          accountName: userInfo.name,
          accountHandle: `@${userInfo.username}`,
          profileUrl: userInfo.profileImageUrl,
          isConnected: "connected",
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        });
      } else {
        await storage.createSocialAccount({
          userId,
          platform: "Twitter",
          accountName: userInfo.name,
          accountHandle: `@${userInfo.username}`,
          profileUrl: userInfo.profileImageUrl,
          isConnected: "connected",
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
          platformAccountId: userInfo.id,
        });
      }

      delete req.session.twitterState;
      delete req.session.twitterCodeVerifier;
      res.redirect("/accounts?connected=twitter");
    } catch (error) {
      console.error("Twitter OAuth error:", error);
      res.redirect("/accounts?error=twitter_oauth_failed");
    }
  });

  // --- LINKEDIN OAuth ---
  app.get("/api/auth/linkedin", requireAuth, (req: any, res) => {
    if (!socialPlatforms.isLinkedInConfigured()) {
      return res.redirect("/accounts?error=linkedin_not_configured");
    }
    const state = socialPlatforms.generateOAuthState();
    req.session.linkedinState = state;
    req.session.save(() => {
      const authUrl = socialPlatforms.getLinkedInAuthUrl(state);
      res.redirect(authUrl);
    });
  });

  app.get("/api/auth/linkedin/callback", async (req: any, res) => {
    try {
      const { code, state } = req.query;
      const userId = getUserId(req);
      
      if (!userId) {
        return res.redirect("/accounts?error=not_authenticated");
      }
      
      const storedState = req.session?.linkedinState;
      if (!code || !storedState || state !== storedState) {
        return res.redirect("/accounts?error=linkedin_invalid_state");
      }

      const tokens = await socialPlatforms.getLinkedInTokens(code);
      const userInfo = await socialPlatforms.getLinkedInUserInfo(tokens.access_token);

      await storage.ensureUser(userId);
      const existingAccount = await storage.getSocialAccountByPlatformAccountId(userId, "LinkedIn", userInfo.sub);

      // Check social channel limit for new accounts
      if (!existingAccount) {
        const { checkSocialChannelLimit } = await import("./usageService");
        const channelCheck = await checkSocialChannelLimit(userId);
        if (!channelCheck.allowed) {
          return res.redirect(`/accounts?error=channel_limit&limit=${channelCheck.limit}&used=${channelCheck.used}`);
        }
      }

      if (existingAccount) {
        await storage.updateSocialAccount(existingAccount.id, {
          accountName: userInfo.name,
          accountHandle: userInfo.email,
          profileUrl: userInfo.picture,
          isConnected: "connected",
          accessToken: tokens.access_token,
          tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        });
      } else {
        await storage.createSocialAccount({
          userId,
          platform: "LinkedIn",
          accountName: userInfo.name,
          accountHandle: userInfo.email,
          profileUrl: userInfo.picture,
          isConnected: "connected",
          accessToken: tokens.access_token,
          tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
          platformAccountId: userInfo.sub,
        });
      }

      delete req.session.linkedinState;
      res.redirect("/accounts?connected=linkedin");
    } catch (error) {
      console.error("LinkedIn OAuth error:", error);
      res.redirect("/accounts?error=linkedin_oauth_failed");
    }
  });

  // --- BLUESKY Auth (username/password) ---
  app.post("/api/auth/bluesky", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({ error: "Username and app password required" });
      }

      const session = await socialPlatforms.loginToBluesky(identifier, password);
      
      await storage.ensureUser(userId);
      const existingAccount = await storage.getSocialAccountByPlatformAccountId(userId, "Bluesky", session.did);

      // Check social channel limit for new accounts
      if (!existingAccount) {
        const { checkSocialChannelLimit } = await import("./usageService");
        const channelCheck = await checkSocialChannelLimit(userId);
        if (!channelCheck.allowed) {
          return res.status(403).json({ 
            error: `Social channel limit reached (${channelCheck.used}/${channelCheck.limit}). Upgrade your plan to connect more channels.`
          });
        }
      }

      if (existingAccount) {
        await storage.updateSocialAccount(existingAccount.id, {
          accountName: session.handle,
          accountHandle: `@${session.handle}`,
          isConnected: "connected",
          accessToken: session.accessJwt,
          refreshToken: session.refreshJwt,
        });
      } else {
        await storage.createSocialAccount({
          userId,
          platform: "Bluesky",
          accountName: session.handle,
          accountHandle: `@${session.handle}`,
          isConnected: "connected",
          accessToken: session.accessJwt,
          refreshToken: session.refreshJwt,
          platformAccountId: session.did,
        });
      }

      res.json({ success: true, handle: session.handle });
    } catch (error: any) {
      console.error("Bluesky auth error:", error);
      res.status(400).json({ error: error.message || "Bluesky login failed" });
    }
  });

  // --- FACEBOOK OAuth ---
  app.get("/api/auth/facebook", requireAuth, (req: any, res) => {
    if (!socialPlatforms.isFacebookConfigured()) {
      return res.redirect("/accounts?error=facebook_not_configured");
    }
    const state = socialPlatforms.generateOAuthState();
    req.session.facebookState = state;
    req.session.save(() => {
      const authUrl = socialPlatforms.getFacebookAuthUrl(state);
      res.redirect(authUrl);
    });
  });

  app.get("/api/auth/facebook/callback", async (req: any, res) => {
    try {
      const { code, state } = req.query;
      const userId = getUserId(req);
      
      if (!userId) {
        return res.redirect("/accounts?error=not_authenticated");
      }
      
      const storedState = req.session?.facebookState;
      if (!code || !storedState || state !== storedState) {
        return res.redirect("/accounts?error=facebook_invalid_state");
      }

      const tokens = await socialPlatforms.getFacebookTokens(code);
      const longLivedToken = await socialPlatforms.getFacebookLongLivedToken(tokens.access_token);
      const pages = await socialPlatforms.getFacebookPages(longLivedToken.access_token);

      await storage.ensureUser(userId);

      const { checkSocialChannelLimit } = await import("./usageService");

      // Connect all Facebook pages (re-check limit for each new account)
      for (const page of pages.data || []) {
        const existingAccount = await storage.getSocialAccountByPlatformAccountId(userId, "Facebook", page.id);

        if (existingAccount) {
          await storage.updateSocialAccount(existingAccount.id, {
            accountName: page.name,
            isConnected: "connected",
            accessToken: page.access_token,
          });
        } else {
          // Re-check limit before creating each new account
          const channelCheck = await checkSocialChannelLimit(userId);
          if (channelCheck.allowed) {
            await storage.createSocialAccount({
              userId,
              platform: "Facebook",
              accountName: page.name,
              isConnected: "connected",
              accessToken: page.access_token,
              platformAccountId: page.id,
            });
          }
        }

        // Check for connected Instagram account
        try {
          const igAccount = await socialPlatforms.getInstagramAccounts(page.id, page.access_token);
          if (igAccount.instagram_business_account) {
            const igId = igAccount.instagram_business_account.id;
            const existingIg = await storage.getSocialAccountByPlatformAccountId(userId, "Instagram", igId);

            if (!existingIg) {
              // Re-check limit before creating Instagram account
              const igChannelCheck = await checkSocialChannelLimit(userId);
              if (igChannelCheck.allowed) {
                await storage.createSocialAccount({
                  userId,
                  platform: "Instagram",
                  accountName: `${page.name} (Instagram)`,
                  isConnected: "connected",
                  accessToken: page.access_token,
                  platformAccountId: igId,
                });
              }
            }
          }
        } catch (igError) {
          console.log("No Instagram account linked to page:", page.name);
        }
      }

      delete req.session.facebookState;
      res.redirect("/accounts?connected=facebook");
    } catch (error) {
      console.error("Facebook OAuth error:", error);
      res.redirect("/accounts?error=facebook_oauth_failed");
    }
  });

  // --- TIKTOK OAuth ---
  app.get("/api/auth/tiktok", requireAuth, (req: any, res) => {
    if (!socialPlatforms.isTikTokConfigured()) {
      return res.redirect("/accounts?error=tiktok_not_configured");
    }
    const state = socialPlatforms.generateOAuthState();
    req.session.tiktokState = state;
    req.session.save(() => {
      const authUrl = socialPlatforms.getTikTokAuthUrl(state);
      res.redirect(authUrl);
    });
  });

  app.get("/api/auth/tiktok/callback", async (req: any, res) => {
    try {
      const { code, state } = req.query;
      const userId = getUserId(req);
      
      if (!userId) {
        return res.redirect("/accounts?error=not_authenticated");
      }
      
      const storedState = req.session?.tiktokState;
      if (!code || !storedState || state !== storedState) {
        return res.redirect("/accounts?error=tiktok_invalid_state");
      }

      const tokens = await socialPlatforms.getTikTokTokens(code);
      const userInfo = await socialPlatforms.getTikTokUserInfo(tokens.access_token);

      await storage.ensureUser(userId);
      const existingAccount = await storage.getSocialAccountByPlatformAccountId(userId, "TikTok", userInfo.data.user.open_id);

      // Check social channel limit for new accounts
      if (!existingAccount) {
        const { checkSocialChannelLimit } = await import("./usageService");
        const channelCheck = await checkSocialChannelLimit(userId);
        if (!channelCheck.allowed) {
          return res.redirect(`/accounts?error=channel_limit&limit=${channelCheck.limit}&used=${channelCheck.used}`);
        }
      }

      if (existingAccount) {
        await storage.updateSocialAccount(existingAccount.id, {
          accountName: userInfo.data.user.display_name,
          profileUrl: userInfo.data.user.avatar_url,
          isConnected: "connected",
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        });
      } else {
        await storage.createSocialAccount({
          userId,
          platform: "TikTok",
          accountName: userInfo.data.user.display_name,
          profileUrl: userInfo.data.user.avatar_url,
          isConnected: "connected",
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
          platformAccountId: userInfo.data.user.open_id,
        });
      }

      delete req.session.tiktokState;
      res.redirect("/accounts?connected=tiktok");
    } catch (error) {
      console.error("TikTok OAuth error:", error);
      res.redirect("/accounts?error=tiktok_oauth_failed");
    }
  });

  // --- THREADS OAuth ---
  app.get("/api/auth/threads", requireAuth, (req: any, res) => {
    if (!socialPlatforms.isFacebookConfigured()) {
      return res.redirect("/accounts?error=threads_not_configured");
    }
    const state = socialPlatforms.generateOAuthState();
    req.session.threadsState = state;
    req.session.save(() => {
      const authUrl = socialPlatforms.getThreadsAuthUrl(state);
      res.redirect(authUrl);
    });
  });

  app.get("/api/auth/threads/callback", async (req: any, res) => {
    try {
      const { code, state } = req.query;
      const userId = getUserId(req);
      
      if (!userId) {
        return res.redirect("/accounts?error=not_authenticated");
      }
      
      const storedState = req.session?.threadsState;
      if (!code || !storedState || state !== storedState) {
        return res.redirect("/accounts?error=threads_invalid_state");
      }

      const tokens = await socialPlatforms.getThreadsTokens(code);
      const userInfo = await socialPlatforms.getThreadsUserInfo(tokens.access_token, tokens.user_id);

      await storage.ensureUser(userId);
      const existingAccount = await storage.getSocialAccountByPlatformAccountId(userId, "Threads", tokens.user_id);

      // Check social channel limit for new accounts
      if (!existingAccount) {
        const { checkSocialChannelLimit } = await import("./usageService");
        const channelCheck = await checkSocialChannelLimit(userId);
        if (!channelCheck.allowed) {
          return res.redirect(`/accounts?error=channel_limit&limit=${channelCheck.limit}&used=${channelCheck.used}`);
        }
      }

      if (existingAccount) {
        await storage.updateSocialAccount(existingAccount.id, {
          accountName: userInfo.username,
          accountHandle: `@${userInfo.username}`,
          profileUrl: userInfo.threads_profile_picture_url,
          isConnected: "connected",
          accessToken: tokens.access_token,
        });
      } else {
        await storage.createSocialAccount({
          userId,
          platform: "Threads",
          accountName: userInfo.username,
          accountHandle: `@${userInfo.username}`,
          profileUrl: userInfo.threads_profile_picture_url,
          isConnected: "connected",
          accessToken: tokens.access_token,
          platformAccountId: tokens.user_id,
        });
      }

      delete req.session.threadsState;
      res.redirect("/accounts?connected=threads");
    } catch (error) {
      console.error("Threads OAuth error:", error);
      res.redirect("/accounts?error=threads_oauth_failed");
    }
  });

  // --- PINTEREST OAuth ---
  app.get("/api/auth/pinterest", requireAuth, (req: any, res) => {
    if (!socialPlatforms.isPinterestConfigured()) {
      return res.redirect("/accounts?error=pinterest_not_configured");
    }
    const userId = getUserId(req);
    if (!userId) {
      return res.redirect("/accounts?error=not_authenticated");
    }
    // Encode userId in state to survive mobile browser session loss during OAuth redirect
    const randomState = socialPlatforms.generateOAuthState();
    const state = `${randomState}.${Buffer.from(userId).toString('base64url')}`;
    req.session.pinterestState = randomState;
    req.session.save(() => {
      const authUrl = socialPlatforms.getPinterestAuthUrl(state);
      res.redirect(authUrl);
    });
  });

  app.get("/api/auth/pinterest/callback", async (req: any, res) => {
    try {
      const { code, state } = req.query;
      
      // Extract userId from state (for mobile browsers that lose session)
      let userId = getUserId(req);
      let randomState = state as string;
      
      if (state && (state as string).includes('.')) {
        const parts = (state as string).split('.');
        randomState = parts[0];
        const encodedUserId = parts[1];
        if (!userId && encodedUserId) {
          try {
            userId = Buffer.from(encodedUserId, 'base64url').toString('utf-8');
          } catch (e) {
            console.error("[Pinterest OAuth] Failed to decode userId from state");
          }
        }
      }
      
      if (!userId) {
        return res.redirect("/accounts?error=not_authenticated");
      }
      
      // For mobile browsers, we may not have session - just validate code exists
      if (!code) {
        return res.redirect("/accounts?error=pinterest_invalid_state");
      }

      const tokens = await socialPlatforms.getPinterestTokens(code);
      const userInfo = await socialPlatforms.getPinterestUserInfo(tokens.access_token);

      await storage.ensureUser(userId);
      const existingAccount = await storage.getSocialAccountByPlatformAccountId(userId, "Pinterest", userInfo.id);

      // Check social channel limit for new accounts
      if (!existingAccount) {
        const { checkSocialChannelLimit } = await import("./usageService");
        const channelCheck = await checkSocialChannelLimit(userId);
        if (!channelCheck.allowed) {
          return res.redirect(`/accounts?error=channel_limit&limit=${channelCheck.limit}&used=${channelCheck.used}`);
        }
      }

      if (existingAccount) {
        await storage.updateSocialAccount(existingAccount.id, {
          accountName: userInfo.username,
          accountHandle: `@${userInfo.username}`,
          profileUrl: userInfo.profile_image,
          isConnected: "connected",
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        });
      } else {
        await storage.createSocialAccount({
          userId,
          platform: "Pinterest",
          accountName: userInfo.username,
          accountHandle: `@${userInfo.username}`,
          profileUrl: userInfo.profile_image,
          isConnected: "connected",
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
          platformAccountId: userInfo.id,
        });
      }

      delete req.session.pinterestState;
      res.redirect("/accounts?connected=pinterest");
    } catch (error) {
      console.error("Pinterest OAuth error:", error);
      res.redirect("/accounts?error=pinterest_oauth_failed");
    }
  });

  // ============================================
  // UNIVERSAL POSTING ENDPOINT
  // ============================================
  
  app.post("/api/social/post", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { accountId, text, imageUrl, videoUrl, title, description } = req.body;

      if (!accountId) {
        return res.status(400).json({ error: "Account ID is required" });
      }

      const account = await storage.getSocialAccount(accountId);
      if (!account || account.userId !== userId) {
        return res.status(404).json({ error: "Account not found" });
      }

      if (!account.accessToken) {
        return res.status(401).json({ error: "Account not connected. Please reconnect." });
      }

      let result;
      
      switch (account.platform) {
        case "Twitter":
          result = await socialPlatforms.postToTwitter(account.accessToken, text);
          break;
          
        case "LinkedIn":
          const authorUrn = `urn:li:person:${account.platformAccountId}`;
          result = await socialPlatforms.postToLinkedIn(account.accessToken, authorUrn, text, imageUrl);
          break;
          
        case "Bluesky":
          result = await socialPlatforms.postToBluesky(
            account.accessToken, 
            account.platformAccountId!, 
            text
          );
          break;
          
        case "Facebook":
          result = await socialPlatforms.postToFacebookPage(
            account.accessToken,
            account.platformAccountId!,
            text,
            imageUrl
          );
          break;
          
        case "Instagram":
          if (!imageUrl) {
            return res.status(400).json({ error: "Instagram requires an image" });
          }
          result = await socialPlatforms.postToInstagram(
            account.accessToken,
            account.platformAccountId!,
            text,
            imageUrl
          );
          break;
          
        case "TikTok":
          if (!videoUrl) {
            return res.status(400).json({ error: "TikTok requires a video URL" });
          }
          result = await socialPlatforms.initTikTokVideoUpload(
            account.accessToken,
            videoUrl,
            title || text
          );
          break;
          
        case "Threads":
          result = await socialPlatforms.postToThreads(
            account.accessToken,
            account.platformAccountId!,
            text,
            imageUrl
          );
          break;
          
        case "Pinterest":
          if (!imageUrl) {
            return res.status(400).json({ error: "Pinterest requires an image" });
          }
          // For Pinterest, we'd need to get the user's boards first
          // This is a simplified version
          const boards = await socialPlatforms.getPinterestBoards(account.accessToken);
          const defaultBoard = boards.items?.[0];
          if (!defaultBoard) {
            return res.status(400).json({ error: "No Pinterest boards found" });
          }
          result = await socialPlatforms.postToPinterest(
            account.accessToken,
            defaultBoard.id,
            title || "Pin",
            text || description || "",
            imageUrl
          );
          break;
          
        default:
          return res.status(400).json({ error: `Posting to ${account.platform} not supported` });
      }

      res.json({ success: true, result, platform: account.platform });
    } catch (error: any) {
      console.error("Social post error:", error);
      res.status(500).json({ error: error.message || "Failed to post to social platform" });
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
  app.post("/api/listening/hits", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { briefId, platform, postContent, postUrl, authorName, authorHandle, postType } = req.body;
      
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
        userId: userId,
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

  // Get trending topics - analyzes scanned hits for patterns
  app.get("/api/listening/trending", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const briefId = req.query.briefId as string | undefined;
      
      // Get user's listening hits to analyze
      const hits = await storage.getListeningHits(userId, briefId);
      
      if (hits.length === 0) {
        return res.json([]);
      }
      
      // Analyze hits for trending topics
      const topicMap = new Map<string, { 
        mentions: number; 
        totalLikes: number; 
        platforms: Set<string>;
        keywords: Set<string>;
        isQuestion: number;
        examples: string[];
      }>();
      
      // Common words to filter out
      const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
        'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once',
        'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other',
        'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can',
        'just', 'now', 'and', 'but', 'or', 'if', 'because', 'until', 'while', 'about', 'this', 'that',
        'these', 'those', 'what', 'which', 'who', 'whom', 'its', 'it', 'my', 'your', 'his', 'her', 'our',
        'their', 'i', 'me', 'you', 'he', 'she', 'we', 'they', 'them', 'us', 'get', 'got', 'getting']);
      
      for (const hit of hits) {
        // Extract significant words from content
        const content = (hit.postContent || '').toLowerCase();
        const words = content.split(/\s+/)
          .map(w => w.replace(/[^a-z0-9]/g, ''))
          .filter(w => w.length > 3 && !stopWords.has(w));
        
        // Count word frequencies and group into topics
        const wordFreq = new Map<string, number>();
        for (const word of words) {
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }
        
        // Use matched keywords as primary topics, fall back to frequent words
        const hitTopics = hit.matchedKeywords && hit.matchedKeywords.length > 0 
          ? hit.matchedKeywords 
          : Array.from(wordFreq.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([w]) => w);
        
        for (const topic of hitTopics) {
          const topicLower = topic.toLowerCase();
          if (!topicMap.has(topicLower)) {
            topicMap.set(topicLower, {
              mentions: 0,
              totalLikes: 0,
              platforms: new Set(),
              keywords: new Set(),
              isQuestion: 0,
              examples: [],
            });
          }
          const data = topicMap.get(topicLower)!;
          data.mentions++;
          data.totalLikes += hit.likes || 0;
          data.platforms.add(hit.platform);
          if (hit.matchedKeywords) {
            hit.matchedKeywords.forEach(kw => data.keywords.add(kw));
          }
          if (hit.isQuestion === 'yes') data.isQuestion++;
          if (data.examples.length < 3) {
            data.examples.push(hit.postContent?.slice(0, 100) || '');
          }
        }
      }
      
      // Convert to trending topics format
      const trendingTopics = Array.from(topicMap.entries())
        .filter(([_, data]) => data.mentions >= 2) // At least 2 mentions to be trending
        .map(([topic, data]) => ({
          id: `trend-${topic}`,
          topic: topic.charAt(0).toUpperCase() + topic.slice(1),
          mentionCount: data.mentions,
          engagementTotal: data.totalLikes,
          platform: Array.from(data.platforms).join(', '),
          keywords: Array.from(data.keywords).slice(0, 5),
          sentiment: data.isQuestion > data.mentions / 2 ? 'curious' : 'neutral',
          trendScore: data.mentions * 10 + Math.min(data.totalLikes / 100, 50),
          examplePosts: data.examples,
        }))
        .sort((a, b) => b.trendScore - a.trendScore)
        .slice(0, 10);
      
      res.json(trendingTopics);
    } catch (error: any) {
      console.error("Error fetching trending topics:", error);
      res.status(500).json({ error: "Failed to fetch trending topics" });
    }
  });

  // Create/update a trending topic
  app.post("/api/listening/trending", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { briefId, topic, keywords, platform, mentionCount, engagementTotal, sentiment } = req.body;
      
      if (!topic) {
        return res.status(400).json({ error: "topic is required" });
      }

      const trendingTopic = await storage.createTrendingTopic({
        userId: userId,
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

  // Quick scan with custom keywords (no brand brief required)
  app.post("/api/listening/quick-scan", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { keywords, platforms = ["reddit"] } = req.body;

      if (!keywords || keywords.length === 0) {
        return res.status(400).json({ error: "Keywords are required" });
      }

      if (!apifyService.isConfigured()) {
        return res.status(400).json({ 
          error: "Apify not configured", 
          message: "Please add your APIFY_API_TOKEN to use scanning" 
        });
      }

      const results: { platform: string; itemsFound: number; itemsImported: number }[] = [];

      for (const platform of platforms) {
        const actorConfig = APIFY_ACTORS[platform];
        if (!actorConfig) {
          console.warn(`No actor configured for platform: ${platform}`);
          continue;
        }

        const scanRun = await storage.createScanRun({
          userId,
          briefId: null,
          platform,
          actorId: actorConfig.actorId,
          status: "running",
          keywords,
        });

        try {
          let input: Record<string, any>;
          if (platform === "reddit") {
            input = {
              [actorConfig.searchField]: keywords.slice(0, 5),
              type: "link",
              sort: "relevance",
              time: "week",
              maxItems: 30,
            };
          } else if (platform === "youtube") {
            input = {
              [actorConfig.searchField]: keywords.join(" "),
              maxResults: 30,
            };
          } else {
            input = {
              [actorConfig.searchField]: keywords.slice(0, 5),
              maxItems: 30,
            };
          }

          const items = await apifyService.runActorAndWait(actorConfig.actorId, input, 180000);
          let imported = 0;

          for (const item of items) {
            const normalized = normalizeApifyItem(platform, item, keywords, null);
            if (!normalized || !normalized.postContent) continue;

            const postId = normalized.postId || `${platform}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const isDuplicate = await storage.checkDuplicateHit(platform, postId);
            if (isDuplicate) continue;

            // Calculate opportunity score
            const commentText = normalized.postContent;
            const isQuestion = commentText.includes("?") || /\b(how|what|why|when|where|who|can|could|would|should|is|are|does|do)\b/i.test(commentText);
            const likes = normalized.likes || 0;
            const baseScore = Math.min(likes * 2, 50);
            const questionBonus = isQuestion ? 25 : 0;
            const lengthBonus = commentText.length > 50 ? 15 : commentText.length > 20 ? 10 : 0;
            const opportunityScore = Math.min(baseScore + questionBonus + lengthBonus, 100);

            await storage.createListeningHit({
              userId,
              briefId: null,
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
              isQuestion: isQuestion ? "yes" : "no",
              isTrending: null,
              replyStatus: "pending",
              postedAt: normalized.postedAt || null,
              sourceUrl: null,
              sourceTitle: null,
              sourceChannel: null,
              opportunityScore,
              scanType: "keyword",
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
          console.error(`Quick scan failed for ${platform}:`, error);
          await storage.updateScanRun(scanRun.id, {
            status: "failed",
            errorMessage: error.message,
          });
          results.push({ platform, itemsFound: 0, itemsImported: 0 });
        }
      }

      res.json({
        success: true,
        keywords,
        results,
        totalImported: results.reduce((sum, r) => sum + r.itemsImported, 0),
      });
    } catch (error: any) {
      console.error("Quick scan error:", error);
      res.status(500).json({ error: error.message || "Failed to run quick scan" });
    }
  });

  // Scrape comments from a viral URL (YouTube, TikTok, Instagram)
  app.post("/api/listening/scrape-url", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { url, maxComments = 50, briefId } = req.body;

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      if (!apifyService.isConfigured()) {
        return res.status(400).json({ 
          error: "Apify not configured", 
          message: "Please add your APIFY_API_TOKEN to use URL scraping" 
        });
      }

      // Detect platform from URL
      let platform: string;
      let actorKey: string;
      let actorInput: Record<string, any>;
      let sourceTitle = "";
      let sourceChannel = "";

      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        platform = "youtube";
        actorKey = "youtubeComments";
        actorInput = {
          startUrls: [{ url }],
          maxComments,
          maxReplies: 10,
        };
      } else if (url.includes("tiktok.com")) {
        platform = "tiktok";
        actorKey = "tiktokComments";
        actorInput = {
          postURLs: [url],
          commentsPerPost: maxComments,
        };
      } else if (url.includes("instagram.com")) {
        platform = "instagram";
        actorKey = "instagramComments";
        actorInput = {
          directUrls: [url],
          resultsLimit: maxComments,
        };
      } else {
        return res.status(400).json({ 
          error: "Unsupported platform",
          message: "Only YouTube, TikTok, and Instagram URLs are supported" 
        });
      }

      const actorConfig = APIFY_ACTORS[actorKey];
      if (!actorConfig) {
        return res.status(500).json({ error: `Actor ${actorKey} not configured` });
      }

      // Create scan run record
      const scanRun = await storage.createScanRun({
        userId,
        briefId: briefId || null,
        platform,
        actorId: actorConfig.actorId,
        status: "running",
        keywords: [url],
      });

      // Run the scraper
      const items = await apifyService.runActorAndWait(actorConfig.actorId, actorInput, 300000);
      let imported = 0;

      // Process each comment
      for (const item of items) {
        // YouTube streamers/youtube-comments-scraper uses: comment, cid, author, voteCount
        const commentText = item.comment || item.text || item.body || item.ctext || "";
        if (!commentText || commentText.length < 3) continue;

        // YouTube author is "@username" string, not an object
        const authorName = item.author || item.authorName || item.username || item.ownerUsername || "Unknown";
        const authorHandle = (typeof item.author === 'string' ? item.author.replace(/^@/, "") : item.author?.id) || item.authorId || item.uniqueId || item.authorMeta?.id || "";
        // YouTube uses voteCount
        const likes = item.voteCount || item.likes || item.likesCount || item.diggCount || 0;

        // Extract source info from first item if available
        if (!sourceTitle && item.videoTitle) sourceTitle = item.videoTitle;
        if (!sourceChannel && (item.channelName || item.ownerUsername)) {
          sourceChannel = item.channelName || item.ownerUsername;
        }

        // Calculate basic engagement opportunity score (0-100)
        // Higher likes = more visibility, questions = better engagement opportunity
        const isQuestion = commentText.includes("?") || /\b(how|what|why|when|where|who|can|could|would|should|is|are|does|do)\b/i.test(commentText);
        const baseScore = Math.min(likes * 2, 50); // Up to 50 points for likes
        const questionBonus = isQuestion ? 25 : 0;
        const lengthBonus = commentText.length > 50 ? 15 : commentText.length > 20 ? 10 : 0;
        const opportunityScore = Math.min(baseScore + questionBonus + lengthBonus, 100);

        // YouTube uses cid, others use id
        const postId = item.cid || item.id || item.commentId || `${platform}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const isDuplicate = await storage.checkDuplicateHit(platform, postId);
        if (isDuplicate) continue;

        await storage.createListeningHit({
          userId,
          briefId: briefId || null,
          platform,
          postId,
          postUrl: item.url || null,
          postContent: commentText,
          authorName,
          authorHandle,
          authorProfileUrl: item.author?.profileUrl || item.authorProfileUrl || null,
          postType: "comment",
          matchedKeywords: [],
          sentiment: null,
          engagementScore: likes,
          likes,
          comments: item.replyCount || item.replies?.length || 0,
          shares: null,
          isQuestion: isQuestion ? "yes" : "no",
          isTrending: null,
          replyStatus: "pending",
          postedAt: item.createdAt ? new Date(item.createdAt) : null,
          sourceUrl: url,
          sourceTitle: sourceTitle || null,
          sourceChannel: sourceChannel || null,
          opportunityScore,
          scanType: "viral_url",
        });
        imported++;
      }

      await storage.updateScanRun(scanRun.id, {
        status: "completed",
        itemsFound: items.length,
        itemsImported: imported,
      });

      res.json({
        success: true,
        platform,
        url,
        sourceTitle,
        sourceChannel,
        commentsFound: items.length,
        commentsImported: imported,
        scanRunId: scanRun.id,
      });
    } catch (error: any) {
      console.error("URL scrape error:", error);
      res.status(500).json({ error: error.message || "Failed to scrape URL" });
    }
  });

  // Scrape comments from a specific hit (by hit ID)
  app.post("/api/listening/hits/:id/scrape-comments", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const hitId = req.params.id;
      const { maxComments = 30 } = req.body;

      // Get the parent hit
      const parentHit = await storage.getListeningHit(hitId);
      if (!parentHit) {
        return res.status(404).json({ error: "Hit not found" });
      }

      // Multi-tenant security: verify the hit belongs to this user
      if (parentHit.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Generate fallback URL for Reddit posts if postUrl is missing but postId exists
      let url = parentHit.postUrl;
      if (!url && parentHit.platform.toLowerCase() === "reddit" && parentHit.postId) {
        // Use www.reddit.com for better compatibility with scrapers
        url = `https://www.reddit.com/comments/${parentHit.postId}/`;
      }
      if (!url) {
        return res.status(400).json({ error: "Hit does not have a URL to scrape" });
      }

      if (!apifyService.isConfigured()) {
        return res.status(400).json({ 
          error: "Apify not configured", 
          message: "Please add your APIFY_API_TOKEN to use comment scraping" 
        });
      }

      // Detect platform and configure scraper
      let platform: string;
      let actorKey: string;
      let actorInput: Record<string, any>;

      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        platform = "youtube";
        actorKey = "youtubeComments";
        actorInput = {
          startUrls: [{ url }],
          maxComments,
          maxReplies: 5,
        };
      } else if (url.includes("reddit.com")) {
        platform = "reddit";
        actorKey = "redditComments";
        // practicaltools/apify-reddit-api uses startUrls and maxItems
        actorInput = {
          startUrls: [{ url }],
          maxItems: 1, // Get 1 post which includes its comments
        };
      } else if (url.includes("tiktok.com")) {
        platform = "tiktok";
        actorKey = "tiktokComments";
        actorInput = {
          postURLs: [url],
          commentsPerPost: maxComments,
        };
      } else if (url.includes("instagram.com")) {
        platform = "instagram";
        actorKey = "instagramComments";
        actorInput = {
          directUrls: [url],
          resultsLimit: maxComments,
        };
      } else {
        return res.status(400).json({ 
          error: "Unsupported platform",
          message: "Comment scraping is available for YouTube, Reddit, TikTok, and Instagram" 
        });
      }

      const actorConfig = APIFY_ACTORS[actorKey];
      if (!actorConfig) {
        return res.status(400).json({ error: `Comment scraping not available for ${platform}` });
      }

      // Run the scraper
      const rawItems = await apifyService.runActorAndWait(actorConfig.actorId, actorInput, 180000);
      let imported = 0;
      
      const sourceTitle = parentHit.postContent?.slice(0, 100) || "";
      const sourceChannel = parentHit.authorName || parentHit.authorHandle || "";

      // Flatten items - practicaltools/apify-reddit-api returns { post, comments } structure
      const items: any[] = [];
      for (const raw of rawItems) {
        if (raw.comments && Array.isArray(raw.comments)) {
          // Reddit API actor format: extract comments array
          items.push(...raw.comments.slice(0, maxComments));
        } else {
          // YouTube/other flat format
          items.push(raw);
        }
      }

      // Extract and prepare comments for classification
      const commentsToProcess: Array<{
        item: any;
        commentText: string;
        authorName: string;
        authorHandle: string;
        likes: number;
        postId: string;
      }> = [];

      for (const item of items) {
        // YouTube streamers/youtube-comments-scraper uses: comment, cid, author, voteCount
        // Reddit practicaltools/apify-reddit-api uses: body, parsedId, username, upVotes
        const commentText = item.comment || item.text || item.body || item.ctext || "";
        if (!commentText || commentText.length < 3) continue;

        // YouTube author is "@username", Reddit uses username field
        const authorName = item.author || item.username || item.authorName || item.ownerUsername || "Unknown";
        const authorHandle = (typeof item.author === 'string' ? item.author.replace(/^@/, "") : "") || item.username || item.authorId || item.uniqueId || "";
        // YouTube uses voteCount, Reddit uses upVotes or score
        const likes = item.voteCount || item.upVotes || item.likes || item.likesCount || item.diggCount || item.score || 0;
        // YouTube uses cid, Reddit uses parsedId or id
        const postId = item.cid || item.parsedId || item.id || item.commentId || `${platform}-comment-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const isDuplicate = await storage.checkDuplicateHit(platform, postId);
        if (!isDuplicate) {
          commentsToProcess.push({ item, commentText, authorName, authorHandle, likes, postId });
        }
      }

      // AI classification for comment types (batch process)
      let classifications: Record<string, string[]> = {};
      if (commentsToProcess.length > 0) {
        try {
          const commentsForAI = commentsToProcess.map((c, i) => `[${i}] ${c.commentText.slice(0, 200)}`).join("\n");
          const classifyResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
              role: "system",
              content: `Classify each comment into one or more types. Types: question (asking something), disagreeing (expressing disagreement/criticism), wants_info (seeking more details), expert (shows expertise/authority). Reply as JSON: {"0":["question"],"1":["expert","wants_info"],...}`
            }, {
              role: "user",
              content: commentsForAI
            }],
            response_format: { type: "json_object" },
            max_tokens: 1000,
          });
          const parsed = JSON.parse(classifyResponse.choices[0]?.message?.content || "{}");
          classifications = parsed;
        } catch (err) {
          console.error("AI classification failed, continuing without types:", err);
        }
      }

      // Find top 5 most liked for "most_liked" tag
      const sortedByLikes = [...commentsToProcess].sort((a, b) => b.likes - a.likes);
      const topLikedIds = new Set(sortedByLikes.slice(0, 5).map(c => c.postId));

      // Save comments with classifications
      for (let i = 0; i < commentsToProcess.length; i++) {
        const { item, commentText, authorName, authorHandle, likes, postId } = commentsToProcess[i];
        
        const commentTypes: string[] = classifications[String(i)] || [];
        if (topLikedIds.has(postId)) {
          commentTypes.push("most_liked");
        }

        const isQuestion = commentText.includes("?") || /\b(how|what|why|when|where|who|can|could|would|should|is|are|does|do)\b/i.test(commentText);
        const baseScore = Math.min(likes * 2, 50);
        const questionBonus = isQuestion ? 25 : 0;
        const lengthBonus = commentText.length > 50 ? 15 : commentText.length > 20 ? 10 : 0;
        const opportunityScore = Math.min(baseScore + questionBonus + lengthBonus, 100);

        await storage.createListeningHit({
          userId,
          briefId: parentHit.briefId || null,
          platform,
          postId,
          postUrl: item.url || item.permalink || null,
          postContent: commentText,
          authorName,
          authorHandle,
          authorProfileUrl: item.author?.profileUrl || null,
          postType: "comment",
          matchedKeywords: parentHit.matchedKeywords || [],
          sentiment: null,
          engagementScore: likes,
          likes,
          comments: item.replyCount || 0,
          shares: null,
          isQuestion: isQuestion ? "yes" : "no",
          isTrending: null,
          replyStatus: "pending",
          postedAt: item.createdAt ? new Date(item.createdAt) : null,
          sourceUrl: url,
          sourceTitle,
          sourceChannel,
          opportunityScore,
          scanType: "viral_url",
          commentTypes: commentTypes.length > 0 ? commentTypes : null,
        });
        imported++;
      }

      res.json({
        success: true,
        platform,
        parentHitId: hitId,
        commentsFound: items.length,
        commentsImported: imported,
      });
    } catch (error: any) {
      console.error("Comment scrape error:", error);
      res.status(500).json({ error: error.message || "Failed to scrape comments" });
    }
  });

  // ==================== SCHEDULED POSTS ====================

  // Get scheduled posts for a user (with optional date range)
  app.get("/api/scheduled-posts", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      
      const posts = await storage.getScheduledPostsByUser(userId, startDate, endDate);
      res.json(posts);
    } catch (error: any) {
      console.error("Error fetching scheduled posts:", error);
      res.status(500).json({ error: "Failed to fetch scheduled posts" });
    }
  });

  // Create a scheduled post (manual planning or YouTube auto-schedule)
  app.post("/api/scheduled-posts", async (req, res) => {
    try {
      const { userId, platform, scheduledFor, ...rest } = req.body;
      
      if (!userId || !platform || !scheduledFor) {
        return res.status(400).json({ error: "userId, platform, and scheduledFor are required" });
      }

      const post = await storage.createScheduledPost({
        userId,
        platform,
        scheduledFor: new Date(scheduledFor),
        ...rest
      });
      
      res.json(post);
    } catch (error: any) {
      console.error("Error creating scheduled post:", error);
      res.status(500).json({ error: error.message || "Failed to create scheduled post" });
    }
  });

  // Get a single scheduled post
  app.get("/api/scheduled-posts/:id", async (req, res) => {
    try {
      const post = await storage.getScheduledPost(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Scheduled post not found" });
      }
      res.json(post);
    } catch (error: any) {
      console.error("Error fetching scheduled post:", error);
      res.status(500).json({ error: "Failed to fetch scheduled post" });
    }
  });

  // Update a scheduled post
  app.patch("/api/scheduled-posts/:id", async (req, res) => {
    try {
      const { scheduledFor, ...rest } = req.body;
      const updateData: any = { ...rest };
      
      if (scheduledFor) {
        updateData.scheduledFor = new Date(scheduledFor);
      }
      
      const post = await storage.updateScheduledPost(req.params.id, updateData);
      if (!post) {
        return res.status(404).json({ error: "Scheduled post not found" });
      }
      res.json(post);
    } catch (error: any) {
      console.error("Error updating scheduled post:", error);
      res.status(500).json({ error: "Failed to update scheduled post" });
    }
  });

  // Delete a scheduled post
  app.delete("/api/scheduled-posts/:id", async (req, res) => {
    try {
      await storage.deleteScheduledPost(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting scheduled post:", error);
      res.status(500).json({ error: "Failed to delete scheduled post" });
    }
  });

  // ==================== CREATOR STUDIO ENDPOINTS ====================

  // Middleware to check Creator Studio access (owners always have access)
  const requireCreatorStudio = async (req: any, res: any, next: any) => {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    // Owners always have access to Creator Studio
    if (user?.isOwner) {
      return next();
    }
    if (!user?.creatorStudioAccess) {
      return res.status(403).json({ 
        error: "Creator Studio access required", 
        upgradeRequired: true,
        message: "Subscribe to Creator Studio (£20/month) to unlock these features"
      });
    }
    next();
  };

  // Get Creator Studio status and usage
  app.get("/api/creator-studio/status", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const stats = await getUsageStats(userId);
      
      // Check if user is owner - owners always have access
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      const hasAccess = stats.hasCreatorStudio || user?.isOwner === true;
      
      res.json({
        hasAccess,
        usage: stats.creatorStudioUsage,
        a2eConfigured: a2eService.isConfigured(),
      });
    } catch (error: any) {
      console.error("Error fetching Creator Studio status:", error);
      res.status(500).json({ error: "Failed to fetch status" });
    }
  });

  // Creator Studio file upload endpoint
  const creatorStudioUploadDir = path.join(process.cwd(), "public", "creator-studio-uploads");
  if (!fs.existsSync(creatorStudioUploadDir)) {
    fs.mkdirSync(creatorStudioUploadDir, { recursive: true });
  }
  app.use("/creator-studio-uploads", express.static(creatorStudioUploadDir));

  const creatorStudioUpload = multer({
    storage: multer.diskStorage({
      destination: creatorStudioUploadDir,
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`);
      },
    }),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos
    fileFilter: (req, file, cb) => {
      const allowedTypes = ["image/", "video/", "audio/"];
      if (allowedTypes.some(type => file.mimetype.startsWith(type))) {
        cb(null, true);
      } else {
        cb(new Error("Only image, video, and audio files are allowed"));
      }
    },
  });

  app.post("/api/creator-studio/upload", isAuthenticated, requireCreatorStudio, creatorStudioUpload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Get the full URL for the uploaded file
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers.host || "localhost:5000";
      const relativePath = `/creator-studio-uploads/${file.filename}`;
      const fullUrl = `${protocol}://${host}${relativePath}`;

      res.json({ 
        success: true, 
        url: fullUrl,
        relativePath,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size
      });
    } catch (error: any) {
      console.error("Creator Studio upload error:", error);
      res.status(500).json({ error: error.message || "Upload failed" });
    }
  });

  // Voice Cloning
  app.post("/api/creator-studio/voice-clone", isAuthenticated, requireCreatorStudio, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { audioUrl, voiceName } = req.body;

      if (!audioUrl || !voiceName) {
        return res.status(400).json({ error: "audioUrl and voiceName are required" });
      }

      await assertCreatorStudioQuota(userId, "voiceClones", 1);
      
      const taskId = await a2eService.cloneVoice({ audioUrl, voiceName });
      await incrementCreatorStudioUsage(userId, "voiceClones", 1);

      res.json({ taskId, message: "Voice cloning started" });
    } catch (error: any) {
      if (error instanceof QuotaExceededError || error instanceof CreatorStudioAccessError) {
        return res.status(429).json({ error: error.message, quotaExceeded: true });
      }
      console.error("Voice clone error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // List cloned voices
  app.get("/api/creator-studio/voices", isAuthenticated, requireCreatorStudio, async (req, res) => {
    try {
      const voices = await a2eService.listVoices();
      res.json(voices);
    } catch (error: any) {
      console.error("List voices error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Talking Photo
  app.post("/api/creator-studio/talking-photo", isAuthenticated, requireCreatorStudio, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { imageUrl, text, voiceId } = req.body;

      if (!imageUrl || !text) {
        return res.status(400).json({ error: "imageUrl and text are required" });
      }

      await assertCreatorStudioQuota(userId, "talkingPhotos", 1);
      
      const taskId = await a2eService.generateTalkingPhoto({ imageUrl, text, voiceId });
      await incrementCreatorStudioUsage(userId, "talkingPhotos", 1);

      res.json({ taskId, message: "Talking photo generation started" });
    } catch (error: any) {
      if (error instanceof QuotaExceededError || error instanceof CreatorStudioAccessError) {
        return res.status(429).json({ error: error.message, quotaExceeded: true });
      }
      console.error("Talking photo error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Talking Video
  app.post("/api/creator-studio/talking-video", isAuthenticated, requireCreatorStudio, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { videoUrl, text, voiceId } = req.body;

      if (!videoUrl || !text) {
        return res.status(400).json({ error: "videoUrl and text are required" });
      }

      await assertCreatorStudioQuota(userId, "talkingVideos", 1);
      
      const taskId = await a2eService.generateTalkingVideo({ videoUrl, text, voiceId });
      await incrementCreatorStudioUsage(userId, "talkingVideos", 1);

      res.json({ taskId, message: "Talking video generation started" });
    } catch (error: any) {
      if (error instanceof QuotaExceededError || error instanceof CreatorStudioAccessError) {
        return res.status(429).json({ error: error.message, quotaExceeded: true });
      }
      console.error("Talking video error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Face Swap
  app.post("/api/creator-studio/face-swap", isAuthenticated, requireCreatorStudio, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { sourceImageUrl, targetVideoUrl } = req.body;

      if (!sourceImageUrl || !targetVideoUrl) {
        return res.status(400).json({ error: "sourceImageUrl and targetVideoUrl are required" });
      }

      await assertCreatorStudioQuota(userId, "faceSwaps", 1);
      
      const taskId = await a2eService.generateFaceSwap({ sourceImageUrl, targetVideoUrl });
      await incrementCreatorStudioUsage(userId, "faceSwaps", 1);

      res.json({ taskId, message: "Face swap started" });
    } catch (error: any) {
      if (error instanceof QuotaExceededError || error instanceof CreatorStudioAccessError) {
        return res.status(429).json({ error: error.message, quotaExceeded: true });
      }
      console.error("Face swap error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Dubbing
  app.post("/api/creator-studio/dubbing", isAuthenticated, requireCreatorStudio, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { videoUrl, targetLanguage } = req.body;

      if (!videoUrl || !targetLanguage) {
        return res.status(400).json({ error: "videoUrl and targetLanguage are required" });
      }

      await assertCreatorStudioQuota(userId, "aiDubbing", 1);
      
      const taskId = await a2eService.generateDubbing({ videoUrl, targetLanguage });
      await incrementCreatorStudioUsage(userId, "aiDubbing", 1);

      res.json({ taskId, message: "AI dubbing started" });
    } catch (error: any) {
      if (error instanceof QuotaExceededError || error instanceof CreatorStudioAccessError) {
        return res.status(429).json({ error: error.message, quotaExceeded: true });
      }
      console.error("Dubbing error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Image to Video
  app.post("/api/creator-studio/image-to-video", isAuthenticated, requireCreatorStudio, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { imageUrl, text } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ error: "imageUrl is required" });
      }

      await assertCreatorStudioQuota(userId, "imageToVideo", 1);
      
      const taskId = await a2eService.generateImageToVideo({ imageUrl, prompt: text });
      await incrementCreatorStudioUsage(userId, "imageToVideo", 1);

      res.json({ taskId, message: "Image to video generation started" });
    } catch (error: any) {
      if (error instanceof QuotaExceededError || error instanceof CreatorStudioAccessError) {
        return res.status(429).json({ error: error.message, quotaExceeded: true });
      }
      console.error("Image to video error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Caption Removal
  app.post("/api/creator-studio/caption-removal", isAuthenticated, requireCreatorStudio, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { videoUrl } = req.body;

      if (!videoUrl) {
        return res.status(400).json({ error: "videoUrl is required" });
      }

      await assertCreatorStudioQuota(userId, "captionRemoval", 1);
      
      const taskId = await a2eService.removeCaptions({ videoUrl });
      await incrementCreatorStudioUsage(userId, "captionRemoval", 1);

      res.json({ taskId, message: "Caption removal started" });
    } catch (error: any) {
      if (error instanceof QuotaExceededError || error instanceof CreatorStudioAccessError) {
        return res.status(429).json({ error: error.message, quotaExceeded: true });
      }
      console.error("Caption removal error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Video to Video (Style Transfer)
  app.post("/api/creator-studio/video-to-video", isAuthenticated, requireCreatorStudio, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { videoUrl, prompt } = req.body;

      if (!videoUrl || !prompt) {
        return res.status(400).json({ error: "videoUrl and prompt are required" });
      }

      await assertCreatorStudioQuota(userId, "videoToVideo", 1);
      
      const taskId = await a2eService.generateVideoToVideo({ videoUrl, prompt });
      await incrementCreatorStudioUsage(userId, "videoToVideo", 1);

      res.json({ taskId, message: "Video to video generation started" });
    } catch (error: any) {
      if (error instanceof QuotaExceededError || error instanceof CreatorStudioAccessError) {
        return res.status(429).json({ error: error.message, quotaExceeded: true });
      }
      console.error("Video to video error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Virtual Try-On
  app.post("/api/creator-studio/virtual-tryon", isAuthenticated, requireCreatorStudio, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { personImageUrl, clothingImageUrl } = req.body;

      if (!personImageUrl || !clothingImageUrl) {
        return res.status(400).json({ error: "personImageUrl and clothingImageUrl are required" });
      }

      await assertCreatorStudioQuota(userId, "virtualTryOn", 1);
      
      const taskId = await a2eService.generateVirtualTryOn({ personImageUrl, clothingImageUrl });
      await incrementCreatorStudioUsage(userId, "virtualTryOn", 1);

      res.json({ taskId, message: "Virtual try-on started" });
    } catch (error: any) {
      if (error instanceof QuotaExceededError || error instanceof CreatorStudioAccessError) {
        return res.status(429).json({ error: error.message, quotaExceeded: true });
      }
      console.error("Virtual try-on error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Image Reformat (portrait to landscape or vice versa using DALL-E)
  app.post("/api/creator-studio/image-reformat", isAuthenticated, requireCreatorStudio, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { imageUrl, targetAspectRatio } = req.body;

      if (!imageUrl || !targetAspectRatio) {
        return res.status(400).json({ error: "imageUrl and targetAspectRatio are required" });
      }

      if (!["landscape", "portrait", "square"].includes(targetAspectRatio)) {
        return res.status(400).json({ error: "targetAspectRatio must be 'landscape', 'portrait', or 'square'" });
      }

      await assertCreatorStudioQuota(userId, "imageReformat", 1);
      
      const { reformatImage } = await import("./openai");
      const result = await reformatImage({ imageUrl, targetAspectRatio });
      await incrementCreatorStudioUsage(userId, "imageReformat", 1);

      res.json({ 
        imageUrl: result.imageUrl, 
        revisedPrompt: result.revisedPrompt 
      });
    } catch (error: any) {
      if (error instanceof QuotaExceededError || error instanceof CreatorStudioAccessError) {
        return res.status(429).json({ error: error.message, quotaExceeded: true });
      }
      console.error("Image reformat error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Check task status (generic for all Creator Studio tasks)
  app.get("/api/creator-studio/task/:taskType/:taskId", isAuthenticated, requireCreatorStudio, async (req, res) => {
    try {
      const { taskType, taskId } = req.params;
      const status = await a2eService.checkTaskStatus(taskId, taskType);
      
      // If task is done and has output URL, save to cloud storage for persistence
      if (status.status === "done" && status.output) {
        try {
          const savedUrl = await downloadAndSaveMedia(status.output, "video");
          console.log(`Saved Creator Studio video to cloud storage: ${savedUrl}`);
          status.output = savedUrl;
        } catch (downloadError) {
          console.error("Failed to save Creator Studio video to cloud storage:", downloadError);
          // Keep original URL if download fails
        }
      }
      
      res.json(status);
    } catch (error: any) {
      console.error("Task status check error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // YouTube metadata fetch endpoint
  app.post("/api/youtube/fetch-metadata", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Extract video ID from YouTube URL
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      if (!videoIdMatch) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
      }
      const videoId = videoIdMatch[1];

      // Use YouTube Data API to get video info
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        // Fallback: Try oEmbed API (doesn't require API key but limited data)
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const oembedRes = await fetch(oembedUrl);
        if (!oembedRes.ok) {
          return res.status(400).json({ error: "Failed to fetch video metadata" });
        }
        const oembedData = await oembedRes.json();
        return res.json({
          title: oembedData.title,
          description: "",
          thumbnailUrl: oembedData.thumbnail_url,
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          channelTitle: oembedData.author_name,
          publishedAt: "",
        });
      }

      // Full YouTube Data API call
      const ytApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
      const ytRes = await fetch(ytApiUrl);
      if (!ytRes.ok) {
        return res.status(400).json({ error: "Failed to fetch video from YouTube API" });
      }
      const ytData = await ytRes.json();
      const video = ytData.items?.[0];
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      res.json({
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
        viewCount: parseInt(video.statistics.viewCount || "0"),
        likeCount: parseInt(video.statistics.likeCount || "0"),
        commentCount: parseInt(video.statistics.commentCount || "0"),
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
      });
    } catch (error: any) {
      console.error("YouTube metadata fetch error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Content comparison endpoint - allow up to 50MB total for multiple screenshots
  const comparisonUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024, files: 20 },
  });

  app.post("/api/content/compare", requireAuth, comparisonUpload.any(), async (req: any, res) => {
    try {
      const userId = req.userId;
      
      // Check quota for content comparisons (paid tiers only)
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || user.tier === "free") {
        return res.status(403).json({ 
          error: "Content Comparison is available for paid subscribers only. Upgrade to Core or higher to access this feature.",
          tierBlocked: true 
        });
      }
      
      try {
        await assertQuota(userId, "contentComparisons", 1);
      } catch (error) {
        if (error instanceof QuotaExceededError) {
          return res.status(429).json({ 
            error: error.message, 
            quotaExceeded: true,
            usageType: error.usageType,
            quota: error.quota 
          });
        }
        throw error;
      }
      
      const files = req.files as Express.Multer.File[];
      const { yourContentId, yourUrl, competitorUrl } = req.body;

      // Gather your content
      let yourContent: ContentComparisonRequest["yourContent"] = {};
      
      if (yourContentId) {
        // Fetch from database and verify ownership
        const content = await storage.getGeneratedContent(yourContentId);
        if (!content) {
          return res.status(404).json({ error: "Content not found" });
        }
        // Verify ownership through the brand brief
        const brief = await storage.getBrandBrief(content.briefId);
        if (!brief || brief.userId !== userId) {
          return res.status(403).json({ error: "Access denied" });
        }
        const metadata = content.generationMetadata as any;
        yourContent = {
          script: content.script || undefined,
          caption: content.caption || undefined,
          hashtags: content.hashtags || [],
          platforms: content.platforms || [],
          scenePrompts: metadata?.videoPrompts?.scenePrompts,
          imagePrompts: metadata?.imagePrompts,
          videoPrompts: metadata?.videoPrompts,
        };
      } else if (yourUrl) {
        // Fetch metadata for user's posted YouTube URL
        const videoIdMatch = yourUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        if (videoIdMatch) {
          const videoId = videoIdMatch[1];
          const apiKey = process.env.YOUTUBE_API_KEY;
          
          if (apiKey) {
            const ytApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
            const ytRes = await fetch(ytApiUrl);
            if (ytRes.ok) {
              const ytData = await ytRes.json();
              const video = ytData.items?.[0];
              if (video) {
                yourContent = {
                  script: video.snippet.description,
                  caption: video.snippet.title,
                  hashtags: video.snippet.tags || [],
                  platforms: ["YouTube"],
                };
              }
            }
          } else {
            // Fallback to oEmbed
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(yourUrl)}&format=json`;
            const oembedRes = await fetch(oembedUrl);
            if (oembedRes.ok) {
              const oembedData = await oembedRes.json();
              yourContent = {
                caption: oembedData.title,
                platforms: ["YouTube"],
              };
            }
          }
        }
      }

      // Gather competitor content
      let competitorContent: ContentComparisonRequest["competitorContent"] = {};
      
      if (competitorUrl) {
        // Fetch YouTube metadata
        const videoIdMatch = competitorUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        if (videoIdMatch) {
          const videoId = videoIdMatch[1];
          const apiKey = process.env.YOUTUBE_API_KEY;
          
          if (apiKey) {
            const ytApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
            const ytRes = await fetch(ytApiUrl);
            if (ytRes.ok) {
              const ytData = await ytRes.json();
              const video = ytData.items?.[0];
              if (video) {
                competitorContent = {
                  title: video.snippet.title,
                  description: video.snippet.description,
                  thumbnailUrl: video.snippet.thumbnails.high?.url,
                  viewCount: parseInt(video.statistics.viewCount || "0"),
                  likeCount: parseInt(video.statistics.likeCount || "0"),
                  commentCount: parseInt(video.statistics.commentCount || "0"),
                  channelTitle: video.snippet.channelTitle,
                };
              }
            }
          } else {
            // Fallback to oEmbed
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(competitorUrl)}&format=json`;
            const oembedRes = await fetch(oembedUrl);
            if (oembedRes.ok) {
              const oembedData = await oembedRes.json();
              competitorContent = {
                title: oembedData.title,
                thumbnailUrl: oembedData.thumbnail_url,
                channelTitle: oembedData.author_name,
              };
            }
          }
        }
      }

      // Convert screenshots to base64 - compress large images automatically
      const screenshotBase64s: string[] = [];
      if (files) {
        const screenshotFiles = files.filter(f => f.fieldname.includes("Screenshot"));
        // Take up to 6 screenshots for comparison
        const limitedFiles = screenshotFiles.slice(0, 6);
        for (const file of limitedFiles) {
          try {
            // Compress large images using sharp (resizes to max 1200px and converts to JPEG)
            let imageBuffer = file.buffer;
            const originalSize = file.buffer.length;
            
            if (originalSize > 1 * 1024 * 1024) { // If over 1MB, compress
              imageBuffer = await sharp(file.buffer)
                .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer();
              console.log(`Compressed screenshot: ${file.originalname} from ${(originalSize / 1024 / 1024).toFixed(1)}MB to ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB`);
            }
            
            const base64 = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
            screenshotBase64s.push(base64);
          } catch (err) {
            console.error(`Failed to process screenshot ${file.originalname}:`, err);
          }
        }
      }

      // Call AI comparison
      const result = await compareContentToViral({
        yourContent,
        competitorContent,
        screenshotBase64s,
      });
      
      // Increment usage after successful comparison
      await incrementUsage(userId, "contentComparisons", 1);

      res.json(result);
    } catch (error: any) {
      console.error("Content comparison error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // =====================
  // Reddit Integration Routes
  // =====================

  // Check if Reddit is configured
  app.get("/api/reddit/status", async (req, res) => {
    res.json({ configured: redditService.isConfigured() });
  });

  // Start Reddit OAuth flow
  app.get("/api/reddit/auth", isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.redirect("/social-accounts?error=unauthorized");
    }

    if (!redditService.isConfigured()) {
      return res.redirect("/social-accounts?error=reddit_not_configured");
    }

    const state = `${userId}_${Date.now()}`;
    const authUrl = redditService.getAuthUrl(state);
    res.redirect(authUrl);
  });

  // Reddit OAuth callback - requires session to validate state
  app.get("/api/reddit/callback", isAuthenticated, async (req: any, res) => {
    try {
      const { code, state, error, error_description } = req.query;
      
      // Handle Reddit's error response
      if (error) {
        console.error("Reddit OAuth error:", error, error_description);
        return res.redirect("/accounts?error=reddit_auth_denied");
      }
      
      if (!code || !state) {
        return res.redirect("/accounts?error=reddit_auth_failed");
      }

      // Validate state matches the authenticated user (CSRF protection)
      const sessionUserId = getUserId(req);
      const [stateUserId] = (state as string).split("_");
      
      if (!sessionUserId || sessionUserId !== stateUserId) {
        console.error("Reddit OAuth state mismatch:", { sessionUserId, stateUserId });
        return res.redirect("/accounts?error=reddit_state_mismatch");
      }
      
      const tokens = await redditService.exchangeCodeForTokens(code as string);
      const user = await redditService.getCurrentUser(tokens.access_token);

      // Create or update social account for Reddit
      const existingAccount = await storage.getSocialAccountByPlatform(sessionUserId, "reddit");
      
      const tokenExpiry = new Date();
      tokenExpiry.setSeconds(tokenExpiry.getSeconds() + tokens.expires_in);

      if (existingAccount) {
        await storage.updateSocialAccount(existingAccount.id, {
          accountName: user.name,
          accountHandle: `u/${user.name}`,
          platformAccountId: user.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry,
          isConnected: "connected",
        });
      } else {
        await storage.createSocialAccount({
          userId: sessionUserId,
          platform: "reddit",
          accountName: user.name,
          accountHandle: `u/${user.name}`,
          platformAccountId: user.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry,
          isConnected: "connected",
        });
      }

      res.redirect("/accounts?success=reddit_connected");
    } catch (error: any) {
      console.error("Reddit callback error:", error);
      res.redirect("/accounts?error=reddit_auth_failed");
    }
  });

  // Get user's target subreddits
  app.get("/api/reddit/subreddits", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const subreddits = await storage.getRedditSubreddits(userId);
      res.json(subreddits);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add a target subreddit
  app.post("/api/reddit/subreddits", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { name, displayName, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Subreddit name is required" });
      }

      // Check for existing
      const existing = await storage.getRedditSubreddits(userId);
      if (existing.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        return res.status(400).json({ error: "Subreddit already added" });
      }

      // Try to get subreddit info if we have a connected account
      const account = await storage.getSocialAccountByPlatform(userId, "reddit");
      let subscribers = 0;
      
      if (account?.accessToken) {
        try {
          const info = await redditService.getSubredditInfo(account.accessToken, name);
          subscribers = info.subscribers || 0;
        } catch (e) {
          // Ignore, subreddit info is optional
        }
      }

      const subreddit = await storage.createRedditSubreddit({
        userId,
        name: name.replace(/^r\//, ""),
        displayName: displayName || name,
        description,
        subscribers,
        isActive: "true",
      });

      res.json(subreddit);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a subreddit
  app.delete("/api/reddit/subreddits/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const subreddit = await storage.getRedditSubreddit(req.params.id);
      if (!subreddit || subreddit.userId !== userId) {
        return res.status(404).json({ error: "Subreddit not found" });
      }

      await storage.deleteRedditSubreddit(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get today's Reddit posts (for checking 5/day limit)
  app.get("/api/reddit/posts/today", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const posts = await storage.getRedditPostsToday(userId);
      res.json({
        posts,
        count: posts.length,
        remaining: Math.max(0, 5 - posts.length),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all Reddit posts history
  app.get("/api/reddit/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const posts = await storage.getRedditPosts(userId);
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Submit a post to Reddit (for A2E SEO Bonus)
  app.post("/api/reddit/post", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check daily limit (5 posts per 24 hours for A2E)
      const todayPosts = await storage.getRedditPostsToday(userId);
      if (todayPosts.length >= 5) {
        return res.status(429).json({ 
          error: "Daily limit reached. A2E allows max 5 posts per 24 hours.",
          remaining: 0
        });
      }

      const { subredditName, title, body, referralLink } = req.body;

      if (!subredditName || !title || !body || !referralLink) {
        return res.status(400).json({ error: "Missing required fields: subredditName, title, body, referralLink" });
      }

      // A2E rules: No URL in title
      if (title.includes("http://") || title.includes("https://") || title.includes("video.a2e.ai")) {
        return res.status(400).json({ error: "Post title must not contain URLs (A2E rule)" });
      }

      // Get Reddit account
      const account = await storage.getSocialAccountByPlatform(userId, "reddit");
      if (!account?.accessToken) {
        return res.status(400).json({ error: "Reddit account not connected" });
      }

      // Refresh token if needed
      let accessToken = account.accessToken;
      if (account.tokenExpiry && new Date(account.tokenExpiry) < new Date()) {
        try {
          const newTokens = await redditService.refreshAccessToken(account.refreshToken!);
          const newExpiry = new Date();
          newExpiry.setSeconds(newExpiry.getSeconds() + newTokens.expires_in);
          
          await storage.updateSocialAccount(account.id, {
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token || account.refreshToken,
            tokenExpiry: newExpiry,
          });
          accessToken = newTokens.access_token;
        } catch (e) {
          return res.status(401).json({ error: "Reddit token expired. Please reconnect." });
        }
      }

      // Submit the post
      const result = await redditService.submitTextPost(
        accessToken,
        subredditName.replace(/^r\//, ""),
        title,
        body
      );

      if (!result.success) {
        const post = await storage.createRedditPost({
          userId,
          subredditName,
          title,
          body,
          referralLink,
          status: "failed",
          errorMessage: result.error,
        });
        return res.status(400).json({ error: result.error, post });
      }

      // Save successful post
      const post = await storage.createRedditPost({
        userId,
        subredditName,
        title,
        body,
        referralLink,
        redditPostId: result.postId,
        postUrl: result.postUrl,
        status: "posted",
        postedAt: new Date(),
        creditsEarned: 200, // Initial instant credits
      });

      // Update subreddit last posted
      const subreddits = await storage.getRedditSubreddits(userId);
      const matchingSub = subreddits.find(s => s.name.toLowerCase() === subredditName.toLowerCase().replace(/^r\//, ""));
      if (matchingSub) {
        await storage.updateRedditSubreddit(matchingSub.id, { lastPostedAt: new Date() });
      }

      res.json({
        success: true,
        post,
        remaining: 4 - todayPosts.length,
      });
    } catch (error: any) {
      console.error("Reddit post error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk add popular subreddits for A2E promotion
  app.post("/api/reddit/subreddits/bulk", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { subreddits } = req.body;
      if (!subreddits || !Array.isArray(subreddits)) {
        return res.status(400).json({ error: "subreddits array is required" });
      }

      const existing = await storage.getRedditSubreddits(userId);
      const existingNames = new Set(existing.map(s => s.name.toLowerCase()));

      const added: any[] = [];
      for (const name of subreddits) {
        const cleanName = name.replace(/^r\//, "").toLowerCase();
        if (!existingNames.has(cleanName)) {
          const sub = await storage.createRedditSubreddit({
            userId,
            name: cleanName,
            displayName: `r/${cleanName}`,
            isActive: "true",
          });
          added.push(sub);
          existingNames.add(cleanName);
        }
      }

      res.json({ added, count: added.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== VIDEO TO CLIPS ====================
  
  // Multer config for video uploads
  const videoToClipsUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("video/")) {
        cb(null, true);
      } else {
        cb(new Error("Only video files allowed"));
      }
    },
  });

  // Upload video for clip extraction
  app.post("/api/video-to-clips/upload", isAuthenticated, videoToClipsUpload.single("video"), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }

      const filename = `video-to-clips-${userId}-${Date.now()}.mp4`;
      
      // Upload to cloud storage
      const result = await objectStorageService.uploadBuffer(
        req.file.buffer,
        filename,
        req.file.mimetype,
        true
      );

      res.json({
        videoUrl: result.objectPath,
        filename: result.filename,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error("Video upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  
  // Analyze video and generate clip suggestions - full pipeline with real AI
  app.post("/api/video-to-clips/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { videoBuffer, suggestions = [], customPrompt } = req.body;
      
      // Check if we have video data in the request (from upload)
      if (!videoBuffer) {
        return res.status(400).json({ error: "Video data is required. Please upload a video first." });
      }

      // Convert base64 to buffer if needed
      let buffer: Buffer;
      if (typeof videoBuffer === "string") {
        buffer = Buffer.from(videoBuffer, "base64");
      } else {
        return res.status(400).json({ error: "Invalid video data format" });
      }

      console.log(`Processing video for user ${userId}, size: ${buffer.length} bytes`);

      // Process video with real AI pipeline
      const result = await processVideoForClips(
        buffer,
        userId,
        suggestions,
        customPrompt
      );

      // Return clips with IDs for frontend
      const clips = result.clips.map((clip, index) => ({
        id: randomUUID(),
        title: clip.title,
        startTime: clip.startTime,
        endTime: clip.endTime,
        transcript: clip.transcript,
        score: clip.score,
        reason: clip.reason,
      }));

      res.json({
        clips,
        totalDuration: result.duration,
        transcript: result.transcript,
        message: "Clips generated successfully using AI analysis",
      });
    } catch (error: any) {
      console.error("Video analysis error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Process video from URL using yt-dlp
  app.post("/api/video-to-clips/url", isAuthenticated, async (req: any, res) => {
    const { execSync, spawn } = await import("child_process");
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { url, suggestions = [], customPrompt = "" } = req.body;
      if (!url) {
        return res.status(400).json({ error: "No URL provided" });
      }

      // Validate URL to prevent command injection
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return res.status(400).json({ error: "Invalid URL protocol" });
        }
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      console.log(`Processing URL for user ${userId}: ${parsedUrl.href}`);

      // Create temp directory
      const tempDir = path.join(os.tmpdir(), `video-url-${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });
      const tempVideoPath = path.join(tempDir, "downloaded.mp4");

      // Download video using yt-dlp with spawn to avoid shell injection
      console.log("Downloading video with yt-dlp...");
      try {
        const { spawnSync } = await import("child_process");
        const result = spawnSync("yt-dlp", [
          "--extractor-args", "youtube:player_client=android",
          "-f", "best[height<=720]",
          "-o", tempVideoPath,
          parsedUrl.href
        ], { timeout: 300000, maxBuffer: 50 * 1024 * 1024 });
        
        if (result.status !== 0) {
          throw new Error(result.stderr?.toString() || "Download failed");
        }
      } catch (dlError: any) {
        console.error("yt-dlp error:", dlError.message);
        fs.rmSync(tempDir, { recursive: true, force: true });
        return res.status(400).json({ error: "Failed to download video. Please check the URL." });
      }

      // Check if file exists and read it
      if (!fs.existsSync(tempVideoPath)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        return res.status(400).json({ error: "Download failed - no video file created" });
      }

      const videoBuffer = fs.readFileSync(tempVideoPath);
      const fileSize = videoBuffer.length;
      console.log(`Downloaded video size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

      // Limit to 500MB
      if (fileSize > 500 * 1024 * 1024) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        return res.status(400).json({ error: "Video too large. Maximum size is 500MB." });
      }

      // Process with AI to get clip suggestions
      const result = await processVideoForClips(
        videoBuffer,
        userId,
        suggestions,
        customPrompt
      );

      // Extract actual video clips using FFmpeg
      const extractedClips = [];
      for (let i = 0; i < result.clips.length; i++) {
        const clip = result.clips[i];
        try {
          const clipFileName = `clip_${i}_${Date.now()}.mp4`;
          const clipPath = path.join(tempDir, clipFileName);

          // Use FFmpeg to extract clip
          execSync(
            `ffmpeg -y -i "${tempVideoPath}" -ss ${clip.startTime} -to ${clip.endTime} -c:v libx264 -c:a aac -preset fast "${clipPath}"`,
            { timeout: 120000 }
          );

          if (fs.existsSync(clipPath)) {
            const clipBuffer = fs.readFileSync(clipPath);
            const uploadResult = await objectStorageService.uploadBuffer(
              clipBuffer,
              clipFileName,
              "video/mp4",
              true
            );
            const clipUrl = uploadResult.objectPath;

            extractedClips.push({
              id: randomUUID(),
              title: clip.title,
              videoUrl: clipUrl,
              startTime: clip.startTime,
              endTime: clip.endTime,
              transcript: clip.transcript,
              score: clip.score,
              reason: clip.reason,
            });
          }
        } catch (clipError) {
          console.error(`Failed to extract clip ${i}:`, clipError);
          extractedClips.push({
            id: randomUUID(),
            title: clip.title,
            startTime: clip.startTime,
            endTime: clip.endTime,
            transcript: clip.transcript,
            score: clip.score,
            reason: clip.reason,
          });
        }
      }

      // Cleanup temp files
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error("Cleanup error:", e);
      }

      res.json({
        clips: extractedClips,
        totalDuration: result.duration,
        transcript: result.transcript,
        message: "Video processed from URL successfully",
      });
    } catch (error: any) {
      console.error("URL processing error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Upload, analyze, and extract clips in one step
  app.post("/api/video-to-clips/process", isAuthenticated, videoToClipsUpload.single("video"), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }

      const suggestions = req.body.suggestions ? JSON.parse(req.body.suggestions) : [];
      const customPrompt = req.body.customPrompt || "";

      console.log(`Processing video for user ${userId}, size: ${req.file.size} bytes`);

      // Save video to temp file for FFmpeg processing
      const tempDir = path.join(os.tmpdir(), `video-clips-${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });
      const tempVideoPath = path.join(tempDir, "source.mp4");
      fs.writeFileSync(tempVideoPath, req.file.buffer);

      // Process with AI to get clip suggestions
      const result = await processVideoForClips(
        req.file.buffer,
        userId,
        suggestions,
        customPrompt
      );

      // Extract actual video clips using FFmpeg
      const extractedClips = [];
      for (let i = 0; i < result.clips.length; i++) {
        const clip = result.clips[i];
        try {
          console.log(`Extracting clip ${i + 1}/${result.clips.length}: ${clip.startTime}s - ${clip.endTime}s`);
          const extracted = await extractAndUploadClip(
            tempVideoPath,
            userId,
            i,
            clip.startTime,
            clip.endTime
          );
          
          extractedClips.push({
            id: randomUUID(),
            title: clip.title,
            startTime: clip.startTime,
            endTime: clip.endTime,
            transcript: clip.transcript,
            score: clip.score,
            reason: clip.reason,
            videoUrl: extracted.clipPath.startsWith('/objects') ? extracted.clipPath : `/objects/${extracted.clipPath}`,
            thumbnailUrl: extracted.thumbnailPath.startsWith('/objects') ? extracted.thumbnailPath : `/objects/${extracted.thumbnailPath}`,
          });
        } catch (extractError) {
          console.error(`Error extracting clip ${i}:`, extractError);
          extractedClips.push({
            id: randomUUID(),
            title: clip.title,
            startTime: clip.startTime,
            endTime: clip.endTime,
            transcript: clip.transcript,
            score: clip.score,
            reason: clip.reason,
          });
        }
      }

      // Cleanup temp files
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error("Cleanup error:", e);
      }

      res.json({
        clips: extractedClips,
        totalDuration: result.duration,
        transcript: result.transcript,
        message: "Video processed and clips extracted successfully",
      });
    } catch (error: any) {
      console.error("Video processing error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate hook, caption, and hashtags for a video clip
  app.post("/api/generate/clip-caption", isAuthenticated, async (req: any, res) => {
    try {
      const { transcript } = req.body;
      if (!transcript) {
        return res.status(400).json({ error: "Transcript is required" });
      }

      const { openai } = await import("./openai");
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a social media expert. Generate engaging content for a short video clip.
            
Return a JSON object with:
- hook: A 5-10 word attention-grabbing opening line
- caption: A compelling 2-3 sentence caption that drives engagement
- hashtags: Array of 5-8 relevant hashtags (without # symbol)

Focus on virality, relatability, and calls to action.`
          },
          {
            role: "user",
            content: `Generate hook, caption, and hashtags for this video clip transcript:\n\n${transcript}`
          }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || "{}";
      const result = JSON.parse(content);
      
      res.json({
        hook: result.hook || "",
        caption: result.caption || "",
        hashtags: (result.hashtags || []).map((h: string) => h.startsWith("#") ? h : `#${h}`),
      });
    } catch (error: any) {
      console.error("Caption generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Help chatbot endpoint
  app.post("/api/help-chat", async (req, res) => {
    try {
      const { message, history = [] } = req.body;
      
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      const { openai } = await import("./openai");
      const { HELP_KNOWLEDGE_BASE } = await import("./helpKnowledgeBase");

      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        {
          role: "system",
          content: `You are a helpful assistant for SocialCommand, a social media management platform. Your job is to help users understand how to use the platform's features.

Use the following knowledge base to answer questions. Be friendly, concise, and helpful. If a question is outside the platform's features, politely redirect to relevant features.

${HELP_KNOWLEDGE_BASE}

Guidelines:
- Keep responses short and actionable (2-4 sentences max unless more detail is needed)
- Use simple, everyday language
- Suggest specific steps when explaining how to do something
- If unsure, recommend checking the relevant section or ask for clarification
- Never make up features that don't exist`
        },
        ...history.slice(-10).map((h: { role: string; content: string }) => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user", content: message },
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_completion_tokens: 500,
      });

      const reply = response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
      
      res.json({ reply });
    } catch (error: any) {
      console.error("Help chat error:", error);
      res.status(500).json({ error: "Sorry, I'm having trouble responding. Please try again." });
    }
  });

  return httpServer;
}
