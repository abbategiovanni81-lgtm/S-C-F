import { db } from "./db";
import { webhookQueue } from "../shared/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

interface WebhookJob {
  id: string;
  webhookType: string;
  payload: any;
  status: string;
  retryCount: number;
}

/**
 * Webhook Queue Service
 * Database-backed webhook processing with retry logic
 */
export class WebhookQueueService {
  private maxRetries = 3;
  private retryDelayMs = 5000;

  /**
   * Add webhook to processing queue
   */
  async enqueue(webhookType: string, payload: any): Promise<string> {
    try {
      const [job] = await db.insert(webhookQueue).values({
        webhookType,
        payload,
        status: "pending",
        retryCount: 0,
      }).returning();

      return job.id;
    } catch (error) {
      console.error("Webhook enqueue error:", error);
      throw new Error(`Failed to enqueue webhook: ${error.message}`);
    }
  }

  /**
   * Process pending webhooks
   */
  async processPending(): Promise<void> {
    try {
      // Get pending webhooks
      const pendingJobs = await db
        .select()
        .from(webhookQueue)
        .where(eq(webhookQueue.status, "pending"))
        .limit(10);

      for (const job of pendingJobs) {
        await this.processJob(job);
      }
    } catch (error) {
      console.error("Process pending webhooks error:", error);
    }
  }

  /**
   * Process individual webhook job
   */
  private async processJob(job: WebhookJob): Promise<void> {
    try {
      // Mark as processing
      await db
        .update(webhookQueue)
        .set({ status: "processing" })
        .where(eq(webhookQueue.id, job.id));

      // Process based on webhook type
      switch (job.webhookType) {
        case "stripe":
          await this.processStripeWebhook(job.payload);
          break;
        case "youtube":
          await this.processYouTubeWebhook(job.payload);
          break;
        case "a2e":
          await this.processA2EWebhook(job.payload);
          break;
        default:
          console.warn(`Unknown webhook type: ${job.webhookType}`);
      }

      // Mark as completed
      await db
        .update(webhookQueue)
        .set({
          status: "completed",
          processedAt: new Date(),
        })
        .where(eq(webhookQueue.id, job.id));
    } catch (error) {
      console.error(`Webhook processing error for job ${job.id}:`, error);
      await this.handleProcessingError(job, error.message);
    }
  }

  /**
   * Handle processing errors with retry logic
   * Note: Retries are handled by setting status back to "pending"
   * The periodic processor will pick them up automatically
   */
  private async handleProcessingError(job: WebhookJob, errorMessage: string): Promise<void> {
    const newRetryCount = job.retryCount + 1;

    if (newRetryCount >= this.maxRetries) {
      // Max retries reached - mark as failed
      await db
        .update(webhookQueue)
        .set({
          status: "failed",
          lastError: errorMessage,
          retryCount: newRetryCount,
        })
        .where(eq(webhookQueue.id, job.id));
    } else {
      // Mark as pending for retry - processor will pick it up
      await db
        .update(webhookQueue)
        .set({
          status: "pending",
          lastError: errorMessage,
          retryCount: newRetryCount,
        })
        .where(eq(webhookQueue.id, job.id));
    }
  }

  /**
   * Process Stripe webhook
   */
  private async processStripeWebhook(payload: any): Promise<void> {
    // Implementation would handle:
    // - subscription.created
    // - subscription.updated
    // - subscription.deleted
    // - payment_intent.succeeded
    // - payment_intent.failed
    console.log("Processing Stripe webhook:", payload.type);
  }

  /**
   * Process YouTube webhook
   */
  private async processYouTubeWebhook(payload: any): Promise<void> {
    // Implementation would handle:
    // - video.published
    // - video.updated
    // - channel.updated
    console.log("Processing YouTube webhook:", payload);
  }

  /**
   * Process A2E webhook
   */
  private async processA2EWebhook(payload: any): Promise<void> {
    // Implementation would handle:
    // - video.completed
    // - video.failed
    // - avatar.ready
    console.log("Processing A2E webhook:", payload);
  }

  /**
   * Get webhook status
   */
  async getStatus(jobId: string): Promise<WebhookJob | null> {
    const [job] = await db
      .select()
      .from(webhookQueue)
      .where(eq(webhookQueue.id, jobId))
      .limit(1);

    return job || null;
  }

  /**
   * Retry failed webhook
   */
  async retryFailed(jobId: string): Promise<void> {
    await db
      .update(webhookQueue)
      .set({
        status: "pending",
        retryCount: 0,
        lastError: null,
      })
      .where(eq(webhookQueue.id, jobId));

    const [job] = await db
      .select()
      .from(webhookQueue)
      .where(eq(webhookQueue.id, jobId))
      .limit(1);

    if (job) {
      await this.processJob(job as WebhookJob);
    }
  }

  /**
   * Clean up old completed webhooks
   */
  async cleanup(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { sql } = await import("drizzle-orm");
    const result = await db
      .delete(webhookQueue)
      .where(
        sql`${webhookQueue.status} = 'completed' AND ${webhookQueue.processedAt} < ${cutoffDate}`
      )
      .returning();

    return result.length;
  }
}

export const webhookQueueService = new WebhookQueueService();

/**
 * Start webhook queue processor
 */
export function startWebhookProcessor(intervalMs: number = 30000): NodeJS.Timer {
  return setInterval(() => {
    webhookQueueService.processPending();
  }, intervalMs);
}
