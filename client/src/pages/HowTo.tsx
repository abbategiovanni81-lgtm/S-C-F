import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  Mic, 
  Video, 
  Image, 
  Film, 
  Search, 
  MessageSquare, 
  Youtube, 
  Settings,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Key,
  Zap
} from "lucide-react";

export default function HowTo() {
  return (
    <Layout title="How To">
      <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-howto-title">How to Use SocialCommand</h1>
            <p className="text-muted-foreground">
              Complete guide to all features, AI engines, and content creation workflows.
            </p>
          </div>

          <Tabs defaultValue="features" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="features" data-testid="tab-features">Features</TabsTrigger>
              <TabsTrigger value="workflows" data-testid="tab-workflows">Workflows</TabsTrigger>
              <TabsTrigger value="apis" data-testid="tab-apis">API Keys</TabsTrigger>
              <TabsTrigger value="setup" data-testid="tab-setup">Setup Guide</TabsTrigger>
            </TabsList>

            <TabsContent value="features">
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-6 pr-4">
                  <FeatureCard
                    icon={<Sparkles className="h-6 w-6" />}
                    title="1. Brand Briefs"
                    description="Define your brand's voice, target audience, content pillars, and style guidelines. All AI-generated content follows these rules."
                    howItWorks="Create a brief with your brand name, description, audience, and content themes. The AI uses this as context when generating scripts, captions, and replies."
                    apiNeeded="None (stored locally)"
                  />

                  <FeatureCard
                    icon={<Zap className="h-6 w-6" />}
                    title="2. Content Generation (Scripts & Captions)"
                    description="Generate social media scripts, captions, and hashtags based on your brand brief."
                    howItWorks={
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Select a brand brief</li>
                        <li>Enter a topic or content idea</li>
                        <li>Choose platform (YouTube, TikTok, Instagram, X)</li>
                        <li>AI generates a script with voiceover text + matching caption with hashtags</li>
                      </ol>
                    }
                    apiNeeded="OpenAI"
                    pricing="Paid only - $5 minimum credit"
                    link="https://platform.openai.com"
                  />

                  <FeatureCard
                    icon={<Mic className="h-6 w-6" />}
                    title="3. AI Voice Generation"
                    description="Converts your script text into natural-sounding voiceover audio."
                    howItWorks={
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Generate or write a script</li>
                        <li>Select a voice from the library</li>
                        <li>Click "Generate Voice" to create an MP3 audio file</li>
                      </ol>
                    }
                    apiNeeded="ElevenLabs"
                    pricing="Free: 10,000 characters/month | Paid: from $5/month"
                    link="https://elevenlabs.io"
                  />

                  <FeatureCard
                    icon={<Video className="h-6 w-6" />}
                    title="4. AI Avatar Videos (A2E - Default)"
                    description="Creates realistic talking-head videos with 50+ pre-built avatars that lip-sync to your voiceover."
                    howItWorks={
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Generate voiceover audio first</li>
                        <li>Select an avatar from the gallery</li>
                        <li>Click "Generate Video" - avatar speaks your script</li>
                      </ol>
                    }
                    apiNeeded="A2E (Audio to Expression)"
                    pricing="Trial credits available | Pay-per-video"
                  />

                  <FeatureCard
                    icon={<Video className="h-6 w-6" />}
                    title="5. AI Video Generation (Fal.ai - Backup)"
                    description="Creates AI-generated video clips from text prompts (visual scenes, not avatars)."
                    howItWorks={
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Enter a visual description</li>
                        <li>AI generates a short video clip matching your prompt</li>
                      </ol>
                    }
                    apiNeeded="Fal.ai"
                    pricing="Free: $1 credit on signup | Pay-as-you-go"
                    link="https://fal.ai"
                  />

                  <FeatureCard
                    icon={<Image className="h-6 w-6" />}
                    title="6. AI Image Generation (4 Options)"
                    description="Generate images for your social media posts using multiple AI engines."
                    howItWorks={
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="font-medium">A2E (Default)</div>
                            <div className="text-sm text-muted-foreground">High-quality images, manga styles. Uses same key as video.</div>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="font-medium">DALL-E 3</div>
                            <div className="text-sm text-muted-foreground">Excellent text rendering, realistic. $0.04-0.12/image</div>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="font-medium">Fal.ai</div>
                            <div className="text-sm text-muted-foreground">Fast AI images, various styles. Pay-as-you-go.</div>
                          </div>
                          <div className="p-3 bg-muted rounded-lg border-2 border-green-500">
                            <div className="font-medium flex items-center gap-2">
                              Pexels <Badge variant="secondary" className="bg-green-100 text-green-700">FREE</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">Professional stock photos. No key needed!</div>
                          </div>
                        </div>
                      </div>
                    }
                    apiNeeded="Varies by engine"
                  />

                  <FeatureCard
                    icon={<Film className="h-6 w-6" />}
                    title="7. B-Roll Footage Search (Pexels)"
                    description="Find professional stock video clips to use as B-roll in your content."
                    howItWorks="Search for any topic, browse results, download clips for use in your videos."
                    apiNeeded="Pexels"
                    pricing="Always FREE - unlimited searches and downloads"
                    isFree
                  />

                  <FeatureCard
                    icon={<Search className="h-6 w-6" />}
                    title="8. Content Inspiration Analyzer"
                    description="Paste a viral video URL and get AI analysis of why it worked + content ideas for your brand."
                    howItWorks={
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Paste YouTube/TikTok URL</li>
                        <li>AI analyzes hooks, structure, engagement tactics</li>
                        <li>Generates content ideas tailored to your brand</li>
                      </ol>
                    }
                    apiNeeded="OpenAI + Apify (for scraping)"
                    link="https://platform.openai.com"
                  />

                  <FeatureCard
                    icon={<MessageSquare className="h-6 w-6" />}
                    title="9. Social Listening"
                    description="Monitor mentions of your brand/keywords across platforms (YouTube, TikTok, Instagram, X, Reddit)."
                    howItWorks={
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Set up keywords to track</li>
                        <li>System scans platforms for mentions</li>
                        <li>AI analyzes sentiment and suggests replies</li>
                        <li>Review and post replies</li>
                      </ol>
                    }
                    apiNeeded="Apify (scraping) + OpenAI (analysis)"
                    link="https://apify.com"
                  />

                  <FeatureCard
                    icon={<Youtube className="h-6 w-6" />}
                    title="10. YouTube Auto-Publishing"
                    description="Post finished videos directly to your YouTube channel."
                    howItWorks={
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Connect your YouTube channel via Google OAuth</li>
                        <li>When video is ready, click "Publish to YouTube"</li>
                        <li>Add title, description, and publish</li>
                      </ol>
                    }
                    apiNeeded="Google/YouTube (OAuth)"
                    pricing="FREE - uses your YouTube account"
                    isFree
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="workflows">
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-6 pr-4">
                  <WorkflowCard
                    title="Flow A: Script + Voice + Avatar Video"
                    description="Create a talking-head video with an AI avatar speaking your script."
                    steps={[
                      { step: "Create Brand Brief", detail: "Define your brand voice" },
                      { step: "Generate Script", detail: "OpenAI creates your content" },
                      { step: "Generate Voiceover", detail: "ElevenLabs converts to audio" },
                      { step: "Select Avatar & Generate Video", detail: "A2E creates talking video" },
                      { step: "Download or Publish", detail: "Post to YouTube or download" },
                    ]}
                    apisUsed={["OpenAI", "ElevenLabs", "A2E"]}
                  />

                  <WorkflowCard
                    title="Flow B: Script + Voice + Stock Footage"
                    description="Create a video using your voiceover with professional B-roll clips."
                    steps={[
                      { step: "Create Brand Brief", detail: "Define your brand voice" },
                      { step: "Generate Script", detail: "OpenAI creates your content" },
                      { step: "Generate Voiceover", detail: "ElevenLabs converts to audio" },
                      { step: "Search B-Roll clips", detail: "Pexels (FREE)" },
                      { step: "Combine in Edit & Merge", detail: "Build your final video" },
                      { step: "Download or Publish", detail: "Post to YouTube or download" },
                    ]}
                    apisUsed={["OpenAI", "ElevenLabs", "Pexels (Free)"]}
                  />

                  <WorkflowCard
                    title="Flow C: Image Post"
                    description="Create an image post with AI-generated caption and image."
                    steps={[
                      { step: "Create Brand Brief", detail: "Define your brand voice" },
                      { step: "Generate Caption", detail: "OpenAI creates caption + hashtags" },
                      { step: "Generate Image", detail: "Choose A2E, DALL-E, Fal.ai, or Pexels" },
                      { step: "Download for posting", detail: "Save and post to your platforms" },
                    ]}
                    apisUsed={["OpenAI", "Image Engine of Choice"]}
                  />

                  <WorkflowCard
                    title="Flow D: Social Listening Reply"
                    description="Monitor brand mentions and respond with AI-generated replies."
                    steps={[
                      { step: "Set Keywords", detail: "Define what to monitor" },
                      { step: "Scan runs automatically", detail: "Apify scrapes platforms" },
                      { step: "AI analyzes mentions", detail: "OpenAI detects sentiment" },
                      { step: "Generate reply suggestions", detail: "AI creates contextual replies" },
                      { step: "Review & post replies", detail: "Approve and send" },
                    ]}
                    apisUsed={["Apify", "OpenAI"]}
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="apis">
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-4 pr-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        API Keys Summary
                      </CardTitle>
                      <CardDescription>
                        All the services you need and where to get them.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3 font-medium">Service</th>
                              <th className="text-left p-3 font-medium">Used For</th>
                              <th className="text-left p-3 font-medium">Free Tier</th>
                              <th className="text-left p-3 font-medium">Get Key</th>
                            </tr>
                          </thead>
                          <tbody>
                            <ApiRow
                              service="OpenAI"
                              usedFor="Scripts, captions, analysis"
                              freeTier="No (min $5)"
                              link="https://platform.openai.com"
                            />
                            <ApiRow
                              service="Claude (Anthropic)"
                              usedFor="Scripts, captions (alternative to OpenAI)"
                              freeTier="No ($5 credit)"
                              link="https://console.anthropic.com"
                            />
                            <ApiRow
                              service="ElevenLabs"
                              usedFor="Voice generation"
                              freeTier="Yes (10k chars/mo)"
                              link="https://elevenlabs.io"
                            />
                            <ApiRow
                              service="A2E"
                              usedFor="Avatar videos & images"
                              freeTier="Trial credits"
                              link="Contact A2E"
                            />
                            <ApiRow
                              service="DALL-E 3"
                              usedFor="Image generation"
                              freeTier="No ($0.04/image)"
                              link="https://platform.openai.com"
                            />
                            <ApiRow
                              service="Fal.ai"
                              usedFor="AI videos & images"
                              freeTier="$1 free credit"
                              link="https://fal.ai"
                            />
                            <ApiRow
                              service="Pexels"
                              usedFor="Stock photos & videos"
                              freeTier="Always free"
                              link="Pre-configured"
                              isFree
                            />
                            <ApiRow
                              service="Apify"
                              usedFor="Social listening scraping"
                              freeTier="Free tier available"
                              link="https://apify.com"
                            />
                            <ApiRow
                              service="Google/YouTube"
                              usedFor="YouTube publishing"
                              freeTier="Free (OAuth)"
                              link="In-app connection"
                              isFree
                            />
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Getting API Keys</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ApiInstructions
                        service="OpenAI"
                        steps={[
                          "Go to platform.openai.com",
                          "Create an account or sign in",
                          "Navigate to API Keys section",
                          "Click 'Create new secret key'",
                          "Copy the key (starts with 'sk-')",
                          "Add $5+ credit to your account",
                        ]}
                      />
                      <Separator />
                      <ApiInstructions
                        service="Claude (Anthropic)"
                        steps={[
                          "Go to console.anthropic.com",
                          "Create an account or sign in",
                          "Navigate to API Keys",
                          "Create a new API key",
                          "Copy the key (starts with 'sk-ant-')",
                          "Add credit to your account",
                        ]}
                      />
                      <Separator />
                      <ApiInstructions
                        service="ElevenLabs"
                        steps={[
                          "Go to elevenlabs.io",
                          "Create a free account",
                          "Go to Profile Settings",
                          "Find your API key",
                          "Copy and save it",
                        ]}
                      />
                      <Separator />
                      <ApiInstructions
                        service="Fal.ai"
                        steps={[
                          "Go to fal.ai",
                          "Sign up (get $1 free credit)",
                          "Go to Dashboard > API Keys",
                          "Create a new key",
                          "Copy and save it",
                        ]}
                      />
                      <Separator />
                      <ApiInstructions
                        service="Apify"
                        steps={[
                          "Go to apify.com",
                          "Create a free account",
                          "Go to Settings > Integrations",
                          "Copy your API token",
                        ]}
                      />
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="setup">
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-6 pr-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        How to Set Up API Keys
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-4">
                        <li className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                          <div>
                            <div className="font-medium">Sign in to SocialCommand</div>
                            <div className="text-sm text-muted-foreground">Use email/password or Google sign-in</div>
                          </div>
                        </li>
                        <li className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                          <div>
                            <div className="font-medium">Go to Settings</div>
                            <div className="text-sm text-muted-foreground">Click the gear icon in the sidebar</div>
                          </div>
                        </li>
                        <li className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                          <div>
                            <div className="font-medium">Find AI Engines Section</div>
                            <div className="text-sm text-muted-foreground">Scroll to see all available API key fields</div>
                          </div>
                        </li>
                        <li className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
                          <div>
                            <div className="font-medium">Enter Each API Key</div>
                            <div className="text-sm text-muted-foreground">Paste your keys in the corresponding fields</div>
                          </div>
                        </li>
                        <li className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">5</div>
                          <div>
                            <div className="font-medium">Click Save</div>
                            <div className="text-sm text-muted-foreground">Green checkmarks will appear next to configured engines</div>
                          </div>
                        </li>
                      </ol>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Start Checklist</CardTitle>
                      <CardDescription>Minimum setup to start creating content</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <ChecklistItem text="Create an account (email or Google)" />
                        <ChecklistItem text="Add OpenAI or Claude API key (for scripts & captions)" />
                        <ChecklistItem text="Add ElevenLabs API key (for voiceovers)" />
                        <ChecklistItem text="Create your first Brand Brief" />
                        <ChecklistItem text="Generate your first piece of content!" />
                      </div>
                      <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="font-medium text-green-800 dark:text-green-200">Free Features Available Now</div>
                        <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Pexels stock photos and B-roll videos are always free with no API key needed!
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Connect YouTube Channel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-3">
                        <li className="flex gap-3">
                          <span className="font-bold">1.</span>
                          <span>Go to <strong>Channels</strong> in the sidebar</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="font-bold">2.</span>
                          <span>Click <strong>Connect YouTube</strong></span>
                        </li>
                        <li className="flex gap-3">
                          <span className="font-bold">3.</span>
                          <span>Sign in with your Google account</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="font-bold">4.</span>
                          <span>Grant permission to manage your YouTube channel</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="font-bold">5.</span>
                          <span>Your channel will appear in the connected accounts list</span>
                        </li>
                      </ol>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
    </Layout>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  howItWorks, 
  apiNeeded, 
  pricing, 
  link,
  isFree 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
  howItWorks: React.ReactNode;
  apiNeeded: string;
  pricing?: string;
  link?: string;
  isFree?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">{icon}</div>
          {title}
          {isFree && <Badge className="bg-green-100 text-green-700">FREE</Badge>}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="font-medium mb-2">How it works:</div>
          <div className="text-sm text-muted-foreground">{howItWorks}</div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="font-medium">API needed:</span>{" "}
            <span className="text-muted-foreground">{apiNeeded}</span>
          </div>
          {pricing && (
            <div>
              <span className="font-medium">Pricing:</span>{" "}
              <span className="text-muted-foreground">{pricing}</span>
            </div>
          )}
          {link && (
            <a 
              href={link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              Get API Key <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WorkflowCard({ 
  title, 
  description, 
  steps, 
  apisUsed 
}: { 
  title: string;
  description: string;
  steps: { step: string; detail: string }[];
  apisUsed: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium">{s.step}</div>
                <div className="text-sm text-muted-foreground">{s.detail}</div>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden md:block" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
          <span className="text-sm font-medium">APIs used:</span>
          {apisUsed.map((api) => (
            <Badge key={api} variant="secondary">{api}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ApiRow({ 
  service, 
  usedFor, 
  freeTier, 
  link, 
  isFree 
}: { 
  service: string;
  usedFor: string;
  freeTier: string;
  link: string;
  isFree?: boolean;
}) {
  return (
    <tr className="border-b last:border-0">
      <td className="p-3 font-medium">{service}</td>
      <td className="p-3 text-muted-foreground">{usedFor}</td>
      <td className="p-3">
        {isFree ? (
          <Badge className="bg-green-100 text-green-700">{freeTier}</Badge>
        ) : (
          <span className="text-muted-foreground">{freeTier}</span>
        )}
      </td>
      <td className="p-3">
        {link.startsWith("http") ? (
          <a 
            href={link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1"
          >
            Link <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-muted-foreground">{link}</span>
        )}
      </td>
    </tr>
  );
}

function ApiInstructions({ service, steps }: { service: string; steps: string[] }) {
  return (
    <div>
      <div className="font-medium mb-2">{service}</div>
      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </div>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle className="h-5 w-5 text-green-500" />
      <span>{text}</span>
    </div>
  );
}
