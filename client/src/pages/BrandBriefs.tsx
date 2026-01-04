import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Video, Image, Layout as LayoutIcon, Type, User, Film, Mic } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Sparkles, Edit2, Loader2, Lightbulb } from "lucide-react";
import type { BrandBrief } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { UpgradePrompt } from "@/components/UpgradePrompt";

const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Twitter", "LinkedIn", "Facebook"];
const FREQUENCIES = ["Daily", "3x per week", "Weekly", "Bi-weekly", "Monthly"];

const DEMO_USER_ID = "demo-user";

export default function BrandBriefs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasFullAccess, user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [generatingForBrief, setGeneratingForBrief] = useState<string | null>(null);
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [showIdeasForBrief, setShowIdeasForBrief] = useState<string | null>(null);
  const [formatDialogOpen, setFormatDialogOpen] = useState(false);
  const [selectedBriefForGenerate, setSelectedBriefForGenerate] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<"video" | "image" | "carousel" | "tiktok_text" | "ugc_talking" | "ugc_lipsync" | "studio_longform">("video");
  const [sceneCount, setSceneCount] = useState<number>(3);
  const [generateTopic, setGenerateTopic] = useState<string>("");
  const [optimizationGoal, setOptimizationGoal] = useState<"reach" | "saves" | "comments" | "clicks">("reach");
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);
  const [upgradeFeatureName, setUpgradeFeatureName] = useState("");

  // Fetch user's own API keys status
  const { data: userApiKeys } = useQuery<{ hasOpenai: boolean; hasElevenlabs: boolean; hasA2e: boolean; hasFal: boolean; hasPexels: boolean }>({
    queryKey: ["/api/user/api-keys"],
    queryFn: async () => {
      const res = await fetch("/api/user/api-keys", { credentials: "include" });
      if (!res.ok) return { hasOpenai: false, hasElevenlabs: false, hasA2e: false, hasFal: false, hasPexels: false };
      return res.json();
    },
    enabled: !!user?.id && !hasFullAccess,
  });

  const checkAIAccess = (featureName: string): boolean => {
    if (hasFullAccess) return true;
    // Free users with their own OpenAI key can access AI features
    if (userApiKeys?.hasOpenai) return true;
    setUpgradeFeatureName(featureName);
    setUpgradePromptOpen(true);
    return false;
  };

  const { data: briefs = [], isLoading } = useQuery<BrandBrief[]>({
    queryKey: [`/api/brand-briefs?userId=${DEMO_USER_ID}`],
  });

  const createBriefMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/brand-briefs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/brand-briefs?userId=${DEMO_USER_ID}`] });
      setIsDialogOpen(false);
      setSelectedPlatforms([]);
      toast({ title: "Brand brief created successfully!" });
    },
    onError: (error) => {
      toast({ title: "Failed to create brand brief", description: error.message, variant: "destructive" });
    },
  });

  const invalidateContentQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=pending"] });
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=approved"] });
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=rejected"] });
  };

  const generateContentMutation = useMutation({
    mutationFn: async ({ briefId, topic, contentFormat, sceneCount, optimizationGoal }: { briefId: string; topic?: string; contentFormat?: string; sceneCount?: number; optimizationGoal?: string }) => {
      const res = await apiRequest("POST", "/api/generate-content", {
        briefId,
        contentType: "both",
        contentFormat: contentFormat || "video",
        topic,
        sceneCount: contentFormat === "video" ? sceneCount : undefined,
        optimizationGoal,
      });
      return res.json();
    },
    onSuccess: () => {
      invalidateContentQueries();
      setFormatDialogOpen(false);
      setGenerateTopic("");
      toast({ title: "Content generated! Check the Content Queue." });
    },
    onError: (error) => {
      toast({ title: "Failed to generate content", description: error.message, variant: "destructive" });
    },
  });

  const generateIdeasMutation = useMutation({
    mutationFn: async (briefId: string) => {
      const res = await apiRequest("POST", "/api/generate-ideas", { briefId, count: 5 });
      return res.json();
    },
    onSuccess: (data, briefId) => {
      setGeneratedIdeas(data.ideas || []);
      setShowIdeasForBrief(briefId);
    },
    onError: (error) => {
      toast({ title: "Failed to generate ideas", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createBriefMutation.mutate({
      userId: DEMO_USER_ID,
      name: formData.get("name"),
      accountType: formData.get("accountType") || "brand",
      brandVoice: formData.get("brandVoice"),
      targetAudience: formData.get("targetAudience"),
      contentGoals: formData.get("contentGoals"),
      linksToInclude: formData.get("linksToInclude") || null,
      postingFrequency: formData.get("postingFrequency"),
      platforms: selectedPlatforms,
    });
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleGenerateContent = (briefId: string, topic?: string) => {
    setSelectedBriefForGenerate(briefId);
    setGenerateTopic(topic || "");
    setFormatDialogOpen(true);
  };

  const executeGenerate = () => {
    if (!checkAIAccess("AI Content Generation")) return;
    if (!selectedBriefForGenerate) return;
    setGeneratingForBrief(selectedBriefForGenerate);
    generateContentMutation.mutate({ 
      briefId: selectedBriefForGenerate, 
      topic: generateTopic || undefined,
      contentFormat: selectedFormat,
      sceneCount: selectedFormat === "video" ? sceneCount : undefined,
      optimizationGoal,
    }, {
      onSettled: () => setGeneratingForBrief(null),
    });
  };

  const handleGenerateIdeas = (briefId: string) => {
    if (!checkAIAccess("AI Content Ideas")) return;
    generateIdeasMutation.mutate(briefId);
  };

  return (
    <Layout title="Brand Briefs">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">
          Create brand profiles to generate consistent, on-brand content across all platforms.
        </p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-brief">
              <Plus className="w-4 h-4 mr-2" />
              New Brand Brief
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Brand Brief</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Brand Name</Label>
                <Input id="name" name="name" placeholder="My Brand" required data-testid="input-name" />
              </div>

              <div className="space-y-2">
                <Label>Account Type</Label>
                <p className="text-xs text-muted-foreground mb-2">This helps AI tailor content to your style and goals</p>
                <RadioGroup
                  name="accountType"
                  defaultValue="brand"
                  className="grid grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="account-brand"
                    className="flex flex-col gap-1 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="brand" id="account-brand" className="sr-only" />
                    <span className="text-sm font-medium">Brand</span>
                    <span className="text-xs text-muted-foreground">Professional, trust-focused, conversion CTAs</span>
                  </Label>
                  <Label
                    htmlFor="account-influencer"
                    className="flex flex-col gap-1 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="influencer" id="account-influencer" className="sr-only" />
                    <span className="text-sm font-medium">Influencer</span>
                    <span className="text-xs text-muted-foreground">Personal, hook-first, engagement-focused</span>
                  </Label>
                  <Label
                    htmlFor="account-ugc"
                    className="flex flex-col gap-1 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="ugc" id="account-ugc" className="sr-only" />
                    <span className="text-sm font-medium">UGC / Social</span>
                    <span className="text-xs text-muted-foreground">Adaptive, deliverable-ready, multiple versions</span>
                  </Label>
                  <Label
                    htmlFor="account-educator"
                    className="flex flex-col gap-1 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="educator" id="account-educator" className="sr-only" />
                    <span className="text-sm font-medium">Educator</span>
                    <span className="text-xs text-muted-foreground">Structured, explanatory, save-worthy</span>
                  </Label>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandVoice">Brand Voice</Label>
                <Textarea
                  id="brandVoice"
                  name="brandVoice"
                  placeholder="Describe your brand's tone and personality (e.g., Professional yet approachable, witty, educational...)"
                  required
                  data-testid="input-brand-voice"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Textarea
                  id="targetAudience"
                  name="targetAudience"
                  placeholder="Describe your ideal audience (e.g., Tech-savvy millennials interested in productivity...)"
                  required
                  data-testid="input-target-audience"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentGoals">Content Goals</Label>
                <Textarea
                  id="contentGoals"
                  name="contentGoals"
                  placeholder="What do you want to achieve? (e.g., Increase brand awareness, drive website traffic, generate leads...)"
                  required
                  data-testid="input-content-goals"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linksToInclude">Links to Include (optional)</Label>
                <Textarea
                  id="linksToInclude"
                  name="linksToInclude"
                  placeholder="Add affiliate links, website URLs, or CTAs to include in captions (e.g., pointsbot.net/signup, bit.ly/myoffer)"
                  data-testid="input-links-to-include"
                />
              </div>

              <div className="space-y-2">
                <Label>Platforms</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => (
                    <Badge
                      key={platform}
                      variant={selectedPlatforms.includes(platform) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => togglePlatform(platform)}
                      data-testid={`badge-platform-${platform}`}
                    >
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postingFrequency">Posting Frequency</Label>
                <Select name="postingFrequency" required>
                  <SelectTrigger data-testid="select-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBriefMutation.isPending || selectedPlatforms.length === 0} data-testid="button-submit-brief">
                  {createBriefMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Brief
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : briefs.length === 0 ? (
        <Card className="border-dashed" data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No brand briefs yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first brand brief to start generating AI-powered content.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-brief">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Brief
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {briefs.map((brief) => (
            <Card key={brief.id} className="hover:shadow-md transition-shadow" data-testid={`card-brief-${brief.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg" data-testid={`text-brief-name-${brief.id}`}>{brief.name}</CardTitle>
                  <Badge variant="outline">{brief.postingFrequency}</Badge>
                </div>
                <CardDescription className="line-clamp-2" data-testid={`text-brief-voice-${brief.id}`}>
                  {brief.brandVoice}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {brief.platforms.map((platform) => (
                    <Badge key={platform} variant="secondary" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Audience:</strong> {brief.targetAudience.slice(0, 60)}...</p>
                  <p><strong>Goals:</strong> {brief.contentGoals.slice(0, 60)}...</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleGenerateContent(brief.id)}
                    disabled={generatingForBrief === brief.id}
                    data-testid={`button-generate-${brief.id}`}
                  >
                    {generatingForBrief === brief.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateIdeas(brief.id)}
                    disabled={generateIdeasMutation.isPending && showIdeasForBrief === brief.id}
                    data-testid={`button-ideas-${brief.id}`}
                  >
                    {generateIdeasMutation.isPending && showIdeasForBrief === brief.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Lightbulb className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {showIdeasForBrief === brief.id && generatedIdeas.length > 0 && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Content Ideas:</p>
                    <ul className="space-y-1">
                      {generatedIdeas.map((idea, i) => (
                        <li key={i} className="text-xs flex gap-2">
                          <span className="text-primary">•</span>
                          <span 
                            className="cursor-pointer hover:text-primary"
                            onClick={() => handleGenerateContent(brief.id, idea)}
                          >
                            {idea}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formatDialogOpen} onOpenChange={setFormatDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Content Format</DialogTitle>
            <DialogDescription>
              Select the type of content you want to generate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {generateTopic && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">Topic:</p>
                <p className="text-sm">{generateTopic}</p>
              </div>
            )}

            <RadioGroup
              value={selectedFormat}
              onValueChange={(value: "video" | "image" | "carousel" | "tiktok_text" | "ugc_talking" | "ugc_lipsync" | "studio_longform") => setSelectedFormat(value)}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="format-video"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedFormat === "video" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <RadioGroupItem value="video" id="format-video" className="sr-only" />
                <Video className="w-6 h-6" />
                <span className="text-sm font-medium">Video</span>
                <span className="text-xs text-muted-foreground text-center">Script, voiceover, AI video</span>
              </Label>

            {selectedFormat === "video" && (
              <div className="col-span-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <Label className="text-sm font-medium mb-2 block">Number of Scenes</Label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant={sceneCount === num ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSceneCount(num)}
                      className="flex-1"
                      data-testid={`button-scene-count-${num}`}
                    >
                      {num} {num === 1 ? "Scene" : "Scenes"}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Each scene generates a separate video clip for editing.
                </p>
              </div>
            )}

              <Label
                htmlFor="format-image"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedFormat === "image" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <RadioGroupItem value="image" id="format-image" className="sr-only" />
                <Image className="w-6 h-6" />
                <span className="text-sm font-medium">Image Post</span>
                <span className="text-xs text-muted-foreground text-center">Single image graphic</span>
              </Label>

              <Label
                htmlFor="format-carousel"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedFormat === "carousel" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <RadioGroupItem value="carousel" id="format-carousel" className="sr-only" />
                <LayoutIcon className="w-6 h-6" />
                <span className="text-sm font-medium">Carousel</span>
                <span className="text-xs text-muted-foreground text-center">Multi-slide post</span>
              </Label>

              <Label
                htmlFor="format-tiktok"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedFormat === "tiktok_text" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <RadioGroupItem value="tiktok_text" id="format-tiktok" className="sr-only" />
                <Type className="w-6 h-6" />
                <span className="text-sm font-medium">TikTok Text</span>
                <span className="text-xs text-muted-foreground text-center">Short promo text</span>
              </Label>

              <div className="col-span-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Creator Studio Formats (Pro/Studio)</p>
              </div>

              <Label
                htmlFor="format-ugc-talking"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedFormat === "ugc_talking" ? "border-purple-500 bg-purple-500/5" : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <RadioGroupItem value="ugc_talking" id="format-ugc-talking" className="sr-only" />
                <User className="w-6 h-6 text-purple-500" />
                <span className="text-sm font-medium">UGC Talking</span>
                <span className="text-xs text-muted-foreground text-center">Talking photo/video</span>
              </Label>

              <Label
                htmlFor="format-ugc-lipsync"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedFormat === "ugc_lipsync" ? "border-purple-500 bg-purple-500/5" : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <RadioGroupItem value="ugc_lipsync" id="format-ugc-lipsync" className="sr-only" />
                <Mic className="w-6 h-6 text-purple-500" />
                <span className="text-sm font-medium">UGC Lip-sync</span>
                <span className="text-xs text-muted-foreground text-center">Face swap lip-sync</span>
              </Label>

              <div className="col-span-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Studio Package (Studio tier)</p>
              </div>

              <Label
                htmlFor="format-studio-longform"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors col-span-2 ${
                  selectedFormat === "studio_longform" ? "border-orange-500 bg-orange-500/5" : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <RadioGroupItem value="studio_longform" id="format-studio-longform" className="sr-only" />
                <Film className="w-6 h-6 text-orange-500" />
                <span className="text-sm font-medium">Long-Form Video</span>
                <span className="text-xs text-muted-foreground text-center">Professional video up to 3 minutes</span>
              </Label>
            </RadioGroup>

            <div className="pt-4 border-t">
              <Label className="text-sm font-medium mb-2 block">Optimize For</Label>
              <Select value={optimizationGoal} onValueChange={(value: "reach" | "saves" | "comments" | "clicks") => setOptimizationGoal(value)}>
                <SelectTrigger data-testid="select-optimization-goal">
                  <SelectValue placeholder="Choose optimization goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reach">
                    <div className="flex flex-col">
                      <span className="font-medium">Reach</span>
                      <span className="text-xs text-muted-foreground">Shareable, broad appeal content</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="saves">
                    <div className="flex flex-col">
                      <span className="font-medium">Saves</span>
                      <span className="text-xs text-muted-foreground">Reference-worthy, bookmark-able</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="comments">
                    <div className="flex flex-col">
                      <span className="font-medium">Comments</span>
                      <span className="text-xs text-muted-foreground">Discussion-driving, engaging</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="clicks">
                    <div className="flex flex-col">
                      <span className="font-medium">Clicks</span>
                      <span className="text-xs text-muted-foreground">Link-driving, action-oriented</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                AI will tailor hooks, CTAs, and structure for this goal.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormatDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={executeGenerate}
              disabled={generateContentMutation.isPending}
              data-testid="button-confirm-generate"
            >
              {generateContentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradePrompt
        feature={upgradeFeatureName}
        open={upgradePromptOpen}
        onOpenChange={setUpgradePromptOpen}
      />
    </Layout>
  );
}
