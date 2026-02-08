import axios from "axios";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * OpenRouter Integration
 * Universal LLM routing to access multiple AI models
 */
export class OpenRouterService {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";
  private appName: string;

  constructor(apiKey: string, appName: string = "S-C-F") {
    this.apiKey = apiKey;
    this.appName = appName;
  }

  /**
   * Send chat completion request
   */
  async chatCompletion(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens,
          top_p: request.topP,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "HTTP-Referer": "https://s-c-f.app",
            "X-Title": this.appName,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        id: response.data.id,
        model: response.data.model,
        choices: response.data.choices.map((choice: any) => ({
          message: {
            role: choice.message.role,
            content: choice.message.content,
          },
          finishReason: choice.finish_reason,
        })),
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        },
      };
    } catch (error: any) {
      console.error("OpenRouter error:", error.response?.data || error.message);
      throw new Error(`OpenRouter request failed: ${error.message}`);
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<Array<{
    id: string;
    name: string;
    pricing: { prompt: number; completion: number };
    contextLength: number;
  }>> {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.data.data.map((model: any) => ({
        id: model.id,
        name: model.name,
        pricing: {
          prompt: parseFloat(model.pricing?.prompt || "0"),
          completion: parseFloat(model.pricing?.completion || "0"),
        },
        contextLength: model.context_length || 4096,
      }));
    } catch (error: any) {
      console.error("OpenRouter models list error:", error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Get cost-effective model for task
   */
  async selectCostEffectiveModel(taskType: "simple" | "complex" | "creative"): Promise<string> {
    const modelMap = {
      simple: "openai/gpt-3.5-turbo",
      complex: "anthropic/claude-3-opus",
      creative: "openai/gpt-4-turbo",
    };

    return modelMap[taskType];
  }

  /**
   * Stream chat completion
   */
  async streamChatCompletion(
    request: OpenRouterRequest,
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
            "HTTP-Referer": "https://s-c-f.app",
            "X-Title": this.appName,
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
      console.error("OpenRouter stream error:", error.response?.data || error.message);
      throw new Error(`OpenRouter stream failed: ${error.message}`);
    }
  }

  /**
   * Compare responses from multiple models
   */
  async compareModels(
    messages: OpenRouterMessage[],
    models: string[]
  ): Promise<Array<{
    model: string;
    response: string;
    tokens: number;
    cost: number;
  }>> {
    const results = await Promise.all(
      models.map(async (model) => {
        try {
          const response = await this.chatCompletion({ model, messages });
          const content = response.choices[0]?.message?.content || "";
          
          // Rough cost calculation (would need actual pricing)
          const cost = (response.usage.totalTokens / 1000) * 0.01;
          
          return {
            model,
            response: content,
            tokens: response.usage.totalTokens,
            cost,
          };
        } catch (error) {
          return {
            model,
            response: `Error: ${error.message}`,
            tokens: 0,
            cost: 0,
          };
        }
      })
    );

    return results;
  }
}

export function createOpenRouterService(apiKey: string): OpenRouterService {
  return new OpenRouterService(apiKey);
}
