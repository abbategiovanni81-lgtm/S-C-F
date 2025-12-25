export interface SteveAIConfig {
  apiKey: string;
}

export interface VideoGenerationRequest {
  script: string;
  style: "animation" | "live_action" | "generative" | "talking_head" | "documentary";
  aspectRatio: "16:9" | "9:16" | "1:1";
  duration: number;
  voiceId?: string;
  language?: string;
  brandKit?: {
    logo?: string;
    colors?: string[];
    fonts?: string[];
  };
}

export interface VideoGenerationResult {
  videoUrl: string;
  thumbnailUrl?: string;
  status: "queued" | "processing" | "completed" | "failed";
  requestId: string;
  estimatedTimeSeconds?: number;
  progress?: number;
  error?: string;
}

export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: "male" | "female";
  preview_url?: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  style: string;
}

export class SteveAIService {
  private apiKey: string | undefined;
  private baseUrl = "https://api.steve.ai/v1";

  constructor() {
    this.apiKey = process.env.STEVE_AI_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    if (!this.apiKey) {
      throw new Error("Steve AI API key not configured. Please add STEVE_AI_API_KEY to your secrets. Contact team@steve.ai for Enterprise API access.");
    }

    const payload = {
      script: request.script,
      style: request.style,
      aspect_ratio: request.aspectRatio,
      duration_seconds: request.duration,
      voice_id: request.voiceId,
      language: request.language || "en-US",
      brand_kit: request.brandKit,
    };

    const response = await fetch(`${this.baseUrl}/videos/generate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Steve AI API error: ${error}`);
    }

    const data = await response.json();
    return {
      requestId: data.request_id || data.id,
      videoUrl: "",
      status: "queued",
      estimatedTimeSeconds: data.estimated_time_seconds || this.estimateProcessingTime(request.duration),
    };
  }

  async checkStatus(requestId: string): Promise<VideoGenerationResult> {
    if (!this.apiKey) {
      throw new Error("Steve AI API key not configured.");
    }

    const response = await fetch(`${this.baseUrl}/videos/${requestId}/status`, {
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Steve AI status check error: ${error}`);
    }

    const data = await response.json();

    return {
      requestId,
      videoUrl: data.video_url || "",
      thumbnailUrl: data.thumbnail_url,
      status: this.mapStatus(data.status),
      progress: data.progress,
      estimatedTimeSeconds: data.estimated_time_remaining,
      error: data.error,
    };
  }

  async getResult(requestId: string): Promise<VideoGenerationResult> {
    if (!this.apiKey) {
      throw new Error("Steve AI API key not configured.");
    }

    const response = await fetch(`${this.baseUrl}/videos/${requestId}`, {
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Steve AI get result error: ${error}`);
    }

    const data = await response.json();
    return {
      requestId,
      videoUrl: data.video_url,
      thumbnailUrl: data.thumbnail_url,
      status: "completed",
    };
  }

  async getVoices(): Promise<Voice[]> {
    if (!this.apiKey) {
      throw new Error("Steve AI API key not configured.");
    }

    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      return this.getDefaultVoices();
    }

    const data = await response.json();
    return data.voices || this.getDefaultVoices();
  }

  async getTemplates(style?: string): Promise<Template[]> {
    if (!this.apiKey) {
      throw new Error("Steve AI API key not configured.");
    }

    const url = style 
      ? `${this.baseUrl}/templates?style=${style}`
      : `${this.baseUrl}/templates`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.templates || [];
  }

  private mapStatus(status: string): "queued" | "processing" | "completed" | "failed" {
    const statusMap: Record<string, "queued" | "processing" | "completed" | "failed"> = {
      "queued": "queued",
      "pending": "queued",
      "processing": "processing",
      "rendering": "processing",
      "completed": "completed",
      "done": "completed",
      "failed": "failed",
      "error": "failed",
    };
    return statusMap[status.toLowerCase()] || "processing";
  }

  private estimateProcessingTime(durationSeconds: number): number {
    return Math.max(60, durationSeconds * 3);
  }

  private getDefaultVoices(): Voice[] {
    return [
      { id: "emma", name: "Emma", language: "en-US", gender: "female" },
      { id: "james", name: "James", language: "en-US", gender: "male" },
      { id: "sophia", name: "Sophia", language: "en-GB", gender: "female" },
      { id: "oliver", name: "Oliver", language: "en-GB", gender: "male" },
      { id: "charlotte", name: "Charlotte", language: "en-AU", gender: "female" },
      { id: "william", name: "William", language: "en-AU", gender: "male" },
    ];
  }

  getVideoStyles(): { id: string; name: string; description: string }[] {
    return [
      { 
        id: "animation", 
        name: "Animation", 
        description: "Animated explainer videos with characters and scenes" 
      },
      { 
        id: "live_action", 
        name: "Live Action", 
        description: "Stock footage compiled into professional videos" 
      },
      { 
        id: "generative", 
        name: "Generative AI", 
        description: "AI-generated visuals from your script" 
      },
      { 
        id: "talking_head", 
        name: "Talking Head", 
        description: "AI avatar presenter delivering your message" 
      },
      { 
        id: "documentary", 
        name: "Documentary", 
        description: "B-roll footage with voiceover narration" 
      },
    ];
  }
}

export const steveAIService = new SteveAIService();
