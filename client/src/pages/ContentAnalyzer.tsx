import { useState, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Loader2, Sparkles, Camera, Type, Palette, Frame, Lightbulb, Target, Megaphone, RefreshCw, Save, CheckCircle, X } from "lucide-react";
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

export default function ContentAnalyzer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState(0);
  const [selectedBriefId, setSelectedBriefId] = useState<string>("");
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: briefs = [] } = useQuery<BrandBrief[]>({
    queryKey: [`/api/brand-briefs?userId=${DEMO_USER_ID}`],
  });

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

  return (
    <Layout title="Content Analyzer">
      <div className="mb-6">
        <p className="text-muted-foreground">
          Upload a screenshot of a viral post and get AI-powered insights on why it worked and how to adapt it for your brand.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Screenshot
              </CardTitle>
              <CardDescription>
                Drag and drop or click to upload a screenshot of a viral social media post
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      <h3 className="font-medium">Save this inspiration?</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedBriefId && selectedBriefId !== "none" 
                          ? "Add to your Content Queue as a new content idea" 
                          : "Select a brand brief above to save this analysis"}
                      </p>
                    </div>
                    {saved ? (
                      <Button disabled className="gap-2" data-testid="button-saved">
                        <CheckCircle className="w-4 h-4" />
                        Saved!
                      </Button>
                    ) : (
                      <Button
                        onClick={() => saveToQueueMutation.mutate()}
                        disabled={!selectedBriefId || selectedBriefId === "none" || saveToQueueMutation.isPending}
                        className="gap-2"
                        data-testid="button-save-to-queue"
                      >
                        {saveToQueueMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save to Content Queue
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full min-h-[400px] flex items-center justify-center">
              <CardContent className="text-center text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Upload a screenshot and click Analyze to see insights</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
