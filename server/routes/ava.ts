import type { Express } from "express";
import { db } from "../db";
import { avaChatSessions, avaChatMessages, avaContentPlans, brandBriefs } from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";
import { 
  generateAvaResponse, 
  createContentPlan, 
  detectContentIntent,
  refineContentPlan,
  generateBatchPlans
} from "../services/avaAgent";

export function registerAvaRoutes(app: Express) {
  
  // Create a new chat session
  app.post("/api/ava/sessions", async (req, res) => {
    try {
      const { userId, title } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const [session] = await db.insert(avaChatSessions).values({
        userId,
        title: title || "New Conversation",
        status: "active",
      }).returning();

      res.json(session);
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ error: "Failed to create chat session" });
    }
  });

  // Get all chat sessions for a user
  app.get("/api/ava/sessions", async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const sessions = await db.query.avaChatSessions.findMany({
        where: eq(avaChatSessions.userId, userId as string),
        orderBy: [desc(avaChatSessions.updatedAt)],
      });

      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ error: "Failed to fetch chat sessions" });
    }
  });

  // Get a specific chat session with messages
  app.get("/api/ava/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;

      const session = await db.query.avaChatSessions.findFirst({
        where: eq(avaChatSessions.id, sessionId),
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const messages = await db.query.avaChatMessages.findMany({
        where: eq(avaChatMessages.sessionId, sessionId),
        orderBy: [asc(avaChatMessages.createdAt)],
      });

      res.json({ session, messages });
    } catch (error) {
      console.error("Error fetching chat session:", error);
      res.status(500).json({ error: "Failed to fetch chat session" });
    }
  });

  // Send a message in a chat session
  app.post("/api/ava/sessions/:sessionId/messages", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { content, role = "user" } = req.body;

      if (!content) {
        return res.status(400).json({ error: "content is required" });
      }

      // Get session
      const session = await db.query.avaChatSessions.findFirst({
        where: eq(avaChatSessions.id, sessionId),
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Save user message
      const [userMessage] = await db.insert(avaChatMessages).values({
        sessionId,
        role,
        messageType: "text",
        content,
      }).returning();

      // Get conversation history
      const previousMessages = await db.query.avaChatMessages.findMany({
        where: eq(avaChatMessages.sessionId, sessionId),
        orderBy: [asc(avaChatMessages.createdAt)],
      });

      // Get user's brand brief if available
      let brandBrief;
      try {
        const briefs = await db.query.brandBriefs.findMany({
          where: eq(brandBriefs.userId, session.userId),
          limit: 1,
        });
        brandBrief = briefs[0];
      } catch (error) {
        console.log("No brand brief found, continuing without it");
      }

      // Build context
      const context = {
        sessionId,
        userId: session.userId,
        messages: previousMessages.map(m => ({
          role: m.role,
          content: m.content
        })),
        brandBrief
      };

      // Detect if this is a content creation request
      const intent = detectContentIntent(content);

      let assistantMessage;
      
      if (intent.isContentRequest && intent.contentType && intent.confidence > 0.7) {
        // Create a content plan
        try {
          const plan = await createContentPlan({
            contentType: intent.contentType,
            userPrompt: content,
            context
          });

          // Save the plan
          const [savedPlan] = await db.insert(avaContentPlans).values({
            sessionId,
            userId: session.userId,
            contentType: intent.contentType,
            status: "draft",
            planData: plan.planData,
          }).returning();

          // Save assistant message with plan reference
          [assistantMessage] = await db.insert(avaChatMessages).values({
            sessionId,
            role: "assistant",
            messageType: "content_plan",
            content: `I've created a ${intent.contentType} plan for you: ${plan.summary}`,
            metadata: { planId: savedPlan.id, plan: plan.planData }
          }).returning();

        } catch (error) {
          console.error("Error creating content plan:", error);
          // Fallback to regular response
          const response = await generateAvaResponse(content, context);
          [assistantMessage] = await db.insert(avaChatMessages).values({
            sessionId,
            role: "assistant",
            messageType: "text",
            content: response,
          }).returning();
        }
      } else {
        // Generate regular chat response
        const response = await generateAvaResponse(content, context);
        [assistantMessage] = await db.insert(avaChatMessages).values({
          sessionId,
          role: "assistant",
          messageType: "text",
          content: response,
        }).returning();
      }

      // Update session timestamp
      await db.update(avaChatSessions)
        .set({ updatedAt: new Date() })
        .where(eq(avaChatSessions.id, sessionId));

      res.json({ userMessage, assistantMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get content plans for a session
  app.get("/api/ava/sessions/:sessionId/plans", async (req, res) => {
    try {
      const { sessionId } = req.params;

      const plans = await db.query.avaContentPlans.findMany({
        where: eq(avaContentPlans.sessionId, sessionId),
        orderBy: [desc(avaContentPlans.createdAt)],
      });

      res.json(plans);
    } catch (error) {
      console.error("Error fetching content plans:", error);
      res.status(500).json({ error: "Failed to fetch content plans" });
    }
  });

  // Update a content plan (for refinements)
  app.patch("/api/ava/plans/:planId", async (req, res) => {
    try {
      const { planId } = req.params;
      const { feedback, status } = req.body;

      const plan = await db.query.avaContentPlans.findFirst({
        where: eq(avaContentPlans.id, planId),
      });

      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }

      let updatedPlanData = plan.planData;

      // If feedback is provided, refine the plan
      if (feedback) {
        updatedPlanData = await refineContentPlan(
          plan.planData,
          feedback,
          plan.contentType
        );
      }

      // Update the plan
      const [updatedPlan] = await db.update(avaContentPlans)
        .set({
          planData: updatedPlanData,
          status: status || plan.status,
          updatedAt: new Date(),
        })
        .where(eq(avaContentPlans.id, planId))
        .returning();

      res.json(updatedPlan);
    } catch (error) {
      console.error("Error updating content plan:", error);
      res.status(500).json({ error: "Failed to update content plan" });
    }
  });

  // Approve a plan and initiate generation
  app.post("/api/ava/plans/:planId/approve", async (req, res) => {
    try {
      const { planId } = req.params;

      const [updatedPlan] = await db.update(avaContentPlans)
        .set({
          status: "approved",
          updatedAt: new Date(),
        })
        .where(eq(avaContentPlans.id, planId))
        .returning();

      res.json(updatedPlan);
    } catch (error) {
      console.error("Error approving plan:", error);
      res.status(500).json({ error: "Failed to approve plan" });
    }
  });

  // Generate batch content plans
  app.post("/api/ava/sessions/:sessionId/batch", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { batchRequest } = req.body;

      if (!batchRequest) {
        return res.status(400).json({ error: "batchRequest is required" });
      }

      const session = await db.query.avaChatSessions.findFirst({
        where: eq(avaChatSessions.id, sessionId),
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Get brand brief
      let brandBrief;
      try {
        const briefs = await db.query.brandBriefs.findMany({
          where: eq(brandBriefs.userId, session.userId),
          limit: 1,
        });
        brandBrief = briefs[0];
      } catch (error) {
        console.log("No brand brief found");
      }

      // Get conversation history
      const previousMessages = await db.query.avaChatMessages.findMany({
        where: eq(avaChatMessages.sessionId, sessionId),
        orderBy: [asc(avaChatMessages.createdAt)],
      });

      const context = {
        sessionId,
        userId: session.userId,
        messages: previousMessages.map(m => ({
          role: m.role,
          content: m.content
        })),
        brandBrief
      };

      const plans = await generateBatchPlans(batchRequest, context);

      // Save all plans
      const savedPlans = [];
      for (const plan of plans) {
        const [savedPlan] = await db.insert(avaContentPlans).values({
          sessionId,
          userId: session.userId,
          contentType: plan.contentType,
          status: "draft",
          planData: plan.planData,
        }).returning();
        savedPlans.push(savedPlan);
      }

      res.json(savedPlans);
    } catch (error) {
      console.error("Error generating batch plans:", error);
      res.status(500).json({ error: "Failed to generate batch plans" });
    }
  });

  // Delete a chat session
  app.delete("/api/ava/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;

      await db.delete(avaChatSessions)
        .where(eq(avaChatSessions.id, sessionId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chat session:", error);
      res.status(500).json({ error: "Failed to delete chat session" });
    }
  });
}
