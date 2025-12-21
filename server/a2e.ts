const A2E_API_KEY = process.env.A2E_API_KEY;
const A2E_BASE_URL = "https://video.a2e.ai";

interface A2EAvatar {
  id: string;
  name: string;
  thumbnail?: string;
  gender?: string;
}

interface LipSyncResponse {
  lipsync_item_id: string;
  status: string;
}

interface LipSyncStatus {
  id: string;
  status: "pending" | "processing" | "done" | "error";
  output?: string;
  error_message?: string;
}

class A2EService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = A2E_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private getHeaders() {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "x-lang": "en-US",
    };
  }

  async listAvatars(): Promise<A2EAvatar[]> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/creators/`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E API error: ${error}`);
      }

      const data = await response.json();
      return data.creators || data.results || [];
    } catch (error: any) {
      console.error("A2E list avatars error:", error);
      throw error;
    }
  }

  async generateLipSync(params: {
    text: string;
    creatorId: string;
    aspectRatio?: string;
    voiceId?: string;
  }): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const requestBody: any = {
        text: params.text,
        creator_id: params.creatorId,
        aspect_ratio: params.aspectRatio || "9:16",
      };

      if (params.voiceId) {
        requestBody.voice_id = params.voiceId;
      }

      const response = await fetch(`${A2E_BASE_URL}/api/lipsyncs/`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E lip-sync error: ${error}`);
      }

      const data = await response.json();
      return data.lipsync_item_id || data.id;
    } catch (error: any) {
      console.error("A2E generate lip-sync error:", error);
      throw error;
    }
  }

  async checkLipSyncStatus(lipSyncId: string): Promise<LipSyncStatus> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/lipsyncs/${lipSyncId}/`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E status check error: ${error}`);
      }

      const data = await response.json();
      return {
        id: lipSyncId,
        status: data.status,
        output: data.output || data.video_url,
        error_message: data.error_message,
      };
    } catch (error: any) {
      console.error("A2E check status error:", error);
      throw error;
    }
  }

  async generateImageToVideo(params: {
    imageUrl: string;
    text?: string;
  }): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/userImage2Video/start`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          image_url: params.imageUrl,
          text: params.text || "",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E image-to-video error: ${error}`);
      }

      const data = await response.json();
      return data.task_id || data.id;
    } catch (error: any) {
      console.error("A2E image-to-video error:", error);
      throw error;
    }
  }

  async checkImageToVideoStatus(taskId: string): Promise<LipSyncStatus> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/userImage2Video/${taskId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E status check error: ${error}`);
      }

      const data = await response.json();
      return {
        id: taskId,
        status: data.status,
        output: data.output || data.video_url,
        error_message: data.error_message,
      };
    } catch (error: any) {
      console.error("A2E check image-to-video status error:", error);
      throw error;
    }
  }

  async pollForCompletion(lipSyncId: string, maxAttempts = 60, intervalMs = 5000): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.checkLipSyncStatus(lipSyncId);
      
      if (status.status === "done" && status.output) {
        return status.output;
      }
      
      if (status.status === "error") {
        throw new Error(status.error_message || "A2E video generation failed");
      }
      
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error("A2E video generation timed out");
  }

  // Text-to-Image generation
  async generateImage(params: {
    prompt: string;
    width?: number;
    height?: number;
    style?: "general" | "manga";
  }): Promise<{ imageUrl: string; taskId: string }> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      // Map style to req_key
      const reqKey = params.style === "manga" ? "high_aes" : "high_aes_general_v21_L";
      
      const response = await fetch(`${A2E_BASE_URL}/api/v1/userText2image/start`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: `image_${Date.now()}`,
          prompt: params.prompt,
          req_key: reqKey,
          width: params.width || 1024,
          height: params.height || 1024,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E text-to-image error: ${error}`);
      }

      const data = await response.json();
      
      // A2E returns completed image immediately
      if (data.code === 0 && data.data?.image_urls?.[0]) {
        return {
          imageUrl: data.data.image_urls[0],
          taskId: data.data._id,
        };
      }
      
      throw new Error("A2E text-to-image failed: No image returned");
    } catch (error: any) {
      console.error("A2E text-to-image error:", error);
      throw error;
    }
  }
}

export const a2eService = new A2EService();
