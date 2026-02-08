import axios from "axios";

interface TogetherMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface TogetherRequest {
  model: string;
  messages: TogetherMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

interface TogetherResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface TogetherImageRequest {
  model: string;
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  n?: number;
}

/**
 * Together AI Integration
 * Fast, cost-effective AI inference
 */
export class TogetherAIService {
  private apiKey: string;
  private baseUrl = "https://api.together.xyz/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Chat completion
   */
  async chatCompletion(request: TogetherRequest): Promise<TogetherResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 512,
          top_p: request.topP,
          top_k: request.topK,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        id: response.data.id,
        model: response.data.model,
        choices: response.data.choices,
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        },
      };
    } catch (error: any) {
      console.error("Together AI error:", error.response?.data || error.message);
      throw new Error(`Together AI request failed: ${error.message}`);
    }
  }

  /**
   * Image generation
   */
  async generateImage(request: TogetherImageRequest): Promise<{
    images: Array<{ url: string; b64_json?: string }>;
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/images/generations`,
        {
          model: request.model,
          prompt: request.prompt,
          width: request.width ?? 1024,
          height: request.height ?? 1024,
          steps: request.steps ?? 20,
          n: request.n ?? 1,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        images: response.data.data || [],
      };
    } catch (error: any) {
      console.error("Together AI image error:", error.response?.data || error.message);
      throw new Error(`Together AI image generation failed: ${error.message}`);
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<Array<{
    id: string;
    name: string;
    type: "chat" | "language" | "image" | "embedding";
  }>> {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.data.map((model: any) => ({
        id: model.id,
        name: model.display_name || model.id,
        type: model.type,
      }));
    } catch (error: any) {
      console.error("Together AI models list error:", error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Generate embedding
   */
  async generateEmbedding(text: string, model: string = "togethercomputer/m2-bert-80M-8k-retrieval"): Promise<number[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/embeddings`,
        {
          model: model,
          input: text,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.data[0].embedding;
    } catch (error: any) {
      console.error("Together AI embedding error:", error.response?.data || error.message);
      throw new Error(`Together AI embedding failed: ${error.message}`);
    }
  }

  /**
   * Stream chat completion
   */
  async streamChatCompletion(
    request: TogetherRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          ...request,
          stream: true,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          responseType: "stream",
        }
      );

      response.data.on("data", (chunk: Buffer) => {
        const lines = chunk.toString().split("\n").filter(line => line.trim());
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.substring(6);
            if (data === "[DONE]") return;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) onChunk(content);
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      });
    } catch (error: any) {
      console.error("Together AI stream error:", error.response?.data || error.message);
      throw new Error(`Together AI stream failed: ${error.message}`);
    }
  }

  /**
   * Fast inference for simple tasks
   */
  async fastCompletion(prompt: string): Promise<string> {
    const response = await this.chatCompletion({
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 256,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "";
  }

  /**
   * High-quality completion for complex tasks
   */
  async qualityCompletion(prompt: string): Promise<string> {
    const response = await this.chatCompletion({
      model: "meta-llama/Llama-3-70b-chat-hf",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 1024,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "";
  }
}

export function createTogetherAIService(apiKey: string): TogetherAIService {
  return new TogetherAIService(apiKey);
}
