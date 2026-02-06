/**
 * Batch Processing Queue System
 * 
 * Handles batch content generation, processing, and scheduling operations
 * Supports multiple job types with priority levels and status tracking
 */

import { db } from "./db";
import { eq, inArray, and } from "drizzle-orm";
import { generatedContent } from "@shared/schema";

export interface BatchJob {
  id: string;
  type: "content_generation" | "video_processing" | "image_generation" | "voice_synthesis" | "avatar_creation" | "podcast_generation";
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  userId: string;
  briefId?: string;
  params: Record<string, any>;
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface BatchJobRequest {
  type: BatchJob["type"];
  priority?: BatchJob["priority"];
  userId: string;
  briefId?: string;
  params: Record<string, any>;
}

// In-memory queue (in production, use Redis or a proper queue service)
const jobQueue: Map<string, BatchJob> = new Map();
const jobHistory: BatchJob[] = [];

/**
 * Create a new batch job
 */
export function createBatchJob(request: BatchJobRequest): BatchJob {
  const job: BatchJob = {
    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: request.type,
    status: "queued",
    priority: request.priority || "normal",
    userId: request.userId,
    briefId: request.briefId,
    params: request.params,
    progress: 0,
    createdAt: new Date(),
  };

  jobQueue.set(job.id, job);
  console.log(`[BatchQueue] Created job ${job.id} (${job.type}) with priority ${job.priority}`);
  
  // Automatically start processing
  processNextJob();
  
  return job;
}

/**
 * Create multiple batch jobs at once
 */
export function createBatchJobs(requests: BatchJobRequest[]): BatchJob[] {
  const jobs = requests.map(createBatchJob);
  console.log(`[BatchQueue] Created ${jobs.length} batch jobs`);
  return jobs;
}

/**
 * Get job status
 */
export function getJobStatus(jobId: string): BatchJob | undefined {
  const job = jobQueue.get(jobId);
  if (!job) {
    // Check history
    return jobHistory.find(j => j.id === jobId);
  }
  return job;
}

/**
 * Get all jobs for a user
 */
export function getUserJobs(userId: string): BatchJob[] {
  const activeJobs = Array.from(jobQueue.values()).filter(j => j.userId === userId);
  const completedJobs = jobHistory.filter(j => j.userId === userId);
  return [...activeJobs, ...completedJobs];
}

/**
 * Cancel a job
 */
export function cancelJob(jobId: string): boolean {
  const job = jobQueue.get(jobId);
  if (job && job.status === "queued") {
    job.status = "cancelled";
    job.completedAt = new Date();
    jobQueue.delete(jobId);
    jobHistory.push(job);
    console.log(`[BatchQueue] Cancelled job ${jobId}`);
    return true;
  }
  return false;
}

/**
 * Update job progress
 */
export function updateJobProgress(jobId: string, progress: number, status?: BatchJob["status"]): void {
  const job = jobQueue.get(jobId);
  if (job) {
    job.progress = Math.min(100, Math.max(0, progress));
    if (status) {
      job.status = status;
      if (status === "processing" && !job.startedAt) {
        job.startedAt = new Date();
      }
      if ((status === "completed" || status === "failed") && !job.completedAt) {
        job.completedAt = new Date();
      }
    }
  }
}

/**
 * Complete a job with result
 */
export function completeJob(jobId: string, result?: any): void {
  const job = jobQueue.get(jobId);
  if (job) {
    job.status = "completed";
    job.progress = 100;
    job.result = result;
    job.completedAt = new Date();
    
    // Move to history
    jobQueue.delete(jobId);
    jobHistory.push(job);
    
    // Keep only last 1000 jobs in history
    if (jobHistory.length > 1000) {
      jobHistory.splice(0, jobHistory.length - 1000);
    }
    
    console.log(`[BatchQueue] Completed job ${jobId} in ${job.completedAt.getTime() - job.createdAt.getTime()}ms`);
    
    // Process next job
    processNextJob();
  }
}

/**
 * Fail a job with error
 */
export function failJob(jobId: string, error: string): void {
  const job = jobQueue.get(jobId);
  if (job) {
    job.status = "failed";
    job.error = error;
    job.completedAt = new Date();
    
    // Move to history
    jobQueue.delete(jobId);
    jobHistory.push(job);
    
    console.error(`[BatchQueue] Failed job ${jobId}: ${error}`);
    
    // Process next job
    processNextJob();
  }
}

/**
 * Get next job to process based on priority
 */
function getNextJob(): BatchJob | undefined {
  const queuedJobs = Array.from(jobQueue.values())
    .filter(j => j.status === "queued")
    .sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by creation time (FIFO)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  
  return queuedJobs[0];
}

/**
 * Check if any job is currently processing
 */
function hasProcessingJob(): boolean {
  return Array.from(jobQueue.values()).some(j => j.status === "processing");
}

/**
 * Process next job in queue
 */
async function processNextJob(): Promise<void> {
  // Only process one job at a time (can be enhanced for parallel processing)
  if (hasProcessingJob()) {
    return;
  }
  
  const nextJob = getNextJob();
  if (!nextJob) {
    return;
  }
  
  nextJob.status = "processing";
  nextJob.startedAt = new Date();
  
  console.log(`[BatchQueue] Processing job ${nextJob.id} (${nextJob.type})`);
  
  try {
    // Simulate job processing based on type
    // In real implementation, this would call actual service functions
    await simulateJobProcessing(nextJob);
    
    completeJob(nextJob.id, { success: true });
  } catch (error: any) {
    failJob(nextJob.id, error.message || "Unknown error");
  }
}

/**
 * Simulate job processing (replace with actual implementation)
 */
async function simulateJobProcessing(job: BatchJob): Promise<void> {
  return new Promise((resolve) => {
    const duration = job.priority === "urgent" ? 1000 : job.priority === "high" ? 2000 : 3000;
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      updateJobProgress(job.id, progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        resolve();
      }
    }, duration / 5);
  });
}

/**
 * Get queue statistics
 */
export function getQueueStats() {
  const jobs = Array.from(jobQueue.values());
  
  return {
    total: jobs.length,
    queued: jobs.filter(j => j.status === "queued").length,
    processing: jobs.filter(j => j.status === "processing").length,
    byPriority: {
      urgent: jobs.filter(j => j.priority === "urgent").length,
      high: jobs.filter(j => j.priority === "high").length,
      normal: jobs.filter(j => j.priority === "normal").length,
      low: jobs.filter(j => j.priority === "low").length,
    },
    byType: {
      content_generation: jobs.filter(j => j.type === "content_generation").length,
      video_processing: jobs.filter(j => j.type === "video_processing").length,
      image_generation: jobs.filter(j => j.type === "image_generation").length,
      voice_synthesis: jobs.filter(j => j.type === "voice_synthesis").length,
      avatar_creation: jobs.filter(j => j.type === "avatar_creation").length,
      podcast_generation: jobs.filter(j => j.type === "podcast_generation").length,
    },
    recentlyCompleted: jobHistory.slice(-10).reverse(),
  };
}

/**
 * Batch content generation helper
 */
export async function batchGenerateContent(
  userId: string,
  briefId: string,
  requests: Array<{
    format: string;
    topic?: string;
    params?: Record<string, any>;
  }>
): Promise<BatchJob[]> {
  const jobs = requests.map(request => 
    createBatchJob({
      type: "content_generation",
      priority: "normal",
      userId,
      briefId,
      params: {
        format: request.format,
        topic: request.topic,
        ...request.params,
      },
    })
  );
  
  console.log(`[BatchQueue] Created batch content generation: ${jobs.length} jobs for brief ${briefId}`);
  
  return jobs;
}

/**
 * Cleanup old completed jobs from history
 */
export function cleanupHistory(olderThanHours: number = 24): number {
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  const originalLength = jobHistory.length;
  
  const filtered = jobHistory.filter(j => 
    j.completedAt && j.completedAt > cutoff
  );
  
  jobHistory.splice(0, jobHistory.length, ...filtered);
  
  const removed = originalLength - jobHistory.length;
  if (removed > 0) {
    console.log(`[BatchQueue] Cleaned up ${removed} old jobs from history`);
  }
  
  return removed;
}

// Cleanup history every hour
setInterval(() => cleanupHistory(24), 60 * 60 * 1000);
