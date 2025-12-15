export interface FalConfig {
  apiKey: string;
}

export interface FileUploadResult {
  url: string;
  contentType: string;
  fileName: string;
}

export interface LipSyncRequest {
  videoUrl: string;
  audioUrl: string;
}

export interface LipSyncResult {
  videoUrl: string;
  status: "completed" | "processing" | "failed";
  processingTime?: number;
}

export interface VideoGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  duration?: number;
}

export interface VideoGenerationResult {
  videoUrl: string;
  status: "completed" | "processing" | "failed";
  requestId?: string;
}

export class FalService {
  private apiKey: string | undefined;
  private baseUrl = "https://queue.fal.run";

  constructor() {
    this.apiKey = process.env.FAL_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, contentType: string): Promise<FileUploadResult> {
    if (!this.apiKey) {
      throw new Error("Fal.ai API key not configured. Please add FAL_API_KEY to your secrets.");
    }

    // Fal.ai uses a CDN upload endpoint for files
    const response = await fetch("https://fal.run/fal-ai/storage/upload", {
      method: "POST",
      headers: {
        "Authorization": `Key ${this.apiKey}`,
        "Content-Type": contentType,
        "X-Fal-File-Name": fileName,
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Fal.ai file upload error: ${error}`);
    }

    const data = await response.json();
    return {
      url: data.url,
      contentType,
      fileName,
    };
  }

  async submitLipSync(request: LipSyncRequest): Promise<{ requestId: string }> {
    if (!this.apiKey) {
      throw new Error("Fal.ai API key not configured. Please add FAL_API_KEY to your secrets.");
    }

    const response = await fetch(`${this.baseUrl}/fal-ai/sync-lipsync`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_url: request.videoUrl,
        audio_url: request.audioUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Fal.ai API error: ${error}`);
    }

    const data = await response.json();
    return { requestId: data.request_id };
  }

  async checkStatus(requestId: string): Promise<LipSyncResult> {
    if (!this.apiKey) {
      throw new Error("Fal.ai API key not configured.");
    }

    const response = await fetch(`${this.baseUrl}/fal-ai/sync-lipsync/requests/${requestId}/status`, {
      headers: {
        "Authorization": `Key ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to check Fal.ai job status");
    }

    const data = await response.json();
    
    if (data.status === "COMPLETED") {
      return {
        videoUrl: data.response?.video_url || "",
        status: "completed",
        processingTime: data.processing_time,
      };
    } else if (data.status === "FAILED") {
      return {
        videoUrl: "",
        status: "failed",
      };
    }
    
    return {
      videoUrl: "",
      status: "processing",
    };
  }

  async getResult(requestId: string): Promise<LipSyncResult> {
    if (!this.apiKey) {
      throw new Error("Fal.ai API key not configured.");
    }

    const response = await fetch(`${this.baseUrl}/fal-ai/sync-lipsync/requests/${requestId}`, {
      headers: {
        "Authorization": `Key ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get Fal.ai result");
    }

    const data = await response.json();
    return {
      videoUrl: data.video_url || "",
      status: "completed",
    };
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    if (!this.apiKey) {
      throw new Error("Fal.ai API key not configured. Please add FAL_API_KEY to your secrets.");
    }

    // Use Kling video model for text-to-video generation
    const payload: any = {
      prompt: request.prompt,
      aspect_ratio: request.aspectRatio || "16:9",
      duration: request.duration || 5,
    };
    if (request.negativePrompt) {
      payload.negative_prompt = request.negativePrompt;
    }
    
    const response = await fetch(`${this.baseUrl}/fal-ai/kling-video/v1.5/pro/text-to-video`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Fal.ai video generation error: ${error}`);
    }

    const data = await response.json();
    return { 
      requestId: data.request_id,
      videoUrl: "",
      status: "processing"
    };
  }

  async checkVideoStatus(requestId: string): Promise<VideoGenerationResult> {
    if (!this.apiKey) {
      throw new Error("Fal.ai API key not configured.");
    }

    const response = await fetch(`${this.baseUrl}/fal-ai/kling-video/v1.5/pro/text-to-video/requests/${requestId}/status`, {
      headers: {
        "Authorization": `Key ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to check video generation status");
    }

    const data = await response.json();
    
    if (data.status === "COMPLETED") {
      // Fetch the actual result
      const resultResponse = await fetch(`${this.baseUrl}/fal-ai/kling-video/v1.5/pro/text-to-video/requests/${requestId}`, {
        headers: {
          "Authorization": `Key ${this.apiKey}`,
        },
      });
      const resultData = await resultResponse.json();
      return {
        videoUrl: resultData.video?.url || "",
        status: "completed",
        requestId,
      };
    } else if (data.status === "FAILED") {
      return {
        videoUrl: "",
        status: "failed",
        requestId,
      };
    }
    
    return {
      videoUrl: "",
      status: "processing",
      requestId,
    };
  }
}

export const falService = new FalService();
