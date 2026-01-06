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
  Zap,
  Crown,
  Rocket,
  Users,
  Globe,
  Palette,
  Languages
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function HowTo() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isFreeUser = !user?.tier || user.tier === "free";

  return (
    <Layout title="How To">
      <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-howto-title">How to Use SocialCommand</h1>
            <p className="text-muted-foreground">
              Complete guide to all features, AI engines, and content creation workflows.
            </p>
          </div>

          {/* Upgrade CTA - Only show for free users */}
          {isFreeUser && (
            <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Rocket className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Get Started Quickly</h3>
                      <p className="text-muted-foreground text-sm">
                        Set up and connect your own API keys, or upgrade to <span className="font-medium text-primary">Premium for £29.99/month</span> and get all AI engines pre-connected and ready to use.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" /> OpenAI Included
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" /> ElevenLabs Included
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" /> A2E Videos Included
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" /> DALL-E Images Included
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setLocation("/subscription")}
                    className="gap-2 whitespace-nowrap"
                    data-testid="button-upgrade-cta"
                  >
                    <Crown className="h-4 w-4" />
                    Upgrade Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="features" className="w-full">
            <TabsList className="w-full flex flex-wrap gap-1 h-auto p-1 mb-6">
              <TabsTrigger value="features" className="flex-1 min-w-[80px]" data-testid="tab-features">Features</TabsTrigger>
              <TabsTrigger value="tiers" className="flex-1 min-w-[80px]" data-testid="tab-tiers">Tiers</TabsTrigger>
              <TabsTrigger value="workflows" className="flex-1 min-w-[80px]" data-testid="tab-workflows">Workflows</TabsTrigger>
              <TabsTrigger value="apis" className="flex-1 min-w-[80px]" data-testid="tab-apis">API Keys</TabsTrigger>
              <TabsTrigger value="setup" className="flex-1 min-w-[80px]" data-testid="tab-setup">Setup</TabsTrigger>
            </TabsList>

            <TabsContent value="features">
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-6 pr-4">
                  {/* Upgrade CTA inside Features tab */}
                  {isFreeUser && (
                    <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
                      <CardContent className="p-5">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Rocket className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Get Started Quickly</h3>
                              <p className="text-muted-foreground text-sm">
                                Set up your own API keys, or upgrade to <span className="font-medium text-primary">Premium (£29.99/mo)</span> for pre-connected AI engines.
                              </p>
                            </div>
                          </div>
                          <Button 
                            onClick={() => setLocation("/subscription")}
                            className="gap-2 w-full"
                            data-testid="button-upgrade-features"
                          >
                            <Crown className="h-4 w-4" />
                            Upgrade Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

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
                    title="6. AI Image Generation (5 Options)"
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
                          <div className="p-3 bg-muted rounded-lg border-2 border-orange-500">
                            <div className="font-medium flex items-center gap-2">
                              Getty Images <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs">Studio</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">Premium stock photos. Studio tier only.</div>
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

                  {/* Studio Package - Studio Tier Only */}
                  <Card className="border-2 border-orange-500/30 bg-gradient-to-r from-orange-500/5 to-red-500/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                          <Film className="h-6 w-6 text-white" />
                        </div>
                        11. Studio Package
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">Studio Only</Badge>
                      </CardTitle>
                      <CardDescription>Professional video generation with 6 powerful features - exclusive to Studio tier (£99.99/mo)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="font-medium flex items-center gap-2">
                            <Film className="h-4 w-4 text-orange-500" />
                            Long-Form Videos
                          </div>
                          <div className="text-sm text-muted-foreground">Create videos up to 3 minutes with 5 style options (animation, live action, generative, talking head, documentary). 100 min/month.</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="font-medium flex items-center gap-2">
                            <Globe className="h-4 w-4 text-orange-500" />
                            Blog/URL to Video
                          </div>
                          <div className="text-sm text-muted-foreground">Paste any blog post or article URL and convert it into a professional video automatically.</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="font-medium flex items-center gap-2">
                            <Mic className="h-4 w-4 text-orange-500" />
                            Voice to Video
                          </div>
                          <div className="text-sm text-muted-foreground">Upload your audio file and get AI-generated visuals that match your narration.</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="font-medium flex items-center gap-2">
                            <Languages className="h-4 w-4 text-orange-500" />
                            Multi-Voice Scenes
                          </div>
                          <div className="text-sm text-muted-foreground">Create videos with different AI voices for each scene - perfect for dialogues and interviews.</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="font-medium flex items-center gap-2">
                            <Palette className="h-4 w-4 text-orange-500" />
                            Scene Properties
                          </div>
                          <div className="text-sm text-muted-foreground">Customize backgrounds, weather effects, furniture, and visual effects for your scenes.</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="font-medium flex items-center gap-2">
                            <Image className="h-4 w-4 text-orange-500" />
                            Getty Images B-Roll
                          </div>
                          <div className="text-sm text-muted-foreground">Access premium Getty Images stock footage for professional B-roll content.</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm pt-2">
                        <div>
                          <span className="font-medium">Monthly Limits:</span>{" "}
                          <span className="text-muted-foreground">Videos: 100 min | Generative: 4 min | Images: 800</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <FeatureCard
                    icon={<Image className="h-6 w-6" />}
                    title="12. Getty Images (Studio Tier)"
                    description="Access premium Getty Images stock photos as B-roll for your videos."
                    howItWorks={
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Go to Creator Studio &gt; Studio Package &gt; Getty tab</li>
                        <li>Search for images or videos by keyword</li>
                        <li>Select assets to use in your Multi-Voice scenes</li>
                        <li>Premium stock content enhances your video quality</li>
                      </ol>
                    }
                    apiNeeded="Getty Images (via Studio Package)"
                    pricing="Included with Studio tier (£99.99/mo)"
                  />

                  <FeatureCard
                    icon={<Search className="h-6 w-6" />}
                    title="13. Content Comparison"
                    description="Compare your content against viral competitors to get AI-powered insights and improvements."
                    howItWorks={
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Select your content from Edit & Merge OR paste a YouTube URL</li>
                        <li>Paste a competitor's viral video URL</li>
                        <li>Upload screenshots for visual comparison (optional)</li>
                        <li>AI analyzes hook strength, visual style, structure, and caption strategy</li>
                        <li>Get a similarity score, predicted view range, and specific improvements</li>
                      </ol>
                    }
                    apiNeeded="OpenAI (GPT-4o Vision)"
                    pricing="Core: 1/month | Premium+: Unlimited"
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tiers">
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-6 pr-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-purple-500" />
                        Subscription Tiers
                      </CardTitle>
                      <CardDescription>
                        Choose the plan that fits your content creation needs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="font-bold text-lg">Free</div>
                          <div className="text-2xl font-bold mb-2">£0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>Scripts + Images only</li>
                            <li>Use your own API keys</li>
                            <li>0 social channels</li>
                            <li>1 brand brief</li>
                          </ul>
                        </div>
                        <div className="p-4 border rounded-lg border-blue-500/50 bg-blue-500/5">
                          <div className="font-bold text-lg text-blue-600">Core</div>
                          <div className="text-2xl font-bold mb-2">£9.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>All tools unlocked</li>
                            <li>Use your own API keys</li>
                            <li>1 social channel</li>
                            <li>1 brand brief</li>
                            <li>1 content comparison</li>
                            <li>Unlimited with own APIs</li>
                          </ul>
                        </div>
                        <div className="p-4 border rounded-lg border-purple-500/50 bg-purple-500/5">
                          <div className="font-bold text-lg text-purple-600">Premium</div>
                          <div className="text-2xl font-bold mb-2">£29.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>Platform APIs included</li>
                            <li>6 social channels</li>
                            <li>5 brand briefs</li>
                            <li>30 min voiceovers</li>
                            <li>20 A2E videos, 180 images</li>
                            <li>150 lipsync, 5 avatars</li>
                            <li>Unlimited comparisons</li>
                          </ul>
                        </div>
                        <div className="p-4 border rounded-lg border-yellow-500/50 bg-yellow-500/5">
                          <div className="font-bold text-lg text-yellow-600">Pro</div>
                          <div className="text-2xl font-bold mb-2">£49.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>8 social channels</li>
                            <li>10 brand briefs</li>
                            <li>75 min voiceovers</li>
                            <li>45 A2E videos, 500 images</li>
                            <li>400 lipsync, 10 avatars</li>
                            <li>Unlimited comparisons</li>
                            <li>4 team logins</li>
                          </ul>
                        </div>
                        <div className="p-4 border-2 rounded-lg border-pink-500 bg-gradient-to-br from-pink-500/10 to-red-500/10">
                          <div className="font-bold text-lg bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">Studio</div>
                          <div className="text-2xl font-bold mb-2">£99.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                          <Badge className="mb-2 bg-pink-500 text-white text-xs">Early Adopter</Badge>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>All 10 social channels</li>
                            <li>15 brand briefs</li>
                            <li>90 min voiceovers</li>
                            <li>60 A2E videos, 500 images</li>
                            <li>450 lipsync, 15 avatars</li>
                            <li>Unlimited comparisons</li>
                            <li>Creator Studio included</li>
                            <li>Studio Package + Getty</li>
                            <li>6 team logins</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Social Channels by Tier
                      </CardTitle>
                      <CardDescription>
                        Connect and auto-post to these platforms based on your subscription
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3 font-medium">Platform</th>
                              <th className="text-center p-3 font-medium">Free</th>
                              <th className="text-center p-3 font-medium">Core</th>
                              <th className="text-center p-3 font-medium">Premium</th>
                              <th className="text-center p-3 font-medium">Pro</th>
                              <th className="text-center p-3 font-medium">Studio</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b"><td className="p-3">YouTube</td><td className="text-center p-3">-</td><td className="text-center p-3">1</td><td className="text-center p-3">6</td><td className="text-center p-3">8</td><td className="text-center p-3 text-green-600">10</td></tr>
                            <tr className="border-b"><td className="p-3">Twitter/X</td><td className="text-center p-3">-</td><td className="text-center p-3">1</td><td className="text-center p-3">6</td><td className="text-center p-3">8</td><td className="text-center p-3 text-green-600">10</td></tr>
                            <tr className="border-b"><td className="p-3">LinkedIn</td><td className="text-center p-3">-</td><td className="text-center p-3">1</td><td className="text-center p-3">6</td><td className="text-center p-3">8</td><td className="text-center p-3 text-green-600">10</td></tr>
                            <tr className="border-b"><td className="p-3">Facebook</td><td className="text-center p-3">-</td><td className="text-center p-3">1</td><td className="text-center p-3">6</td><td className="text-center p-3">8</td><td className="text-center p-3 text-green-600">10</td></tr>
                            <tr className="border-b"><td className="p-3">Instagram</td><td className="text-center p-3">-</td><td className="text-center p-3">1</td><td className="text-center p-3">6</td><td className="text-center p-3">8</td><td className="text-center p-3 text-green-600">10</td></tr>
                            <tr className="border-b"><td className="p-3">TikTok</td><td className="text-center p-3">-</td><td className="text-center p-3">1</td><td className="text-center p-3">6</td><td className="text-center p-3">8</td><td className="text-center p-3 text-green-600">10</td></tr>
                            <tr className="border-b"><td className="p-3">Threads</td><td className="text-center p-3">-</td><td className="text-center p-3">1</td><td className="text-center p-3">6</td><td className="text-center p-3">8</td><td className="text-center p-3 text-green-600">10</td></tr>
                            <tr className="border-b"><td className="p-3">Bluesky</td><td className="text-center p-3">-</td><td className="text-center p-3">1</td><td className="text-center p-3">6</td><td className="text-center p-3">8</td><td className="text-center p-3 text-green-600">10</td></tr>
                            <tr className="border-b"><td className="p-3">Pinterest</td><td className="text-center p-3">-</td><td className="text-center p-3">1</td><td className="text-center p-3">6</td><td className="text-center p-3">8</td><td className="text-center p-3 text-green-600">10</td></tr>
                            <tr><td className="p-3">Reddit</td><td className="text-center p-3">-</td><td className="text-center p-3">1</td><td className="text-center p-3">6</td><td className="text-center p-3">8</td><td className="text-center p-3 text-green-600">10</td></tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        Channel limits are shared across all platforms. For example, Core users can connect 1 total channel (e.g., 1 YouTube OR 1 TikTok).
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Creator Studio Add-on
                      </CardTitle>
                      <CardDescription>
                        Advanced AI creation tools for Premium and Pro subscribers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 border rounded-lg bg-purple-500/5 border-purple-500/30 mb-4">
                        <div className="font-bold text-lg text-purple-600">£20/month add-on</div>
                        <p className="text-sm text-muted-foreground">Available for Premium and Pro subscribers. Included free with Studio tier.</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-muted rounded-lg text-sm"><strong>Voice Cloning</strong> - 2/month</div>
                        <div className="p-3 bg-muted rounded-lg text-sm"><strong>Talking Photos</strong> - 4/month</div>
                        <div className="p-3 bg-muted rounded-lg text-sm"><strong>Talking Videos</strong> - 2/month</div>
                        <div className="p-3 bg-muted rounded-lg text-sm"><strong>Face Swap</strong> - 5/month</div>
                        <div className="p-3 bg-muted rounded-lg text-sm"><strong>AI Dubbing</strong> - 2/month</div>
                        <div className="p-3 bg-muted rounded-lg text-sm"><strong>Image to Video</strong> - 5/month</div>
                        <div className="p-3 bg-muted rounded-lg text-sm"><strong>Caption Removal</strong> - 6/month</div>
                        <div className="p-3 bg-muted rounded-lg text-sm"><strong>Video Style Transfer</strong> - 3/month</div>
                        <div className="p-3 bg-muted rounded-lg text-sm"><strong>Virtual Try-On</strong> - 5/month</div>
                      </div>
                    </CardContent>
                  </Card>
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
                  <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-amber-600">
                        <Zap className="h-5 w-5" />
                        Important: Tier-Based API Access
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                          <div className="font-medium text-green-700 dark:text-green-300 mb-1">Premium & Pro Subscribers</div>
                          <div className="text-green-600 dark:text-green-400">
                            All AI features work automatically using platform API keys. No setup needed!
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                          <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">Free Tier Users</div>
                          <div className="text-blue-600 dark:text-blue-400">
                            You need to add your own API keys to use AI features. See the table below for where to get them.
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

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
                  <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-500" />
                        Premium & Pro Users
                      </CardTitle>
                      <CardDescription>You don't need to add any API keys!</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm">
                          Premium and Pro subscribers automatically get access to all AI features using our platform API keys. 
                          You can start generating content immediately without any setup.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                          <Badge variant="secondary" className="justify-center py-1">OpenAI</Badge>
                          <Badge variant="secondary" className="justify-center py-1">ElevenLabs</Badge>
                          <Badge variant="secondary" className="justify-center py-1">A2E Avatars</Badge>
                          <Badge variant="secondary" className="justify-center py-1">DALL-E</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Free Users: How to Add Your API Keys
                      </CardTitle>
                      <CardDescription>Two easy ways to configure your own API keys</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="font-medium mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">A</span>
                            Option A: From AI Engines Page (Recommended)
                          </div>
                          <ol className="space-y-2 text-sm text-muted-foreground ml-8">
                            <li>1. Go to <strong>AI Engines</strong> in the sidebar</li>
                            <li>2. Find the engine you want to configure (OpenAI, ElevenLabs, etc.)</li>
                            <li>3. Click the <strong>"Configure"</strong> button next to it</li>
                            <li>4. Paste your API key in the dialog</li>
                            <li>5. Click <strong>"Save Key"</strong></li>
                            <li>6. The engine will show a green checkmark when configured</li>
                          </ol>
                        </div>

                        <div className="p-4 bg-muted rounded-lg">
                          <div className="font-medium mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm">B</span>
                            Option B: From Settings Page
                          </div>
                          <ol className="space-y-2 text-sm text-muted-foreground ml-8">
                            <li>1. Go to <strong>Settings</strong> (gear icon in sidebar)</li>
                            <li>2. Scroll to <strong>AI Engines</strong> section</li>
                            <li>3. Enter your API keys in the respective fields</li>
                            <li>4. Click <strong>Save</strong> at the bottom</li>
                          </ol>
                        </div>
                      </div>
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
