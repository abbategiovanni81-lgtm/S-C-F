import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// ============================================================================
// VIRAL CONTENT KNOWLEDGE BASE
// Curated from top-performing social media content patterns
// ============================================================================

export const VIRAL_HOOKS = {
  growth: [
    '"Unpopular opinion:..."',
    '"Here\'s the secret no one tells you about..."',
    '"Why does nobody talk about..."',
    '"This is going to be controversial..."',
    '"How to [result] without [common method]"',
    '"Stop doing [common thing]. Here\'s why..."',
    '"I spent [time/money] so you don\'t have to"',
    '"I\'ve been wrong about [topic] for years"',
    '"What nobody tells you about [topic]..."',
    '"Think [X]? Think again."',
    '"The real reason [common frustration]..."',
    '"This [industry term] changed everything for me"',
    '"Can we talk about [problem]?"',
    '"What if [surprising claim]?"',
    '"The [industry] doesn\'t want you to know this"',
    '"I tried [trend] for [time]. Here\'s what happened"',
    '"I analyzed [number] [things]. Here\'s what works"',
    '"Forget everything you know about [topic]"',
    '"Controversial take:..."',
    '"I wish someone told me this before [milestone]"',
    '"[Number] things you\'re doing wrong with [topic]"',
    '"The biggest mistake I see [audience] make is..."',
    '"Here\'s what [success metric] really looks like"',
    '"This one change [impressive result]"',
  ],
  viral: [
    '"This is why you\'re [problem]"',
    '"The truth about [topic]"',
    '"This single [thing] changed my life"',
    '"Stop doing [action]"',
    '"Here\'s why [thing] isn\'t working for you"',
    '"You\'ve been [action] wrong this whole time"',
    '"My unpopular opinion about [topic]"',
    '"I can\'t believe I [action/mistake]"',
    '"The [thing] that [result]"',
    '"Am I the only one who [relatable thing]?"',
    '"My [expert/role] told me..."',
    '"Here\'s why [common belief] is wrong"',
    '"The [thing] nobody talks about"',
    '"What I wish I knew before [milestone]"',
    '"[Famous person/expert] was right about..."',
    '"How I [achievement] in [short time]"',
    '"This might make you [emotion]"',
    '"Why [common approach] doesn\'t work"',
    '"The real reason [outcome]"',
    '"Watch until the end to see [teaser]"',
    '"If you [problem], you NEED to know this"',
    '"I was today years old when I learned..."',
    '"Most people have no idea that..."',
    '"[Category] I swear by as a [role]"',
    '"Day [number] of [challenge/journey]"',
    '"Here\'s what [result] actually looks like"',
    '"I asked [person/AI] to [task]..."',
  ],
  negative: [
    '"Most people fail at [goal] because of this one thing."',
    '"You\'ve been lied to about [strategy or trend]."',
    '"The dark side of [popular platform or tool] no one talks about."',
    '"[Thing everyone\'s doing] isn\'t working anymore."',
    '"Why [niche or industry] experts don\'t want you to know this."',
    '"You\'re following [common path] straight into burnout."',
    '"You\'re building the wrong audience with [specific tactic]."',
    '"Think you\'re doing everything right? Think again."',
    '"[Goal] isn\'t your problem—[habit] is."',
    '"You\'re overcomplicating [simple but essential task]."',
    '"Your [platform] strategy is working... against you."',
    '"[Trusted source] was wrong about this."',
    '"If you keep doing [mistake], you\'ll stay stuck forever."',
    '"You\'re doing too much of [action] and not enough of [better action]."',
    '"The truth about [easy tactic everyone promotes]."',
    '"The harsh truth about [why people unfollow or ignore]."',
    '"[Thing you thought was a strength] is actually a weakness."',
    '"[Common framework] is outdated—and here\'s what works instead."',
    '"People scroll past because of [mistake] you didn\'t notice."',
    '"Your audience doesn\'t trust you because of [invisible mistake]."',
  ],
  converting: [
    '"You\'ll never believe..."',
    '"The secret to [result]"',
    '"Here\'s what nobody tells you about..."',
    '"I spent [time] testing [thing]—here\'s what I learned"',
    '"Why [common approach] is sabotaging your [goal]"',
    '"[Number] things I wish I knew about [topic]"',
    '"The one thing [experts] always get wrong about..."',
    '"How to [achievement] without [sacrifice]"',
    '"This changed everything I thought about [topic]"',
    '"Most [audience] don\'t realize..."',
    '"I finally figured out [problem]"',
    '"The biggest lie about [industry/topic]"',
    '"Here\'s a [topic] hack most people miss"',
    '"Why [thing] is harder than it looks"',
    '"[Number] mistakes that are killing your [goal]"',
    '"The truth about [topic] (that nobody talks about)"',
    '"How I went from [before] to [after]"',
    '"You\'re doing [action] wrong—here\'s why"',
    '"I tested [thing] for [time]. Here\'s what happened"',
    '"What [experts/successful people] actually do"',
  ],
};

export const FORMAT_SPECIFIC_IDEAS = {
  reel: [
    "Tutorials (step-by-step how-to)",
    "Before & After transformations",
    "Mini Vlogs (day snippets)",
    "Problem-Solution format",
    "Trending audio/challenges",
    "Talking Head (direct to camera)",
    "Dance or Lip-Sync Challenges",
    "Behind the Scenes moments",
    "Collaborations with others",
    "Day in a Life of...",
    "Q&A Response format",
    "Product Review",
    "Transformation Journey",
    "Challenge Participation",
  ],
  carousel: [
    // EDUCATIONAL (trust + saves + long-term growth)
    "Step-by-step tutorials with clear takeaway",
    "Quick checklists ('swipe to save')",
    "Top tools I use",
    "Beginner mistakes to avoid",
    "Myth-busting carousels",
    // RELATABLE (engagement + resonance)
    "Before vs after (mindset, life, results)",
    "'If you know, you know' struggles",
    "Things I wish I knew earlier",
    "Unpopular opinions",
    // STORYTELLING (depth + loyalty)
    "Mistakes that almost made me quit",
    "From struggle → success journey",
    "What no one tells you about [topic]",
    "Behind-the-scenes process",
    // CREDIBLE (conversion + authority)
    "Case studies (result in X time)",
    "What I'd do if I started over",
    "Lessons from investing time/money",
    // SAVEABLE (algorithm signals)
    "Infographics & breakdowns",
    "Do's & Don'ts",
    "Cheat sheets (hooks, captions, ideas)",
    "Niche-specific 'Top 5' resources",
  ],
  single_post: [
    "Inspirational Quote",
    "Aesthetic Photo",
    "Announcements",
    "User-Generated Content",
    "Milestone Celebration (follower count)",
    "Behind the Scenes Image",
    "Brand Collab",
    "Promotional Offer",
    "Sneak Peek of an Upcoming Event",
  ],
  story: [
    "Poll or Quiz",
    "Countdown Timer",
    "This or That Challenge",
    "Repost of Someone Else's Content",
    "Quick Tip of the Day",
    "Flash Sale Announcement",
    "New Post Alert",
    "Unboxing Video",
    "Location Tagging (what's at an event)",
    "Direct Link to a Product or Article",
  ],
  ugc_talking: [
    "Product unboxing with genuine reactions",
    "First impressions and honest review",
    "Get Ready With Me featuring product",
    "Morning/night routine with product integration",
    "Storytime while using product",
    "POV: discovering this product for the first time",
    "Answering FAQs about the product",
    "Day in my life with product woven in",
    "Testimonial-style recommendation",
    "Demo while explaining benefits naturally",
  ],
  ugc_lipsync: [
    "Trending sound with product showcase",
    "Relatable moment + product solution",
    "POV scenarios with lip-sync audio",
    "Before/after transformation with trending audio",
    "Reaction videos with viral sounds",
    "Comedy skit with product integration",
    "Duet-style content with brand audio",
    "Aesthetic reveal with trending music",
  ],
  studio_longform: [
    "In-depth tutorial (5-15 min)",
    "Documentary-style brand story",
    "Expert interview or panel discussion",
    "Behind the scenes: how it's made",
    "Customer success story deep-dive",
    "Educational series episode",
    "Product comparison and analysis",
    "Live event or webinar recording",
    "Q&A session with detailed answers",
    "Course or training content",
  ],
  video: [
    "Tutorials (step-by-step how-to)",
    "Before & After transformations",
    "Problem-Solution format",
    "Talking Head (direct to camera)",
    "Behind the Scenes moments",
    "Q&A Response format",
    "Product Review",
    "Transformation Journey",
  ],
  image: [
    "Inspirational Quote",
    "Aesthetic Photo",
    "Announcements",
    "User-Generated Content",
    "Milestone Celebration",
    "Behind the Scenes Image",
    "Brand Collab",
    "Promotional Offer",
  ],
  tiktok_text: [
    "Bold promotional announcement",
    "Sale or discount reveal",
    "New feature announcement",
    "Limited time offer",
    "Countdown to launch",
    "Quote or testimonial highlight",
  ],
};

export const CAROUSEL_STRUCTURE = {
  slide1: "HOOK - 6-8 words max. Speak audience's language. Signal value, tension, or curiosity. Must stop scrollers.",
  slide2: "CRITICAL FOR REACH - Instagram may resurface posts using slide 2. Reinforce the hook, add context, push curiosity to keep swiping.",
  slides3to9: "BODY - One key point per slide. Build a clear narrative flow. Each slide should naturally lead to the next. Encourage continued swiping.",
  finalSlide: "CTA - Clear call to action. Prompt comments, keywords, or next actions. CTA style should match carousel tone. 'Link in bio' is fine.",
  designRules: [
    "Prefer 4:5 or 3:4 vertical ratios to maximize screen space and feed visibility",
    "ONE idea per carousel - maintain clear narrative: hook → explanation → insight → CTA",
    "Flow matters more than volume - each slide should lead naturally to the next",
    "Large, readable fonts (readable on mobile)",
    "Limit text per slide (6-8 words max for hook, 5-7 for body)",
    "Consistent visual theme across all slides",
    "Use brand colors for cohesion",
    "Use visuals that support the message: screenshots, typography, illustrations, or relevant photos",
    "Carousels can surface in Reels tab - visual quality matters",
  ],
  platformBoosts: [
    "Add music (preferably instrumental) to qualify for Reels distribution",
    "Use location tags when relevant, especially for local reach",
  ],
};

export const RELATABILITY_STRATEGIES = [
  "Share a personal mistake or failure",
  "Tell a story about your failures",
  "Use casual, everyday language",
  "Share mini 'behind-the-scenes' moments",
  "Talk about common fears + doubts",
  "Show your beginner phase",
  "Tell stories in real time",
  "Use a 5th grade reading level",
  "Use humor",
  "Show vulnerability",
  "Talk about unpopular opinions",
  "Share small, everyday wins",
  "Let people see your quirks",
  "Express genuine gratitude",
  "Tell stories that show real emotions, not just highlight reels",
  "Write like you're texting a friend",
  "Use memes, gifs, or pop culture references",
  "Ask open-ended questions",
  "Start captions with 'real talk...'",
  "Avoid buzzwords",
  "Avoid heavy industry jargon",
  "Keep sentences short and punchy",
  "Add playful or casual phrasing",
  "Share experiences",
  "Talk about the 'messy stuff'",
  "Share things no one talks about",
  "Use captions as a second 'hook'",
  "Talk about well known experiences",
  "Use 'you' language instead of just 'I'",
  "Most relatable subjects: money, relationships, food",
];

export const SERVICE_PROVIDER_CONTENT_IDEAS = [
  "Create a reel sharing how you started your biz",
  "Share your first website layout vs now",
  "Share your working from home set up",
  "Reveal your new offer/service",
  "Share your to-do list",
  "Show a 'day in the life' from start to finish",
  "Share your brand values and what motivates your biz",
  "Share 3 apps/tools you couldn't live without",
  "Educate your followers with shock statistics in your niche",
  "Bust a myth in your industry",
  "Sell your offer—why is it so good? What about it is so different?",
  "Show your client transformations and social proof",
  "Share BTS teasers of what went into creating your offer",
  "Showcase your expertise—create a step by step client journey",
  "Answer a frequently asked question regarding your niche or services",
  "What is the biggest lesson you've learned?",
  "What is something you're most proud of?",
  "What would you go back and tell your younger self if you could?",
  "What is your biggest goal for next year?",
  "What do you want to be left in the past?",
  "How did you recently overcome a challenge?",
  "Show how you like to relax—how do you deal with burnout?",
  "What is your favourite way to self care?",
  "What's one thing you're 'supposed' to like but actually hate?",
  "What's a problem your audience have but might not always realize?",
  "What is one tip you would give them to overcome that problem?",
  "What industry trend should they get ahead of?",
  "Share a client case study—what was their problem and how did you help?",
  "Share a 'steal my strategy for'—something people struggle with",
  "Share a mini training or tutorial",
  "Share a throwback with how far you've come",
  "Expectation vs reality—what did you think would be different in your biz journey?",
  "Your experience with imposter syndrome—how did you overcome?",
];

export const CTA_EXAMPLES = {
  comments: [
    "Drop a [emoji] if you agree!",
    "Comment [word] if you need this!",
    "Which one is your favorite? 1, 2, or 3?",
    "Tell me in the comments: ...",
    "Tag someone who needs to see this!",
    "What would you add to this list?",
  ],
  saves: [
    "Save this for later when you need it!",
    "Bookmark this for reference!",
    "Save this before it gets buried in your feed!",
    "Pin this for when you need inspiration!",
  ],
  shares: [
    "Share this with someone who needs to hear it!",
    "Send this to a friend who's struggling with...",
    "Know someone who would love this? Share it!",
  ],
  follows: [
    "Follow for more [topic] tips!",
    "Follow if you want to see part 2!",
    "Turn on notifications so you don't miss...",
  ],
};

// Helper to get random hooks for prompts
export function getRandomHooks(category: keyof typeof VIRAL_HOOKS, count: number = 5): string[] {
  const hooks = VIRAL_HOOKS[category];
  const shuffled = [...hooks].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper to get format-specific ideas
export function getFormatIdeas(format: keyof typeof FORMAT_SPECIFIC_IDEAS): string[] {
  return FORMAT_SPECIFIC_IDEAS[format] || [];
}

export interface BrandAssetReference {
  name: string;
  assetType: string;
  description?: string | null;
  imageUrl: string;
}

export interface ContentGenerationRequest {
  briefId: string;
  brandVoice: string;
  targetAudience: string;
  contentGoals: string;
  linksToInclude?: string | null;
  platforms: string[];
  contentType: "video_script" | "caption" | "both";
  contentFormat?: "video" | "image" | "carousel" | "tiktok_text" | "ugc_talking" | "ugc_lipsync" | "studio_longform";
  accountType?: "brand" | "influencer" | "ugc" | "educator";
  optimizationGoal?: "reach" | "saves" | "comments" | "clicks";
  topic?: string;
  avoidPatterns?: string[];
  topPerformingPosts?: { title: string; views: number; postedOn?: string }[];
  sceneCount?: number; // 1-3 scenes for video content
  brandAssets?: BrandAssetReference[]; // Brand assets to reference in image generation
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

  const accountTypeGuidance: Record<string, string> = {
    brand: `ACCOUNT TYPE: BRAND
- Tone: Professional, trust-focused, consistent brand voice
- CTAs: Conversion-oriented (shop now, sign up, learn more)
- Caption Style: Polished, on-brand, product-focused
- Goal: Trust, credibility, conversions`,
    influencer: `ACCOUNT TYPE: INFLUENCER
- Tone: Personal, opinionated, authentic, relatable
- CTAs: Engagement-focused (double-tap if you agree, comment below)
- Caption Style: Hook-first, conversational, trend-aware
- Goal: Reach, authority, audience connection`,
    ugc: `ACCOUNT TYPE: UGC / SOCIAL CREATOR
- Tone: Adaptive, can match any brand voice, authentic-feeling
- CTAs: Product-focused but natural (I've been using X for...)
- Caption Style: Testimonial-style, demo-ready, ad-friendly
- Goal: Deliverables, reusable content, multiple versions`,
    educator: `ACCOUNT TYPE: EDUCATOR
- Tone: Structured, explanatory, authoritative but approachable
- CTAs: Save-focused (save this for later, share with someone who needs this)
- Caption Style: Framework-based, clear steps, value-packed
- Goal: Authority, clarity, save-worthy content`
  };

  const accountTypeSection = request.accountType && accountTypeGuidance[request.accountType]
    ? `\n\n${accountTypeGuidance[request.accountType]}`
    : "";

  // Optimization goal guidance - tells AI to optimize for ONE specific outcome
  const optimizationGoalGuidance: Record<string, string> = {
    reach: `OPTIMIZATION GOAL: MAXIMIZE REACH
- Prioritize shareable, relatable content that spreads organically
- Use broad appeal hooks that resonate with wide audiences
- Create "tag a friend" or "share this" worthy moments
- Optimize for algorithm signals: watch time, shares, saves
- Make content feel universal, not niche
- CTA focus: Shares and follows`,
    saves: `OPTIMIZATION GOAL: MAXIMIZE SAVES
- Create reference-worthy content people want to return to
- Provide frameworks, templates, checklists, or how-to guides
- Make it educational and actionable
- Structure content so it's scannable and easy to revisit
- Include specific tips, stats, or resources worth bookmarking
- CTA focus: "Save this for later!" "Bookmark this!"`,
    comments: `OPTIMIZATION GOAL: MAXIMIZE COMMENTS
- Ask engaging questions that invite responses
- Create debate or discussion with polarizing takes
- Use "hot takes" or unpopular opinions
- End with open-ended questions, not statements
- Create FOMO that makes people want to join the conversation
- CTA focus: "Drop a [emoji] if you agree!" "What would you add?"`,
    clicks: `OPTIMIZATION GOAL: MAXIMIZE CLICKS
- Create curiosity gaps that require clicking to resolve
- Tease value that lives behind the link
- Make the benefit of clicking crystal clear
- Use urgency and scarcity when authentic
- Balance value delivery with driving action
- CTA focus: "Link in bio" "Tap to learn more" "DM me [word]"`,
  };

  const optimizationSection = request.optimizationGoal && optimizationGoalGuidance[request.optimizationGoal]
    ? `\n\n${optimizationGoalGuidance[request.optimizationGoal]}`
    : "";

  // Get random viral hooks for this generation
  const growthHooks = getRandomHooks("growth", 5);
  const viralHooks = getRandomHooks("viral", 5);
  const negativeHooks = getRandomHooks("negative", 3);
  const convertingHooks = getRandomHooks("converting", 3);

  // Get format-specific ideas based on content format
  const formatKeyMap: Record<string, keyof typeof FORMAT_SPECIFIC_IDEAS> = {
    video: "video",
    image: "image",
    carousel: "carousel",
    tiktok_text: "tiktok_text",
    ugc_talking: "ugc_talking",
    ugc_lipsync: "ugc_lipsync",
    studio_longform: "studio_longform",
  };
  const formatKey = formatKeyMap[contentFormat] || "reel";
  const formatIdeas = FORMAT_SPECIFIC_IDEAS[formatKey] || FORMAT_SPECIFIC_IDEAS.reel;

  // Build carousel structure guidance if needed
  const carouselGuidance = contentFormat === "carousel" ? `

CAROUSEL OPTIMIZATION RULES (FOLLOW EXACTLY):
═══════════════════════════════════════════════════════════════════════════════

SLIDE STRUCTURE:
- Slide 1: ${CAROUSEL_STRUCTURE.slide1}
- Slide 2: ${CAROUSEL_STRUCTURE.slide2}
- Slides 3-9: ${CAROUSEL_STRUCTURE.slides3to9}
- Final Slide: ${CAROUSEL_STRUCTURE.finalSlide}

CAROUSEL DESIGN RULES:
${CAROUSEL_STRUCTURE.designRules.map(r => `- ${r}`).join("\n")}

PLATFORM REACH BOOSTERS:
${CAROUSEL_STRUCTURE.platformBoosts.map(r => `- ${r}`).join("\n")}

AI CONTENT GENERATION RULES:
- Optimize for SWIPE DEPTH, not just slide 1
- Generate hooks FIRST, then build content around them
- Enforce structural discipline (one idea, clear flow)
- Auto-suggest CTAs aligned to post intent
- Recommend visuals and music as part of post readiness, not optional extras

CAROUSEL FORMAT STRATEGY (match format to goal):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EDUCATIONAL (goal: trust, saves, long-term growth)
→ Step-by-step tutorials, checklists, top tools, beginner mistakes, myth-busting

RELATABLE (goal: engagement, resonance, comments)
→ Before vs after, "if you know you know", things I wish I knew, unpopular opinions

STORYTELLING (goal: depth, loyalty, audience bonding)
→ Mistakes that almost made me quit, struggle→success, behind-the-scenes, "the day everything changed"

CREDIBLE (goal: conversion, authority, offers)
→ Case studies, real result screenshots, what I'd do if I started over, testimonials

SAVEABLE (goal: algorithm signals, shares)
→ Infographics, do's & don'ts, cheat sheets, niche-specific top resources
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTENT STRATEGY:
- Rotate educational + relatable + credible formats weekly
- Ensure clear messaging on every slide
- Optimise for saves, shares, and clarity - NOT volume` : "";

  // Select random relatability strategies to inject
  const shuffledRelatability = [...RELATABILITY_STRATEGIES].sort(() => 0.5 - Math.random()).slice(0, 8);

  // Build brand assets section for image generation guidance
  const brandAssetsSection = request.brandAssets && request.brandAssets.length > 0
    ? `\n\n═══════════════════════════════════════════════════════════════════════════════
BRAND ASSETS - REFERENCE THESE IN IMAGE PROMPTS:
═══════════════════════════════════════════════════════════════════════════════
The brand has uploaded these visual assets. When generating image prompts, reference and incorporate these elements to maintain brand consistency:
${request.brandAssets.map((asset, i) => `${i + 1}. ${asset.name} (${asset.assetType})${asset.description ? `: ${asset.description}` : ""}`).join("\n")}

IMPORTANT FOR IMAGE PROMPTS:
- Incorporate the style, colors, and visual elements from these brand assets
- For product photos: Feature the actual product as described
- For logos: Include brand identity elements in compositions
- For lifestyle shots: Match the aesthetic and mood
- For screenshots: Reference UI elements and color schemes`
    : "";

  const systemPrompt = `You are an expert social media content strategist and copywriter with deep knowledge of viral content patterns. You create engaging, platform-optimized content that resonates with target audiences.

Brand Voice: ${request.brandVoice}
Target Audience: ${request.targetAudience}
Content Goals: ${request.contentGoals}
Platforms: ${request.platforms.join(", ")}
Content Format: ${contentFormat.toUpperCase()}${accountTypeSection}${optimizationSection}

═══════════════════════════════════════════════════════════════════════════════
VIRAL HOOK TEMPLATES - USE THESE PROVEN PATTERNS (adapt to the topic/niche):
═══════════════════════════════════════════════════════════════════════════════

GROWTH HOOKS:
${growthHooks.map(h => `• ${h}`).join("\n")}

VIRAL HOOKS:
${viralHooks.map(h => `• ${h}`).join("\n")}

NEGATIVE HOOKS (create urgency/FOMO):
${negativeHooks.map(h => `• ${h}`).join("\n")}

CONVERTING HOOKS:
${convertingHooks.map(h => `• ${h}`).join("\n")}

═══════════════════════════════════════════════════════════════════════════════
FORMAT-SPECIFIC CONTENT IDEAS FOR ${contentFormat.toUpperCase()}:
═══════════════════════════════════════════════════════════════════════════════
${formatIdeas.slice(0, 6).map(idea => `• ${idea}`).join("\n")}${carouselGuidance}${brandAssetsSection}

═══════════════════════════════════════════════════════════════════════════════
RELATABILITY STRATEGIES - Make content feel authentic:
═══════════════════════════════════════════════════════════════════════════════
${shuffledRelatability.map(s => `• ${s}`).join("\n")}

═══════════════════════════════════════════════════════════════════════════════
CTA EXAMPLES - End with engagement drivers:
═══════════════════════════════════════════════════════════════════════════════
For Comments: ${CTA_EXAMPLES.comments.slice(0, 3).join(" | ")}
For Saves: ${CTA_EXAMPLES.saves.slice(0, 2).join(" | ")}
For Shares: ${CTA_EXAMPLES.shares.slice(0, 2).join(" | ")}

═══════════════════════════════════════════════════════════════════════════════
CRITICAL - HOOK VIEWERS IN THE FIRST 8 SECONDS:
═══════════════════════════════════════════════════════════════════════════════
1. TEASE THE PAYOFF - Show/mention the most exciting moment upfront
2. SOLVE A PROBLEM - Address a pain point: "Tired of X? Here's how to fix it"
3. ASK A RELATABLE QUESTION - "Have you ever wondered why...?"
4. SHARE A SHOCKING FACT - Mind-blowing stats grab attention
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

═══════════════════════════════════════════════════════════════════════════════
MID-CONTENT ATTENTION RESET (CRITICAL FOR RETENTION):
═══════════════════════════════════════════════════════════════════════════════
At the 40-60% mark of the content, add a SECOND HOOK to re-engage viewers who might drop off:
- "But here's what nobody tells you..."
- "Wait, it gets better..."
- "Now here's where it gets interesting..."
- "But that's not even the best part..."
- Introduce an unexpected twist, reveal, or escalation
- Shift the emotional tone (humor → serious, or serious → surprising)
- Add a pattern interrupt (change visual style, pace, or delivery)

This mid-content reset is crucial for retention. Don't let the energy plateau.

Your content should:
- Match the brand voice perfectly
- Appeal directly to the target audience
- Support the content goals
- Be optimized for the specified platforms
- Use the viral hook templates above (adapted to the topic)
- Create curiosity and urgency to keep watching
- Feel authentic and relatable

CAPTION FRAMEWORK - Follow this structured approach:
1. CONTEXT: Lead with a clear, searchable phrase (not vague openers)
2. BELIEF BREAK: Challenge an assumption or introduce a surprising perspective
3. PAYOFF: Deliver the value or insight promised
4. CTA: End with a question to drive comments (questions > statements)

CAPTION RULES:
- SEARCH-FIRST: Write for Instagram/TikTok SEO - lead with searchable keywords
- KEYWORD REPETITION: Use main keywords 2-3 times naturally
- STANDALONE: Assume videos watched without sound - caption must make sense alone
- NO "as you can see" LANGUAGE: Restate what's happening visually
- CONVERSATION STARTERS: Write to spark engagement
- PLATFORM-SPECIFIC: Tailor length and style for each platform
- PRIORITIZE ENGAGEMENT: Optimize for comments, saves, and replies
- USE RELATABILITY: Apply the strategies above to connect with audience

CAPTION DON'TS:
- No generic hooks like "Stop scrolling!" or "Wait for it!"
- No vague openers like "This changed everything" without context
- No link-pushing as the main focus
- No hashtag-stuffing - max 3-5 targeted hashtags
- No explaining what viewers can already see

═══════════════════════════════════════════════════════════════════════════════
INSTAGRAM POST OPTIMIZATION (SINGLE IMAGES & STORIES):
═══════════════════════════════════════════════════════════════════════════════

CORE PRINCIPLE: Posts that ASK outperform posts that TELL
- Interaction (reply, vote, DM) is the primary goal
- Questions, polls, and choices drive engagement

LOW-FRICTION PROMPTS THAT DRIVE REPLIES:
- Binary choices: "this or that", "agree or nah"
- Simple opinion asks: "coffee or matcha?"
- One-word reply triggers: "FREEBIE", "VIDEO", "DISCOUNT"
- Keep the barrier to respond extremely low

AUDIENCE VALIDATION = HIGHER ENGAGEMENT:
- Ask about struggles, preferences, or opinions
- Make users feel seen and heard
- Prompts should invite users to talk about THEMSELVES, not the creator
- Example: "What's your biggest struggle with X?" not "Here's what I learned about X"

CONVERSATION FRAMING > EXPERTISE FRAMING:
- Use casual language: "coffee chat", "be honest", "curious…"
- Write like a DM, not a broadcast
- Feel approachable, not authoritative

STORIES ARE IDEAL FOR SOFT CTAs:
- Frame freebies, discounts, and links as optional help
- Reply-based CTAs outperform hard "click now" selling
- Example: "DM 'GUIDE' if you want this free template" > "Click link to buy"

SOCIAL PROOF & COMMUNITY PROMPTS:
- "Drop your IG/business below"
- "Anyone else watching…?"
- Encourages replies AND mutual visibility among followers

RESEARCH VALUE:
- Use posts to surface audience pain points, preferences, and objections
- These insights fuel future content, offers, and products

═══════════════════════════════════════════════════════════════════════════════
CTA & FOLLOW OPTIMIZATION:
═══════════════════════════════════════════════════════════════════════════════

SOFT CTAs > DIRECT "FOLLOW" ASKS:
- Reframe follows as belonging, alignment, or value - not sales
- "If this resonates, you'll want to stick around" > "Follow for more"
- Creates attraction through fit, not pressure

IDENTITY-BASED LANGUAGE:
- Imply "this is for people like you" rather than "everyone should follow"
- "If you're the type who..." or "For those of you who..."
- Filters audience and strengthens signal

CONFIDENCE > PERSUASION:
- Statements should be declarative, not needy
- "I'm not for everyone" increases perceived value and trust
- Never beg for follows or algorithm engagement

EMOTIONAL RESONANCE > INSTRUCTION:
- Reference clarity, honesty, relief, momentum, or feeling "seen"
- Position follow as the natural next step after resonance
- Example: "If you finally feel understood here..." > "Hit follow!"

CURIOSITY CREATES PASSIVE COMMITMENT:
- Hint at future value without over-promising
- "Stay close", "What's next", "You'll want to stay"
- Encourages followers without hard selling

SUBTLE EXCLUSION INCREASES CONVERSION:
- "Maybe that's why you're here" filters the audience
- Creates insider feeling for those who stay
- Attracts ideal followers, repels mismatch

TONE RULES:
- Calm, assured, conversational
- NO urgency spam ("Follow NOW before...")
- NO algorithm begging ("Help me beat the algorithm!")
- NO desperate energy${linksSection}${avoidSection}${learningSection}`;

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
  // Get random hooks and ideas to inspire generation
  const sampleHooks = [...getRandomHooks("growth", 3), ...getRandomHooks("viral", 3)];
  const sampleIdeas = [...SERVICE_PROVIDER_CONTENT_IDEAS].sort(() => 0.5 - Math.random()).slice(0, 5);
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a social media strategist with deep knowledge of viral content patterns. Generate content ideas that align with the brand and have high viral potential.

Brand Voice: ${brandVoice}
Target Audience: ${targetAudience}
Content Goals: ${contentGoals}

VIRAL HOOK PATTERNS TO USE:
${sampleHooks.map(h => `• ${h}`).join("\n")}

PROVEN CONTENT FORMATS TO INSPIRE:
${sampleIdeas.map(i => `• ${i}`).join("\n")}

Generate ideas that combine viral hook patterns with content formats that match the brand voice.`,
      },
      {
        role: "user",
        content: `Generate ${count} unique, engaging content ideas using the viral patterns above. Each idea should be a specific, actionable post concept. Respond in JSON: { "ideas": ["idea1", "idea2", ...] }`,
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

export interface ContentComparisonRequest {
  yourContent: {
    script?: string;
    caption?: string;
    hashtags?: string[];
    platforms?: string[];
    scenePrompts?: any[];
    imagePrompts?: any;
    videoPrompts?: any;
  };
  competitorContent: {
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
    channelTitle?: string;
  };
  screenshotBase64s?: string[];
}

export interface ContentComparisonResult {
  similarityScore: number;
  predictedViewRange: { min: number; max: number };
  hookStrength: { score: number; feedback: string };
  visualStyleMatch: { score: number; feedback: string };
  structureAlignment: { score: number; feedback: string };
  captionStrategy: { score: number; feedback: string };
  improvements: string[];
  strengths: string[];
}

export async function compareContentToViral(
  request: ContentComparisonRequest
): Promise<ContentComparisonResult> {
  const yourContentStr = JSON.stringify(request.yourContent, null, 2);
  const competitorStr = JSON.stringify(request.competitorContent, null, 2);
  
  const hasScreenshots = request.screenshotBase64s && request.screenshotBase64s.length > 0;
  const hasYourData = request.yourContent && Object.keys(request.yourContent).length > 0;
  const hasCompetitorData = request.competitorContent && Object.keys(request.competitorContent).length > 0;

  const messages: any[] = [
    {
      role: "system",
      content: `You are an expert social media content analyst specializing in Instagram, TikTok, and YouTube content. Your job is to compare user content against successful/viral competitor content and provide actionable feedback.

${hasScreenshots ? `IMPORTANT: You will receive screenshot images of social media posts. Analyze these images carefully to understand:
- The visual style, colors, typography, and design elements
- The hook/headline text visible in the images
- The overall content structure and layout
- Any engagement metrics visible (likes, comments, views)
- The carousel flow if multiple slides are shown

First describe what you see in the images, then provide your analysis.` : ''}

Analyze the user's content against the competitor's viral content and score them on:
1. Hook Strength (0-100): How compelling is the opening hook/headline?
2. Visual Style Match (0-100): Does the visual approach match successful patterns?
3. Structure Alignment (0-100): Is the content structure optimized like the viral example?
4. Caption Strategy (0-100): Are the caption, hashtags, and CTA effective?

Based on the competitor's engagement (if visible in screenshots), estimate a predicted view range for the user's content.

Respond in this exact JSON format:
{
  "similarityScore": <0-100>,
  "predictedViewRange": { "min": <number>, "max": <number> },
  "hookStrength": { "score": <0-100>, "feedback": "<1-2 sentence feedback>" },
  "visualStyleMatch": { "score": <0-100>, "feedback": "<1-2 sentence feedback>" },
  "structureAlignment": { "score": <0-100>, "feedback": "<1-2 sentence feedback>" },
  "captionStrategy": { "score": <0-100>, "feedback": "<1-2 sentence feedback>" },
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"]
}`,
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: hasScreenshots 
            ? `Compare my content against this viral competitor using the screenshots provided.

${hasYourData ? `MY CONTENT METADATA:\n${yourContentStr}\n` : 'MY CONTENT: See the first set of screenshots showing my posts.'}

${hasCompetitorData ? `COMPETITOR'S VIRAL CONTENT METADATA:\n${competitorStr}\n` : 'COMPETITOR CONTENT: See the second set of screenshots showing their viral posts.'}

The screenshots show both my content and the competitor's viral content. Please analyze the visual style, hooks, structure, and engagement to provide specific scores and actionable improvements.`
            : `Compare my content against this viral competitor:

MY CONTENT:
${yourContentStr}

COMPETITOR'S VIRAL CONTENT:
${competitorStr}

Please analyze and provide scores, predicted performance, and specific improvements.`,
        },
      ],
    },
  ];

  if (hasScreenshots) {
    for (const base64 of request.screenshotBase64s!) {
      (messages[1].content as any[]).push({
        type: "image_url",
        image_url: { 
          url: base64.startsWith("data:") ? base64 : `data:image/jpeg;base64,${base64}`,
          detail: "high"
        },
      });
    }
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    response_format: { type: "json_object" },
    max_tokens: 1500,
  });

  const result = JSON.parse(response.choices[0]?.message?.content || "{}");
  return result as ContentComparisonResult;
}

export interface ImageReformatRequest {
  imageUrl: string;
  targetAspectRatio: "landscape" | "portrait" | "square"; // landscape=16:9, portrait=9:16, square=1:1
}

export interface ImageReformatResult {
  imageUrl: string;
  revisedPrompt?: string;
}

export async function reformatImage(request: ImageReformatRequest): Promise<ImageReformatResult> {
  if (!isDalleConfigured()) {
    throw new Error("OpenAI API key not configured. Please add OPENAI_DALLE_API_KEY to your secrets.");
  }

  // Download the image and convert to buffer for the edit API
  const imageResponse = await fetch(request.imageUrl);
  if (!imageResponse.ok) {
    throw new Error("Failed to fetch source image");
  }
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  
  // Create a File-like object for the API
  const imageFile = new File([imageBuffer], "image.png", { type: "image/png" });

  // Size mapping for different aspect ratios
  const sizeMap = {
    landscape: "1536x1024" as const,  // GPT Image landscape
    portrait: "1024x1536" as const,   // GPT Image portrait
    square: "1024x1024" as const,
  };

  const aspectLabels = {
    landscape: "landscape/horizontal (16:9)",
    portrait: "portrait/vertical (9:16)", 
    square: "square (1:1)",
  };

  const prompt = `Recreate this exact same image but reformatted to ${aspectLabels[request.targetAspectRatio]} aspect ratio. Keep the same subject, style, colors, and mood. Extend the composition naturally to fill the new format.`;

  // Use GPT Image model for editing with image input
  const response = await dalleClient.images.edit({
    model: "gpt-image-1",
    image: imageFile,
    prompt,
    n: 1,
    size: sizeMap[request.targetAspectRatio],
  });

  const newImageUrl = response.data[0]?.url || response.data[0]?.b64_json;
  if (!newImageUrl) {
    throw new Error("Failed to generate reformatted image");
  }

  // If b64_json, convert to data URL
  const finalUrl = response.data[0]?.url 
    ? response.data[0].url 
    : `data:image/png;base64,${response.data[0]?.b64_json}`;

  return {
    imageUrl: finalUrl,
    revisedPrompt: (response.data[0] as any)?.revised_prompt,
  };
}
