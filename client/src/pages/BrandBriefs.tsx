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
import { Video, Image, Layout as LayoutIcon, Type, User, Film, Mic, ImagePlus, Trash2, Upload, Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Sparkles, Edit2, Loader2, Lightbulb } from "lucide-react";
import type { BrandBrief, BrandAsset, AssetType, ASSET_TYPES } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { ResponsiveTooltip } from "@/components/ui/responsive-tooltip";

const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Twitter", "LinkedIn", "Facebook"];
const FREQUENCIES = ["Daily", "3x per week", "Weekly", "Bi-weekly", "Monthly"];
const ASSET_TYPE_OPTIONS = [
  { value: "screenshot", label: "Screenshot" },
  { value: "product", label: "Product Photo" },
  { value: "logo", label: "Logo" },
  { value: "headshot", label: "Headshot" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "testimonial", label: "Testimonial" },
  { value: "other", label: "Other" },
];

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
  const [carouselMode, setCarouselMode] = useState<"from_scratch" | "match_style">("from_scratch");
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [analyzingStyle, setAnalyzingStyle] = useState(false);
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);
  const [upgradeFeatureName, setUpgradeFeatureName] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBrief, setEditingBrief] = useState<BrandBrief | null>(null);
  const [editPlatforms, setEditPlatforms] = useState<string[]>([]);
  const [assetsDialogOpen, setAssetsDialogOpen] = useState(false);
  const [assetsBriefId, setAssetsBriefId] = useState<string | null>(null);
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("other");
  const [assetDescription, setAssetDescription] = useState("");
  const [assetReferenceSlug, setAssetReferenceSlug] = useState("");
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  
  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };
  
  const handleAssetNameChange = (name: string) => {
    setAssetName(name);
    // Auto-generate slug for ALL asset types
    setAssetReferenceSlug(generateSlug(name));
  };
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [analyzingWebsite, setAnalyzingWebsite] = useState(false);
  const [formName, setFormName] = useState("");
  const [formAccountType, setFormAccountType] = useState("brand");
  const [formBrandVoice, setFormBrandVoice] = useState("");
  const [formTargetAudience, setFormTargetAudience] = useState("");
  const [formContentGoals, setFormContentGoals] = useState("");
  const [formPostingFrequency, setFormPostingFrequency] = useState("");

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

  const updateBriefMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/brand-briefs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/brand-briefs?userId=${DEMO_USER_ID}`] });
      setEditDialogOpen(false);
      setEditingBrief(null);
      toast({ title: "Brand brief updated successfully!" });
    },
    onError: (error) => {
      toast({ title: "Failed to update brand brief", description: error.message, variant: "destructive" });
    },
  });

  const invalidateContentQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=pending"] });
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=approved"] });
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=rejected"] });
  };

  const generateContentMutation = useMutation({
    mutationFn: async ({ briefId, topic, contentFormat, sceneCount, optimizationGoal, carouselMode, extractedStyle, referenceImageUrl }: { 
      briefId: string; 
      topic?: string; 
      contentFormat?: string; 
      sceneCount?: number; 
      optimizationGoal?: string;
      carouselMode?: "from_scratch" | "match_style";
      extractedStyle?: string;
      referenceImageUrl?: string;
    }) => {
      const res = await apiRequest("POST", "/api/generate-content", {
        briefId,
        contentType: "both",
        contentFormat: contentFormat || "video",
        topic,
        sceneCount: contentFormat === "video" ? sceneCount : undefined,
        optimizationGoal,
        carouselMode,
        extractedStyle,
        referenceImageUrl,
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
      name: formName || formData.get("name"),
      accountType: formAccountType || formData.get("accountType") || "brand",
      brandVoice: formBrandVoice || formData.get("brandVoice"),
      targetAudience: formTargetAudience || formData.get("targetAudience"),
      contentGoals: formContentGoals || formData.get("contentGoals"),
      linksToInclude: formData.get("linksToInclude") || null,
      postingFrequency: formPostingFrequency || formData.get("postingFrequency"),
      platforms: selectedPlatforms,
    }, {
      onSuccess: () => {
        resetFormFields();
      }
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
    setCarouselMode("from_scratch");
    setReferenceImage(null);
    setReferenceImagePreview(null);
    setFormatDialogOpen(true);
  };

  const handleReferenceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const executeGenerate = async () => {
    if (!checkAIAccess("AI Content Generation")) return;
    if (!selectedBriefForGenerate) return;
    
    // For match_style mode, first upload the reference image and analyze style
    let styleData: { extractedStyle?: string; referenceImageUrl?: string } = {};
    
    if (selectedFormat === "carousel" && carouselMode === "match_style" && referenceImage) {
      setAnalyzingStyle(true);
      try {
        const formData = new FormData();
        formData.append("file", referenceImage);
        
        const uploadRes = await fetch("/api/carousel/analyze-style", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        
        if (!uploadRes.ok) {
          const error = await uploadRes.json();
          throw new Error(error.error || "Failed to analyze style");
        }
        
        styleData = await uploadRes.json();
      } catch (error: any) {
        toast({ title: "Failed to analyze style", description: error.message, variant: "destructive" });
        setAnalyzingStyle(false);
        return;
      }
      setAnalyzingStyle(false);
    }
    
    setGeneratingForBrief(selectedBriefForGenerate);
    generateContentMutation.mutate({ 
      briefId: selectedBriefForGenerate, 
      topic: generateTopic || undefined,
      contentFormat: selectedFormat,
      sceneCount: selectedFormat === "video" ? sceneCount : undefined,
      optimizationGoal,
      carouselMode: selectedFormat === "carousel" ? carouselMode : undefined,
      extractedStyle: styleData.extractedStyle,
      referenceImageUrl: styleData.referenceImageUrl,
    }, {
      onSettled: () => setGeneratingForBrief(null),
    });
  };

  const handleGenerateIdeas = (briefId: string) => {
    if (!checkAIAccess("AI Content Ideas")) return;
    generateIdeasMutation.mutate(briefId);
  };

  // Brand Assets
  const { data: assets = [], refetch: refetchAssets } = useQuery<BrandAsset[]>({
    queryKey: [`/api/brand-assets/${assetsBriefId}`],
    enabled: !!assetsBriefId && assetsDialogOpen,
  });

  const handleOpenAssets = (briefId: string) => {
    setAssetsBriefId(briefId);
    setAssetsDialogOpen(true);
    setAssetName("");
    setAssetType("other");
    setAssetDescription("");
    setAssetFile(null);
  };

  const handleUploadAsset = async () => {
    if (!assetsBriefId || !assetFile || !assetName) return;
    
    setUploadingAsset(true);
    try {
      const formData = new FormData();
      formData.append("file", assetFile);
      formData.append("briefId", assetsBriefId);
      formData.append("name", assetName);
      formData.append("assetType", assetType);
      if (assetDescription) formData.append("description", assetDescription);
      // Include referenceSlug for ALL asset types
      if (assetReferenceSlug) {
        formData.append("referenceSlug", assetReferenceSlug);
      }
      
      const res = await fetch("/api/brand-assets", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Upload failed");
      
      toast({ title: "Asset uploaded successfully!" });
      setAssetName("");
      setAssetType("other");
      setAssetDescription("");
      setAssetReferenceSlug("");
      setAssetFile(null);
      refetchAssets();
    } catch (error: any) {
      toast({ title: "Failed to upload asset", description: error.message, variant: "destructive" });
    } finally {
      setUploadingAsset(false);
    }
  };

  const deleteAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const res = await apiRequest("DELETE", `/api/brand-assets/${assetId}`);
      return res.json();
    },
    onSuccess: () => {
      refetchAssets();
      toast({ title: "Asset deleted" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete asset", description: error.message, variant: "destructive" });
    },
  });

  const handleEditBrief = (brief: BrandBrief) => {
    setEditingBrief(brief);
    setEditPlatforms(brief.platforms);
    setEditDialogOpen(true);
  };

  const toggleEditPlatform = (platform: string) => {
    setEditPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl.trim()) return;
    
    setAnalyzingWebsite(true);
    try {
      const res = await fetch("/api/brand-briefs/generate-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: websiteUrl }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to analyze website");
      }
      
      const { data } = await res.json();
      
      // Normalize accountType to ensure valid value
      const validAccountTypes = ["brand", "influencer", "ugc", "educator"];
      const normalizedAccountType = validAccountTypes.includes(data.accountType?.toLowerCase()) 
        ? data.accountType.toLowerCase() 
        : "brand";
      
      // Normalize postingFrequency to ensure valid value
      const validFrequencies = ["Daily", "3x per week", "Weekly", "Bi-weekly", "Monthly"];
      const normalizedFrequency = validFrequencies.find(f => f.toLowerCase() === data.postingFrequency?.toLowerCase()) || "3x per week";
      
      // Populate form fields
      setFormName(data.name || "");
      setFormAccountType(normalizedAccountType);
      setFormBrandVoice(data.brandVoice || "");
      setFormTargetAudience(data.targetAudience || "");
      setFormContentGoals(data.contentGoals || "");
      setFormPostingFrequency(normalizedFrequency);
      setSelectedPlatforms(data.suggestedPlatforms || []);
      
      toast({ title: "Website analyzed! Review and adjust the fields below." });
    } catch (error: any) {
      toast({ title: "Failed to analyze website", description: error.message, variant: "destructive" });
    } finally {
      setAnalyzingWebsite(false);
    }
  };

  const resetFormFields = () => {
    setWebsiteUrl("");
    setFormName("");
    setFormAccountType("brand");
    setFormBrandVoice("");
    setFormTargetAudience("");
    setFormContentGoals("");
    setFormPostingFrequency("");
    setSelectedPlatforms([]);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBrief) return;
    const formData = new FormData(e.currentTarget);
    
    updateBriefMutation.mutate({
      id: editingBrief.id,
      data: {
        name: formData.get("editName"),
        accountType: formData.get("editAccountType") || editingBrief.accountType,
        brandVoice: formData.get("editBrandVoice"),
        targetAudience: formData.get("editTargetAudience"),
        contentGoals: formData.get("editContentGoals"),
        linksToInclude: formData.get("editLinksToInclude") || null,
        postingFrequency: formData.get("editPostingFrequency"),
        platforms: editPlatforms,
      },
    });
  };

  return (
    <Layout title="Brand Briefs">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">
          Create brand profiles to generate consistent, on-brand content across all platforms.
        </p>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetFormFields(); }}>
          <DialogTrigger asChild>
            <ResponsiveTooltip content="Create a brand profile">
              <Button data-testid="button-create-brief">
                <Plus className="w-4 h-4 mr-2" />
                New Brand Brief
              </Button>
            </ResponsiveTooltip>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Brand Brief</DialogTitle>
            </DialogHeader>
            
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4 mb-4">
              <Label className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-purple-500" />
                Quick Start: Analyze Your Profile or Website
              </Label>
              <p className="text-xs text-muted-foreground mb-3">
                Paste your social media profile or website URL and we'll auto-fill your brand brief using AI
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 dark:text-purple-300 border border-purple-200/50">Instagram</span>
                <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200/50">TikTok</span>
                <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200/50">YouTube</span>
                <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/50">Twitter/X</span>
                <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-700 dark:text-gray-300 border border-gray-200/50">Website</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="https://instagram.com/yourname or https://your-website.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="flex-1"
                  data-testid="input-website-url"
                />
                <ResponsiveTooltip content="Auto-fill with AI">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAnalyzeWebsite}
                    disabled={analyzingWebsite || !websiteUrl.trim()}
                    data-testid="button-analyze-website"
                  >
                    {analyzingWebsite ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {analyzingWebsite ? "Analyzing..." : "Analyze"}
                  </Button>
                </ResponsiveTooltip>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Brand Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="My Brand" 
                  required 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  data-testid="input-name" 
                />
              </div>

              <div className="space-y-2">
                <Label>Account Type</Label>
                <p className="text-xs text-muted-foreground mb-2">This helps AI tailor content to your style and goals</p>
                <RadioGroup
                  name="accountType"
                  value={formAccountType}
                  onValueChange={setFormAccountType}
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
                  value={formBrandVoice}
                  onChange={(e) => setFormBrandVoice(e.target.value)}
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
                  value={formTargetAudience}
                  onChange={(e) => setFormTargetAudience(e.target.value)}
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
                  value={formContentGoals}
                  onChange={(e) => setFormContentGoals(e.target.value)}
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
                <Select name="postingFrequency" value={formPostingFrequency} onValueChange={setFormPostingFrequency} required>
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
                <ResponsiveTooltip content="Close dialog">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </ResponsiveTooltip>
                <ResponsiveTooltip content="Save new brief">
                  <Button type="submit" disabled={createBriefMutation.isPending || selectedPlatforms.length === 0} data-testid="button-submit-brief">
                    {createBriefMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create Brief
                  </Button>
                </ResponsiveTooltip>
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
            <ResponsiveTooltip content="Create a brand profile">
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-brief">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Brief
              </Button>
            </ResponsiveTooltip>
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
                  <ResponsiveTooltip content="Create AI content">
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
                  </ResponsiveTooltip>
                  <ResponsiveTooltip content="Get topic suggestions">
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
                  </ResponsiveTooltip>
                  <ResponsiveTooltip content="Modify this brief">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditBrief(brief)}
                      data-testid={`button-edit-${brief.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </ResponsiveTooltip>
                  <ResponsiveTooltip content="Upload brand images">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenAssets(brief.id)}
                      data-testid={`button-assets-${brief.id}`}
                    >
                      <ImagePlus className="w-4 h-4" />
                    </Button>
                  </ResponsiveTooltip>
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
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
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
                    <ResponsiveTooltip key={num} content="Select scene count">
                      <Button
                        type="button"
                        variant={sceneCount === num ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSceneCount(num)}
                        className="flex-1"
                        data-testid={`button-scene-count-${num}`}
                      >
                        {num} {num === 1 ? "Scene" : "Scenes"}
                      </Button>
                    </ResponsiveTooltip>
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

            {selectedFormat === "carousel" && (
              <div className="col-span-2 p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
                <Label className="text-sm font-medium block">How would you like to create?</Label>
                <RadioGroup
                  value={carouselMode}
                  onValueChange={(value: "from_scratch" | "match_style") => {
                    setCarouselMode(value);
                    if (value === "from_scratch") {
                      setReferenceImage(null);
                      setReferenceImagePreview(null);
                    }
                  }}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="carousel-from-scratch"
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      carouselMode === "from_scratch" ? "border-primary bg-background" : "border-muted hover:border-muted-foreground/50"
                    }`}
                  >
                    <RadioGroupItem value="from_scratch" id="carousel-from-scratch" className="mt-0.5" />
                    <div>
                      <span className="text-sm font-medium">Generate from scratch</span>
                      <p className="text-xs text-muted-foreground">AI creates everything based on your brand brief</p>
                    </div>
                  </Label>
                  <Label
                    htmlFor="carousel-match-style"
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      carouselMode === "match_style" ? "border-primary bg-background" : "border-muted hover:border-muted-foreground/50"
                    }`}
                  >
                    <RadioGroupItem value="match_style" id="carousel-match-style" className="mt-0.5" />
                    <div>
                      <span className="text-sm font-medium">Match my style</span>
                      <p className="text-xs text-muted-foreground">Upload a reference slide and AI will create 6 more matching it</p>
                    </div>
                  </Label>
                </RadioGroup>

                {carouselMode === "match_style" && (
                  <div className="mt-3 space-y-2">
                    <Label className="text-sm font-medium block">Upload Reference Slide</Label>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleReferenceImageChange}
                          className="cursor-pointer"
                          data-testid="input-reference-image"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload one slide image. AI will analyze colors, fonts, and layout.
                        </p>
                      </div>
                      {referenceImagePreview && (
                        <div className="w-16 h-16 rounded border overflow-hidden flex-shrink-0">
                          <img 
                            src={referenceImagePreview} 
                            alt="Reference preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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
            <ResponsiveTooltip content="Close dialog">
              <Button variant="outline" onClick={() => setFormatDialogOpen(false)}>
                Cancel
              </Button>
            </ResponsiveTooltip>
            <ResponsiveTooltip content="Start generating">
              <Button
                onClick={executeGenerate}
                disabled={generateContentMutation.isPending || analyzingStyle || (selectedFormat === "carousel" && carouselMode === "match_style" && !referenceImage)}
                data-testid="button-confirm-generate"
              >
                {analyzingStyle ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Style...
                  </>
                ) : generateContentMutation.isPending ? (
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
            </ResponsiveTooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Brand Brief</DialogTitle>
          </DialogHeader>
          {editingBrief && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Brand Name</Label>
                <Input 
                  id="editName" 
                  name="editName" 
                  defaultValue={editingBrief.name} 
                  required 
                  data-testid="input-edit-name" 
                />
              </div>

              <div className="space-y-2">
                <Label>Account Type</Label>
                <RadioGroup
                  name="editAccountType"
                  defaultValue={editingBrief.accountType || "brand"}
                  className="grid grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="edit-account-brand"
                    className="flex flex-col gap-1 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="brand" id="edit-account-brand" className="sr-only" />
                    <span className="text-sm font-medium">Brand</span>
                    <span className="text-xs text-muted-foreground">Professional, trust-focused</span>
                  </Label>
                  <Label
                    htmlFor="edit-account-influencer"
                    className="flex flex-col gap-1 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="influencer" id="edit-account-influencer" className="sr-only" />
                    <span className="text-sm font-medium">Influencer</span>
                    <span className="text-xs text-muted-foreground">Personal, engagement-focused</span>
                  </Label>
                  <Label
                    htmlFor="edit-account-ugc"
                    className="flex flex-col gap-1 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="ugc" id="edit-account-ugc" className="sr-only" />
                    <span className="text-sm font-medium">UGC Creator</span>
                    <span className="text-xs text-muted-foreground">Authentic, product-focused</span>
                  </Label>
                  <Label
                    htmlFor="edit-account-educator"
                    className="flex flex-col gap-1 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="educator" id="edit-account-educator" className="sr-only" />
                    <span className="text-sm font-medium">Educator</span>
                    <span className="text-xs text-muted-foreground">Value-first, authority-building</span>
                  </Label>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editBrandVoice">Brand Voice / Tone</Label>
                <Textarea
                  id="editBrandVoice"
                  name="editBrandVoice"
                  defaultValue={editingBrief.brandVoice}
                  placeholder="Describe your brand's voice..."
                  required
                  data-testid="input-edit-brand-voice"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editTargetAudience">Target Audience</Label>
                <Textarea
                  id="editTargetAudience"
                  name="editTargetAudience"
                  defaultValue={editingBrief.targetAudience}
                  placeholder="Who is your target audience?"
                  required
                  data-testid="input-edit-target-audience"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editContentGoals">Content Goals</Label>
                <Textarea
                  id="editContentGoals"
                  name="editContentGoals"
                  defaultValue={editingBrief.contentGoals}
                  placeholder="What do you want to achieve?"
                  required
                  data-testid="input-edit-content-goals"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editLinksToInclude">Links to Include (optional)</Label>
                <Input
                  id="editLinksToInclude"
                  name="editLinksToInclude"
                  defaultValue={editingBrief.linksToInclude || ""}
                  placeholder="e.g., https://mysite.com"
                  data-testid="input-edit-links"
                />
              </div>

              <div className="space-y-2">
                <Label>Platforms</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => (
                    <Badge
                      key={platform}
                      variant={editPlatforms.includes(platform) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleEditPlatform(platform)}
                      data-testid={`badge-edit-platform-${platform}`}
                    >
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editPostingFrequency">Posting Frequency</Label>
                <Select name="editPostingFrequency" defaultValue={editingBrief.postingFrequency}>
                  <SelectTrigger data-testid="select-edit-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((freq) => (
                      <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <ResponsiveTooltip content="Close dialog">
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                </ResponsiveTooltip>
                <ResponsiveTooltip content="Save edits">
                  <Button type="submit" disabled={updateBriefMutation.isPending || editPlatforms.length === 0} data-testid="button-save-edit">
                    {updateBriefMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </ResponsiveTooltip>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={assetsDialogOpen} onOpenChange={setAssetsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Brand Assets</DialogTitle>
            <DialogDescription>
              Upload screenshots, product photos, logos, and other brand materials to reference in AI-generated images.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="p-4 border rounded-lg space-y-4">
              <h4 className="font-medium text-sm">Upload New Asset</h4>
              
              <div className="space-y-2">
                <Label htmlFor="assetName">Asset Name</Label>
                <Input
                  id="assetName"
                  value={assetName}
                  onChange={(e) => handleAssetNameChange(e.target.value)}
                  placeholder="e.g., Creator Studio"
                  data-testid="input-asset-name"
                />
              </div>

              <div className="space-y-2">
                <Label>Asset Type</Label>
                <Select value={assetType} onValueChange={(v) => { 
                  setAssetType(v); 
                  // Generate slug for all types when type changes
                  if (assetName) {
                    setAssetReferenceSlug(generateSlug(assetName));
                  }
                }}>
                  <SelectTrigger data-testid="select-asset-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetReferenceSlug">Reference ID (for AI prompts)</Label>
                <Input
                  id="assetReferenceSlug"
                  value={assetReferenceSlug}
                  onChange={(e) => setAssetReferenceSlug(generateSlug(e.target.value))}
                  placeholder="e.g., main-logo, product-hero"
                  data-testid="input-asset-reference-slug"
                />
                <p className="text-xs text-muted-foreground">
                  AI will use [asset:{assetReferenceSlug || 'your-id'}] to reference this image in generated content
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetDescription">Description (optional)</Label>
                <Input
                  id="assetDescription"
                  value={assetDescription}
                  onChange={(e) => setAssetDescription(e.target.value)}
                  placeholder="Brief description of the asset"
                  data-testid="input-asset-description"
                />
              </div>

              <div className="space-y-2">
                <Label>Image File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAssetFile(e.target.files?.[0] || null)}
                    className="flex-1"
                    data-testid="input-asset-file"
                  />
                </div>
                {assetFile && (
                  <p className="text-xs text-muted-foreground">Selected: {assetFile.name}</p>
                )}
              </div>

              <ResponsiveTooltip content="Upload this image">
                <Button
                  onClick={handleUploadAsset}
                  disabled={!assetFile || !assetName || uploadingAsset}
                  className="w-full"
                  data-testid="button-upload-asset"
                >
                  {uploadingAsset ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Asset
                    </>
                  )}
                </Button>
              </ResponsiveTooltip>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Uploaded Assets ({assets.length})</h4>
              
              {assets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No assets uploaded yet. Upload your first asset above.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {assets.map((asset) => (
                    <div key={asset.id} className="border rounded-lg p-3 space-y-2" data-testid={`card-asset-${asset.id}`}>
                      <div className="aspect-video bg-muted rounded overflow-hidden">
                        <img
                          src={asset.imageUrl.startsWith("/") ? asset.imageUrl : `/objects/${asset.imageUrl}`}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder-image.svg";
                          }}
                        />
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{asset.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {ASSET_TYPE_OPTIONS.find(o => o.value === asset.assetType)?.label || asset.assetType}
                            </Badge>
                            {(asset as any).referenceSlug && (
                              <Badge variant="secondary" className="text-xs font-mono">
                                [{(asset as any).referenceSlug}]
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ResponsiveTooltip content="Remove this asset">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteAssetMutation.mutate(asset.id)}
                            data-testid={`button-delete-asset-${asset.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </ResponsiveTooltip>
                      </div>
                      {asset.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{asset.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <ResponsiveTooltip content="Close dialog">
              <Button variant="outline" onClick={() => setAssetsDialogOpen(false)}>
                Close
              </Button>
            </ResponsiveTooltip>
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
