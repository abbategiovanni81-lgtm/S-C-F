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
  contentFormat?: "video" | "image" | "carousel" | "tiktok_text";
  topic?: string;
  avoidPatterns?: string[];
  topPerformingPosts?: { title: string; views: number; postedOn?: string }[];
}

export interface ScenePrompt {
  sceneNumber: number;
  duration: number; // in seconds
  visualPrompt: string; // detailed prompt for AI video generation
  sceneDescription: string; // what's happening in this scene (from script)
}

export interface GeneratedContentResult {
  script?: string;
  caption?: string;
  hashtags?: string[];
  contentIdeas?: string[];
  contentFormat?: "video" | "image" | "carousel" | "tiktok_text";
  videoPrompts?: {
    voiceoverText?: string;
    voiceStyle?: string;
    visualDescription?: string; // legacy: single prompt (still supported for backwards compat)
    scenePrompts?: ScenePrompt[]; // new: 2-3 scene-specific prompts for clip generation
    thumbnailPrompt?: string;
    brollSuggestions?: string[];
  };
  imagePrompts?: {
    mainImagePrompt?: string;
    textOverlay?: string;
    colorScheme?: string;
    style?: string;
    aspectRatio?: "1:1" | "9:16" | "16:9" | "4:5";
  };
  carouselPrompts?: {
    slides: Array<{
      imagePrompt: string;
      textOverlay?: string;
    }>;
    theme?: string;
  };
  tiktokTextPost?: {
    mainText: string;
    highlightedText?: string;
    ctaText?: string;
    backgroundColor?: string;
  };
}

export async function generateSocialContent(
  request: ContentGenerationRequest
): Promise<GeneratedContentResult> {
  const avoidSection = request.avoidPatterns && request.avoidPatterns.length > 0
    ? `\n\nIMPORTANT - AVOID these elements based on past feedback:\n${request.avoidPatterns.map(p => `- ${p}`).join("\n")}`
    : "";

  const learningSection = request.topPerformingPosts && request.topPerformingPosts.length > 0
    ? `\n\nLEARN FROM TOP PERFORMING POSTS - Study these successful post titles/topics and incorporate similar hooks, structures, and themes:\n${request.topPerformingPosts.slice(0, 5).map((p, i) => `${i + 1}. "${p.title}" (${(p.views || 0).toLocaleString()} views)`).join("\n")}`
    : "";

  const contentFormat = request.contentFormat || "video";

  const systemPrompt = `You are an expert social media content strategist and copywriter. You create engaging, platform-optimized content that resonates with target audiences.

Brand Voice: ${request.brandVoice}
Target Audience: ${request.targetAudience}
Content Goals: ${request.contentGoals}
Platforms: ${request.platforms.join(", ")}
Content Format: ${contentFormat.toUpperCase()}

Your content should:
- Match the brand voice perfectly
- Appeal directly to the target audience
- Support the content goals
- Be optimized for the specified platforms
- Use trending formats and hooks when appropriate${avoidSection}${learningSection}`;

  let formatSpecificPrompt = "";
  let formatSpecificJson = "";

  if (contentFormat === "video") {
    formatSpecificPrompt = `Generate video content with script and 2-3 scene-specific video prompts. Each scene should be 8-10 seconds and describe a specific action or visual moment from the script. Focus on concrete actions and subjects rather than abstract moods.`;
    formatSpecificJson = `"videoPrompts": {
    "voiceoverText": "The exact text to use for AI voiceover (ElevenLabs). This should be the spoken narration, conversational and natural.",
    "voiceStyle": "Description of voice style (e.g., 'Friendly, energetic female voice with slight excitement')",
    "scenePrompts": [
      { "sceneNumber": 1, "duration": 8, "visualPrompt": "Detailed AI video prompt for scene 1 - describe specific action, subject, camera angle (e.g., 'Close-up of hands typing on laptop, then person looking frustrated and rubbing temples, soft indoor lighting')", "sceneDescription": "What happens in this scene" },
      { "sceneNumber": 2, "duration": 10, "visualPrompt": "Detailed AI video prompt for scene 2 - different action/moment from the script", "sceneDescription": "What happens in this scene" }
    ],
    "thumbnailPrompt": "AI image generation prompt for the video thumbnail - eye-catching, include text overlay suggestions",
    "brollSuggestions": ["List of 3-5 B-roll footage ideas to include in the video"]
  }
  NOTE: scenePrompts should have 2-3 scenes based on script complexity. Adjust scene count and durations to fit the voiceover length (total ~20-30 seconds).`;
  } else if (contentFormat === "image") {
    formatSpecificPrompt = `Generate a single promotional image post with AI image generation prompts.`;
    formatSpecificJson = `"imagePrompts": {
    "mainImagePrompt": "Detailed AI image generation prompt - describe the visual scene, style, composition, lighting, colors in detail for Fal.ai/DALL-E",
    "textOverlay": "The key text/headline to overlay on the image (keep short and punchy)",
    "colorScheme": "Primary colors to use (e.g., 'deep purple and gold with white accents')",
    "style": "Visual style (e.g., 'minimalist', 'bold graphic', 'photorealistic', 'illustrated')",
    "aspectRatio": "Best aspect ratio for the platform: '1:1' for Instagram feed, '9:16' for Stories/Reels, '16:9' for YouTube"
  }`;
  } else if (contentFormat === "carousel") {
    formatSpecificPrompt = `Generate a carousel/slideshow post with 3-5 slides, each with its own image prompt.`;
    formatSpecificJson = `"carouselPrompts": {
    "slides": [
      { "imagePrompt": "AI image prompt for slide 1 - hook/attention grabber", "textOverlay": "Slide 1 text" },
      { "imagePrompt": "AI image prompt for slide 2 - main content", "textOverlay": "Slide 2 text" },
      { "imagePrompt": "AI image prompt for slide 3 - supporting point", "textOverlay": "Slide 3 text" },
      { "imagePrompt": "AI image prompt for slide 4 - CTA/conclusion", "textOverlay": "Slide 4 text" }
    ],
    "theme": "Overall visual theme tying the carousel together"
  }`;
  } else if (contentFormat === "tiktok_text") {
    formatSpecificPrompt = `Generate a TikTok-style text post - this is a simple graphic with bold text overlay, typically 1-2 punchy lines promoting something. Like a promotional announcement or offer.`;
    formatSpecificJson = `"tiktokTextPost": {
    "mainText": "The main promotional text (1-2 short punchy lines, like 'Sign up and try all premium features for the next 36 hrs!!')",
    "highlightedText": "Key words to highlight in a different color (e.g., the website name, discount amount, or key feature)",
    "ctaText": "Call-to-action text if any (e.g., 'Try Now', 'Link in bio')",
    "backgroundColor": "Suggested background color or style (e.g., 'dark with gradient', 'brand purple')"
  }`;
  }

  const userPrompt = `Generate ${request.contentType === "both" ? "content with caption" : request.contentType === "video_script" ? "content" : "a caption"} for ${request.platforms.join(" and ")}.

Content Format: ${contentFormat.toUpperCase()}
${formatSpecificPrompt}

${request.topic ? `Topic/Theme: ${request.topic}` : "Create content around a trending topic relevant to the brand."}

Respond in JSON format:
{
  "contentFormat": "${contentFormat}",
  ${contentFormat === "video" ? '"script": "The full video script with scene directions",' : '"script": null,'}
  "caption": "The social media caption optimized for engagement",
  "hashtags": ["array", "of", "relevant", "hashtags"],
  "contentIdeas": ["3-5 follow-up content ideas based on this topic"],
  ${formatSpecificJson}
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

export interface AnalyticsExtractionResult {
  platform: string;
  reportingRange?: string;
  overview?: {
    postViews?: number;
    profileViews?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    followers?: number;
    followersChange?: number;
    estimatedRewards?: number;
  };
  topPosts?: Array<{
    rank: number;
    title: string;
    views: number;
    likes?: number;
    postedOn?: string;
  }>;
  trafficSources?: {
    forYou?: number;
    search?: number;
    personalProfile?: number;
    following?: number;
    sound?: number;
    other?: number;
  };
  searchQueries?: Array<{
    query: string;
    percentage: number;
  }>;
  audienceData?: {
    gender?: { male?: number; female?: number; other?: number };
    age?: Record<string, number>;
    locations?: Array<{ name: string; percentage: number }>;
  };
  bestTimes?: {
    day?: string;
    time?: string;
    hourlyData?: Array<{ hour: string; activity: number }>;
  };
  confidenceScore: number;
}

export async function extractAnalyticsFromScreenshot(
  imageBase64: string,
  mimeType: string = "image/png"
): Promise<AnalyticsExtractionResult> {
  const systemPrompt = `You are an expert at reading and extracting structured data from social media analytics screenshots. 
Your job is to accurately extract all visible metrics, numbers, and data from the screenshot.

IMPORTANT:
- Extract EXACT numbers you can see (e.g., "14K" = 14000, "2,261" = 2261)
- If you see percentages (like -51.6%), include them as change values
- For top posts, extract the title/description, view count, and post date if visible
- For audience data, extract gender percentages, age breakdowns, locations
- For best times, extract the day, time range, and any hourly activity data
- Identify the platform (TikTok, Instagram, YouTube, etc.) from the UI design
- Provide a confidence score (0-100) based on how clearly you could read the data`;

  const userPrompt = `Extract all analytics data from this social media analytics screenshot.

Respond in JSON format with this exact structure:
{
  "platform": "tiktok|instagram|youtube|twitter|other",
  "reportingRange": "e.g., '28 days', '7 days', 'Nov 17 - Dec 14'",
  "overview": {
    "postViews": number or null,
    "profileViews": number or null,
    "likes": number or null,
    "comments": number or null,
    "shares": number or null,
    "followers": number or null,
    "followersChange": number or null (positive or negative),
    "estimatedRewards": number or null
  },
  "topPosts": [
    { "rank": 1, "title": "post title/description", "views": number, "likes": number or null, "postedOn": "date string" }
  ],
  "trafficSources": {
    "forYou": percentage or null,
    "search": percentage or null,
    "personalProfile": percentage or null,
    "following": percentage or null,
    "sound": percentage or null,
    "other": percentage or null
  },
  "searchQueries": [
    { "query": "search term", "percentage": number }
  ],
  "audienceData": {
    "gender": { "male": percentage, "female": percentage, "other": percentage },
    "age": { "18-24": percentage, "25-34": percentage, etc },
    "locations": [{ "name": "country/city", "percentage": number }]
  },
  "bestTimes": {
    "day": "most active day",
    "time": "peak time range",
    "hourlyData": [{ "hour": "12p", "activity": relative_value }]
  },
  "confidenceScore": 0-100 based on data clarity
}

Only include fields you can actually see in the screenshot. Use null for fields not visible.`;

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
    throw new Error("No analytics data extracted from OpenAI");
  }

  return JSON.parse(content) as AnalyticsExtractionResult;
}

export interface ReplyGenerationRequest {
  postContent: string;
  postAuthor?: string;
  platform: string;
  brandVoice: string;
  targetAudience: string;
  contentGoals: string;
  replyTone?: "helpful" | "promotional" | "educational" | "friendly";
}

export interface ReplyGenerationResult {
  replyContent: string;
  replyTone: string;
  alternativeReplies: string[];
  keyPointsAddressed: string[];
}

export async function generateReply(request: ReplyGenerationRequest): Promise<ReplyGenerationResult> {
  const toneDescription = request.replyTone || "helpful";
  
  const systemPrompt = `You are a social media community manager for a brand. You craft thoughtful, engaging replies to comments and posts.

Brand Voice: ${request.brandVoice}
Target Audience: ${request.targetAudience}
Content Goals: ${request.contentGoals}
Desired Tone: ${toneDescription}
Platform: ${request.platform}

Your replies should:
- Match the brand voice exactly
- Be conversational and authentic (not robotic)
- Add value (answer questions, share insights, be helpful)
- Subtly promote the brand when appropriate without being pushy
- Be the right length for the platform (shorter for TikTok/Instagram, can be longer for YouTube)
- Never include hashtags in replies`;

  const userPrompt = `Generate a reply to this ${request.platform} post/comment:

${request.postAuthor ? `Author: @${request.postAuthor}` : ""}
Content: "${request.postContent}"

Respond in JSON format:
{
  "replyContent": "The main suggested reply",
  "replyTone": "The tone used (helpful/promotional/educational/friendly)",
  "alternativeReplies": ["2-3 alternative reply options with slightly different approaches"],
  "keyPointsAddressed": ["List of key points or questions addressed in the reply"]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No reply generated from OpenAI");
  }

  return JSON.parse(content) as ReplyGenerationResult;
}

export interface TrendAnalysisResult {
  isQuestion: boolean;
  sentiment: "positive" | "negative" | "neutral";
  topics: string[];
  keywords: string[];
  engagementPotential: "high" | "medium" | "low";
  suggestedAction: "reply" | "ignore" | "monitor";
}

export async function analyzePostForListening(
  postContent: string,
  brandKeywords: string[]
): Promise<TrendAnalysisResult> {
  const systemPrompt = `You are a social media analyst. Analyze posts to determine if they're worth engaging with.

Brand Keywords to match: ${brandKeywords.join(", ")}

Identify:
1. Is this a question that could be answered?
2. What's the sentiment?
3. What topics/keywords are discussed?
4. Is this a good opportunity to engage?`;

  const userPrompt = `Analyze this social media post:

"${postContent}"

Respond in JSON:
{
  "isQuestion": true/false,
  "sentiment": "positive/negative/neutral",
  "topics": ["main topics discussed"],
  "keywords": ["matched brand keywords"],
  "engagementPotential": "high/medium/low",
  "suggestedAction": "reply/ignore/monitor"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No analysis from OpenAI");
  }

  return JSON.parse(content) as TrendAnalysisResult;
}
