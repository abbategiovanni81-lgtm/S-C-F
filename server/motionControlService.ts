export interface MotionControlModel {
  id: string;
  name: string;
  description: string;
  supportedFormats: string[];
  maxDuration?: number; // in seconds
  endpoint: string; // Full endpoint path
  statusPath: string; // Path for status checking
}

export const MOTION_CONTROL_MODELS: MotionControlModel[] = [
  {
    id: "dreamactor",
    name: "DreamActor v2",
    description: "High-quality character animation with precise motion transfer. Best for realistic human movements.",
    supportedFormats: ["mp4", "mov"],
    maxDuration: 30,
    endpoint: "fal-ai/bytedance/dreamactor/v2",
    statusPath: "bytedance/dreamactor",
  },
  {
    id: "kling-motion-control",
    name: "Kling Motion Control",
    description: "Advanced motion control for dynamic character animations. Supports complex motion patterns.",
    supportedFormats: ["mp4", "mov"],
    maxDuration: 60,
    endpoint: "fal-ai/kling-video/v2.6/pro/motion-control",
    statusPath: "kling-video",
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

  private getModelConfig(modelId: string): MotionControlModel {
    const model = MOTION_CONTROL_MODELS.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Unknown model: ${modelId}`);
    }
    return model;
  }

  async submitMotionControl(request: MotionControlRequest): Promise<{ requestId: string }> {
    if (!this.apiKey) {
      throw new Error("Fal.ai API key not configured. Please add FAL_API_KEY to your environment.");
    }

    const modelConfig = this.getModelConfig(request.model);
    
    const payload = {
      character_image_url: request.characterImageUrl,
      motion_video_url: request.motionVideoUrl,
    };

    const response = await fetch(`${this.baseUrl}/${modelConfig.endpoint}`, {
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

    const modelConfig = this.getModelConfig(model);
    
    const response = await fetch(`${this.baseUrl}/fal-ai/${modelConfig.statusPath}/requests/${requestId}/status`, {
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
      const resultResponse = await fetch(`${this.baseUrl}/fal-ai/${modelConfig.statusPath}/requests/${requestId}`, {
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
