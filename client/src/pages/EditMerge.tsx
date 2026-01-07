import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Video, Play, Pause, Loader2, ArrowUp, ArrowDown, Wand2, Check, RefreshCw, Volume2, Scissors, Upload, Trash2, FileVideo, Image as ImageIcon, CheckCircle, ArrowRight, LayoutGrid, Plus, X } from "lucide-react";
import type { GeneratedContent, BrandBrief, ScenePrompt } from "@shared/schema";

const DEMO_USER_ID = "demo-user";

interface ClipState {
  id: string;
  sceneNumber?: number;
  type: "generated" | "uploaded";
  status: "pending" | "generating" | "completed" | "failed";
  videoUrl?: string;
  requestId?: string;
  fileName?: string;
}

export default function EditMerge() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const params = useParams<{ contentId?: string }>();
  const [filterBrief, setFilterBrief] = useState<string>("all");
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const [clips, setClips] = useState<ClipState[]>([]);
  const [playingClip, setPlayingClip] = useState<number | null>(null);
  const [merging, setMerging] = useState(false);

  const { data: briefs = [] } = useQuery<BrandBrief[]>({
    queryKey: [`/api/brand-briefs?userId=${DEMO_USER_ID}`],
  });

  const { data: approvedContent = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=approved"],
  });

  // Auto-select content when contentId is in URL
  useEffect(() => {
    if (params.contentId && approvedContent.length > 0 && !selectedContent) {
      const content = approvedContent.find(c => c.id === params.contentId);
      if (content) {
        setSelectedContent(content);
      }
    }
  }, [params.contentId, approvedContent, selectedContent]);

  // Show ALL approved content (video, image, carousel, etc.)
  const allApprovedContent = useMemo(() => 
    approvedContent.filter((content) => {
      const matchesBrief = filterBrief === "all" || content.briefId === filterBrief;
      return matchesBrief;
    }),
    [approvedContent, filterBrief]
  );

  const invalidateContentQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=approved"] });
  };

  const getScenePrompts = (content: GeneratedContent): ScenePrompt[] => {
    const metadata = content.generationMetadata as any;
    return metadata?.videoPrompts?.scenePrompts || [];
  };

  const getVoiceoverUrl = (content: GeneratedContent): string | null => {
    const metadata = content.generationMetadata as any;
    return metadata?.voiceoverAudioUrl || null;
  };

  const generateClipMutation = useMutation({
    mutationFn: async ({ contentId, sceneNumber, prompt }: { contentId: string; sceneNumber: number; prompt: string }) => {
      const res = await fetch("/api/fal/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          aspectRatio: "9:16", 
          duration: 10, 
          contentId,
          sceneNumber 
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to start video generation");
      }
      return res.json();
    },
    onSuccess: (data, { sceneNumber }) => {
      setClips(prev => prev.map(clip => 
        clip.sceneNumber === sceneNumber 
          ? { ...clip, status: "generating" as const, requestId: data.requestId }
          : clip
      ));
      toast({ title: `Scene ${sceneNumber} generating...`, description: "This may take a few minutes." });
    },
    onError: (error: Error, { sceneNumber }) => {
      setClips(prev => prev.map(clip => 
        clip.sceneNumber === sceneNumber 
          ? { ...clip, status: "failed" as const }
          : clip
      ));
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [movingToReady, setMovingToReady] = useState(false);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number | null>(null);

  const handleSelectContent = (content: GeneratedContent) => {
    setSelectedContent(content);
    const scenePrompts = getScenePrompts(content);
    const metadata = content.generationMetadata as any;
    const existingClips = metadata?.generatedClips || [];
    const uploadedClips = metadata?.uploadedClips || [];
    
    const generatedClipStates: ClipState[] = scenePrompts.map((scene) => {
      const existing = existingClips.find((c: any) => c.sceneNumber === scene.sceneNumber);
      return {
        id: `scene-${scene.sceneNumber}`,
        sceneNumber: scene.sceneNumber,
        type: "generated" as const,
        status: existing?.videoUrl ? "completed" : "pending",
        videoUrl: existing?.videoUrl,
        requestId: existing?.requestId,
      };
    });
    
    const uploadedClipStates: ClipState[] = uploadedClips.map((clip: any, i: number) => ({
      id: clip.id || `uploaded-${i}`,
      type: "uploaded" as const,
      status: "completed" as const,
      videoUrl: clip.videoUrl,
      fileName: clip.fileName,
    }));
    
    setClips([...generatedClipStates, ...uploadedClipStates]);
  };

  const handleUploadClip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedContent || !e.target.files?.length) return;
    const file = e.target.files[0];
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("contentId", selectedContent.id);
      
      const res = await fetch("/api/video/upload-clip", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      
      const data = await res.json();
      
      const newClip: ClipState = {
        id: `uploaded-${Date.now()}`,
        type: "uploaded",
        status: "completed",
        videoUrl: data.videoUrl,
        fileName: file.name,
      };
      
      setClips(prev => [...prev, newClip]);
      toast({ title: "Clip uploaded!", description: file.name });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveClip = (clipId: string) => {
    setClips(prev => prev.filter(c => c.id !== clipId));
  };

  const handleGenerateClip = (scene: ScenePrompt) => {
    if (!selectedContent) return;
    generateClipMutation.mutate({
      contentId: selectedContent.id,
      sceneNumber: scene.sceneNumber,
      prompt: scene.visualPrompt,
    });
  };

  const handleGenerateAllClips = () => {
    if (!selectedContent) return;
    const scenePrompts = getScenePrompts(selectedContent);
    scenePrompts.forEach(scene => {
      const clip = clips.find(c => c.sceneNumber === scene.sceneNumber);
      if (clip?.status === "pending" || clip?.status === "failed") {
        generateClipMutation.mutate({
          contentId: selectedContent.id,
          sceneNumber: scene.sceneNumber,
          prompt: scene.visualPrompt,
        });
      }
    });
  };

  const handleMoveClip = (index: number, direction: "up" | "down") => {
    const newClips = [...clips];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newClips.length) return;
    [newClips[index], newClips[targetIndex]] = [newClips[targetIndex], newClips[index]];
    setClips(newClips);
  };

  const allClipsReady = clips.length > 0 && clips.every(c => c.status === "completed");
  const voiceoverUrl = selectedContent ? getVoiceoverUrl(selectedContent) : null;

  const handleMergeClips = async () => {
    if (!selectedContent || !allClipsReady) return;
    setMerging(true);
    
    try {
      const res = await fetch("/api/video/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: selectedContent.id,
          clipUrls: clips.map(c => c.videoUrl),
          voiceoverUrl,
        }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to merge clips");
      }
      
      const data = await res.json();
      invalidateContentQueries();
      toast({ title: "Video merged!", description: "Your final video is ready in Ready to Post." });
    } catch (error: any) {
      toast({ title: "Merge failed", description: error.message, variant: "destructive" });
    } finally {
      setMerging(false);
    }
  };

  const getImagePrompt = (content: GeneratedContent): string | null => {
    const metadata = content.generationMetadata as any;
    return metadata?.imagePrompts?.mainImagePrompt 
      || metadata?.videoPrompts?.thumbnailPrompt
      || (content.caption ? `Social media image for: ${content.caption.substring(0, 200)}` : null);
  };

  const getImageUrl = (content: GeneratedContent): string | null => {
    const metadata = content.generationMetadata as any;
    return metadata?.generatedImageUrl || metadata?.uploadedImageUrl || null;
  };
  
  const getCarouselImages = (content: GeneratedContent): { slideIndex: number; imageUrl: string }[] => {
    const metadata = content.generationMetadata as any;
    return metadata?.generatedCarouselImages || [];
  };

  const handleGenerateImage = async () => {
    if (!selectedContent) return;
    const prompt = getImagePrompt(selectedContent);
    
    if (!prompt) {
      toast({ title: "No prompt available", description: "Could not generate a suitable image prompt. Try uploading an image instead.", variant: "destructive" });
      return;
    }
    
    setGeneratingImage(true);
    try {
      const metadata = selectedContent.generationMetadata as any;
      const aspectRatio = metadata?.imagePrompts?.aspectRatio || "1:1";
      const res = await fetch("/api/fal/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate image");
      }
      
      const data = await res.json();
      
      const freshRes = await fetch(`/api/content/${selectedContent.id}`);
      const freshContent = await freshRes.json();
      const existingMetadata = freshContent?.generationMetadata || {};
      await fetch(`/api/content/${selectedContent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationMetadata: { ...existingMetadata, generatedImageUrl: data.imageUrl },
        }),
      });
      
      invalidateContentQueries();
      toast({ title: "Image generated!", description: "Your image is ready." });
    } catch (error: any) {
      toast({ title: "Image generation failed", description: error.message, variant: "destructive" });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, addNew: boolean = false) => {
    if (!selectedContent || !e.target.files?.length) return;
    const file = e.target.files[0];
    setUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("contentId", selectedContent.id);
      
      const carouselImages = getCarouselImages(selectedContent);
      const isCarousel = carouselImages.length > 0 || (selectedContent.generationMetadata as any)?.contentFormat === "carousel";
      
      if (isCarousel) {
        if (addNew) {
          // Add as new slide at the end
          formData.append("slideIndex", "-1");
        } else if (selectedSlideIndex !== null) {
          // Replace selected slide
          formData.append("slideIndex", selectedSlideIndex.toString());
        } else {
          // No slide selected - add as new
          formData.append("slideIndex", "-1");
        }
      }
      
      const res = await fetch("/api/image/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      
      const data = await res.json();
      
      invalidateContentQueries();
      let successMsg = file.name;
      if (isCarousel) {
        successMsg = selectedSlideIndex !== null && !addNew
          ? `Slide ${selectedSlideIndex + 1} replaced!`
          : "New slide added!";
      }
      toast({ title: "Image uploaded!", description: successMsg });
      setSelectedSlideIndex(null);
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleReorderCarouselSlide = async (slideIndex: number, direction: "up" | "down") => {
    if (!selectedContent) return;
    const carouselImages = getCarouselImages(selectedContent);
    const currentPos = carouselImages.findIndex(s => s.slideIndex === slideIndex);
    const newPos = direction === "up" ? currentPos - 1 : currentPos + 1;
    
    if (newPos < 0 || newPos >= carouselImages.length) return;
    
    // Swap positions
    const newOrder = [...carouselImages];
    const temp = newOrder[currentPos];
    newOrder[currentPos] = newOrder[newPos];
    newOrder[newPos] = temp;
    
    // Reassign slideIndex values
    const reordered = newOrder.map((slide, i) => ({ ...slide, slideIndex: i }));
    
    try {
      const freshRes = await fetch(`/api/content/${selectedContent.id}`);
      if (!freshRes.ok) throw new Error("Failed to fetch content");
      const freshContent = await freshRes.json();
      const existingMetadata = freshContent?.generationMetadata || {};
      
      const patchRes = await fetch(`/api/content/${selectedContent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationMetadata: { ...existingMetadata, generatedCarouselImages: reordered },
        }),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json();
        throw new Error(err.error || "Failed to update");
      }
      
      invalidateContentQueries();
      toast({ title: "Slide reordered!" });
    } catch (error: any) {
      toast({ title: "Reorder failed", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteCarouselSlide = async (slideIndex: number) => {
    if (!selectedContent) return;
    const carouselImages = getCarouselImages(selectedContent);
    
    // Remove the slide and reindex
    const filtered = carouselImages.filter(s => s.slideIndex !== slideIndex);
    const reordered = filtered.map((slide, i) => ({ ...slide, slideIndex: i }));
    
    try {
      const freshRes = await fetch(`/api/content/${selectedContent.id}`);
      if (!freshRes.ok) throw new Error("Failed to fetch content");
      const freshContent = await freshRes.json();
      const existingMetadata = freshContent?.generationMetadata || {};
      
      const patchRes = await fetch(`/api/content/${selectedContent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationMetadata: { ...existingMetadata, generatedCarouselImages: reordered },
        }),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json();
        throw new Error(err.error || "Failed to delete");
      }
      
      invalidateContentQueries();
      setSelectedSlideIndex(null);
      toast({ title: "Slide deleted!" });
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  };

  const handleMoveToReady = async () => {
    if (!selectedContent) return;
    setMovingToReady(true);
    
    try {
      const metadata = selectedContent.generationMetadata as any;
      const existingMetadata = metadata || {};
      await fetch(`/api/content/${selectedContent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationMetadata: { ...existingMetadata, manuallyReady: true },
          status: "ready",
        }),
      });
      
      invalidateContentQueries();
      toast({ title: "Moved to Ready to Post!", description: "Content is now in Ready to Post." });
      setSelectedContent(null);
    } catch (error: any) {
      toast({ title: "Failed to move", description: error.message, variant: "destructive" });
    } finally {
      setMovingToReady(false);
    }
  };

  const hasAssets = (content: GeneratedContent): boolean => {
    const metadata = content.generationMetadata as any;
    return !!(
      metadata?.mergedVideoUrl ||
      metadata?.generatedVideoUrl ||
      metadata?.voiceoverAudioUrl ||
      metadata?.generatedImageUrl ||
      metadata?.uploadedImageUrl ||
      metadata?.generatedCarouselImages?.length > 0 ||
      clips.some(c => c.status === "completed")
    );
  };

  useEffect(() => {
    const generatingClips = clips.filter(c => c.status === "generating" && c.requestId);
    if (generatingClips.length === 0) return;

    const pollStatus = async () => {
      for (const clip of generatingClips) {
        if (!clip.requestId) continue;
        try {
          const res = await fetch(`/api/fal/video-status/${clip.requestId}`);
          const data = await res.json();
          
          if (data.status === "completed" && data.videoUrl) {
            setClips(prev => prev.map(c => 
              c.id === clip.id 
                ? { ...c, status: "completed" as const, videoUrl: data.videoUrl }
                : c
            ));
            
            if (selectedContent) {
              const freshRes = await fetch(`/api/content/${selectedContent.id}`);
              const freshContent = await freshRes.json();
              const existingMetadata = freshContent.generationMetadata || {};
              const existingClips = existingMetadata.generatedClips || [];
              const updatedClips = existingClips.filter((c: any) => c.sceneNumber !== clip.sceneNumber);
              updatedClips.push({ sceneNumber: clip.sceneNumber, videoUrl: data.videoUrl, requestId: clip.requestId });
              
              await fetch(`/api/content/${selectedContent.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  generationMetadata: { ...existingMetadata, generatedClips: updatedClips },
                }),
              });
            }
          } else if (data.status === "failed") {
            setClips(prev => prev.map(c => 
              c.id === clip.id 
                ? { ...c, status: "failed" as const }
                : c
            ));
          }
        } catch (error) {
          console.error("Failed to poll clip status:", error);
        }
      }
    };

    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, [clips, selectedContent]);

  return (
    <Layout title="Edit & Merge">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display" data-testid="text-page-title">Edit & Merge</h1>
            <p className="text-muted-foreground mt-1">Generate video clips for each scene, reorder, and merge with voiceover</p>
          </div>
          <Select value={filterBrief} onValueChange={setFilterBrief}>
            <SelectTrigger className="w-[200px]" data-testid="select-filter-brief">
              <SelectValue placeholder="Filter by brief" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Briefs</SelectItem>
              {briefs.map((brief) => (
                <SelectItem key={brief.id} value={brief.id}>
                  {brief.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="w-5 h-5" />
                  Approved Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {allApprovedContent.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No approved content. Approve content from the Content Queue to get started.
                  </p>
                ) : (
                  allApprovedContent.map((content) => {
                    const scenePrompts = getScenePrompts(content);
                    const brief = briefs.find(b => b.id === content.briefId);
                    const isSelected = selectedContent?.id === content.id;
                    
                    return (
                      <div
                        key={content.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => handleSelectContent(content)}
                        data-testid={`card-content-${content.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {content.caption?.substring(0, 50)}...
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {brief && (
                                <Badge variant="outline" className="text-xs">
                                  {brief.name}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {scenePrompts.length > 0 ? `${scenePrompts.length} scenes` : "Upload clips"}
                              </Badge>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedContent ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      Scene Clips
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateAllClips}
                        disabled={clips.every(c => c.status === "completed" || c.status === "generating")}
                        data-testid="button-generate-all"
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {voiceoverUrl && (
                    <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Voiceover Ready</p>
                        <audio src={voiceoverUrl} controls className="w-full mt-1 h-8" />
                      </div>
                    </div>
                  )}

                  {clips.map((clip, index) => {
                    const scene = clip.type === "generated" && clip.sceneNumber 
                      ? getScenePrompts(selectedContent).find(s => s.sceneNumber === clip.sceneNumber)
                      : null;
                    
                    return (
                      <div
                        key={clip.id}
                        className="p-4 rounded-lg border bg-card space-y-3"
                        data-testid={`clip-${clip.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {clip.type === "generated" ? (
                                <Badge variant="outline">Scene {clip.sceneNumber}</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                                  <FileVideo className="w-3 h-3 mr-1" />
                                  Uploaded
                                </Badge>
                              )}
                              <Badge variant={clip.status === "completed" ? "default" : clip.status === "generating" ? "secondary" : "outline"}>
                                {clip.status === "generating" && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                {clip.status}
                              </Badge>
                            </div>
                            {scene ? (
                              <>
                                <p className="text-sm text-muted-foreground mt-2">{scene.sceneDescription}</p>
                                <p className="text-xs text-muted-foreground mt-1 italic">"{scene.visualPrompt.substring(0, 100)}..."</p>
                              </>
                            ) : clip.fileName && (
                              <p className="text-sm text-muted-foreground mt-2">{clip.fileName}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveClip(index, "up")}
                              disabled={index === 0}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveClip(index, "down")}
                              disabled={index === clips.length - 1}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                            {clip.type === "uploaded" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveClip(clip.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {clip.status === "completed" && clip.videoUrl ? (
                          <video
                            src={clip.videoUrl}
                            controls
                            className="w-full rounded-lg max-h-48 object-contain bg-black"
                          />
                        ) : clip.status === "pending" || clip.status === "failed" ? (
                          scene && (
                            <Button
                              variant="secondary"
                              className="w-full"
                              onClick={() => handleGenerateClip(scene)}
                              disabled={generateClipMutation.isPending}
                            >
                              {clip.status === "failed" ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Retry Generation
                                </>
                              ) : (
                                <>
                                  <Wand2 className="w-4 h-4 mr-2" />
                                  Generate Clip
                                </>
                              )}
                            </Button>
                          )
                        ) : (
                          <div className="h-48 rounded-lg bg-muted flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="p-4 rounded-lg border border-dashed bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Add Your Own Clips</span>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleUploadClip}
                        className="hidden"
                        data-testid="input-upload-clip"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        data-testid="button-upload-clip"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Video
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload archive footage, B-roll, or additional clips to include in your final video
                    </p>
                  </div>

                  {/* Image Section */}
                  {selectedContent && (
                    <div className="p-4 rounded-lg border bg-gradient-to-r from-purple-500/5 to-pink-500/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-purple-500" />
                          <span className="text-sm font-medium">Image / Thumbnail</span>
                        </div>
                      </div>
                      
                      {/* Single Image Display */}
                      {getImageUrl(selectedContent) && getCarouselImages(selectedContent).length === 0 && (
                        <div className="space-y-2">
                          <img 
                            src={getImageUrl(selectedContent)!} 
                            alt="Generated/Uploaded" 
                            className="w-full rounded-lg max-h-48 object-contain bg-black"
                          />
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Image Ready
                          </Badge>
                        </div>
                      )}
                      
                      {/* Carousel Images Display */}
                      {getCarouselImages(selectedContent).length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <LayoutGrid className="w-4 h-4 text-purple-500" />
                              <span className="text-sm">Carousel Images ({getCarouselImages(selectedContent).length} slides)</span>
                            </div>
                            {selectedSlideIndex !== null && (
                              <Badge variant="secondary" className="text-xs">
                                Slide {selectedSlideIndex + 1} selected
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">Click a slide to select it, use arrows to reorder</p>
                          <div className="grid grid-cols-3 gap-2">
                            {getCarouselImages(selectedContent)
                              .sort((a, b) => a.slideIndex - b.slideIndex)
                              .map((slide: { slideIndex: number; imageUrl: string }, i: number, arr: { slideIndex: number; imageUrl: string }[]) => (
                                <div 
                                  key={i} 
                                  className={`group relative cursor-pointer transition-all ${selectedSlideIndex === slide.slideIndex ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-2 hover:ring-muted-foreground/50'}`}
                                  onClick={() => setSelectedSlideIndex(selectedSlideIndex === slide.slideIndex ? null : slide.slideIndex)}
                                >
                                  <img 
                                    src={slide.imageUrl} 
                                    alt={`Slide ${slide.slideIndex + 1}`} 
                                    className="w-full aspect-square object-cover rounded-lg border"
                                  />
                                  <span className={`absolute top-1 left-1 text-white text-xs px-1.5 py-0.5 rounded ${selectedSlideIndex === slide.slideIndex ? 'bg-primary' : 'bg-black/60'}`}>
                                    {slide.slideIndex + 1}
                                  </span>
                                  {/* Reorder and delete controls */}
                                  <div className={`absolute top-1 right-1 flex flex-col gap-0.5 transition-opacity ${selectedSlideIndex === slide.slideIndex ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    {i > 0 && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleReorderCarouselSlide(slide.slideIndex, "up"); }}
                                        className="bg-black/60 hover:bg-black/80 text-white p-0.5 rounded"
                                      >
                                        <ArrowUp className="w-3 h-3" />
                                      </button>
                                    )}
                                    {i < arr.length - 1 && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleReorderCarouselSlide(slide.slideIndex, "down"); }}
                                        className="bg-black/60 hover:bg-black/80 text-white p-0.5 rounded"
                                      >
                                        <ArrowDown className="w-3 h-3" />
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteCarouselSlide(slide.slideIndex); }}
                                      className="bg-red-500/80 hover:bg-red-500 text-white p-0.5 rounded"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                  {selectedSlideIndex === slide.slideIndex && (
                                    <div className="absolute inset-0 bg-primary/10 rounded-lg pointer-events-none" />
                                  )}
                                </div>
                              ))}
                          </div>
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Carousel Ready
                          </Badge>
                        </div>
                      )}
                      
                      {(() => {
                        const carouselImages = getCarouselImages(selectedContent);
                        const isCarousel = carouselImages.length > 0 || (selectedContent.generationMetadata as any)?.contentFormat === "carousel";
                        
                        return (
                          <>
                            <div className="flex gap-2">
                              <Button
                                variant={getImageUrl(selectedContent) ? "outline" : "default"}
                                size="sm"
                                onClick={handleGenerateImage}
                                disabled={generatingImage}
                                className="flex-1"
                                data-testid="button-generate-image"
                              >
                                {generatingImage ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    {getImageUrl(selectedContent) ? "Regenerate" : "Generate"} Image
                                  </>
                                )}
                              </Button>
                              
                              <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleUploadImage(e, false)}
                                className="hidden"
                                data-testid="input-upload-image"
                              />
                              
                              {isCarousel ? (
                                <>
                                  {selectedSlideIndex !== null ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => imageInputRef.current?.click()}
                                      disabled={uploadingImage}
                                      className="flex-1"
                                      data-testid="button-replace-slide"
                                    >
                                      {uploadingImage ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          Uploading...
                                        </>
                                      ) : (
                                        <>
                                          <Upload className="w-4 h-4 mr-2" />
                                          Replace Slide {selectedSlideIndex + 1}
                                        </>
                                      )}
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => imageInputRef.current?.click()}
                                      disabled={uploadingImage}
                                      className="flex-1"
                                      data-testid="button-add-slide"
                                    >
                                      {uploadingImage ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          Uploading...
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-4 h-4 mr-2" />
                                          Add New Slide
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => imageInputRef.current?.click()}
                                  disabled={uploadingImage}
                                  className="flex-1"
                                  data-testid="button-upload-image"
                                >
                                  {uploadingImage ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4 mr-2" />
                                      Upload Image
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {isCarousel 
                                ? (selectedSlideIndex !== null 
                                    ? "Upload to replace the selected slide" 
                                    : "Add a new slide to your carousel")
                                : "Add a thumbnail or featured image for this post"
                              }
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {allClipsReady && (
                    <div className="pt-4 border-t">
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleMergeClips}
                        disabled={merging}
                        data-testid="button-merge-clips"
                      >
                        {merging ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Merging Clips...
                          </>
                        ) : (
                          <>
                            <Scissors className="w-4 h-4 mr-2" />
                            Merge All Clips {voiceoverUrl ? "with Voiceover" : ""}
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Move to Ready button - visible when there are assets OR user wants to move anyway */}
                  {selectedContent && (
                    <div className="pt-4 border-t">
                      <Button
                        className="w-full"
                        variant="secondary"
                        size="lg"
                        onClick={handleMoveToReady}
                        disabled={movingToReady}
                        data-testid="button-move-ready"
                      >
                        {movingToReady ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Moving...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Move to Ready to Post
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Ready to publish? Move this content to Ready to Post
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select content from the left to manage video clips
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
