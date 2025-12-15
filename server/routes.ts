import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBrandBriefSchema, insertGeneratedContentSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { generateSocialContent, generateContentIdeas, type ContentGenerationRequest } from "./openai";

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
        generationMetadata: { contentIdeas: result.contentIdeas },
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

  return httpServer;
}
