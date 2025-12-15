import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface ContentGenerationRequest {
  briefId: string;
  brandVoice: string;
  targetAudience: string;
  contentGoals: string;
  platforms: string[];
  contentType: "video_script" | "caption" | "both";
  topic?: string;
}

export interface GeneratedContentResult {
  script?: string;
  caption?: string;
  hashtags?: string[];
  contentIdeas?: string[];
}

export async function generateSocialContent(
  request: ContentGenerationRequest
): Promise<GeneratedContentResult> {
  const systemPrompt = `You are an expert social media content strategist and copywriter. You create engaging, platform-optimized content that resonates with target audiences.

Brand Voice: ${request.brandVoice}
Target Audience: ${request.targetAudience}
Content Goals: ${request.contentGoals}
Platforms: ${request.platforms.join(", ")}

Your content should:
- Match the brand voice perfectly
- Appeal directly to the target audience
- Support the content goals
- Be optimized for the specified platforms
- Use trending formats and hooks when appropriate`;

  const userPrompt = `Generate ${request.contentType === "both" ? "a video script AND a caption" : request.contentType === "video_script" ? "a video script" : "a caption"} for ${request.platforms.join(" and ")}.

${request.topic ? `Topic/Theme: ${request.topic}` : "Create content around a trending topic relevant to the brand."}

Respond in JSON format:
{
  "script": "The full video script with scene directions if applicable (only if generating video_script or both)",
  "caption": "The social media caption optimized for engagement (only if generating caption or both)",
  "hashtags": ["array", "of", "relevant", "hashtags"],
  "contentIdeas": ["3-5 follow-up content ideas based on this topic"]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content generated from OpenAI");
  }

  return JSON.parse(content) as GeneratedContentResult;
}

export async function generateContentIdeas(
  brandVoice: string,
  targetAudience: string,
  contentGoals: string,
  count: number = 5
): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a social media strategist. Generate content ideas that align with the brand.
Brand Voice: ${brandVoice}
Target Audience: ${targetAudience}
Content Goals: ${contentGoals}`,
      },
      {
        role: "user",
        content: `Generate ${count} unique, engaging content ideas. Respond in JSON: { "ideas": ["idea1", "idea2", ...] }`,
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return [];
  }

  const parsed = JSON.parse(content);
  return parsed.ideas || [];
}
