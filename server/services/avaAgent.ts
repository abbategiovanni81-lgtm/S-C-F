import { contentAnalysisService, type ContentAnalysisInput, type DetailedAnalysis, type ComparisonResult } from "./contentAnalysisService";
import type { Storage } from "../storage";

export interface AvaAnalysisRequest {
  contentId?: string;
  content?: {
    hook?: string;
    script?: string;
    caption?: string;
    hashtags?: string[];
    platform?: string;
    contentFormat?: string;
  };
}

export interface AvaComparisonRequest {
  yourContent: ContentAnalysisInput;
  comparisonType: "own" | "competitor";
  referenceContentId?: string;
  referenceUrl?: string;
  referenceContent?: ContentAnalysisInput;
}

export class AvaAgent {
  constructor(private storage: Storage) {}

  /**
   * Analyzes content and returns scoring for Ava chat display
   */
  async analyzeContent(request: AvaAnalysisRequest): Promise<DetailedAnalysis> {
    let input: ContentAnalysisInput;

    if (request.contentId && this.storage) {
      // Fetch content from database
      const generatedContent = await this.storage.getGeneratedContent(request.contentId);
      if (!generatedContent) {
        throw new Error("Content not found");
      }

      input = {
        hook: this.extractHook(generatedContent.script),
        script: generatedContent.script,
        caption: generatedContent.caption,
        hashtags: generatedContent.hashtags || [],
        platform: generatedContent.platforms?.[0],
        contentFormat: this.determineFormat(generatedContent),
      };
    } else if (request.content) {
      input = request.content;
    } else {
      throw new Error("Either contentId or content must be provided");
    }

    return await contentAnalysisService.analyzeContent(input);
  }

  /**
   * Compares new content against own top-performing posts
   */
  async compareToOwnContent(
    userId: string,
    yourContent: ContentAnalysisInput,
    topContentId?: string
  ): Promise<ComparisonResult> {
    let referenceContent: ContentAnalysisInput;

    if (topContentId) {
      // Use specific content for comparison
      const content = await this.storage.getGeneratedContent(topContentId);
      if (!content || content.userId !== userId) {
        throw new Error("Content not found or access denied");
      }

      referenceContent = {
        hook: this.extractHook(content.script),
        script: content.script,
        caption: content.caption,
        hashtags: content.hashtags || [],
        platform: content.platforms?.[0],
        contentFormat: this.determineFormat(content),
      };
    } else {
      // Find top-performing content automatically
      const topContent = await this.getTopPerformingContent(userId);
      if (!topContent) {
        throw new Error("No top-performing content found for comparison");
      }

      referenceContent = {
        hook: this.extractHook(topContent.script),
        script: topContent.script,
        caption: topContent.caption,
        hashtags: topContent.hashtags || [],
        platform: topContent.platforms?.[0],
        contentFormat: this.determineFormat(topContent),
      };
    }

    return await contentAnalysisService.compareContent(
      yourContent,
      referenceContent,
      "own"
    );
  }

  /**
   * Compares content against a competitor post
   */
  async compareToCompetitor(
    yourContent: ContentAnalysisInput,
    competitorUrl: string
  ): Promise<ComparisonResult & { competitorData?: any }> {
    // TODO: Implement competitor URL scraping using existing scraping infrastructure
    // For now, we'll throw an error directing users to use the comparison feature
    // with manually provided content or to use the standalone ContentComparison page
    
    throw new Error(
      "Competitor URL scraping is not yet available in the chat interface. " +
      "Please use the Content Comparison page to analyze competitor posts, " +
      "or provide the competitor content details directly."
    );
  }

  /**
   * Extracts a hook from the script
   */
  private extractHook(script: string): string {
    if (!script) return "";
    
    // Get first sentence or first line
    const lines = script.split("\n").filter(l => l.trim());
    if (lines.length === 0) return "";
    
    const firstLine = lines[0];
    const sentences = firstLine.match(/[^.!?]+[.!?]+/g);
    
    return sentences?.[0]?.trim() || firstLine.trim();
  }

  /**
   * Determines the content format from generated content
   */
  private determineFormat(content: any): string {
    if (content.videoUrl) return "video";
    if (content.blogBody) return "blog";
    if (content.generationMetadata?.scenes) {
      return content.generationMetadata.scenes.length > 1 ? "carousel" : "image";
    }
    return "text";
  }

  /**
   * Gets top-performing content for a user
   * TODO: Implement proper engagement-based sorting using analytics data
   * Currently returns the most recent content as a placeholder
   */
  private async getTopPerformingContent(userId: string): Promise<any> {
    // Get user's brand briefs
    const briefs = await this.storage.getBrandBriefsByUser(userId);
    
    if (briefs.length === 0) {
      return null;
    }
    
    // TODO: Query analytics snapshots to find actual top-performing content
    // For now, get content from the first brief as a fallback
    const allContent = await this.storage.getContentByBrief(briefs[0].id);
    
    if (allContent.length === 0) {
      return null;
    }
    
    // TODO: Sort by engagement metrics instead of just returning first item
    return allContent[0];
  }
}

// Export factory function
export function createAvaAgent(storage: Storage): AvaAgent {
  return new AvaAgent(storage);
}
