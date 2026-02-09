import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface HookRequest {
  topic: string;
  platform: string;
  tone?: string;
  targetAudience?: string;
}

export interface Hook {
  text: string;
  type: string;
  estimatedEngagement: number;
}

export interface ScriptRequest {
  topic: string;
  platform: string;
  tone?: string;
  length: "short" | "medium" | "long"; // 30s, 60s, 90s+
  targetAudience?: string;
}

export interface ScriptSection {
  name: string;
  duration: number;
  content: string;
  timing: string;
}

export interface Script {
  sections: ScriptSection[];
  totalDuration: number;
  wordCount: number;
}

export interface CaptionRequest {
  contentTopic: string;
  contentType: string;
  platform: string;
  tone?: string;
  includeHashtags?: boolean;
}

export interface Caption {
  text: string;
  hashtagCount: number;
  characterCount: number;
  variation: string;
}

export interface HashtagRequest {
  topic: string;
  niche: string;
  platform: string;
  count?: number;
  style?: "niche" | "trending" | "balanced";
}

export interface Hashtag {
  tag: string;
  category: string;
  estimatedReach: string;
}

export interface IdeaRequest {
  niche: string;
  platform: string;
  trendingTopics?: string[];
  targetAudience?: string;
  count?: number;
}

export interface ContentIdea {
  title: string;
  description: string;
  estimatedEngagement: number;
  difficulty: string;
  trendAlignment: number;
}

export interface CarouselRequest {
  topic: string;
  slideCount: number;
  tone?: string;
  targetAudience?: string;
}

export interface CarouselSlide {
  slideNumber: number;
  title: string;
  content: string;
  imageDescription: string;
  designTips: string;
}

export interface ViralForecastRequest {
  topic: string;
  country?: string;
  platform?: string;
  contentType?: string;
}

export interface ViralForecast {
  viralPotential: number;
  audienceSize: string;
  demographics: {
    primaryAge: string;
    genderSplit: string;
    interests: string[];
  };
  competitionLevel: string;
  recommendations: string[];
  bestTimeToPost: string;
}

export interface BestTimeRequest {
  platform: string;
  targetAudience?: string;
  contentType?: string;
  timezone?: string;
}

export interface BestTimeResponse {
  recommendations: {
    day: string;
    times: string[];
    rationale: string;
    expectedReach: string;
  }[];
  peakEngagementWindow: string;
  avoidTimes: string[];
}

/**
 * Helper function to safely parse OpenAI JSON responses
 */
function safeParseJSON(content: string | null | undefined, fallback: any = {}): any {
  if (!content) {
    console.error("OpenAI response content is empty");
    return fallback;
  }
  
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to parse OpenAI JSON response:", error);
    return fallback;
  }
}

/**
 * Check if Ava is configured properly
 */
export function isAvaConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Validate API key before making calls
 */
function validateApiKey(): void {
  if (!isAvaConfigured()) {
    throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.");
  }
}

/**
 * Generate 3 hook variations for content
 */
export async function generateHooks(request: HookRequest): Promise<Hook[]> {
  validateApiKey();
  
  const systemPrompt = `You are an expert content creator specializing in viral hooks. Generate 3 unique, attention-grabbing hooks for ${request.platform} content.
  
Consider:
- Target audience: ${request.targetAudience || "general"}
- Tone: ${request.tone || "engaging"}
- Platform best practices for ${request.platform}
- Various hook types: question, bold statement, curiosity gap, pattern interrupt, story opening

Return hooks as JSON array with: text, type, estimatedEngagement (1-10 score)`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Topic: ${request.topic}` }
      ],
      temperature: 0.9,
      response_format: { type: "json_object" }
    });

    const response = safeParseJSON(completion.choices[0]?.message?.content, { hooks: [] });
    return response.hooks || [];
  } catch (error: any) {
    console.error("Error generating hooks:", error);
    throw new Error(`Failed to generate hooks: ${error.message}`);
  }
}

/**
 * Generate a full timed script with sections
 */
export async function generateScript(request: ScriptRequest): Promise<Script> {
  validateApiKey();
  
  const durationMap = {
    short: { total: 30, hook: 3, intro: 5, buildup: 15, punchline: 5, cta: 2 },
    medium: { total: 60, hook: 5, intro: 8, buildup: 35, punchline: 8, cta: 4 },
    long: { total: 90, hook: 7, intro: 12, buildup: 55, punchline: 12, cta: 4 }
  };

  const durations = durationMap[request.length];

  const systemPrompt = `You are a professional scriptwriter for ${request.platform} content. Create a timed script with clear sections.

Script requirements:
- Total duration: ${durations.total} seconds
- Tone: ${request.tone || "engaging"}
- Target audience: ${request.targetAudience || "general"}
- Platform: ${request.platform}

Sections:
1. Hook (${durations.hook}s) - Attention-grabbing opening
2. Introduction (${durations.intro}s) - Setup and context
3. Build-up (${durations.buildup}s) - Main content delivery
4. Punchline (${durations.punchline}s) - Key message or reveal
5. Call to Action (${durations.cta}s) - Engagement prompt

Return as JSON with sections array containing: name, duration, content, timing`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Topic: ${request.topic}` }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const response = safeParseJSON(completion.choices[0]?.message?.content, { sections: [] });
    
    // Calculate word count
    const wordCount = response.sections?.reduce((acc: number, section: any) => {
      return acc + (section.content?.split(/\s+/).length || 0);
    }, 0) || 0;

    return {
      sections: response.sections || [],
      totalDuration: durations.total,
      wordCount
    };
  } catch (error: any) {
    console.error("Error generating script:", error);
    throw new Error(`Failed to generate script: ${error.message}`);
  }
}

/**
 * Generate 3 caption variations with hashtags
 */
export async function generateCaptions(request: CaptionRequest): Promise<Caption[]> {
  validateApiKey();
  
  const systemPrompt = `You are a social media copywriter specializing in ${request.platform}. Generate 3 unique caption variations.

Requirements:
- Content topic: ${request.contentTopic}
- Content type: ${request.contentType}
- Tone: ${request.tone || "engaging"}
- Include hashtags: ${request.includeHashtags !== false}
- Platform best practices for ${request.platform}

Variations:
1. Short and punchy (1-2 sentences + emojis)
2. Storytelling (narrative approach)
3. Value-focused (educational angle)

Return as JSON array with: text, hashtagCount, characterCount, variation`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate captions for: ${request.contentTopic}` }
      ],
      temperature: 0.85,
      response_format: { type: "json_object" }
    });

    const response = safeParseJSON(completion.choices[0]?.message?.content, { captions: [] });
    return response.captions || [];
  } catch (error: any) {
    console.error("Error generating captions:", error);
    throw new Error(`Failed to generate captions: ${error.message}`);
  }
}

/**
 * Generate niche and topic-based hashtags
 */
export async function generateHashtags(request: HashtagRequest): Promise<Hashtag[]> {
  validateApiKey();
  
  const count = request.count || 15;
  const style = request.style || "balanced";

  const styleGuidance = {
    niche: "Focus on specific, targeted hashtags with smaller but engaged audiences",
    trending: "Focus on popular, high-reach hashtags with broader appeal",
    balanced: "Mix of niche-specific and trending hashtags"
  };

  const systemPrompt = `You are a social media hashtag expert for ${request.platform}. Generate ${count} effective hashtags.

Strategy: ${styleGuidance[style]}

Requirements:
- Topic: ${request.topic}
- Niche: ${request.niche}
- Platform: ${request.platform}
- Categorize each hashtag (niche-specific, trending, industry, audience, action)
- Estimate reach (High, Medium, Low)

Return as JSON array with: tag (without #), category, estimatedReach`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate hashtags for: ${request.topic} in ${request.niche}` }
      ],
      temperature: 0.75,
      response_format: { type: "json_object" }
    });

    const response = safeParseJSON(completion.choices[0]?.message?.content, { hashtags: [] });
    return response.hashtags || [];
  } catch (error: any) {
    console.error("Error generating hashtags:", error);
    throw new Error(`Failed to generate hashtags: ${error.message}`);
  }
}

/**
 * Generate content ideas with engagement estimates
 */
export async function generateIdeas(request: IdeaRequest): Promise<ContentIdea[]> {
  validateApiKey();
  
  const count = request.count || 5;
  const trending = request.trendingTopics?.join(", ") || "current trends";

  const systemPrompt = `You are a content strategist for ${request.platform}. Generate ${count} compelling content ideas.

Requirements:
- Niche: ${request.niche}
- Target audience: ${request.targetAudience || "general"}
- Consider trending: ${trending}
- Platform: ${request.platform}

For each idea provide:
- Title (catchy, clickable)
- Description (what, why, how)
- EstimatedEngagement (1-10 score)
- Difficulty (Easy, Medium, Hard)
- TrendAlignment (1-10 score)

Return as JSON array with these fields`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate content ideas for: ${request.niche}` }
      ],
      temperature: 0.9,
      response_format: { type: "json_object" }
    });

    const response = safeParseJSON(completion.choices[0]?.message?.content, { ideas: [] });
    return response.ideas || [];
  } catch (error: any) {
    console.error("Error generating ideas:", error);
    throw new Error(`Failed to generate ideas: ${error.message}`);
  }
}

/**
 * Generate carousel slides
 */
export async function generateCarouselSlides(request: CarouselRequest): Promise<CarouselSlide[]> {
  validateApiKey();
  
  const systemPrompt = `You are a carousel content designer. Create ${request.slideCount} slides for an Instagram/LinkedIn carousel.

Requirements:
- Topic: ${request.topic}
- Tone: ${request.tone || "professional"}
- Target audience: ${request.targetAudience || "general"}
- Each slide should be visually engaging and informative

For each slide provide:
- slideNumber (1 to ${request.slideCount})
- title (short, impactful)
- content (key points, 2-3 bullets max)
- imageDescription (detailed description for image generation)
- designTips (colors, layout, typography suggestions)

Return as JSON array with these fields`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create carousel about: ${request.topic}` }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const response = safeParseJSON(completion.choices[0]?.message?.content, { slides: [] });
    return response.slides || [];
  } catch (error: any) {
    console.error("Error generating carousel slides:", error);
    throw new Error(`Failed to generate carousel slides: ${error.message}`);
  }
}

/**
 * Get viral forecast for content idea
 */
export async function getViralForecast(request: ViralForecastRequest): Promise<ViralForecast> {
  validateApiKey();
  
  const systemPrompt = `You are a viral content analyst. Analyze the viral potential of a content idea.

Requirements:
- Topic: ${request.topic}
- Country: ${request.country || "global"}
- Platform: ${request.platform || "cross-platform"}
- Content type: ${request.contentType || "general"}

Provide detailed forecast with:
- viralPotential (1-10 score)
- audienceSize (estimate: "10K-50K", "50K-200K", "200K-1M", "1M+")
- demographics (primaryAge, genderSplit, interests array)
- competitionLevel ("Low", "Medium", "High", "Very High")
- recommendations (array of specific advice)
- bestTimeToPost (day and time range)

Return as JSON object with these fields`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Forecast viral potential for: ${request.topic}` }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const response = safeParseJSON(completion.choices[0]?.message?.content, {
      viralPotential: 5,
      audienceSize: "50K-200K",
      demographics: { primaryAge: "18-34", genderSplit: "50/50", interests: [] },
      competitionLevel: "Medium",
      recommendations: [],
      bestTimeToPost: "Weekdays 9AM-5PM"
    });
    return response.forecast || response;
  } catch (error: any) {
    console.error("Error getting viral forecast:", error);
    throw new Error(`Failed to get viral forecast: ${error.message}`);
  }
}

/**
 * Get best time to post recommendations
 */
export async function getBestTimeToPost(request: BestTimeRequest): Promise<BestTimeResponse> {
  validateApiKey();
  
  const systemPrompt = `You are a social media timing expert. Recommend optimal posting times.

Requirements:
- Platform: ${request.platform}
- Target audience: ${request.targetAudience || "general"}
- Content type: ${request.contentType || "general"}
- Timezone: ${request.timezone || "UTC"}

Provide recommendations with:
- recommendations array (day, times array, rationale, expectedReach)
- peakEngagementWindow (overall best time)
- avoidTimes (when not to post)

Base recommendations on:
- Platform algorithms
- Audience behavior patterns
- Content type engagement patterns
- Day of week trends

Return as JSON object with these fields`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Best posting times for ${request.platform}` }
      ],
      temperature: 0.6,
      response_format: { type: "json_object" }
    });

    const response = safeParseJSON(completion.choices[0]?.message?.content, {
      recommendations: [],
      peakEngagementWindow: "Weekdays 9AM-12PM",
      avoidTimes: []
    });
    return response.schedule || response;
  } catch (error: any) {
    console.error("Error getting best time to post:", error);
    throw new Error(`Failed to get best time to post: ${error.message}`);
  }
}
