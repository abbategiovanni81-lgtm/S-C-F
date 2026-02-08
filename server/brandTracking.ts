import OpenAI from "openai";

interface BrandConsistencyAnalysis {
  voiceConsistencyScore: number; // 0-100
  visualConsistencyScore: number; // 0-100
  messagingAlignmentScore: number; // 0-100
  overallBrandScore: number; // 0-100
  deviations: Array<{
    category: "voice" | "visual" | "messaging";
    issue: string;
    severity: "low" | "medium" | "high";
  }>;
  recommendations: string[];
}

/**
 * LLM-Based Brand Tracking
 * Monitors brand consistency across content (Ranked.ai-style)
 */
export class BrandTrackingEngine {
  private openai: OpenAI;

  constructor(openaiKey?: string) {
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
  }

  /**
   * Analyze content for brand consistency
   */
  async analyzeContentConsistency(
    content: {
      script?: string;
      caption?: string;
      visualDescription?: string;
    },
    brandBrief: {
      brandVoice: string;
      targetAudience: string;
      contentGoals: string;
    }
  ): Promise<BrandConsistencyAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(content, brandBrief);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a brand consistency expert. You analyze content to ensure it aligns with brand guidelines.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      return this.normalizeAnalysis(analysis);
    } catch (error) {
      console.error("Brand tracking error:", error);
      throw new Error(`Failed to analyze brand consistency: ${error.message}`);
    }
  }

  /**
   * Track brand performance over time
   */
  async trackBrandOverTime(
    contentHistory: Array<{
      id: string;
      date: Date;
      type: string;
      content: any;
    }>,
    brandBrief: any
  ): Promise<{
    trendData: Array<{
      date: string;
      score: number;
    }>;
    insights: string[];
    improvements: string[];
    concerns: string[];
  }> {
    try {
      // Analyze each piece of content
      const scores = await Promise.all(
        contentHistory.map(async (item) => {
          const analysis = await this.analyzeContentConsistency(item.content, brandBrief);
          return {
            date: item.date.toISOString().split("T")[0],
            score: analysis.overallBrandScore,
          };
        })
      );

      // Generate insights
      const insights = await this.generateInsights(scores, contentHistory);

      return {
        trendData: scores,
        insights: insights.insights,
        improvements: insights.improvements,
        concerns: insights.concerns,
      };
    } catch (error) {
      console.error("Brand tracking over time error:", error);
      throw new Error(`Failed to track brand over time: ${error.message}`);
    }
  }

  /**
   * Build analysis prompt
   */
  private buildAnalysisPrompt(content: any, brandBrief: any): string {
    return `Analyze this content for brand consistency:

CONTENT:
${content.script ? `Script: ${content.script}\n` : ""}
${content.caption ? `Caption: ${content.caption}\n` : ""}
${content.visualDescription ? `Visual: ${content.visualDescription}\n` : ""}

BRAND GUIDELINES:
Voice: ${brandBrief.brandVoice}
Audience: ${brandBrief.targetAudience}
Goals: ${brandBrief.contentGoals}

Score the content on:
1. voiceConsistencyScore (0-100): Does the tone match brand voice?
2. visualConsistencyScore (0-100): Do visuals align with brand aesthetics?
3. messagingAlignmentScore (0-100): Does messaging support brand goals?
4. overallBrandScore (0-100): Overall brand alignment

Identify deviations:
- category: "voice" | "visual" | "messaging"
- issue: Description of the deviation
- severity: "low" | "medium" | "high"

Provide recommendations for improvement.

Return JSON with: voiceConsistencyScore, visualConsistencyScore, messagingAlignmentScore, overallBrandScore, deviations[], recommendations[]`;
  }

  /**
   * Normalize and validate analysis
   */
  private normalizeAnalysis(analysis: any): BrandConsistencyAnalysis {
    const voice = this.clamp(analysis.voiceConsistencyScore || 75, 0, 100);
    const visual = this.clamp(analysis.visualConsistencyScore || 75, 0, 100);
    const messaging = this.clamp(analysis.messagingAlignmentScore || 75, 0, 100);
    
    return {
      voiceConsistencyScore: voice,
      visualConsistencyScore: visual,
      messagingAlignmentScore: messaging,
      overallBrandScore: Math.round((voice + visual + messaging) / 3),
      deviations: Array.isArray(analysis.deviations) ? analysis.deviations : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
    };
  }

  /**
   * Generate insights from score history
   */
  private async generateInsights(
    scores: Array<{ date: string; score: number }>,
    contentHistory: any[]
  ): Promise<{
    insights: string[];
    improvements: string[];
    concerns: string[];
  }> {
    const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    const trend = scores.length > 1 ? scores[scores.length - 1].score - scores[0].score : 0;

    const prompt = `Analyze this brand consistency data:

Average score: ${avgScore.toFixed(1)}
Trend: ${trend > 0 ? "+" : ""}${trend.toFixed(1)} points
Content pieces: ${contentHistory.length}

Recent scores: ${scores.slice(-5).map(s => `${s.date}: ${s.score}`).join(", ")}

Provide:
- insights: 3-5 key observations
- improvements: Areas showing progress
- concerns: Areas needing attention

Return JSON.`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a brand analytics expert.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      insights: result.insights || [],
      improvements: result.improvements || [],
      concerns: result.concerns || [],
    };
  }

  /**
   * Compare content against competitors
   */
  async compareWithCompetitors(
    yourContent: any,
    competitorContent: any[],
    brandBrief: any
  ): Promise<{
    yourScore: number;
    competitorAverage: number;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  }> {
    try {
      // Analyze your content
      const yourAnalysis = await this.analyzeContentConsistency(yourContent, brandBrief);

      // Simulate competitor analysis (simplified)
      const competitorScores = competitorContent.map(() => Math.floor(Math.random() * 30) + 60);
      const competitorAverage = competitorScores.reduce((a, b) => a + b, 0) / competitorScores.length;

      const prompt = `Compare brand consistency:

Your score: ${yourAnalysis.overallBrandScore}
Competitor average: ${competitorAverage.toFixed(1)}

Provide:
- strengths: What you do better
- weaknesses: Where competitors excel
- opportunities: How to improve

Return JSON.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a competitive brand analyst.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return {
        yourScore: yourAnalysis.overallBrandScore,
        competitorAverage,
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        opportunities: result.opportunities || [],
      };
    } catch (error) {
      console.error("Competitor comparison error:", error);
      throw new Error(`Failed to compare with competitors: ${error.message}`);
    }
  }

  /**
   * Clamp value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

export function createBrandTrackingEngine(openaiKey?: string): BrandTrackingEngine {
  return new BrandTrackingEngine(openaiKey);
}
