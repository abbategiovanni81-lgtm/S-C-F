/**
 * Webhook Notification System
 * 
 * Sends webhook notifications for various events:
 * - Content generation completed
 * - Batch jobs completed
 * - Scheduled posts published
 * - AI processing completed
 * - Error notifications
 */

import { EventEmitter } from "events";

export interface WebhookEvent {
  id: string;
  type: "content.generated" | "content.scheduled" | "content.posted" | "batch.completed" | "batch.failed" | "job.completed" | "job.failed" | "error.occurred";
  timestamp: Date;
  userId: string;
  data: Record<string, any>;
}

export interface WebhookSubscription {
  id: string;
  userId: string;
  url: string;
  events: WebhookEvent["type"][];
  secret?: string;
  active: boolean;
  createdAt: Date;
}

// Event emitter for internal event handling
const eventEmitter = new EventEmitter();

// In-memory webhook subscriptions (in production, use database)
const webhookSubscriptions: Map<string, WebhookSubscription> = new Map();
const webhookHistory: Array<{ subscription: string; event: WebhookEvent; success: boolean; error?: string }> = [];

/**
 * Register a webhook subscription
 */
export function registerWebhook(
  userId: string,
  url: string,
  events: WebhookEvent["type"][],
  secret?: string
): WebhookSubscription {
  const subscription: WebhookSubscription = {
    id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    url,
    events,
    secret,
    active: true,
    createdAt: new Date(),
  };

  webhookSubscriptions.set(subscription.id, subscription);
  console.log(`[Webhooks] Registered webhook ${subscription.id} for user ${userId}`);

  return subscription;
}

/**
 * Unregister a webhook subscription
 */
export function unregisterWebhook(subscriptionId: string): boolean {
  const deleted = webhookSubscriptions.delete(subscriptionId);
  if (deleted) {
    console.log(`[Webhooks] Unregistered webhook ${subscriptionId}`);
  }
  return deleted;
}

/**
 * Get all webhooks for a user
 */
export function getUserWebhooks(userId: string): WebhookSubscription[] {
  return Array.from(webhookSubscriptions.values()).filter(w => w.userId === userId);
}

/**
 * Update webhook subscription
 */
export function updateWebhook(
  subscriptionId: string,
  updates: Partial<Pick<WebhookSubscription, "url" | "events" | "secret" | "active">>
): WebhookSubscription | undefined {
  const webhook = webhookSubscriptions.get(subscriptionId);
  if (webhook) {
    Object.assign(webhook, updates);
    console.log(`[Webhooks] Updated webhook ${subscriptionId}`);
  }
  return webhook;
}

/**
 * Emit an event (internal use)
 */
export function emitEvent(event: Omit<WebhookEvent, "id" | "timestamp">): void {
  const fullEvent: WebhookEvent = {
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    ...event,
  };

  console.log(`[Webhooks] Event emitted: ${fullEvent.type} for user ${fullEvent.userId}`);

  // Emit to internal event system
  eventEmitter.emit(fullEvent.type, fullEvent);
  eventEmitter.emit("*", fullEvent);

  // Send to registered webhooks
  sendToWebhooks(fullEvent);
}

/**
 * Send event to all matching webhook subscriptions
 */
async function sendToWebhooks(event: WebhookEvent): Promise<void> {
  const matchingWebhooks = Array.from(webhookSubscriptions.values()).filter(
    w => w.active && w.userId === event.userId && w.events.includes(event.type)
  );

  if (matchingWebhooks.length === 0) {
    return;
  }

  console.log(`[Webhooks] Sending event ${event.type} to ${matchingWebhooks.length} webhooks`);

  // Send to all webhooks in parallel
  await Promise.all(
    matchingWebhooks.map(webhook => sendWebhookNotification(webhook, event))
  );
}

/**
 * Send notification to a single webhook
 */
async function sendWebhookNotification(
  webhook: WebhookSubscription,
  event: WebhookEvent
): Promise<void> {
  try {
    const payload = {
      event: {
        id: event.id,
        type: event.type,
        timestamp: event.timestamp.toISOString(),
        data: event.data,
      },
      subscription: {
        id: webhook.id,
      },
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "SocialCommand-Webhooks/1.0",
      "X-Event-Type": event.type,
      "X-Event-ID": event.id,
    };

    // Add signature if secret is provided
    if (webhook.secret) {
      const signature = await generateSignature(webhook.secret, JSON.stringify(payload));
      headers["X-Webhook-Signature"] = signature;
    }

    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Log success
    webhookHistory.push({
      subscription: webhook.id,
      event,
      success: true,
    });

    console.log(`[Webhooks] Successfully sent to ${webhook.url} (${response.status})`);
  } catch (error: any) {
    // Log failure
    webhookHistory.push({
      subscription: webhook.id,
      event,
      success: false,
      error: error.message,
    });

    console.error(`[Webhooks] Failed to send to ${webhook.url}:`, error.message);

    // Deactivate webhook after 10 consecutive failures
    const recentFailures = webhookHistory
      .filter(h => h.subscription === webhook.id && !h.success)
      .slice(-10);

    if (recentFailures.length >= 10) {
      webhook.active = false;
      console.warn(`[Webhooks] Deactivated webhook ${webhook.id} due to repeated failures`);
    }
  }
}

/**
 * Generate HMAC signature for webhook payload
 */
async function generateSignature(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Listen to internal events (for server-side handlers)
 */
export function onEvent(
  eventType: WebhookEvent["type"] | "*",
  handler: (event: WebhookEvent) => void
): () => void {
  eventEmitter.on(eventType, handler);

  // Return unsubscribe function
  return () => {
    eventEmitter.off(eventType, handler);
  };
}

/**
 * Get webhook delivery history for a subscription
 */
export function getWebhookHistory(subscriptionId: string, limit: number = 50) {
  return webhookHistory
    .filter(h => h.subscription === subscriptionId)
    .slice(-limit)
    .reverse();
}

/**
 * Get webhook statistics
 */
export function getWebhookStats(subscriptionId?: string) {
  const history = subscriptionId
    ? webhookHistory.filter(h => h.subscription === subscriptionId)
    : webhookHistory;

  const total = history.length;
  const successful = history.filter(h => h.success).length;
  const failed = history.filter(h => !h.success).length;

  return {
    total,
    successful,
    failed,
    successRate: total > 0 ? (successful / total) * 100 : 0,
    recentDeliveries: history.slice(-10).reverse(),
  };
}

/**
 * Helper functions to emit common events
 */
export const WebhookEvents = {
  contentGenerated(userId: string, contentId: string, format: string, briefId: string) {
    emitEvent({
      type: "content.generated",
      userId,
      data: { contentId, format, briefId },
    });
  },

  contentScheduled(userId: string, contentId: string, scheduledFor: Date) {
    emitEvent({
      type: "content.scheduled",
      userId,
      data: { contentId, scheduledFor: scheduledFor.toISOString() },
    });
  },

  contentPosted(userId: string, contentId: string, platform: string, platformPostId?: string) {
    emitEvent({
      type: "content.posted",
      userId,
      data: { contentId, platform, platformPostId },
    });
  },

  batchCompleted(userId: string, batchId: string, jobCount: number, successCount: number) {
    emitEvent({
      type: "batch.completed",
      userId,
      data: { batchId, jobCount, successCount, failedCount: jobCount - successCount },
    });
  },

  batchFailed(userId: string, batchId: string, error: string) {
    emitEvent({
      type: "batch.failed",
      userId,
      data: { batchId, error },
    });
  },

  jobCompleted(userId: string, jobId: string, jobType: string, result?: any) {
    emitEvent({
      type: "job.completed",
      userId,
      data: { jobId, jobType, result },
    });
  },

  jobFailed(userId: string, jobId: string, jobType: string, error: string) {
    emitEvent({
      type: "job.failed",
      userId,
      data: { jobId, jobType, error },
    });
  },

  errorOccurred(userId: string, errorType: string, message: string, details?: any) {
    emitEvent({
      type: "error.occurred",
      userId,
      data: { errorType, message, details },
    });
  },
};

// Cleanup old history entries every hour
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
  const originalLength = webhookHistory.length;
  
  webhookHistory.splice(
    0,
    webhookHistory.findIndex(h => h.event.timestamp.getTime() > cutoff)
  );
  
  const removed = originalLength - webhookHistory.length;
  if (removed > 0) {
    console.log(`[Webhooks] Cleaned up ${removed} old history entries`);
  }
}, 60 * 60 * 1000);
