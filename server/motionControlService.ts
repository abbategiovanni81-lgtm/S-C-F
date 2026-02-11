export interface MotionControlModel {
  id: string;
  name: string;
  description: string;
  supportedFormats: string[];
  maxDuration?: number; // in seconds
}

export const MOTION_CONTROL_MODELS: MotionControlModel[] = [
  {
    id: "dreamactor",
    name: "DreamActor v2",
    description: "High-quality character animation with precise motion transfer. Best for realistic human movements.",
    supportedFormats: ["mp4", "mov"],
    maxDuration: 30,
  },
  {
    id: "kling-motion-control",
    name: "Kling Motion Control",
    description: "Advanced motion control for dynamic character animations. Supports complex motion patterns.",
    supportedFormats: ["mp4", "mov"],
    maxDuration: 60,
  },
];

export interface MotionControlRequest {
  characterImageUrl: string;
  motionVideoUrl: string;
  model: string;
}

export interface MotionControlResult {
  requestId: string;
  status: "queued" | "processing" | "completed" | "failed";
  videoUrl?: string;
  errorMessage?: string;
}

export class MotionControlService {
  private apiKey: string | undefined;
  private baseUrl = "https://queue.fal.run";

  constructor() {
    this.apiKey = process.env.FAL_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getModels(): MotionControlModel[] {
    return MOTION_CONTROL_MODELS;
  }

  private getModelEndpoint(model: string): string {
    switch (model) {
      case "dreamactor":
        return "fal-ai/bytedance/dreamactor/v2";
      case "kling-motion-control":
        return "fal-ai/kling-video/v2.6/pro/motion-control";
      default:
        throw new Error(`Unknown model: ${model}`);
    }
  }

  async submitMotionControl(request: MotionControlRequest): Promise<{ requestId: string }> {
    if (!this.apiKey) {
      throw new Error("Fal.ai API key not configured. Please add FAL_API_KEY to your environment.");
    }

    const endpoint = this.getModelEndpoint(request.model);
    
    const payload = {
      character_image_url: request.characterImageUrl,
      motion_video_url: request.motionVideoUrl,
    };

    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Fal.ai motion control API error: ${error}`);
    }

    const data = await response.json();
    return { requestId: data.request_id };
  }

  async checkStatus(requestId: string, model: string): Promise<MotionControlResult> {
    if (!this.apiKey) {
      throw new Error("Fal.ai API key not configured.");
    }

    // Get the base model path for status check
    const modelPath = model === "dreamactor" ? "bytedance/dreamactor" : "kling-video";
    
    const response = await fetch(`${this.baseUrl}/fal-ai/${modelPath}/requests/${requestId}/status`, {
      headers: {
        "Authorization": `Key ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fal.ai status check error:", response.status, errorText);
      throw new Error(`Failed to check motion control status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === "COMPLETED") {
      // Fetch the actual result
      const resultResponse = await fetch(`${this.baseUrl}/fal-ai/${modelPath}/requests/${requestId}`, {
        headers: {
          "Authorization": `Key ${this.apiKey}`,
        },
      });
      
      if (!resultResponse.ok) {
        throw new Error("Failed to fetch completed result");
      }
      
      const resultData = await resultResponse.json();
      return {
        requestId,
        status: "completed",
        videoUrl: resultData.video?.url || resultData.output?.url || "",
      };
    } else if (data.status === "FAILED") {
      return {
        requestId,
        status: "failed",
        errorMessage: data.error || "Unknown error occurred",
      };
    } else if (data.status === "IN_PROGRESS" || data.status === "IN_QUEUE") {
      return {
        requestId,
        status: "processing",
      };
    }
    
    return {
      requestId,
      status: "queued",
    };
  }
}

export const motionControlService = new MotionControlService();
