// Standalone AI Tools Service
// Face Swap, Background Removal, Lip Sync, Image Upscaling, etc.

export class AIToolsService {
  private replicateKey: string | undefined;
  private removeBgKey: string | undefined;

  constructor() {
    this.replicateKey = process.env.REPLICATE_API_KEY;
    this.removeBgKey = process.env.REMOVE_BG_API_KEY;
  }

  // Face Swap using InsightFace via Replicate
  async faceSwap(sourceImageUrl: string, targetImageUrl: string): Promise<string> {
    if (!this.replicateKey) {
      throw new Error("Replicate API key not configured for face swap.");
    }

    try {
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${this.replicateKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34", // InsightFace
          input: {
            target_image: targetImageUrl,
            swap_image: sourceImageUrl,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Face swap error: ${error}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error: any) {
      console.error("Face swap error:", error);
      throw error;
    }
  }

  // Background Removal using Remove.bg
  async removeBackground(imageUrl: string): Promise<string> {
    if (!this.removeBgKey) {
      throw new Error("Remove.bg API key not configured.");
    }

    try {
      const formData = new FormData();
      formData.append("image_url", imageUrl);
      formData.append("size", "auto");

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": this.removeBgKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Background removal error: ${error}`);
      }

      // Return the processed image as base64 or URL
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return `data:image/png;base64,${buffer.toString("base64")}`;
    } catch (error: any) {
      console.error("Background removal error:", error);
      throw error;
    }
  }

  // Lip Sync using Wav2Lip via Replicate
  async lipSync(videoUrl: string, audioUrl: string): Promise<string> {
    if (!this.replicateKey) {
      throw new Error("Replicate API key not configured for lip sync.");
    }

    try {
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${this.replicateKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "8d65e3f4f4298520e079198b493c25adfc43c058ffec924f2aefc8010ed25eef", // Wav2Lip
          input: {
            face: videoUrl,
            audio: audioUrl,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Lip sync error: ${error}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error: any) {
      console.error("Lip sync error:", error);
      throw error;
    }
  }

  // Image Upscaling using Real-ESRGAN via Replicate
  async upscaleImage(imageUrl: string, scale: number = 4): Promise<string> {
    if (!this.replicateKey) {
      throw new Error("Replicate API key not configured for upscaling.");
    }

    try {
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${this.replicateKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b", // Real-ESRGAN
          input: {
            image: imageUrl,
            scale,
            face_enhance: true,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Image upscaling error: ${error}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error: any) {
      console.error("Image upscaling error:", error);
      throw error;
    }
  }

  // Get status of Replicate prediction
  async getReplicateStatus(predictionId: string): Promise<{
    status: "starting" | "processing" | "succeeded" | "failed";
    output?: any;
    error?: string;
  }> {
    if (!this.replicateKey) {
      throw new Error("Replicate API key not configured.");
    }

    try {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        method: "GET",
        headers: {
          "Authorization": `Token ${this.replicateKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Replicate status error: ${error}`);
      }

      const data = await response.json();
      return {
        status: data.status,
        output: data.output,
        error: data.error,
      };
    } catch (error: any) {
      console.error("Replicate status error:", error);
      throw error;
    }
  }

  // Style Transfer
  async styleTransfer(contentImageUrl: string, styleImageUrl: string): Promise<string> {
    if (!this.replicateKey) {
      throw new Error("Replicate API key not configured for style transfer.");
    }

    try {
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${this.replicateKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "99a3c3715bcd2d96e4ae1765b660ac52fccd8d18eeb9fc45fb5c69a4f3b9f22e", // Style Transfer
          input: {
            content_image: contentImageUrl,
            style_image: styleImageUrl,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Style transfer error: ${error}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error: any) {
      console.error("Style transfer error:", error);
      throw error;
    }
  }

  // Image Inpainting using Stable Diffusion
  async inpaint(imageUrl: string, maskUrl: string, prompt: string): Promise<string> {
    if (!this.replicateKey) {
      throw new Error("Replicate API key not configured for inpainting.");
    }

    try {
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${this.replicateKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3", // SDXL Inpaint
          input: {
            image: imageUrl,
            mask: maskUrl,
            prompt,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Inpainting error: ${error}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error: any) {
      console.error("Inpainting error:", error);
      throw error;
    }
  }

  // Image Outpainting
  async outpaint(imageUrl: string, prompt: string, direction: "up" | "down" | "left" | "right"): Promise<string> {
    if (!this.replicateKey) {
      throw new Error("Replicate API key not configured for outpainting.");
    }

    try {
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${this.replicateKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3", // SDXL
          input: {
            image: imageUrl,
            prompt,
            direction,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Outpainting error: ${error}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error: any) {
      console.error("Outpainting error:", error);
      throw error;
    }
  }
}

export const aiToolsService = new AIToolsService();
