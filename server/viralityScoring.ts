import OpenAI from "openai";

interface ViralityAnalysis {
  predictedCTR: number; // 0-100
  engagementScore: number; // 0-100
  hookScore: number; // 0-100
  retentionScore: number; // 0-100
  viralityFactors: {
    pacing: number;
    editing: number;
    audio: number;
    visuals: number;
    storytelling: number;
    emotion: number;
  };
  recommendations: string[];
}

/**
 * Virality Scoring Backend
 * Predicts CTR and engagement metrics for content
 */
export class ViralityScoringEngine {
  private openai: OpenAI;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Score video for virality potential
   */
  async scoreVideo(
    videoUrl: string,
    transcript?: string,
    thumbnailUrl?: string
  ): Promise<ViralityAnalysis> {
    try {
      const analysisPrompt = this.buildAnalysisPrompt(transcript, !!thumbnailUrl);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert in viral content analysis. You analyze videos and predict their virality potential based on proven engagement factors.",
          },
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      return this.normalizeAnalysis(analysis);
    } catch (error) {
      console.error("Virality scoring error:", error);
      throw new Error(`Failed to score video: ${error.message}`);
    }
  }

  /**
   * Score text content (script, caption) for engagement potential
   */
  async scoreTextContent(content: string, contentType: "script" | "caption"): Promise<{
    engagementScore: number;
    hookQuality: number;
    emotionalImpact: number;
    clarity: number;
    recommendations: string[];
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert in ${contentType === "script" ? "video script" : "social media caption"} analysis. Score the content for engagement potential.`,
          },
          {
            role: "user",
            content: `Analyze this ${contentType} and provide scores (0-100) and recommendations:\n\n${content}\n\nReturn JSON with: engagementScore, hookQuality, emotionalImpact, clarity, recommendations[]`,
          },
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Text content scoring error:", error);
      throw new Error(`Failed to score ${contentType}: ${error.message}`);
    }
  }

  /**
   * Predict CTR for thumbnail and title combination
   */
  async predictCTR(title: string, thumbnailUrl?: string): Promise<{
    predictedCTR: number;
    titleScore: number;
    thumbnailScore: number;
    recommendations: string[];
  }> {
    try {
      const prompt = `Analyze this video title for click-through rate potential: "${title}"\n${
        thumbnailUrl ? `Thumbnail provided at: ${thumbnailUrl}\n` : ""
      }\nProvide: predictedCTR (0-100), titleScore (0-100), ${
        thumbnailUrl ? "thumbnailScore (0-100), " : ""
      }recommendations[]`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert in YouTube/social media CTR optimization. Analyze titles and thumbnails for click potential.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("CTR prediction error:", error);
      throw new Error(`Failed to predict CTR: ${error.message}`);
    }
  }

  /**
   * Build analysis prompt for video scoring
   */
  private buildAnalysisPrompt(transcript?: string, hasThumbnail?: boolean): string {
    let prompt = "Analyze this video content for virality potential.\n\n";
    
    if (transcript) {
      prompt += `Transcript:\n${transcript}\n\n`;
    }
    
    if (hasThumbnail) {
      prompt += "Thumbnail image is provided.\n\n";
    }
    
    prompt += `Provide JSON with:
- predictedCTR: 0-100 (predicted click-through rate)
- engagementScore: 0-100 (overall engagement potential)
- hookScore: 0-100 (first 3 seconds effectiveness)
- retentionScore: 0-100 (predicted viewer retention)
- viralityFactors: {pacing: 0-100, editing: 0-100, audio: 0-100, visuals: 0-100, storytelling: 0-100, emotion: 0-100}
- recommendations: string[] (specific improvements)`;
    
    return prompt;
  }

  /**
   * Normalize and validate analysis results
   */
  private normalizeAnalysis(analysis: any): ViralityAnalysis {
    return {
      predictedCTR: this.clamp(analysis.predictedCTR || 50, 0, 100),
      engagementScore: this.clamp(analysis.engagementScore || 50, 0, 100),
      hookScore: this.clamp(analysis.hookScore || 50, 0, 100),
      retentionScore: this.clamp(analysis.retentionScore || 50, 0, 100),
      viralityFactors: {
        pacing: this.clamp(analysis.viralityFactors?.pacing || 50, 0, 100),
        editing: this.clamp(analysis.viralityFactors?.editing || 50, 0, 100),
        audio: this.clamp(analysis.viralityFactors?.audio || 50, 0, 100),
        visuals: this.clamp(analysis.viralityFactors?.visuals || 50, 0, 100),
        storytelling: this.clamp(analysis.viralityFactors?.storytelling || 50, 0, 100),
        emotion: this.clamp(analysis.viralityFactors?.emotion || 50, 0, 100),
      },
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
    };
  }

  /**
   * Clamp value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

export function createViralityScoringEngine(openaiKey?: string): ViralityScoringEngine {
  return new ViralityScoringEngine(openaiKey);
}
