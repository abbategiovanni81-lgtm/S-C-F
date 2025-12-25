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

export interface GenerativeVideoRequest {
  prompt: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  duration: number; // in seconds (max 30 for generative)
  style?: "realistic" | "artistic" | "cinematic" | "anime";
}

export interface ImageGenerationRequest {
  prompt: string;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
  style?: "photorealistic" | "illustration" | "3d" | "anime" | "digital_art";
  count?: number; // 1-4 images
}

export interface ImageGenerationResult {
  images: { url: string; id: string }[];
  requestId: string;
  status: "completed" | "failed";
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

  async generateGenerativeVideo(request: GenerativeVideoRequest): Promise<VideoGenerationResult> {
    if (!this.apiKey) {
      throw new Error("Steve AI API key not configured. Please add STEVE_AI_API_KEY to your secrets.");
    }

    const payload = {
      prompt: request.prompt,
      aspect_ratio: request.aspectRatio,
      duration_seconds: Math.min(request.duration, 30), // Max 30 seconds for generative
      style: request.style || "cinematic",
      type: "generative",
    };

    const response = await fetch(`${this.baseUrl}/generative/create`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Steve AI Generative API error: ${error}`);
    }

    const data = await response.json();
    return {
      requestId: data.request_id || data.id,
      videoUrl: "",
      status: "queued",
      estimatedTimeSeconds: data.estimated_time_seconds || 120,
    };
  }

  async checkGenerativeStatus(requestId: string): Promise<VideoGenerationResult> {
    if (!this.apiKey) {
      throw new Error("Steve AI API key not configured.");
    }

    const response = await fetch(`${this.baseUrl}/generative/${requestId}/status`, {
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Steve AI generative status check error: ${error}`);
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

  async generateImages(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!this.apiKey) {
      throw new Error("Steve AI API key not configured. Please add STEVE_AI_API_KEY to your secrets.");
    }

    const payload = {
      prompt: request.prompt,
      aspect_ratio: request.aspectRatio,
      style: request.style || "photorealistic",
      count: Math.min(request.count || 1, 4),
    };

    const response = await fetch(`${this.baseUrl}/images/generate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Steve AI Image API error: ${error}`);
    }

    const data = await response.json();
    const status = data.status?.toLowerCase();
    return {
      requestId: data.request_id || data.id,
      images: data.images || [],
      status: (status === "completed" || status === "done") ? "completed" : 
              (status === "failed" || status === "error") ? "failed" : "completed",
      error: data.error,
    };
  }

  async checkImageStatus(requestId: string): Promise<ImageGenerationResult> {
    if (!this.apiKey) {
      throw new Error("Steve AI API key not configured.");
    }

    const response = await fetch(`${this.baseUrl}/images/${requestId}/status`, {
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Steve AI image status check error: ${error}`);
    }

    const data = await response.json();
    const status = this.mapStatus(data.status);
    return {
      requestId,
      images: data.images || [],
      status: status === "completed" ? "completed" : status === "failed" ? "failed" : "completed",
      error: data.error,
    };
  }

  getGenerativeStyles(): { id: string; name: string; description: string }[] {
    return [
      { id: "realistic", name: "Realistic", description: "Photorealistic AI-generated footage" },
      { id: "artistic", name: "Artistic", description: "Creative and stylized visuals" },
      { id: "cinematic", name: "Cinematic", description: "Movie-quality cinematography" },
      { id: "anime", name: "Anime", description: "Japanese animation style" },
    ];
  }

  getImageStyles(): { id: string; name: string; description: string }[] {
    return [
      { id: "photorealistic", name: "Photorealistic", description: "Ultra-realistic photography" },
      { id: "illustration", name: "Illustration", description: "Hand-drawn artistic style" },
      { id: "3d", name: "3D Render", description: "3D computer graphics" },
      { id: "anime", name: "Anime", description: "Japanese animation style" },
      { id: "digital_art", name: "Digital Art", description: "Modern digital artwork" },
    ];
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
