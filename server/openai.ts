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
  avoidPatterns?: string[];
}

export interface GeneratedContentResult {
  script?: string;
  caption?: string;
  hashtags?: string[];
  contentIdeas?: string[];
  videoPrompts?: {
    voiceoverText?: string;
    voiceStyle?: string;
    visualDescription?: string;
    thumbnailPrompt?: string;
    brollSuggestions?: string[];
  };
}

export async function generateSocialContent(
  request: ContentGenerationRequest
): Promise<GeneratedContentResult> {
  const avoidSection = request.avoidPatterns && request.avoidPatterns.length > 0
    ? `\n\nIMPORTANT - AVOID these elements based on past feedback:\n${request.avoidPatterns.map(p => `- ${p}`).join("\n")}`
    : "";

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
- Use trending formats and hooks when appropriate${avoidSection}`;

  const userPrompt = `Generate ${request.contentType === "both" ? "a video script AND a caption" : request.contentType === "video_script" ? "a video script" : "a caption"} for ${request.platforms.join(" and ")}.

${request.topic ? `Topic/Theme: ${request.topic}` : "Create content around a trending topic relevant to the brand."}

Respond in JSON format:
{
  "script": "The full video script with scene directions if applicable (only if generating video_script or both)",
  "caption": "The social media caption optimized for engagement (only if generating caption or both)",
  "hashtags": ["array", "of", "relevant", "hashtags"],
  "contentIdeas": ["3-5 follow-up content ideas based on this topic"],
  "videoPrompts": {
    "voiceoverText": "The exact text to use for AI voiceover (ElevenLabs). This should be the spoken narration, conversational and natural.",
    "voiceStyle": "Description of voice style (e.g., 'Friendly, energetic female voice with slight excitement')",
    "visualDescription": "Detailed prompt for AI video generation - describe the visuals, scenes, style, colors, mood for tools like Runway/Pika",
    "thumbnailPrompt": "AI image generation prompt for the video thumbnail - eye-catching, include text overlay suggestions",
    "brollSuggestions": ["List of 3-5 B-roll footage ideas to include in the video"]
  }
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

export interface ContentAnalysisResult {
  whyThisWorked: string[];
  visualBreakdown: {
    camera: string;
    text: string;
    colors: string;
    framing: string;
  };
  contentStructure: {
    openingLine: string;
    middleIdea: string;
    payoff: string;
  };
  adaptationForMyChannel: {
    sameStructure: string;
    differentTopic: string;
    myTone: string;
  };
  hookRewrites: string[];
  postAdvice: {
    platform: string;
    format: string;
    captionAngle: string;
  };
}

export async function analyzeViralContent(
  imageBase64: string,
  mimeType: string,
  brandBrief?: { brandVoice: string; targetAudience: string; contentGoals: string }
): Promise<ContentAnalysisResult> {
  const brandContext = brandBrief
    ? `\n\nBrand Context for Adaptation:
- Brand Voice: ${brandBrief.brandVoice}
- Target Audience: ${brandBrief.targetAudience}
- Content Goals: ${brandBrief.contentGoals}`
    : "\n\nNo brand brief provided - provide generic adaptation advice.";

  const systemPrompt = `You are an expert social media analyst who breaks down viral content. Analyze the screenshot of a social media post and provide a detailed breakdown.${brandContext}`;

  const userPrompt = `Analyze this viral/successful social media post screenshot and provide insights in the following structure:

1. **Why This Worked** - 2-3 bullet points on the emotion, hook, and audience appeal
2. **Visual Breakdown** - Camera angles/shot type, text overlays, colors, and framing
3. **Content Structure** - Opening line/hook, middle idea/value, and payoff/CTA
4. **Adaptation for MY Channel** - How to use the same structure with a different topic in my brand's tone
5. **3 Hook Rewrites** - Short, punchy, scroll-stopping variations of the hook
6. **Post Advice** - Best platform, format recommendations, and caption angle

Respond in JSON format:
{
  "whyThisWorked": ["bullet 1", "bullet 2", "bullet 3"],
  "visualBreakdown": {
    "camera": "description of camera/shot",
    "text": "text overlays analysis",
    "colors": "color palette analysis",
    "framing": "composition and framing"
  },
  "contentStructure": {
    "openingLine": "the hook/opening",
    "middleIdea": "the value/middle content",
    "payoff": "the CTA/payoff"
  },
  "adaptationForMyChannel": {
    "sameStructure": "how to use the same structure",
    "differentTopic": "topic suggestions for the brand",
    "myTone": "how to adapt to brand voice"
  },
  "hookRewrites": ["hook 1", "hook 2", "hook 3"],
  "postAdvice": {
    "platform": "recommended platform(s)",
    "format": "format recommendation",
    "captionAngle": "caption strategy"
  }
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No analysis generated from OpenAI");
  }

  return JSON.parse(content) as ContentAnalysisResult;
}
