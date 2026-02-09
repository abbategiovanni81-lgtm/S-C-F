// A2E Nano Banana Pro Image Processing Service
// This service handles image transformations using A2E's Nano Banana Pro API

const A2E_NANO_API_KEY = process.env.A2E_API_KEY;
const A2E_NANO_BASE_URL = "https://api.a2e.ai/nano-banana-pro"; // Placeholder URL - update with actual endpoint

interface NanoBananaProRequest {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  strength?: number; // 0.0 to 1.0
}

interface NanoBananaProResponse {
  requestId: string;
  status: "queued" | "processing" | "completed" | "failed";
  resultUrl?: string;
  errorMessage?: string;
}

class A2EImageService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = A2E_NANO_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private getHeaders() {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Submit an image for AI transformation
   */
  async processImage(request: NanoBananaProRequest): Promise<NanoBananaProResponse> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_NANO_BASE_URL}/process`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          image_url: request.imageUrl,
          prompt: request.prompt,
          negative_prompt: request.negativePrompt,
          strength: request.strength || 0.8,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`A2E Nano Banana Pro API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return {
        requestId: data.request_id || data.id,
        status: data.status,
        resultUrl: data.result_url || data.output,
        errorMessage: data.error_message,
      };
    } catch (error: any) {
      throw new Error(`Failed to process image with A2E: ${error.message}`);
    }
  }

  /**
   * Check the status of an image processing job
   */
  async getStatus(requestId: string): Promise<NanoBananaProResponse> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_NANO_BASE_URL}/status/${requestId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`A2E Nano Banana Pro API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return {
        requestId: data.request_id || data.id,
        status: data.status,
        resultUrl: data.result_url || data.output,
        errorMessage: data.error_message,
      };
    } catch (error: any) {
      throw new Error(`Failed to get status from A2E: ${error.message}`);
    }
  }
}

export const a2eImageService = new A2EImageService();
