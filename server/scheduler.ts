/**
 * Scheduled-post dispatcher.
 *
 * Polls Postgres every POLL_INTERVAL_MS for due rows in scheduled_posts and
 * publishes them through publishService (direct platform APIs) or Late.dev
 * when the user holds a Late/Zernio key. Only rows with postType "autopost"
 * are dispatched - "auto" (YouTube-native publishAt) and "manual"
 * (calendar tracking) rows are never touched, so pre-existing data cannot
 * suddenly start posting.
 *
 * Lifecycle: scheduled -> uploading -> published | failed
 * Retries: MAX_ATTEMPTS with a linear backoff (attempts * RETRY_BACKOFF_MS),
 * enforced in the claim query via last_attempt_at. Failures store the error
 * on upload_error so the Schedule UI can show the reason. Success stores the
 * platform's post id/url receipt - a post is only "published" when the
 * platform gave us one.
 *
 * Claiming uses FOR UPDATE SKIP LOCKED so multiple server instances never
 * double-post the same row.
 */
import { sql } from "drizzle-orm";
import { db } from "./db";
import { storage } from "./storage";
import { publishDirect } from "./publishService";
import { createZernioPost, mapPlatformToZernioName, inferMediaItems } from "./zernioService";
import { decryptKey } from "./keyVault";
import { userApiKeys } from "@shared/schema";
import { eq } from "drizzle-orm";

const POLL_INTERVAL_MS = 60_000;
const RETRY_BACKOFF_MS = 5 * 60_000;
const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 10;

let timer: NodeJS.Timeout | null = null;
let running = false;

interface DueRow {
  id: string;
  user_id: string;
  account_id: string | null;
  platform: string;
  title: string | null;
  description: string | null;
  media_url: string | null;
  media_type: string | null;
  attempts: number;
}

async function claimDuePosts(): Promise<DueRow[]> {
  const result = await db.execute(sql`
    UPDATE scheduled_posts SET
      status = 'uploading',
      attempts = attempts + 1,
      last_attempt_at = now()
    WHERE id IN (
      SELECT id FROM scheduled_posts
      WHERE status = 'scheduled'
        AND post_type = 'autopost'
        AND scheduled_for <= now()
        AND (last_attempt_at IS NULL
             OR last_attempt_at < now() - (${RETRY_BACKOFF_MS} * interval '1 millisecond') * attempts)
      ORDER BY scheduled_for
      LIMIT ${BATCH_SIZE}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, user_id, account_id, platform, title, description, media_url, media_type, attempts
  `);
  return (result.rows ?? result) as unknown as DueRow[];
}

async function markPublished(id: string, postId?: string, postUrl?: string) {
  await db.execute(sql`
    UPDATE scheduled_posts
    SET status = 'published', upload_error = NULL,
        published_post_id = ${postId ?? null}, published_url = ${postUrl ?? null}
    WHERE id = ${id}
  `);
}

async function markFailure(id: string, attempts: number, error: string) {
  const final = attempts >= MAX_ATTEMPTS;
  await db.execute(sql`
    UPDATE scheduled_posts
    SET status = ${final ? "failed" : "scheduled"}, upload_error = ${error.slice(0, 1000)}
    WHERE id = ${id}
  `);
}

async function dispatchOne(row: DueRow): Promise<void> {
  try {
    if (!row.account_id) {
      throw new Error("No account linked to this scheduled post");
    }
    const account = await storage.getSocialAccount(row.account_id);
    if (!account) {
      throw new Error("Linked social account no longer exists");
    }
    if (account.userId !== row.user_id) {
      throw new Error("Account/user mismatch");
    }

    // Mapping set by /api/social/post: description = post text, title = title
    const content = {
      text: row.description || row.title || "",
      title: row.title || undefined,
      imageUrl: row.media_type === "image" ? row.media_url || undefined : undefined,
      videoUrl: row.media_type === "video" ? row.media_url || undefined : undefined,
    };

    // Zernio path when the user holds a key - post NOW (the worker is the
    // single source of truth for timing; no scheduledFor delegation).
    const [keys] = await db.select().from(userApiKeys).where(eq(userApiKeys.userId, row.user_id));
    const zernioKey = decryptKey(keys?.lateKey);
    if (zernioKey) {
      // row.id as x-request-id: a retried attempt within Zernio's
      // idempotency window returns the original post, never a duplicate
      const post = await createZernioPost(zernioKey, {
        content: content.text,
        mediaItems: inferMediaItems(row.media_url, row.media_type),
        publishNow: true,
        platforms: [{
          platform: mapPlatformToZernioName(row.platform),
          accountId: account.platformAccountId || account.id,
        }],
      }, row.id);
      const pr = post.platforms?.[0];
      if (pr?.status === "failed" || post.status === "failed") {
        throw new Error(pr?.error || "Zernio reported a failed post");
      }
      // createZernioPost already throws when no _id receipt came back
      await markPublished(row.id, pr?.platformPostId || post._id, pr?.platformPostUrl);
      console.log(`[scheduler] Published ${row.id} to ${row.platform} via Zernio (${post._id})`);
      return;
    }

    const receipt = await publishDirect(account, content);
    if (!receipt.postId) {
      throw new Error("Platform returned no post id receipt");
    }
    await markPublished(row.id, receipt.postId, receipt.postUrl);
    console.log(`[scheduler] Published ${row.id} to ${row.platform} (${receipt.postId})`);
  } catch (error: any) {
    const message = error?.message || String(error);
    console.error(`[scheduler] Post ${row.id} attempt ${row.attempts} failed: ${message}`);
    await markFailure(row.id, row.attempts, message);
  }
}

export async function runSchedulerTick(): Promise<{ dispatched: number }> {
  if (running) return { dispatched: 0 }; // Never overlap ticks
  running = true;
  try {
    const due = await claimDuePosts();
    if (due.length > 0) {
      console.log(`[scheduler] Dispatching ${due.length} due post(s)`);
      // Sequential: platform rate limits over throughput
      for (const row of due) {
        await dispatchOne(row);
      }
    }
    return { dispatched: due.length };
  } catch (error) {
    console.error("[scheduler] Tick failed:", error);
    return { dispatched: 0 };
  } finally {
    running = false;
  }
}

/**
 * COST NOTE (Gio, 2026-07-26): an always-on poll loop keeps a Replit app
 * awake 24/7 and bills compute around the clock (the May incident).
 * Therefore the in-process loop is OPT-IN ONLY (SCHEDULER_MODE=interval,
 * for self-hosted/VPS). Default: NO loop. Scheduling still works:
 * - Zernio-routed platforms + YouTube: NATIVE scheduling (the platform's
 *   own servers fire at publish time - no process of ours involved).
 * - Direct platforms (Bluesky/Reddit/Pinterest/LinkedIn): an external
 *   cron (e.g. Replit Scheduled Deployment - runs and exits) pings
 *   POST /api/scheduler/tick with the CRON_SECRET header.
 */
export function startScheduler(): void {
  if (process.env.SCHEDULER_MODE !== "interval") {
    console.log("[scheduler] In-process loop disabled (native platform scheduling + external tick). Set SCHEDULER_MODE=interval to enable on always-on hosts.");
    return;
  }
  if (timer) return;
  timer = setInterval(() => void runSchedulerTick(), POLL_INTERVAL_MS);
  timer.unref?.();
  console.log(`[scheduler] Started (poll every ${POLL_INTERVAL_MS / 1000}s)`);
  void runSchedulerTick(); // Catch up immediately on boot
}

export function stopScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
