import OpenAI from "openai";
import { searchPexelsVideos, searchPexelsPhotos } from "./pexels";
import { searchGettyImages } from "./getty";

interface BRollSuggestion {
  query: string;
  timestamp: number; // When to insert in the video
  duration: number; // How long to show
  reason: string; // Why this B-roll is relevant
  sources: Array<{
    url: string;
    provider: "pexels" | "getty";
    thumbnailUrl?: string;
    videoUrl?: string;
  }>;
}

interface BRollInsertionPlan {
  suggestions: BRollSuggestion[];
  totalBRollDuration: number;
  coverage: number; // Percentage of video with B-roll
}

/**
 * Auto B-Roll Insertion Engine
 * AI-powered stock footage picker and inserter
 */
export class BRollEngine {
  private openai: OpenAI;
  private pexelsKey?: string;
  private gettyKey?: string;

  constructor(openaiKey?: string, pexelsKey?: string, gettyKey?: string) {
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
    this.pexelsKey = pexelsKey;
    this.gettyKey = gettyKey;
  }

  /**
   * Analyze script and generate B-roll insertion plan
   */
  async generateBRollPlan(
    script: string,
    videoDuration: number,
    transcript?: Array<{ start: number; end: number; text: string }>
  ): Promise<BRollInsertionPlan> {
    try {
      // Use AI to identify B-roll opportunities
      const suggestions = await this.identifyBRollOpportunities(script, videoDuration, transcript);
      
      // Search for relevant stock footage for each suggestion
      const enrichedSuggestions = await Promise.all(
        suggestions.map(async (suggestion) => {
          const sources = await this.searchBRollSources(suggestion.query);
          return { ...suggestion, sources };
        })
      );

      const totalBRollDuration = enrichedSuggestions.reduce((sum, s) => sum + s.duration, 0);
      const coverage = (totalBRollDuration / videoDuration) * 100;

      return {
        suggestions: enrichedSuggestions,
        totalBRollDuration,
        coverage,
      };
    } catch (error) {
      console.error("B-roll generation error:", error);
      throw new Error(`Failed to generate B-roll plan: ${error.message}`);
    }
  }

  /**
   * Use AI to identify B-roll opportunities in script
   */
  private async identifyBRollOpportunities(
    script: string,
    videoDuration: number,
    transcript?: Array<{ start: number; end: number; text: string }>
  ): Promise<Array<Omit<BRollSuggestion, "sources">>> {
    const prompt = `Analyze this video script and identify optimal B-roll insertion points.

Script: ${script}

${transcript ? `Transcript with timestamps:\n${JSON.stringify(transcript, null, 2)}\n` : ""}

Video duration: ${videoDuration} seconds

For each B-roll suggestion, provide:
- query: Search query for stock footage (specific, visual, actionable)
- timestamp: When to insert (in seconds)
- duration: How long to show (in seconds, typically 2-5s)
- reason: Why this B-roll enhances the content

Return JSON array of suggestions. Focus on:
1. Visual concepts that benefit from demonstration
2. Abstract concepts that need visualization
3. Transitions between topics
4. Key product/feature mentions

Example: [{"query": "person typing on laptop", "timestamp": 15.5, "duration": 3, "reason": "Visualize remote work concept"}]`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert video editor specializing in B-roll insertion for engaging content.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.suggestions || [];
  }

  /**
   * Search for B-roll footage from available sources
   */
  private async searchBRollSources(query: string): Promise<BRollSuggestion["sources"]> {
    const sources: BRollSuggestion["sources"] = [];

    try {
      // Search Pexels videos
      if (this.pexelsKey) {
        const pexelsVideos = await searchPexelsVideos(query, this.pexelsKey);
        if (pexelsVideos && pexelsVideos.length > 0) {
          // Take top 3 results
          sources.push(...pexelsVideos.slice(0, 3).map((video: any) => ({
            url: video.url,
            provider: "pexels" as const,
            thumbnailUrl: video.image,
            videoUrl: video.video_files?.[0]?.link,
          })));
        }
      }

      // Search Getty images (as fallback for stills)
      if (this.gettyKey && sources.length < 3) {
        const gettyImages = await searchGettyImages(query, this.gettyKey);
        if (gettyImages && gettyImages.length > 0) {
          sources.push(...gettyImages.slice(0, 2).map((image: any) => ({
            url: image.display_sizes?.[0]?.uri || image.uri,
            provider: "getty" as const,
            thumbnailUrl: image.display_sizes?.[0]?.uri,
          })));
        }
      }

      // Search Pexels photos as additional fallback
      if (this.pexelsKey && sources.length < 5) {
        const pexelsPhotos = await searchPexelsPhotos(query, this.pexelsKey);
        if (pexelsPhotos && pexelsPhotos.length > 0) {
          sources.push(...pexelsPhotos.slice(0, 2).map((photo: any) => ({
            url: photo.url,
            provider: "pexels" as const,
            thumbnailUrl: photo.src?.medium,
          })));
        }
      }
    } catch (error) {
      console.error(`B-roll search error for "${query}":`, error);
    }

    return sources;
  }

  /**
   * Auto-select best B-roll from suggestions using AI
   */
  async selectBestBRoll(
    suggestions: BRollSuggestion[],
    context: string
  ): Promise<Array<{ timestamp: number; url: string; duration: number }>> {
    try {
      const prompt = `Select the best B-roll footage for each timestamp.

Context: ${context}

Suggestions: ${JSON.stringify(suggestions, null, 2)}

For each suggestion, pick the most relevant source URL. Return JSON array:
[{"timestamp": 15.5, "url": "...", "duration": 3}]`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert at selecting relevant B-roll footage for video editing.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.selections || [];
    } catch (error) {
      console.error("B-roll selection error:", error);
      throw new Error(`Failed to select B-roll: ${error.message}`);
    }
  }
}

export function createBRollEngine(
  openaiKey?: string,
  pexelsKey?: string,
  gettyKey?: string
): BRollEngine {
  return new BRollEngine(openaiKey, pexelsKey, gettyKey);
}
