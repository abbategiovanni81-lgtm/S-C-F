import { openai } from "./openai";

interface ContentInput {
  hook: string;
  script: string;
  caption: string;
  hashtags: string[];
  platform: string;
  contentFormat: string;
}

interface ScoreResult {
  overallScore: number;
  hookStrength: number;
  captionQuality: number;
  hashtagRelevance: number;
  platformFit: number;
  suggestions: string[];
  predictedEngagement: "low" | "medium" | "high" | "viral";
}

export class ViralityScoringService {
  async scoreContent(input: ContentInput): Promise<ScoreResult> {
    const prompt = `Analyze the following content for its viral potential on social media. Score the content on these dimensions (1-10):\n    1. Hook strength (does it grab attention?)\n    2. Caption quality (clarity, engagement)\n    3. Hashtag relevance (mix of branded, trending, niche)\n    4. Platform fit (best practices for the platform)\n    Additionally, provide suggestions to improve the content.\n    \n    Content details:\n    Hook: "${input.hook}"\n    Script: "${input.script}"\n    Caption: "${input.caption}"\n    Hashtags: "${input.hashtags.join(", ")}"\n    Platform: "${input.platform}"\n    Content format: "${input.contentFormat}"\n    \n    Respond in JSON: {\n      \"overallScore\": number,\n      \"hookStrength\": number,\n      \"captionQuality\": number,\n      \"hashtagRelevance\": number,\n      \"platformFit\": number,\n      \"suggestions\": string[],\n      \"predictedEngagement\": \"low\" | \"medium\" | \"high\" | \"viral\"\n    }`;

    try {
      const response = await openai.complete({
        model: "gpt-4o",
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      return response;
    } catch (error) {
      console.error("Error scoring content:", error);
      return {
        overallScore: 5,
        hookStrength: 5,
        captionQuality: 5,
        hashtagRelevance: 5,
        platformFit: 5,
        suggestions: ["Improve clarity and emotional appeal of the hook."],
        predictedEngagement: "medium",
      };
    }
  }
}

// Export a singleton instance
export const viralityScoringService = new ViralityScoringService();