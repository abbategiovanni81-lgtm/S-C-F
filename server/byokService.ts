// BYOK Service Integrations
// Supports multiple LLM, image, and video API providers

import OpenAI from "openai";

export interface BYOKProvider {
  id: string;
  name: string;
  category: "llm" | "image" | "video" | "voice" | "avatar";
  baseUrl?: string;
  isOpenAICompatible?: boolean;
}

export const BYOK_PROVIDERS: BYOKProvider[] = [
  // LLMs
  { id: "grok", name: "Grok (xAI)", category: "llm", baseUrl: "https://api.x.ai/v1", isOpenAICompatible: true },
  { id: "claude", name: "Claude (Anthropic)", category: "llm" },
  { id: "gemini", name: "Gemini (Google)", category: "llm" },
  { id: "openrouter", name: "OpenRouter", category: "llm", baseUrl: "https://openrouter.ai/api/v1", isOpenAICompatible: true },
  { id: "together", name: "Together AI", category: "llm", baseUrl: "https://api.together.xyz/v1", isOpenAICompatible: true },
  { id: "groq", name: "Groq", category: "llm", baseUrl: "https://api.groq.com/openai/v1", isOpenAICompatible: true },
  { id: "deepseek", name: "DeepSeek", category: "llm", baseUrl: "https://api.deepseek.com/v1", isOpenAICompatible: true },
  { id: "perplexity", name: "Perplexity", category: "llm" },
  
  // Image Generation
  { id: "stability", name: "Stability AI", category: "image" },
  { id: "replicate", name: "Replicate", category: "image" },
  { id: "ideogram", name: "Ideogram", category: "image" },
  { id: "leonardo", name: "Leonardo AI", category: "image" },
  
  // Avatar/Talking Head
  { id: "heygen", name: "HeyGen", category: "avatar" },
  { id: "d-id", name: "D-ID", category: "avatar" },
  { id: "creatify", name: "Creatify", category: "avatar" },
  
  // Voice
  { id: "playht", name: "Play.ht", category: "voice" },
];

// Grok (xAI) Service - OpenAI-compatible
export class GrokService {
  private client: OpenAI | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (key) {
      this.client = new OpenAI({
        apiKey: key,
        baseURL: "https://api.x.ai/v1",
      });
    }
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  async chat(messages: any[], model: string = "grok-beta") {
    if (!this.client) {
      throw new Error("Grok API key not configured.");
    }

    const response = await this.client.chat.completions.create({
      model,
      messages,
    });

    return response.choices[0]?.message?.content;
  }
}

// Claude Service
export class ClaudeService {
  private apiKey: string | undefined;
  private baseUrl = "https://api.anthropic.com/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async chat(messages: any[], model: string = "claude-3-5-sonnet-20241022") {
    if (!this.apiKey) {
      throw new Error("Claude API key not configured.");
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text;
  }
}

// Gemini Service
export class GeminiService {
  private apiKey: string | undefined;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async chat(messages: any[], model: string = "gemini-2.0-flash-exp") {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured.");
    }

    // Convert OpenAI format to Gemini format
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(`${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  }
}

// Stability AI Service
export class StabilityService {
  private apiKey: string | undefined;
  private baseUrl = "https://api.stability.ai/v2beta";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.STABILITY_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generateImage(prompt: string, model: string = "stable-diffusion-xl-1024-v1-0") {
    if (!this.apiKey) {
      throw new Error("Stability AI API key not configured.");
    }

    const response = await fetch(`${this.baseUrl}/stable-image/generate/core`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        prompt,
        output_format: "png",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stability AI error: ${error}`);
    }

    const data = await response.json();
    return data.image;
  }
}

// Replicate Service
export class ReplicateService {
  private apiKey: string | undefined;
  private baseUrl = "https://api.replicate.com/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.REPLICATE_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async runModel(model: string, input: any) {
    if (!this.apiKey) {
      throw new Error("Replicate API key not configured.");
    }

    const response = await fetch(`${this.baseUrl}/predictions`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: model,
        input,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Replicate error: ${error}`);
    }

    const data = await response.json();
    return data;
  }

  async getStatus(predictionId: string) {
    if (!this.apiKey) {
      throw new Error("Replicate API key not configured.");
    }

    const response = await fetch(`${this.baseUrl}/predictions/${predictionId}`, {
      method: "GET",
      headers: {
        "Authorization": `Token ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Replicate status error: ${error}`);
    }

    return await response.json();
  }
}

// HeyGen Service
export class HeyGenService {
  private apiKey: string | undefined;
  private baseUrl = "https://api.heygen.com/v2";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.HEYGEN_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generateVideo(params: {
    avatarId: string;
    text: string;
    voiceId?: string;
  }) {
    if (!this.apiKey) {
      throw new Error("HeyGen API key not configured.");
    }

    const response = await fetch(`${this.baseUrl}/video/generate`, {
      method: "POST",
      headers: {
        "X-Api-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type: "avatar",
            avatar_id: params.avatarId,
          },
          voice: {
            type: "text",
            input_text: params.text,
            voice_id: params.voiceId,
          },
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HeyGen error: ${error}`);
    }

    return await response.json();
  }

  async listAvatars() {
    if (!this.apiKey) {
      throw new Error("HeyGen API key not configured.");
    }

    const response = await fetch(`${this.baseUrl}/avatars`, {
      method: "GET",
      headers: {
        "X-Api-Key": this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HeyGen list avatars error: ${error}`);
    }

    const data = await response.json();
    return data.data?.avatars || [];
  }
}

// Export service instances
export const grokService = new GrokService();
export const claudeService = new ClaudeService();
export const geminiService = new GeminiService();
export const stabilityService = new StabilityService();
export const replicateService = new ReplicateService();
export const heygenService = new HeyGenService();
