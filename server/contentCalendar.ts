import OpenAI from "openai";

interface ContentPlanDay {
  date: string;
  platform: string;
  contentType: string;
  topic: string;
  hook: string;
  keyPoints: string[];
  cta: string;
  hashtags?: string[];
}

interface WeeklyContentPlan {
  weekStartDate: Date;
  weekEndDate: Date;
  days: ContentPlanDay[];
  theme: string;
  brandFocus: string;
}

/**
 * Content Calendar Auto-Fill Backend
 * AI system to generate weekly content plans from brand briefs
 */
export class ContentCalendarEngine {
  private openai: OpenAI;

  constructor(openaiKey?: string) {
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
  }

  /**
   * Generate weekly content plan from brand brief
   */
  async generateWeeklyPlan(
    brandBrief: {
      name: string;
      brandVoice: string;
      targetAudience: string;
      contentGoals: string;
      platforms: string[];
      postingFrequency: string;
    },
    weekStartDate: Date
  ): Promise<WeeklyContentPlan> {
    try {
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);

      // Determine how many posts per week
      const postsPerWeek = this.calculatePostsPerWeek(brandBrief.postingFrequency);
      
      // Generate content ideas for the week
      const days = await this.generateDailyContent(
        brandBrief,
        weekStartDate,
        weekEndDate,
        postsPerWeek
      );

      // Extract theme from content
      const theme = await this.extractWeeklyTheme(days);

      return {
        weekStartDate,
        weekEndDate,
        days,
        theme,
        brandFocus: brandBrief.contentGoals,
      };
    } catch (error) {
      console.error("Content calendar generation error:", error);
      throw new Error(`Failed to generate content calendar: ${error.message}`);
    }
  }

  /**
   * Calculate number of posts per week from frequency string
   */
  private calculatePostsPerWeek(frequency: string): number {
    const freq = frequency.toLowerCase();
    
    if (freq.includes("daily") || freq.includes("7")) return 7;
    if (freq.includes("5") || freq.includes("weekday")) return 5;
    if (freq.includes("3")) return 3;
    if (freq.includes("2")) return 2;
    
    // Default to 3 posts per week
    return 3;
  }

  /**
   * Generate daily content for the week
   */
  private async generateDailyContent(
    brandBrief: any,
    startDate: Date,
    endDate: Date,
    postsPerWeek: number
  ): Promise<ContentPlanDay[]> {
    const prompt = `Create a ${postsPerWeek}-post weekly content plan for this brand:

Brand: ${brandBrief.name}
Voice: ${brandBrief.brandVoice}
Audience: ${brandBrief.targetAudience}
Goals: ${brandBrief.contentGoals}
Platforms: ${brandBrief.platforms.join(", ")}

Week: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}

For each post, provide:
- date: YYYY-MM-DD
- platform: Which platform
- contentType: "reel", "post", "story", "carousel", etc.
- topic: Main subject
- hook: Attention-grabbing opening line
- keyPoints: Array of 3-5 key messages
- cta: Call to action
- hashtags: Array of 5-10 relevant hashtags

Distribute posts strategically throughout the week. Consider:
- Peak engagement times
- Platform best practices
- Content variety
- Audience preferences
- Trending topics

Return JSON with days array.`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert social media strategist and content planner. You create engaging, strategic content calendars.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.days || [];
  }

  /**
   * Extract weekly theme from generated content
   */
  private async extractWeeklyTheme(days: ContentPlanDay[]): Promise<string> {
    if (days.length === 0) return "Brand content";

    const topics = days.map(d => d.topic).join(", ");
    
    const prompt = `Given these content topics for a week: ${topics}

Provide a concise weekly theme (3-5 words) that unifies them.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a content strategist. Extract themes from content topics.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      return response.choices[0].message.content?.trim() || "Weekly content";
    } catch (error) {
      return "Weekly content";
    }
  }

  /**
   * Generate content for specific day
   */
  async generateDayContent(
    brandBrief: any,
    date: Date,
    contentType: string,
    platform: string
  ): Promise<ContentPlanDay> {
    const prompt = `Create a single ${contentType} content plan for ${platform}:

Brand: ${brandBrief.name}
Voice: ${brandBrief.brandVoice}
Audience: ${brandBrief.targetAudience}
Goals: ${brandBrief.contentGoals}
Date: ${date.toLocaleDateString()}

Provide:
- topic
- hook
- keyPoints (array)
- cta
- hashtags (array)

Return JSON.`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a social media content creator.",
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
      date: date.toISOString().split("T")[0],
      platform,
      contentType,
      topic: result.topic || "Brand content",
      hook: result.hook || "",
      keyPoints: result.keyPoints || [],
      cta: result.cta || "",
      hashtags: result.hashtags || [],
    };
  }

  /**
   * Optimize existing plan based on analytics
   */
  async optimizePlan(
    currentPlan: WeeklyContentPlan,
    analytics: {
      topPerformingTopics: string[];
      bestPostingTimes: string[];
      engagementTrends: any;
    }
  ): Promise<WeeklyContentPlan> {
    const prompt = `Optimize this content plan based on performance data:

Current plan: ${JSON.stringify(currentPlan.days, null, 2)}

Analytics insights:
- Top topics: ${analytics.topPerformingTopics.join(", ")}
- Best times: ${analytics.bestPostingTimes.join(", ")}
- Trends: ${JSON.stringify(analytics.engagementTrends)}

Adjust the plan to:
1. Focus more on high-performing topics
2. Schedule posts at optimal times
3. Incorporate trending themes
4. Maintain brand consistency

Return optimized JSON with days array.`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a data-driven content strategist.",
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
      ...currentPlan,
      days: result.days || currentPlan.days,
    };
  }
}

export function createContentCalendarEngine(openaiKey?: string): ContentCalendarEngine {
  return new ContentCalendarEngine(openaiKey);
}
