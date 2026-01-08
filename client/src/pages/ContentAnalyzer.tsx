import { useState, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Upload, Loader2, Sparkles, Camera, Type, Palette, Frame, Lightbulb, Target, Megaphone, 
  RefreshCw, Save, CheckCircle, X, Plus, Search, Youtube, Trash2, BarChart2, FileText, 
  TrendingUp, AlertCircle, GitCompare, Clock, Eye, ThumbsUp, Image, Video, LayoutGrid, MessageSquare, Wand2, BookOpen
} from "lucide-react";
import type { BrandBrief } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const DEMO_USER_ID = "demo-user";

interface ContentAnalysis {
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
    trendingAngle?: string;
  };
  hookRewrites: string[];
  postAdvice: {
    platform: string;
    format: string;
    captionAngle: string;
  };
}

interface AnalyzedVideo {
  id: string;
  videoId: string;
  videoUrl: string;
  title: string;
  channelName?: string;
  duration?: number;
  viewCount?: number;
  likeCount?: number;
  thumbnailUrl?: string;
  transcript?: string;
  status: string;
  createdAt: string;
}

interface VideoAnalysisResult {
  id: string;
  videoId: string;
  analysisType: string;
  summary?: string;
  hookAnalysis?: { type: string; duration: number; strength: number; transcript: string };
  contentStructure?: { section: string; startTime: number; endTime: number; summary: string }[];
  keyTopics?: string[];
  ctaAnalysis?: { hasCta: boolean; type: string; placement: string; strength: number };
  toneAnalysis?: { primary: string; secondary: string; consistency: number };
  engagementTips?: string[];
  scriptIdeas?: string[];
  strengths?: string[];
  weaknesses?: string[];
}

interface VideoComparison {
  id: string;
  name: string;
  videoIds: string[];
  winningPatterns?: string[];
  contentGaps?: string[];
  recommendations?: string[];
  comparisonResult?: { comparisonSummary: string };
  createdAt: string;
}

export default function ContentAnalyzer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [mainTab, setMainTab] = useState("post-analyzer");
  
  // Post Analyzer state
  const [inputMode, setInputMode] = useState<"screenshot" | "url">("screenshot");
  const [postUrl, setPostUrl] = useState("");
  const [scrapedData, setScrapedData] = useState<{
    platform: string;
    url: string;
    caption: string;
    author: string;
    authorHandle: string;
    likes: number;
    comments: number;
    shares?: number;
    views?: number;
    thumbnailUrl?: string;
    hashtags?: string[];
  } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState(0);
  const [selectedBriefId, setSelectedBriefId] = useState<string>("");
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [saved, setSaved] = useState(false);

  // Generate Content dialog state
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"video" | "image" | "carousel" | "tiktok_text">("video");
  const [sceneCount, setSceneCount] = useState(3);
  const [optimizationGoal, setOptimizationGoal] = useState<"reach" | "saves" | "comments" | "clicks">("reach");
  const [generateSource, setGenerateSource] = useState<"post" | "video">("post");

  // Video Research state
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [comparisonName, setComparisonName] = useState("");
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [videoTab, setVideoTab] = useState("videos");

  const { data: briefs = [] } = useQuery<BrandBrief[]>({
    queryKey: [`/api/brand-briefs?userId=${DEMO_USER_ID}`],
  });

  const { data: videos = [], isLoading: loadingVideos } = useQuery<AnalyzedVideo[]>({
    queryKey: ["/api/content-analysis/videos"],
  });

  const { data: comparisons = [] } = useQuery<VideoComparison[]>({
    queryKey: ["/api/content-analysis/comparisons"],
  });

  const selectedVideo = videos.find(v => v.id === selectedVideoId);

  const { data: analysisResults = [] } = useQuery<VideoAnalysisResult[]>({
    queryKey: ["/api/content-analysis/videos", selectedVideoId, "results"],
    enabled: !!selectedVideoId,
    queryFn: async () => {
      if (!selectedVideoId) return [];
      const res = await fetch(`/api/content-analysis/videos/${selectedVideoId}/results`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Post Analyzer mutations
  const analyzeMutation = useMutation({
    mutationFn: async ({ files, briefId }: { files: File[]; briefId?: string }) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });
      if (briefId) {
        formData.append("briefId", briefId);
      }
      const res = await fetch("/api/analyze-content", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to analyze content");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setAnalysis(data);
      setCurrentAnalysisIndex(0);
      setSaved(false);
      toast({ title: `Analysis complete! Analyzed ${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''}.` });
    },
    onError: (error: any) => {
      toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
    },
  });

  // Scrape post by URL mutation
  const scrapePostMutation = useMutation({
    mutationFn: async ({ url, briefId }: { url: string; briefId?: string }) => {
      const res = await fetch("/api/scrape-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url, briefId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to scrape post");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setScrapedData(data.scrapedData);
      if (data.analysis) {
        setAnalysis(data.analysis);
      }
      setSaved(false);
      toast({ 
        title: "Post scraped successfully!", 
        description: `Got ${data.scrapedData.platform} post from @${data.scrapedData.authorHandle}` 
      });
    },
    onError: (error: any) => {
      toast({ title: "Scraping failed", description: error.message, variant: "destructive" });
    },
  });

  const saveToQueueMutation = useMutation({
    mutationFn: async () => {
      if (!analysis || !selectedBriefId || selectedBriefId === "none") {
        throw new Error("Please select a brand brief to save the analysis");
      }
      const selectedBrief = briefs.find(b => b.id === selectedBriefId);
      const script = `# Content Inspiration Analysis

## Why This Worked
${analysis.whyThisWorked.map(p => `- ${p}`).join("\n")}

## Content Structure
- **Opening Hook:** ${analysis.contentStructure.openingLine}
- **Middle Idea:** ${analysis.contentStructure.middleIdea}
- **Payoff/CTA:** ${analysis.contentStructure.payoff}

## Adaptation Ideas
- **Structure:** ${analysis.adaptationForMyChannel.sameStructure}
- **Topic:** ${analysis.adaptationForMyChannel.differentTopic}
- **Tone:** ${analysis.adaptationForMyChannel.myTone}${analysis.adaptationForMyChannel.trendingAngle ? `
- **Trending Angle:** ${analysis.adaptationForMyChannel.trendingAngle}` : ""}

## Hook Rewrites
${analysis.hookRewrites.map((h, i) => `${i + 1}. ${h}`).join("\n")}`;

      const caption = `${analysis.postAdvice.captionAngle}

Visual notes: ${analysis.visualBreakdown.colors}, ${analysis.visualBreakdown.framing}`;

      const res = await apiRequest("POST", "/api/content", {
        briefId: selectedBriefId,
        status: "pending",
        contentType: "both",
        script,
        caption,
        hashtags: [],
        platforms: selectedBrief?.platforms || ["Instagram", "TikTok"],
        generationMetadata: {
          source: "content_analyzer",
          analysisData: analysis,
          postAdvice: analysis.postAdvice,
        },
      });
      return res.json();
    },
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["/api/content?status=pending"] });
      toast({ 
        title: "Saved to Content Queue!", 
        description: "View it in your Content Queue to edit and publish.",
      });
    },
    onError: (error: any) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    },
  });

  // Generate content with inspiration context
  const generateContentMutation = useMutation({
    mutationFn: async ({ briefId, format, scenes, goal, inspirationContext }: { 
      briefId: string; 
      format: string; 
      scenes: number;
      goal: string;
      inspirationContext: any;
    }) => {
      const res = await apiRequest("POST", "/api/generate-content", {
        briefId,
        contentType: "both",
        contentFormat: format,
        sceneCount: format === "video" ? scenes : undefined,
        optimizationGoal: goal,
        inspirationContext,
      });
      return res.json();
    },
    onSuccess: () => {
      setSaved(true);
      setGenerateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/content?status=pending"] });
      toast({ 
        title: "Content generated!", 
        description: "View it in your Content Queue to edit and publish.",
      });
      setLocation("/content-queue");
    },
    onError: (error: any) => {
      toast({ title: "Failed to generate content", description: error.message, variant: "destructive" });
    },
  });

  // Build inspiration context from post analysis
  const buildPostInspirationContext = () => {
    if (!analysis) return null;
    return {
      whyThisWorked: analysis.whyThisWorked,
      contentStructure: analysis.contentStructure,
      hookRewrites: analysis.hookRewrites,
      visualBreakdown: analysis.visualBreakdown,
      adaptationIdeas: {
        sameStructure: analysis.adaptationForMyChannel.sameStructure,
        differentTopic: analysis.adaptationForMyChannel.differentTopic,
        myTone: analysis.adaptationForMyChannel.myTone,
        trendingAngle: analysis.adaptationForMyChannel.trendingAngle,
      },
    };
  };

  // Build inspiration context from video analysis
  const buildVideoInspirationContext = () => {
    if (!latestAnalysis) return null;
    return {
      videoAnalysis: {
        summary: latestAnalysis.summary,
        hookStrength: latestAnalysis.hookAnalysis?.strength,
        ctaStrength: latestAnalysis.ctaAnalysis?.strength,
        keyTopics: latestAnalysis.keyTopics,
        strengths: latestAnalysis.strengths,
        scriptIdeas: latestAnalysis.scriptIdeas,
      },
    };
  };

  const handleOpenGenerateDialog = (source: "post" | "video") => {
    setGenerateSource(source);
    setGenerateDialogOpen(true);
  };

  const handleGenerateContent = () => {
    if (!selectedBriefId || selectedBriefId === "none") {
      toast({ title: "Please select a brand brief", variant: "destructive" });
      return;
    }
    
    const inspirationContext = generateSource === "post" 
      ? buildPostInspirationContext() 
      : buildVideoInspirationContext();
    
    if (!inspirationContext) {
      toast({ title: "No analysis data available", variant: "destructive" });
      return;
    }
    
    generateContentMutation.mutate({
      briefId: selectedBriefId,
      format: selectedFormat,
      scenes: sceneCount,
      goal: optimizationGoal,
      inspirationContext,
    });
  };

  // Video Research mutations
  const addVideoMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch("/api/content-analysis/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add video");
      }
      return res.json();
    },
    onSuccess: (video) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-analysis/videos"] });
      setNewVideoUrl("");
      setSelectedVideoId(video.id);
      toast({ title: "Video added! Click 'Fetch Transcript' to get the content." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add video", description: error.message, variant: "destructive" });
    },
  });

  const scrapeVideoMutation = useMutation({
    mutationFn: async (videoDbId: string) => {
      const res = await fetch(`/api/content-analysis/videos/${videoDbId}/scrape`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to scrape video");
      }
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/content-analysis/videos"] });
      await queryClient.refetchQueries({ queryKey: ["/api/content-analysis/videos"] });
      toast({ title: "Transcript fetched successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to fetch transcript", description: error.message, variant: "destructive" });
    },
  });

  const analyzeVideoMutation = useMutation({
    mutationFn: async (videoDbId: string) => {
      const res = await fetch(`/api/content-analysis/videos/${videoDbId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisType: "full" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to analyze video");
      }
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/content-analysis/videos", selectedVideoId, "results"] });
      await queryClient.refetchQueries({ queryKey: ["/api/content-analysis/videos", selectedVideoId, "results"] });
      toast({ title: "Analysis complete!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to analyze video", description: error.message, variant: "destructive" });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoDbId: string) => {
      const res = await fetch(`/api/content-analysis/videos/${videoDbId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete video");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-analysis/videos"] });
      setSelectedVideoId(null);
      toast({ title: "Video deleted" });
    },
  });

  const compareVideosMutation = useMutation({
    mutationFn: async ({ videoIds, name }: { videoIds: string[]; name: string }) => {
      const res = await fetch("/api/content-analysis/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoIds, name }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to compare videos");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-analysis/comparisons"] });
      setShowComparisonDialog(false);
      setSelectedForComparison([]);
      setComparisonName("");
      setVideoTab("comparisons");
      toast({ title: "Comparison complete!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to compare videos", description: error.message, variant: "destructive" });
    },
  });

  // Post Analyzer handlers
  const MAX_FILES = 10;

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = [...selectedFiles, ...files].slice(0, MAX_FILES);
      setSelectedFiles(newFiles);
      setPreviewUrls(newFiles.map(f => URL.createObjectURL(f)));
      setAnalysis(null);
    }
  }, [selectedFiles]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length > 0) {
      const newFiles = [...selectedFiles, ...files].slice(0, MAX_FILES);
      setSelectedFiles(newFiles);
      setPreviewUrls(newFiles.map(f => URL.createObjectURL(f)));
      setAnalysis(null);
    }
  }, [selectedFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviewUrls(newFiles.map(f => URL.createObjectURL(f)));
    if (analysis && currentAnalysisIndex >= newFiles.length) {
      setCurrentAnalysisIndex(Math.max(0, newFiles.length - 1));
    }
  }, [selectedFiles, analysis, currentAnalysisIndex]);

  const handleAnalyze = () => {
    if (selectedFiles.length === 0) return;
    analyzeMutation.mutate({
      files: selectedFiles,
      briefId: selectedBriefId && selectedBriefId !== "none" ? selectedBriefId : undefined,
    });
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setAnalysis(null);
    setSelectedBriefId("");
    setSaved(false);
    setCurrentAnalysisIndex(0);
  };

  // Video Research handlers
  const toggleVideoForComparison = (videoId: string) => {
    setSelectedForComparison(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatNumber = (num?: number) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const latestAnalysis = analysisResults[0];

  return (
    <Layout title="Content Analyzer">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="page-title">Content Analyzer</h1>
            <p className="text-muted-foreground">Analyze viral posts and competitor videos to improve your content</p>
          </div>
          {mainTab === "video-research" && selectedForComparison.length >= 2 && (
            <Button onClick={() => setShowComparisonDialog(true)} data-testid="button-compare-selected">
              <GitCompare className="w-4 h-4 mr-2" />
              Compare {selectedForComparison.length} Videos
            </Button>
          )}
        </div>

        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="post-analyzer" data-testid="tab-post-analyzer">
              <Image className="w-4 h-4 mr-2" />
              Post Analyzer
            </TabsTrigger>
            <TabsTrigger value="video-research" data-testid="tab-video-research">
              <Youtube className="w-4 h-4 mr-2" />
              Video Research
            </TabsTrigger>
          </TabsList>

          <TabsContent value="post-analyzer" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Analyze a Post
                    </CardTitle>
                    <CardDescription>
                      Paste a YouTube, TikTok or Instagram URL, or upload a screenshot
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "screenshot" | "url")}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="url" data-testid="tab-input-url">
                          <Search className="w-4 h-4 mr-2" />
                          Paste URL
                        </TabsTrigger>
                        <TabsTrigger value="screenshot" data-testid="tab-input-screenshot">
                          <Upload className="w-4 h-4 mr-2" />
                          Screenshot
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="url" className="mt-4 space-y-4">
                        <div className="space-y-2">
                          <Label>YouTube, TikTok or Instagram URL</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="https://youtube.com/watch?v=... or tiktok.com/... or instagram.com/..."
                              value={postUrl}
                              onChange={(e) => setPostUrl(e.target.value)}
                              data-testid="input-post-url"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Paste a public YouTube, TikTok or Instagram URL to scrape the caption and metrics
                          </p>
                        </div>

                        {scrapedData && (
                          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary">{scrapedData.platform}</Badge>
                              <span className="text-sm text-muted-foreground">@{scrapedData.authorHandle}</span>
                            </div>
                            <p className="text-sm line-clamp-4">{scrapedData.caption}</p>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>❤️ {formatNumber(scrapedData.likes)}</span>
                              <span>💬 {formatNumber(scrapedData.comments)}</span>
                              {scrapedData.views && <span>👁 {formatNumber(scrapedData.views)}</span>}
                              {scrapedData.shares && <span>🔗 {formatNumber(scrapedData.shares)}</span>}
                            </div>
                            {scrapedData.hashtags && scrapedData.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {scrapedData.hashtags.slice(0, 5).map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">#{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <Button
                          onClick={() => {
                            if (!postUrl) {
                              toast({ title: "Please enter a URL", variant: "destructive" });
                              return;
                            }
                            scrapePostMutation.mutate({ 
                              url: postUrl, 
                              briefId: selectedBriefId && selectedBriefId !== "none" ? selectedBriefId : undefined 
                            });
                          }}
                          disabled={!postUrl || scrapePostMutation.isPending}
                          className="w-full"
                          data-testid="button-scrape-post"
                        >
                          {scrapePostMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Scraping post...
                            </>
                          ) : (
                            <>
                              <Search className="w-4 h-4 mr-2" />
                              Scrape & Analyze Post
                            </>
                          )}
                        </Button>
                      </TabsContent>

                      <TabsContent value="screenshot" className="mt-4">
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDrop}
                          className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer min-h-[200px]"
                          onClick={() => document.getElementById("file-input")?.click()}
                          data-testid="dropzone-upload"
                        >
                          {previewUrls.length > 0 ? (
                            <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {previewUrls.map((url, index) => (
                                  <div key={index} className="relative group">
                                    <img
                                      src={url}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-20 object-cover rounded-lg shadow-sm"
                                      data-testid={`img-preview-${index}`}
                                    />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFile(index);
                                      }}
                                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      data-testid={`button-remove-${index}`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                                {selectedFiles.length < MAX_FILES && (
                                  <div
                                    onClick={() => document.getElementById("file-input")?.click()}
                                    className="w-full h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                                  >
                                    <Upload className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {selectedFiles.length} of {MAX_FILES} images selected
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 py-4">
                              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                              <p className="text-muted-foreground">
                                Drop images here or click to browse
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Upload up to 10 screenshots (PNG, JPG, WEBP)
                              </p>
                            </div>
                          )}
                          <input
                            id="file-input"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                            data-testid="input-file"
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Personalization (Optional)</CardTitle>
                    <CardDescription>
                      Select a brand brief to get tailored adaptation suggestions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="brief-select">Brand Brief</Label>
                        <Select value={selectedBriefId} onValueChange={setSelectedBriefId}>
                          <SelectTrigger id="brief-select" data-testid="select-brief">
                            <SelectValue placeholder="Select a brand brief (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No brand brief</SelectItem>
                            {briefs.map((brief) => (
                              <SelectItem key={brief.id} value={brief.id}>
                                {brief.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleAnalyze}
                          disabled={selectedFiles.length === 0 || analyzeMutation.isPending}
                          className="flex-1"
                          data-testid="button-analyze"
                        >
                          {analyzeMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Analyze Content
                            </>
                          )}
                        </Button>
                        {(selectedFiles.length > 0 || analysis) && (
                          <Button variant="outline" onClick={handleReset} data-testid="button-reset">
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {analysis ? (
                  <>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Lightbulb className="w-5 h-5 text-yellow-500" />
                          Why This Worked
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.whyThisWorked.map((point, i) => (
                            <li key={i} className="flex items-start gap-2" data-testid={`text-why-worked-${i}`}>
                              <span className="text-primary font-bold">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Camera className="w-5 h-5 text-blue-500" />
                          Visual Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                              <Camera className="w-4 h-4" /> Camera/Shot
                            </div>
                            <p className="text-sm" data-testid="text-visual-camera">{analysis.visualBreakdown.camera}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                              <Type className="w-4 h-4" /> Text Overlays
                            </div>
                            <p className="text-sm" data-testid="text-visual-text">{analysis.visualBreakdown.text}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                              <Palette className="w-4 h-4" /> Colors
                            </div>
                            <p className="text-sm" data-testid="text-visual-colors">{analysis.visualBreakdown.colors}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                              <Frame className="w-4 h-4" /> Framing
                            </div>
                            <p className="text-sm" data-testid="text-visual-framing">{analysis.visualBreakdown.framing}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Target className="w-5 h-5 text-green-500" />
                          Content Structure
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Opening Hook</p>
                            <p className="text-sm" data-testid="text-structure-opening">{analysis.contentStructure.openingLine}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Middle Idea</p>
                            <p className="text-sm" data-testid="text-structure-middle">{analysis.contentStructure.middleIdea}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Payoff/CTA</p>
                            <p className="text-sm" data-testid="text-structure-payoff">{analysis.contentStructure.payoff}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Sparkles className="w-5 h-5 text-purple-500" />
                          Adaptation for Your Channel
                          {selectedBriefId && selectedBriefId !== "none" && (
                            <span className="ml-2 text-xs font-normal bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full" data-testid="badge-personalized">
                              Personalized
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Same Structure</p>
                            <p className="text-sm" data-testid="text-adapt-structure">{analysis.adaptationForMyChannel.sameStructure}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Topic Suggestions</p>
                            <p className="text-sm" data-testid="text-adapt-topic">{analysis.adaptationForMyChannel.differentTopic}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Your Tone</p>
                            <p className="text-sm" data-testid="text-adapt-tone">{analysis.adaptationForMyChannel.myTone}</p>
                          </div>
                          {analysis.adaptationForMyChannel.trendingAngle && (
                            <div className="pt-2 border-t">
                              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Trending Angle
                              </p>
                              <p className="text-sm text-green-700 dark:text-green-400" data-testid="text-adapt-trending">{analysis.adaptationForMyChannel.trendingAngle}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Megaphone className="w-5 h-5 text-orange-500" />
                          Hook Rewrites
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analysis.hookRewrites.map((hook, i) => (
                            <div
                              key={i}
                              className="p-3 bg-muted rounded-lg text-sm"
                              data-testid={`text-hook-${i}`}
                            >
                              {hook}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Target className="w-5 h-5 text-indigo-500" />
                          Post Advice
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Platform</p>
                            <p className="text-sm" data-testid="text-advice-platform">{analysis.postAdvice.platform}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Format</p>
                            <p className="text-sm" data-testid="text-advice-format">{analysis.postAdvice.format}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Caption Angle</p>
                            <p className="text-sm" data-testid="text-advice-caption">{analysis.postAdvice.captionAngle}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div>
                            <h3 className="font-medium">Ready to create content?</h3>
                            <p className="text-sm text-muted-foreground">
                              Generate a new script using these insights as inspiration
                            </p>
                          </div>
                          {saved ? (
                            <Button disabled className="gap-2" data-testid="button-saved">
                              <CheckCircle className="w-4 h-4" />
                              Generated!
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleOpenGenerateDialog("post")}
                                className="gap-2"
                                data-testid="button-generate-from-post"
                              >
                                <Wand2 className="w-4 h-4" />
                                Generate Content
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setLocation("/blog-studio")}
                                className="gap-2"
                                data-testid="button-convert-to-blog-post"
                              >
                                <BookOpen className="w-4 h-4" />
                                Create Blog
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="h-full min-h-[400px] flex items-center justify-center">
                    <CardContent className="text-center py-12">
                      <Sparkles className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        Upload a screenshot of a viral post and we'll break down exactly why it worked and how you can adapt it.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="video-research" className="mt-6 space-y-6">
            <Tabs value={videoTab} onValueChange={setVideoTab}>
              <TabsList>
                <TabsTrigger value="videos" data-testid="tab-videos">
                  <Youtube className="w-4 h-4 mr-2" />
                  Videos ({videos.length})
                </TabsTrigger>
                <TabsTrigger value="comparisons" data-testid="tab-comparisons">
                  <GitCompare className="w-4 h-4 mr-2" />
                  Comparisons ({comparisons.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="videos" className="space-y-6 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Add YouTube Video
                    </CardTitle>
                    <CardDescription>Paste a YouTube URL to analyze its content and structure</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://youtube.com/watch?v=..."
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        data-testid="input-video-url"
                      />
                      <Button 
                        onClick={() => addVideoMutation.mutate(newVideoUrl)}
                        disabled={!newVideoUrl || addVideoMutation.isPending}
                        data-testid="button-add-video"
                      >
                        {addVideoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle>Your Videos</CardTitle>
                      <CardDescription>Select to view analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingVideos ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : videos.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Youtube className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No videos added yet</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-2">
                            {videos.map((video) => (
                              <div
                                key={video.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                  selectedVideoId === video.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                                }`}
                                onClick={() => setSelectedVideoId(video.id)}
                                data-testid={`video-item-${video.id}`}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    checked={selectedForComparison.includes(video.id)}
                                    onCheckedChange={() => toggleVideoForComparison(video.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    disabled={video.status !== "completed"}
                                    data-testid={`checkbox-video-${video.id}`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{video.title}</p>
                                    {video.channelName && (
                                      <p className="text-xs text-muted-foreground truncate">{video.channelName}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge 
                                        variant={video.status === "completed" ? "default" : video.status === "failed" ? "destructive" : "secondary"}
                                        className="text-xs"
                                      >
                                        {video.status}
                                      </Badge>
                                      {video.viewCount && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Eye className="w-3 h-3" />
                                          {formatNumber(video.viewCount)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Video Details</CardTitle>
                          <CardDescription>
                            {selectedVideo ? selectedVideo.title : "Select a video to view details"}
                          </CardDescription>
                        </div>
                        {selectedVideo && (
                          <div className="flex gap-2">
                            {selectedVideo.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() => scrapeVideoMutation.mutate(selectedVideo.id)}
                                disabled={scrapeVideoMutation.isPending}
                                data-testid="button-fetch-transcript"
                              >
                                {scrapeVideoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                                Fetch Transcript
                              </Button>
                            )}
                            {selectedVideo.status === "completed" && (
                              <Button
                                size="sm"
                                onClick={() => analyzeVideoMutation.mutate(selectedVideo.id)}
                                disabled={analyzeVideoMutation.isPending}
                                data-testid="button-analyze-video"
                              >
                                {analyzeVideoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BarChart2 className="w-4 h-4 mr-2" />}
                                Analyze with AI
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteVideoMutation.mutate(selectedVideo.id)}
                              data-testid="button-delete-video"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!selectedVideo ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Select a video from the list to view its analysis</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex gap-4">
                            {selectedVideo.thumbnailUrl && (
                              <img 
                                src={selectedVideo.thumbnailUrl} 
                                alt={selectedVideo.title}
                                className="w-40 h-24 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold">{selectedVideo.title}</h3>
                              <p className="text-sm text-muted-foreground">{selectedVideo.channelName}</p>
                              <div className="flex gap-4 mt-2 text-sm">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatDuration(selectedVideo.duration)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-4 h-4" />
                                  {formatNumber(selectedVideo.viewCount)} views
                                </span>
                                <span className="flex items-center gap-1">
                                  <ThumbsUp className="w-4 h-4" />
                                  {formatNumber(selectedVideo.likeCount)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {selectedVideo.transcript && (
                            <div>
                              <h4 className="font-medium mb-2">Transcript Preview</h4>
                              <div className="p-3 bg-muted/50 rounded-lg text-sm max-h-32 overflow-y-auto">
                                {selectedVideo.transcript.slice(0, 500)}...
                              </div>
                            </div>
                          )}

                          {latestAnalysis && (
                            <div className="space-y-4">
                              <h4 className="font-medium flex items-center gap-2">
                                <BarChart2 className="w-4 h-4" />
                                AI Analysis Results
                              </h4>

                              {latestAnalysis.summary && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                  <p className="text-sm">{latestAnalysis.summary}</p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                {latestAnalysis.hookAnalysis && (
                                  <div className="p-3 border rounded-lg">
                                    <h5 className="text-sm font-medium mb-2">Hook Strength</h5>
                                    <Progress value={latestAnalysis.hookAnalysis.strength} className="h-2 mb-1" />
                                    <p className="text-xs text-muted-foreground">
                                      {latestAnalysis.hookAnalysis.type} hook ({latestAnalysis.hookAnalysis.strength}%)
                                    </p>
                                  </div>
                                )}
                                {latestAnalysis.ctaAnalysis && (
                                  <div className="p-3 border rounded-lg">
                                    <h5 className="text-sm font-medium mb-2">CTA Strength</h5>
                                    <Progress value={latestAnalysis.ctaAnalysis.strength} className="h-2 mb-1" />
                                    <p className="text-xs text-muted-foreground">
                                      {latestAnalysis.ctaAnalysis.type} at {latestAnalysis.ctaAnalysis.placement}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {latestAnalysis.keyTopics && latestAnalysis.keyTopics.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-medium mb-2">Key Topics</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {latestAnalysis.keyTopics.map((topic, i) => (
                                      <Badge key={i} variant="secondary">{topic}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                {latestAnalysis.strengths && latestAnalysis.strengths.length > 0 && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      Strengths
                                    </h5>
                                    <ul className="text-sm space-y-1">
                                      {latestAnalysis.strengths.slice(0, 3).map((s, i) => (
                                        <li key={i} className="text-muted-foreground">• {s}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {latestAnalysis.weaknesses && latestAnalysis.weaknesses.length > 0 && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                                      Could Improve
                                    </h5>
                                    <ul className="text-sm space-y-1">
                                      {latestAnalysis.weaknesses.slice(0, 3).map((w, i) => (
                                        <li key={i} className="text-muted-foreground">• {w}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              {latestAnalysis.scriptIdeas && latestAnalysis.scriptIdeas.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                                    Content Ideas Inspired by This Video
                                  </h5>
                                  <ul className="text-sm space-y-2">
                                    {latestAnalysis.scriptIdeas.map((idea, i) => (
                                      <li key={i} className="p-2 bg-muted/50 rounded">• {idea}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="pt-4 border-t space-y-2">
                                <Button
                                  onClick={() => handleOpenGenerateDialog("video")}
                                  className="w-full gap-2"
                                  data-testid="button-generate-from-video"
                                >
                                  <Wand2 className="w-4 h-4" />
                                  Generate Content from This Analysis
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setLocation(`/blog-studio/video/${video.id}`)}
                                  className="w-full gap-2"
                                  data-testid="button-convert-to-blog-video"
                                >
                                  <BookOpen className="w-4 h-4" />
                                  Convert to Blog
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="comparisons" className="space-y-6 mt-4">
                {comparisons.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <GitCompare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <h3 className="font-medium mb-2">No Comparisons Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Select 2+ videos from the Videos tab and compare them to find winning patterns
                      </p>
                      <Button onClick={() => setVideoTab("videos")}>
                        Go to Videos
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {comparisons.map((comparison) => (
                      <Card key={comparison.id}>
                        <CardHeader>
                          <CardTitle>{comparison.name}</CardTitle>
                          <CardDescription>
                            Compared {comparison.videoIds.length} videos • {new Date(comparison.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {comparison.comparisonResult?.comparisonSummary && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                              <p className="text-sm">{comparison.comparisonResult.comparisonSummary}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {comparison.winningPatterns && comparison.winningPatterns.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                  Winning Patterns
                                </h5>
                                <ul className="text-sm space-y-1">
                                  {comparison.winningPatterns.map((p, i) => (
                                    <li key={i} className="text-muted-foreground">• {p}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {comparison.contentGaps && comparison.contentGaps.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                                  <Target className="w-4 h-4 text-yellow-600" />
                                  Content Gaps
                                </h5>
                                <ul className="text-sm space-y-1">
                                  {comparison.contentGaps.map((g, i) => (
                                    <li key={i} className="text-muted-foreground">• {g}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {comparison.recommendations && comparison.recommendations.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                                  <Lightbulb className="w-4 h-4 text-purple-600" />
                                  Recommendations
                                </h5>
                                <ul className="text-sm space-y-1">
                                  {comparison.recommendations.map((r, i) => (
                                    <li key={i} className="text-muted-foreground">• {r}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        <Dialog open={showComparisonDialog} onOpenChange={setShowComparisonDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compare Videos</DialogTitle>
              <DialogDescription>
                Analyze {selectedForComparison.length} videos to find winning patterns and content gaps
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Comparison Name</label>
                <Input
                  placeholder="e.g., Competitor Hook Analysis"
                  value={comparisonName}
                  onChange={(e) => setComparisonName(e.target.value)}
                  data-testid="input-comparison-name"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Selected videos:</p>
                <ul className="space-y-1">
                  {selectedForComparison.map(id => {
                    const video = videos.find(v => v.id === id);
                    return video ? (
                      <li key={id} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {video.title.slice(0, 50)}...
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowComparisonDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => compareVideosMutation.mutate({ 
                  videoIds: selectedForComparison, 
                  name: comparisonName || `Comparison - ${new Date().toLocaleDateString()}` 
                })}
                disabled={compareVideosMutation.isPending}
                data-testid="button-confirm-compare"
              >
                {compareVideosMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <GitCompare className="w-4 h-4 mr-2" />}
                Compare Videos
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Content</DialogTitle>
              <DialogDescription>
                Create new content using the analyzed {generateSource === "post" ? "post" : "video"} as inspiration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Brand Brief</Label>
                <Select value={selectedBriefId} onValueChange={setSelectedBriefId}>
                  <SelectTrigger data-testid="select-brief-generate">
                    <SelectValue placeholder="Select a brand brief" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a brief...</SelectItem>
                    {briefs.map((brief) => (
                      <SelectItem key={brief.id} value={brief.id}>
                        {brief.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Content Format</Label>
                <RadioGroup value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as any)}>
                  <div className="grid grid-cols-2 gap-2">
                    <Label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${selectedFormat === "video" ? "border-primary bg-primary/5" : ""}`}>
                      <RadioGroupItem value="video" />
                      <Video className="w-4 h-4" />
                      Video
                    </Label>
                    <Label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${selectedFormat === "image" ? "border-primary bg-primary/5" : ""}`}>
                      <RadioGroupItem value="image" />
                      <Image className="w-4 h-4" />
                      Image
                    </Label>
                    <Label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${selectedFormat === "carousel" ? "border-primary bg-primary/5" : ""}`}>
                      <RadioGroupItem value="carousel" />
                      <LayoutGrid className="w-4 h-4" />
                      Carousel
                    </Label>
                    <Label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${selectedFormat === "tiktok_text" ? "border-primary bg-primary/5" : ""}`}>
                      <RadioGroupItem value="tiktok_text" />
                      <MessageSquare className="w-4 h-4" />
                      Text Post
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {selectedFormat === "video" && (
                <div className="space-y-2">
                  <Label>Number of Scenes</Label>
                  <Select value={sceneCount.toString()} onValueChange={(v) => setSceneCount(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Scene</SelectItem>
                      <SelectItem value="2">2 Scenes</SelectItem>
                      <SelectItem value="3">3 Scenes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Optimize For</Label>
                <Select value={optimizationGoal} onValueChange={(v) => setOptimizationGoal(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reach">Reach (shares, follows)</SelectItem>
                    <SelectItem value="saves">Saves (bookmarks)</SelectItem>
                    <SelectItem value="comments">Comments (engagement)</SelectItem>
                    <SelectItem value="clicks">Clicks (conversions)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerateContent}
                disabled={!selectedBriefId || selectedBriefId === "none" || generateContentMutation.isPending}
                data-testid="button-confirm-generate"
              >
                {generateContentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
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
      </div>
    </Layout>
  );
}
