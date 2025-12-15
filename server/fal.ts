export interface FalConfig {
  apiKey: string;
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

export class FalService {
  private apiKey: string | undefined;
  private baseUrl = "https://queue.fal.run";

  constructor() {
    this.apiKey = process.env.FAL_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
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
}

export const falService = new FalService();
