import OpenAI from "openai";

const soraClient = new OpenAI({
  apiKey: process.env.OPENAI_DALLE_API_KEY || process.env.OPENAI_API_KEY,
});

export interface SoraVideoRequest {
  prompt: string;
  duration?: 4 | 8 | 12;
  size?: "1280x720" | "720x1280" | "1024x1024";
  model?: "sora-2" | "sora-2-pro";
}

export interface SoraVideoResult {
  videoId: string;
  status: "queued" | "generating" | "completed" | "failed";
  videoUrl?: string;
}

export interface SoraImageToVideoRequest {
  prompt: string;
  imageUrl: string;
  duration?: 4 | 8 | 12;
  size?: "1280x720" | "720x1280";
}

export function isSoraConfigured(): boolean {
  return !!(process.env.OPENAI_DALLE_API_KEY || process.env.OPENAI_API_KEY);
}

export async function createSoraVideo(request: SoraVideoRequest): Promise<SoraVideoResult> {
  if (!isSoraConfigured()) {
    throw new Error("OpenAI API key not configured for Sora video generation.");
  }

  const response = await (soraClient as any).videos.create({
    model: request.model || "sora-2",
    prompt: request.prompt,
    duration: request.duration || 4,
    size: request.size || "1280x720",
  });

  return {
    videoId: response.id,
    status: response.status,
    videoUrl: response.url,
  };
}

export async function getSoraVideoStatus(videoId: string): Promise<SoraVideoResult> {
  if (!isSoraConfigured()) {
    throw new Error("OpenAI API key not configured.");
  }

  const response = await (soraClient as any).videos.retrieve(videoId);

  return {
    videoId: response.id,
    status: response.status,
    videoUrl: response.url,
  };
}

export async function createSoraImageToVideo(request: SoraImageToVideoRequest): Promise<SoraVideoResult> {
  if (!isSoraConfigured()) {
    throw new Error("OpenAI API key not configured for Sora video generation.");
  }

  const response = await (soraClient as any).videos.create({
    model: "sora-2-i2v",
    prompt: request.prompt,
    image_url: request.imageUrl,
    duration: request.duration || 4,
    size: request.size || "1280x720",
  });

  return {
    videoId: response.id,
    status: response.status,
    videoUrl: response.url,
  };
}

export async function remixSoraVideo(videoId: string, prompt: string): Promise<SoraVideoResult> {
  if (!isSoraConfigured()) {
    throw new Error("OpenAI API key not configured.");
  }

  const response = await (soraClient as any).videos.remix({
    video_id: videoId,
    prompt: prompt,
  });

  return {
    videoId: response.id,
    status: response.status,
    videoUrl: response.url,
  };
}
