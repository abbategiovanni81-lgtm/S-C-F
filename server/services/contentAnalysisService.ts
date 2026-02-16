import { openai } from "../openai";

export interface ContentScores {
  viralPotential: number; // 0-10
  hookScore: number; // 0-10
  bodyScore: number; // 0-10
  visualScore: number; // 0-10
  competitiveScore: number; // 0-10
}

export interface ContentAnalysisInput {
  hook?: string;
  script?: string;
  caption?: string;
  hashtags?: string[];
  platform?: string;
  contentFormat?: string;
  imageUrls?: string[];
}

export interface DetailedAnalysis extends ContentScores {
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestedActions: string[];
  predictedEngagement: "low" | "medium" | "high" | "viral";
}

export interface ComparisonResult {
  yourContent: ContentScores;
  referenceContent: ContentScores;
  differences: {
    hook: number;
    body: number;
    visual: number;
    overall: number;
  };
  feedback: string;
  actionableSteps: string[];
}

export class ContentAnalysisService {
  /**
   * Analyzes content and provides detailed scoring
   */
  async analyzeContent(input: ContentAnalysisInput): Promise<DetailedAnalysis> {
    const prompt = `Analyze the following social media content and score it on viral potential and quality.

Content Details:
${input.hook ? `Hook: "${input.hook}"` : ""}
${input.script ? `Script/Body: "${input.script}"` : ""}
${input.caption ? `Caption: "${input.caption}"` : ""}
${input.hashtags?.length ? `Hashtags: ${input.hashtags.join(", ")}` : ""}
${input.platform ? `Platform: ${input.platform}` : ""}
${input.contentFormat ? `Format: ${input.contentFormat}` : ""}

Score the content on these dimensions (0-10):
1. **Hook Score**: Does it grab attention in the first 3 seconds?
2. **Body Score**: Is the middle content engaging, valuable, and well-structured?
3. **Visual Score**: How compelling are the visuals/aesthetic?
4. **Competitive Score**: How does it compare to top-performing content in this niche?
5. **Viral Potential**: Overall likelihood of going viral (weighted average)

Provide:
- A conversational summary highlighting key strengths and areas for improvement
- Top 3 strengths
- Top 3 improvements needed
- Suggested actions (e.g., "Strengthen the hook", "Rewrite the CTA", "Post as-is")
- Predicted engagement level

Respond in JSON format:
{
  "hookScore": number,
  "bodyScore": number,
  "visualScore": number,
  "competitiveScore": number,
  "viralPotential": number,
  "summary": "conversational summary",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "suggestedActions": ["action 1", "action 2"],
  "predictedEngagement": "low" | "medium" | "high" | "viral"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert social media content analyst. Provide honest, actionable feedback to help creators improve their content.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1500,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No analysis generated from OpenAI");
      }

      return JSON.parse(content) as DetailedAnalysis;
    } catch (error) {
      console.error("Error analyzing content:", error);
      // Return default scores on error
      return {
        hookScore: 5,
        bodyScore: 5,
        visualScore: 5,
        competitiveScore: 5,
        viralPotential: 5,
        summary: "Unable to analyze content at this time. Please try again.",
        strengths: [],
        improvements: ["Consider refining your hook for better engagement"],
        suggestedActions: ["Review and refine"],
        predictedEngagement: "medium",
      };
    }
  }

  /**
   * Compares content against a reference (own top post or competitor)
   */
  async compareContent(
    yourContent: ContentAnalysisInput,
    referenceContent: ContentAnalysisInput,
    comparisonType: "own" | "competitor"
  ): Promise<ComparisonResult> {
    const typeContext = comparisonType === "own"
      ? "one of your top-performing posts"
      : "a competitor's post";

    const prompt = `Compare the following two pieces of content and provide a detailed analysis.

YOUR CONTENT:
${yourContent.hook ? `Hook: "${yourContent.hook}"` : ""}
${yourContent.script ? `Script: "${yourContent.script}"` : ""}
${yourContent.caption ? `Caption: "${yourContent.caption}"` : ""}
${yourContent.hashtags?.length ? `Hashtags: ${yourContent.hashtags.join(", ")}` : ""}

REFERENCE CONTENT (${typeContext.toUpperCase()}):
${referenceContent.hook ? `Hook: "${referenceContent.hook}"` : ""}
${referenceContent.script ? `Script: "${referenceContent.script}"` : ""}
${referenceContent.caption ? `Caption: "${referenceContent.caption}"` : ""}
${referenceContent.hashtags?.length ? `Hashtags: ${referenceContent.hashtags.join(", ")}` : ""}

Score both pieces on:
1. Hook strength (0-10)
2. Body/content quality (0-10)
3. Visual appeal (0-10)
4. Overall effectiveness (0-10)

Provide:
- Score differences (positive means your content is better)
- Conversational feedback on what the reference content does better
- 3-5 actionable steps to improve your content to match or beat the reference

Respond in JSON format:
{
  "yourContent": {
    "hookScore": number,
    "bodyScore": number,
    "visualScore": number,
    "competitiveScore": number,
    "viralPotential": number
  },
  "referenceContent": {
    "hookScore": number,
    "bodyScore": number,
    "visualScore": number,
    "competitiveScore": number,
    "viralPotential": number
  },
  "differences": {
    "hook": number (your score - their score),
    "body": number,
    "visual": number,
    "overall": number
  },
  "feedback": "conversational feedback on key differences",
  "actionableSteps": ["step 1", "step 2", "step 3"]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert social media strategist helping creators improve their content by comparing it to ${typeContext}.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1200,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No comparison generated from OpenAI");
      }

      return JSON.parse(content) as ComparisonResult;
    } catch (error) {
      console.error("Error comparing content:", error);
      // Return default comparison on error
      return {
        yourContent: {
          hookScore: 5,
          bodyScore: 5,
          visualScore: 5,
          competitiveScore: 5,
          viralPotential: 5,
        },
        referenceContent: {
          hookScore: 5,
          bodyScore: 5,
          visualScore: 5,
          competitiveScore: 5,
          viralPotential: 5,
        },
        differences: {
          hook: 0,
          body: 0,
          visual: 0,
          overall: 0,
        },
        feedback: "Unable to compare content at this time. Please try again.",
        actionableSteps: [],
      };
    }
  }
}

// Export singleton instance
export const contentAnalysisService = new ContentAnalysisService();
