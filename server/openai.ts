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
  linksToInclude?: string | null;
  platforms: string[];
  contentType: "video_script" | "caption" | "both";
  contentFormat?: "video" | "image" | "carousel" | "tiktok_text";
  topic?: string;
  avoidPatterns?: string[];
  topPerformingPosts?: { title: string; views: number; postedOn?: string }[];
  sceneCount?: number; // 1-3 scenes for video content
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

  const linksSection = request.linksToInclude
    ? `\n\nIMPORTANT - Include these links/CTAs in your captions naturally:\n${request.linksToInclude}`
    : "";

  const systemPrompt = `You are an expert social media content strategist and copywriter. You create engaging, platform-optimized content that resonates with target audiences.

Brand Voice: ${request.brandVoice}
Target Audience: ${request.targetAudience}
Content Goals: ${request.contentGoals}
Platforms: ${request.platforms.join(", ")}
Content Format: ${contentFormat.toUpperCase()}

CRITICAL - HOOK VIEWERS IN THE FIRST 8 SECONDS using one of these proven techniques:
1. TEASE THE PAYOFF - Show/mention the most exciting moment upfront to make them want to see how it unfolds
2. SOLVE A PROBLEM - Address a pain point directly: "Tired of X? Here's how to fix it"
3. ASK A RELATABLE QUESTION - Make viewers stop and think: "Have you ever wondered why...?"
4. SHARE A SHOCKING FACT - Mind-blowing stats grab attention instantly
5. USE POP CULTURE - Reference trending memes, sounds, or viral moments
6. INSPIRATIONAL QUOTE - For motivational content, open with a powerful quote
7. TELL A JOKE - Disarm viewers with unexpected humor
8. ENGAGE THE SENSES - Start with dynamic visuals, sound effects, motion

VIDEO INTRO RULES:
- Hook must happen in FIRST 8 SECONDS - no slow intros
- Keep branded intro under 10 seconds total
- Get to the main content by seconds 11-20
- Skip generic greetings like "Hey guys, welcome back"
- Front-load the value proposition

Your content should:
- Match the brand voice perfectly
- Appeal directly to the target audience
- Support the content goals
- Be optimized for the specified platforms
- Use trending formats and hooks
- Create curiosity and urgency to keep watching

CAPTION FRAMEWORK - Follow this structured approach:
1. CONTEXT: Lead with a clear, searchable phrase (not vague openers like "This is it" or "So...")
2. BELIEF BREAK: Challenge an assumption or introduce a surprising perspective
3. PAYOFF: Deliver the value or insight promised
4. CTA: End with a question to drive comments (questions > statements)

CAPTION RULES:
- SEARCH-FIRST: Write for Instagram/TikTok SEO - lead with searchable keywords
- KEYWORD REPETITION: Use main keywords 2-3 times naturally instead of relying on hashtags
- STANDALONE: Assume videos watched without sound - caption must make sense alone
- NO "as you can see" LANGUAGE: Restate what's happening visually, don't reference it
- CONVERSATION STARTERS: Write to spark engagement, not to explain or push links
- PLATFORM-SPECIFIC: Tailor length and style for each platform (TikTok: shorter, Instagram: medium, YouTube: longer)
- PRIORITIZE ENGAGEMENT: Optimize for comments, saves, and replies over outbound clicks
- STRUCTURED OUTPUT: Use the framework above, not freeform writing

CAPTION DON'TS:
- No generic hooks like "Stop scrolling!" or "Wait for it!"
- No vague openers like "This changed everything" without immediate context
- No link-pushing as the main focus
- No hashtag-stuffing - max 3-5 targeted hashtags
- No explaining what viewers can already see${linksSection}${avoidSection}${learningSection}`;

  let formatSpecificPrompt = "";
  let formatSpecificJson = "";

  const numScenes = request.sceneCount || 3;
  
  if (contentFormat === "video") {
    const sceneInstructions = numScenes === 1 
      ? `Generate video content with script and 1 scene (single continuous video).

The single scene should combine the hook, main content, and CTA into one cohesive 15-20 second video.
Start with an attention-grabbing opening, deliver value, and end with a call to action.`
      : numScenes === 2
      ? `Generate video content with script and 2 scene-specific video prompts.

SCENE 1 IS THE HOOK (first 10 seconds) - CRITICAL for retention:
- Must grab attention immediately using one of the 8 hook techniques
- Start with the payoff, problem, question, or shocking fact
- No slow intros, no "Hey guys", no channel branding

SCENE 2 IS THE PAYOFF/CTA (10-15 seconds):
- Deliver the main value and call to action
- End strong with clear next steps`
      : `Generate video content with script and 3 scene-specific video prompts.

SCENE 1 IS THE HOOK (first 8 seconds) - CRITICAL for retention:
- Must grab attention immediately using one of the 8 hook techniques
- Start with the payoff, problem, question, or shocking fact
- No slow intros, no "Hey guys", no channel branding
- This scene determines if viewers stay or leave

Focus on concrete actions, subjects, and dynamic camera movements.`;

    formatSpecificPrompt = sceneInstructions;
    
    const sceneExamples = numScenes === 1
      ? `{ "sceneNumber": 1, "duration": 18, "visualPrompt": "COMPLETE VIDEO - Hook opening, main content delivery, and strong CTA ending. Dynamic visuals throughout.", "sceneDescription": "Full video combining hook, content, and CTA" }`
      : numScenes === 2
      ? `{ "sceneNumber": 1, "duration": 10, "visualPrompt": "THE HOOK SCENE - Must be visually dynamic and attention-grabbing. Show the problem/payoff/shocking moment.", "sceneDescription": "The hook - grabs viewer attention" },
      { "sceneNumber": 2, "duration": 12, "visualPrompt": "PAYOFF/CTA - Deliver the value and show the result, transformation, or call to action. End strong.", "sceneDescription": "The main content and call to action" }`
      : `{ "sceneNumber": 1, "duration": 8, "visualPrompt": "THE HOOK SCENE - Must be visually dynamic and attention-grabbing. Show the problem/payoff/shocking moment. Use motion, close-ups, dramatic angles.", "sceneDescription": "The hook - grabs viewer attention in first 8 seconds" },
      { "sceneNumber": 2, "duration": 10, "visualPrompt": "MAIN CONTENT - Deliver the value promised in the hook. Show the solution or story development.", "sceneDescription": "The main content delivery" },
      { "sceneNumber": 3, "duration": 8, "visualPrompt": "PAYOFF/CTA - Show the result, transformation, or call to action. End strong.", "sceneDescription": "The payoff and call to action" }`;

    formatSpecificJson = `"videoPrompts": {
    "voiceoverText": "The exact text for AI voiceover. START WITH THE HOOK - first sentence must grab attention. Energetic and conversational.",
    "voiceStyle": "Description of voice style (e.g., 'Friendly, energetic female voice with excitement')",
    "scenePrompts": [
      ${sceneExamples}
    ],
    "thumbnailPrompt": "Click-worthy thumbnail - clear subject, bold colors, expressive face if applicable, text overlay suggestion",
    "brollSuggestions": ["List of 3-5 B-roll footage ideas for visual variety"]
  }
  NOTE: Generate exactly ${numScenes} scene${numScenes > 1 ? 's' : ''}.`;
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
  "caption": "STRUCTURED CAPTION following the framework: [CONTEXT: searchable keyword phrase] + [BELIEF BREAK: surprising insight] + [PAYOFF: the value] + [CTA: a question to drive comments]. Lead with searchable terms, include 2-3 keyword repetitions naturally. End with an engaging question. Must work standalone without watching the video.",
  "hashtags": ["max", "5", "targeted", "hashtags", "only"],
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

// DALL-E Image Generation
export interface DalleImageRequest {
  prompt: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
}

export interface DalleImageResult {
  imageUrl: string;
  revisedPrompt?: string;
}

// Create a separate OpenAI client for DALL-E using the dedicated key
const dalleClient = new OpenAI({
  apiKey: process.env.OPENAI_DALLE_API_KEY || process.env.OPENAI_API_KEY,
});

export async function generateDalleImage(request: DalleImageRequest): Promise<DalleImageResult> {
  if (!isDalleConfigured()) {
    throw new Error("DALL-E API key not configured. Please add OPENAI_DALLE_API_KEY to your secrets.");
  }

  const response = await dalleClient.images.generate({
    model: "dall-e-3",
    prompt: request.prompt,
    n: 1,
    size: request.size || "1024x1024",
    quality: request.quality || "standard",
    style: request.style || "vivid",
  });

  const imageUrl = response.data[0]?.url;
  if (!imageUrl) {
    throw new Error("No image generated from DALL-E");
  }

  return {
    imageUrl,
    revisedPrompt: response.data[0]?.revised_prompt,
  };
}

export function isDalleConfigured(): boolean {
  return !!(process.env.OPENAI_DALLE_API_KEY || process.env.OPENAI_API_KEY);
}
