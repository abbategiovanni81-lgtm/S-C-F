import { useState, useRef, useMemo, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Check, X, RefreshCw, FileText, Video, Hash, Loader2, Upload, Youtube, Wand2, Copy, Mic, Play, Film, ImageIcon, LayoutGrid, Type, ArrowRight, Scissors, Clapperboard, Download, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { GeneratedContent, SocialAccount } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { UpgradePrompt, UpgradeBanner } from "@/components/UpgradePrompt";

export default function ContentQueue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasFullAccess, tier, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lipSyncVideoRef = useRef<HTMLInputElement>(null);
  
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);
  const [upgradeFeatureName, setUpgradeFeatureName] = useState("");
  
  // Fetch user's own API keys status
  const { data: userApiKeys } = useQuery<{ hasOpenai: boolean; hasElevenlabs: boolean; hasA2e: boolean; hasFal: boolean; hasPexels: boolean; hasSteveai: boolean }>({
    queryKey: ["/api/user/api-keys"],
    queryFn: async () => {
      const res = await fetch("/api/user/api-keys", { credentials: "include" });
      if (!res.ok) return { hasOpenai: false, hasElevenlabs: false, hasA2e: false, hasFal: false, hasPexels: false, hasSteveai: false };
      return res.json();
    },
    enabled: !!user?.id && !hasFullAccess,
  });
  
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const [publishForm, setPublishForm] = useState({
    title: "",
    description: "",
    tags: "",
    privacyStatus: "private" as "private" | "unlisted" | "public",
    accountId: "",
  });
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [useGeneratedVideo, setUseGeneratedVideo] = useState(false);
  
  const [generatingVoiceoverId, setGeneratingVoiceoverId] = useState<string | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<Record<string, string>>({});
  
  const [lipSyncDialogOpen, setLipSyncDialogOpen] = useState(false);
  const [lipSyncContent, setLipSyncContent] = useState<GeneratedContent | null>(null);
  const [lipSyncVideoFile, setLipSyncVideoFile] = useState<File | null>(null);
  const [lipSyncAudioFile, setLipSyncAudioFile] = useState<File | null>(null);
  const [lipSyncStatus, setLipSyncStatus] = useState<"idle" | "uploading" | "processing" | "complete">("idle");
  const [lipSyncResult, setLipSyncResult] = useState<{ requestId?: string; videoUrl?: string } | null>(null);

  const [generatingVideoId, setGeneratingVideoId] = useState<string | null>(null);
  const [videoRequests, setVideoRequests] = useState<Record<string, { requestId: string; status: string; videoUrl?: string }>>({});
  const [generatedVideos, setGeneratedVideos] = useState<Record<string, string>>({});

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingContent, setRejectingContent] = useState<GeneratedContent | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [avoidPatterns, setAvoidPatterns] = useState("");

  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoDialogContent, setVideoDialogContent] = useState<GeneratedContent | null>(null);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [editableVideoPrompt, setEditableVideoPrompt] = useState("");

  const [brollDialogOpen, setBrollDialogOpen] = useState(false);
  const [brollSearchQuery, setBrollSearchQuery] = useState("");
  const [brollMediaType, setBrollMediaType] = useState<"both" | "photos" | "videos">("both");
  const [brollResults, setBrollResults] = useState<any[]>([]);
  const [brollLoading, setBrollLoading] = useState(false);

  const [sceneGenerating, setSceneGenerating] = useState<Record<string, number | null>>({});
  const [sceneVideos, setSceneVideos] = useState<Record<string, Record<number, { status: string; videoUrl?: string; requestId?: string }>>>({});

  // Scene editing state
  const [editSceneDialogOpen, setEditSceneDialogOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<{ contentId: string; sceneNumber: number; sceneDescription: string; visualPrompt: string } | null>(null);

  // Voiceover editing state
  const [editVoiceoverDialogOpen, setEditVoiceoverDialogOpen] = useState(false);
  const [editingVoiceover, setEditingVoiceover] = useState<{ contentId: string; voiceoverText: string; voiceStyle: string } | null>(null);

  // Thumbnail editing state
  const [editThumbnailDialogOpen, setEditThumbnailDialogOpen] = useState(false);
  const [editingThumbnail, setEditingThumbnail] = useState<{ contentId: string; thumbnailPrompt: string } | null>(null);

  // Image prompt editing state
  const [editImageDialogOpen, setEditImageDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<{ contentId: string; mainImagePrompt: string; textOverlay: string; colorScheme: string; style: string } | null>(null);

  // Video engine selection (A2E vs Fal.ai vs Studio Package)
  const [videoEngine, setVideoEngine] = useState<"a2e" | "fal" | "steveai">("a2e");
  // Image engine selection (A2E vs DALL-E vs Fal.ai vs Pexels vs Getty)
  const [imageEngine, setImageEngine] = useState<"a2e" | "dalle" | "fal" | "pexels" | "getty">("a2e");
  // Studio Package specific settings
  const [steveAIStyle, setSteveAIStyle] = useState<"animation" | "live_action" | "generative" | "talking_head" | "documentary">("animation");
  const [selectedA2EAvatar, setSelectedA2EAvatar] = useState<string>("");
  const [a2eAvatars, setA2EAvatars] = useState<{ id: string; name: string; thumbnail?: string }[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);

  // Fetch AI engines status
  const { data: aiEngines } = useQuery<Record<string, { configured: boolean; name: string }>>({
    queryKey: ["/api/ai-engines/status"],
  });

  // Fetch A2E avatars when engine is selected
  useEffect(() => {
    if (videoEngine === "a2e" && aiEngines?.a2e?.configured && a2eAvatars.length === 0) {
      setLoadingAvatars(true);
      fetch("/api/a2e/avatars")
        .then(res => res.json())
        .then(data => {
          const avatars = data.avatars || [];
          setA2EAvatars(avatars);
          if (avatars.length > 0 && !selectedA2EAvatar) {
            setSelectedA2EAvatar(avatars[0].id || avatars[0].creator_id);
          }
        })
        .catch(err => console.error("Failed to load A2E avatars:", err))
        .finally(() => setLoadingAvatars(false));
    }
  }, [videoEngine, aiEngines]);

  const { data: pendingContent = [], isLoading: loadingPending } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=pending"],
  });

  const { data: approvedContent = [], isLoading: loadingApproved } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=approved"],
  });

  const { data: rejectedContent = [], isLoading: loadingRejected } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=rejected"],
  });

  const { data: socialAccounts = [] } = useQuery<SocialAccount[]>({
    queryKey: ["/api/social-accounts?userId=demo-user"],
  });

  const youtubeAccounts = useMemo(() => 
    socialAccounts.filter((a) => a.platform === "YouTube" && a.isConnected === "connected" && a.accessToken && a.refreshToken),
    [socialAccounts]
  );
  const hasYouTubeAccounts = youtubeAccounts.length > 0;

  // All connected platform accounts with proper token validation
  const getConnectedAccounts = (platform: string, requireTokens = false) => 
    socialAccounts.filter((a) => {
      const baseMatch = a.platform === platform && a.isConnected === "connected";
      if (requireTokens) {
        return baseMatch && a.accessToken && a.refreshToken;
      }
      return baseMatch;
    });
  
  // YouTube requires full OAuth tokens for video upload
  const platformAccounts = useMemo(() => ({
    YouTube: getConnectedAccounts("YouTube", true),
    Twitter: getConnectedAccounts("Twitter", true),
    LinkedIn: getConnectedAccounts("LinkedIn", true),
    Facebook: getConnectedAccounts("Facebook", true),
    Instagram: getConnectedAccounts("Instagram", true),
    TikTok: getConnectedAccounts("TikTok", true),
    Threads: getConnectedAccounts("Threads", true),
    Pinterest: getConnectedAccounts("Pinterest", true),
    Bluesky: getConnectedAccounts("Bluesky"),  // Bluesky uses password auth, stored differently
  }), [socialAccounts]);

  // Map platform variations to canonical names
  const normalizePlatformName = (platform: string): string => {
    const lower = platform.toLowerCase();
    if (lower.includes("youtube")) return "YouTube";
    if (lower.includes("instagram")) return "Instagram";
    if (lower.includes("tiktok")) return "TikTok";
    if (lower.includes("twitter") || lower === "x") return "Twitter";
    if (lower.includes("linkedin")) return "LinkedIn";
    if (lower.includes("facebook")) return "Facebook";
    if (lower.includes("threads")) return "Threads";
    if (lower.includes("pinterest")) return "Pinterest";
    if (lower.includes("bluesky")) return "Bluesky";
    return platform;
  };

  // Universal publish state
  const [selectedPublishPlatform, setSelectedPublishPlatform] = useState<string | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const invalidateContentQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=pending"] });
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=approved"] });
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=rejected"] });
  };

  const checkAIAccess = (featureName: string): boolean => {
    if (hasFullAccess) return true;
    // Free users with their own OpenAI key can access AI features
    if (userApiKeys?.hasOpenai) return true;
    setUpgradeFeatureName(featureName);
    setUpgradePromptOpen(true);
    return false;
  };

  // Track which content IDs we've already started polling for
  const pollingStartedRef = useRef<Set<string>>(new Set());

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/content/${id}/approve`);
    },
    onSuccess: invalidateContentQueries,
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/content/${id}/reject`);
    },
    onSuccess: invalidateContentQueries,
  });

  const [markingReadyId, setMarkingReadyId] = useState<string | null>(null);
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  
  const markReadyMutation = useMutation({
    mutationFn: async (contentId: string) => {
      setMarkingReadyId(contentId);
      const freshContentRes = await fetch(`/api/content/${contentId}`);
      const freshContent = await freshContentRes.json();
      const existingMetadata = (freshContent?.generationMetadata as any) || {};
      await apiRequest("PATCH", `/api/content/${contentId}`, {
        generationMetadata: { ...existingMetadata, manuallyReady: true },
      });
    },
    onSuccess: () => {
      invalidateContentQueries();
      toast({ title: "Moved to Ready", description: "Content is now in Ready to Post." });
      setMarkingReadyId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      setMarkingReadyId(null);
    },
  });

  const handleGenerateImage = async (content: GeneratedContent) => {
    if (!checkAIAccess("AI Image Generation")) return;
    const metadata = content.generationMetadata as any;
    // Try imagePrompts first, then thumbnailPrompt from videoPrompts, then caption as fallback
    const prompt = metadata?.imagePrompts?.mainImagePrompt 
      || metadata?.videoPrompts?.thumbnailPrompt
      || (content.caption ? `Social media image for: ${content.caption.substring(0, 200)}` : null);
    
    if (!prompt) {
      toast({ title: "No prompt available", description: "Could not generate a suitable image prompt. Try uploading an image instead.", variant: "destructive" });
      return;
    }
    
    setGeneratingImageId(content.id);
    try {
      const aspectRatio = metadata?.imagePrompts?.aspectRatio || "1:1";
      
      // Use selected image engine
      const endpoint = imageEngine === "a2e" ? "/api/a2e/generate-image" 
        : imageEngine === "dalle" ? "/api/dalle/generate-image" 
        : imageEngine === "pexels" ? "/api/pexels/search-image"
        : imageEngine === "getty" ? "/api/getty/search-image"
        : "/api/fal/generate-image";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate image");
      }
      
      const data = await res.json();
      setGeneratedImages(prev => ({ ...prev, [content.id]: data.imageUrl }));
      
      // Save to metadata
      const freshContentRes = await fetch(`/api/content/${content.id}`);
      const freshContent = await freshContentRes.json();
      const existingMetadata = (freshContent?.generationMetadata as any) || {};
      await apiRequest("PATCH", `/api/content/${content.id}`, {
        generationMetadata: { ...existingMetadata, generatedImageUrl: data.imageUrl },
      });
      
      invalidateContentQueries();
      toast({ title: "Image generated!", description: "Your image is ready." });
    } catch (error: any) {
      toast({ title: "Image generation failed", description: error.message, variant: "destructive" });
    } finally {
      setGeneratingImageId(null);
    }
  };

  const handleImageUpload = async (content: GeneratedContent, file: File) => {
    setUploadingImageId(content.id);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to upload image");
      }
      
      const data = await res.json();
      setGeneratedImages(prev => ({ ...prev, [content.id]: data.url }));
      
      // Save to metadata
      const freshContentRes = await fetch(`/api/content/${content.id}`);
      const freshContent = await freshContentRes.json();
      const existingMetadata = (freshContent?.generationMetadata as any) || {};
      await apiRequest("PATCH", `/api/content/${content.id}`, {
        generationMetadata: { ...existingMetadata, uploadedImageUrl: data.url },
      });
      
      invalidateContentQueries();
      toast({ title: "Image uploaded!", description: "Your image has been attached." });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingImageId(null);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/youtube/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Video Published!",
        description: `Your video is now on YouTube: ${data.url}`,
      });
      setPublishDialogOpen(false);
      setSelectedContent(null);
      setSelectedVideoFile(null);
      setPublishForm({ title: "", description: "", tags: "", privacyStatus: "private", accountId: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Universal social post mutation for all platforms except YouTube
  const socialPostMutation = useMutation({
    mutationFn: async (data: {
      accountId: string;
      text: string;
      mediaUrl?: string;
      scheduleTime?: string;
    }) => {
      const response = await fetch("/api/social/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Post failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      const platform = selectedPublishPlatform || "social media";
      toast({
        title: scheduleEnabled ? "Post Scheduled!" : "Posted!",
        description: scheduleEnabled 
          ? `Your content will be posted to ${platform} at the scheduled time.`
          : `Your content is now live on ${platform}!`,
      });
      setPublishDialogOpen(false);
      setSelectedContent(null);
      setSelectedPublishPlatform(null);
      setPublishForm({ title: "", description: "", tags: "", privacyStatus: "private", accountId: "" });
      invalidateContentQueries();
    },
    onError: (error: Error) => {
      toast({
        title: "Post Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const voiceoverMutation = useMutation({
    mutationFn: async ({ contentId, text }: { contentId: string; text: string }) => {
      setGeneratingVoiceoverId(contentId);
      const res = await fetch("/api/elevenlabs/voiceover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate voiceover");
      }
      return res.json();
    },
    onSuccess: async (data, { contentId }) => {
      setGeneratedAudio(prev => ({ ...prev, [contentId]: data.audioUrl }));
      try {
        // Fetch fresh content from server to get current metadata
        const freshContentRes = await fetch(`/api/content/${contentId}`);
        if (!freshContentRes.ok) {
          throw new Error(`Failed to fetch content: ${freshContentRes.status}`);
        }
        const freshContent = await freshContentRes.json();
        const existingMetadata = (freshContent?.generationMetadata as any) || {};
        const patchRes = await fetch(`/api/content/${contentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            generationMetadata: { ...existingMetadata, voiceoverAudioUrl: data.audioUrl },
          }),
        });
        if (!patchRes.ok) {
          const errData = await patchRes.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to save: ${patchRes.status}`);
        }
        invalidateContentQueries();
        toast({ title: "Voiceover generated!", description: "Your audio is ready to play." });
      } catch (e: any) {
        console.error("Failed to save voiceover URL:", e);
        toast({ title: "Voiceover generated but failed to save", description: e.message || "The audio was created but couldn't be saved.", variant: "destructive" });
      }
      setGeneratingVoiceoverId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Voiceover failed", description: error.message, variant: "destructive" });
      setGeneratingVoiceoverId(null);
    },
  });

  const openLipSyncDialog = (content: GeneratedContent) => {
    if (!checkAIAccess("AI Lip-Sync Video")) return;
    setLipSyncContent(content);
    setLipSyncVideoFile(null);
    setLipSyncStatus("idle");
    setLipSyncResult(null);
    setLipSyncDialogOpen(true);
  };

  const handleGenerateVoiceover = (content: GeneratedContent) => {
    if (!checkAIAccess("AI Voice Generation")) return;
    const voiceoverText = (content.generationMetadata as any)?.videoPrompts?.voiceoverText;
    if (!voiceoverText) {
      toast({ title: "No voiceover text", description: "This content doesn't have voiceover text.", variant: "destructive" });
      return;
    }
    voiceoverMutation.mutate({ contentId: content.id, text: voiceoverText });
  };

  const videoMutation = useMutation({
    mutationFn: async ({ contentId, prompt, aspectRatio, negativePrompt }: { contentId: string; prompt: string; aspectRatio?: string; negativePrompt?: string }) => {
      setGeneratingVideoId(contentId);
      const res = await fetch("/api/fal/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, negativePrompt, aspectRatio: aspectRatio || "16:9", duration: 5, contentId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to start video generation");
      }
      return res.json();
    },
    onSuccess: async (data, { contentId }) => {
      setVideoRequests(prev => ({ ...prev, [contentId]: { requestId: data.requestId, status: "processing" } }));
      toast({ title: "Video generation started!", description: "This may take a few minutes. We'll poll for status." });
      pollVideoStatus(contentId, data.requestId);
    },
    onError: (error: Error) => {
      toast({ title: "Video generation failed", description: error.message, variant: "destructive" });
      setGeneratingVideoId(null);
    },
  });

  const pollVideoStatus = async (contentId: string, requestId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/fal/video-status/${requestId}?contentId=${contentId}`);
        if (!res.ok) throw new Error("Failed to check status");
        const data = await res.json();
        
        if (data.status === "completed" && data.videoUrl) {
          setVideoRequests(prev => ({ ...prev, [contentId]: { requestId, status: "completed", videoUrl: data.videoUrl } }));
          setGeneratedVideos(prev => ({ ...prev, [contentId]: data.videoUrl }));
          setGeneratingVideoId(null);
          try {
            const contentList = [...pendingContent, ...approvedContent, ...rejectedContent];
            const existingContent = contentList.find(c => c.id === contentId);
            const existingMetadata = (existingContent?.generationMetadata as any) || {};
            await apiRequest("PATCH", `/api/content/${contentId}`, {
              generationMetadata: { ...existingMetadata, generatedVideoUrl: data.videoUrl },
            });
            invalidateContentQueries();
          } catch (e) {}
          toast({ title: "Video ready!", description: "Your AI-generated video is ready to download." });
        } else if (data.status === "failed") {
          setVideoRequests(prev => ({ ...prev, [contentId]: { requestId, status: "failed" } }));
          setGeneratingVideoId(null);
          toast({ title: "Video generation failed", variant: "destructive" });
        } else {
          setTimeout(poll, 10000);
        }
      } catch (e) {
        setTimeout(poll, 10000);
      }
    };
    poll();
  };

  // Resume polling for in-progress video generation on page load
  useEffect(() => {
    const allContent = [...pendingContent, ...approvedContent, ...rejectedContent];
    allContent.forEach((content) => {
      const typedContent = content as GeneratedContent & { videoRequestId?: string; videoRequestStatus?: string };
      if (typedContent.videoRequestId && typedContent.videoRequestStatus === "processing") {
        // Check if we're not already polling this content
        if (!pollingStartedRef.current.has(content.id)) {
          pollingStartedRef.current.add(content.id);
          setVideoRequests(prev => ({ 
            ...prev, 
            [content.id]: { requestId: typedContent.videoRequestId!, status: "processing" } 
          }));
          setGeneratingVideoId(content.id);
          pollVideoStatus(content.id, typedContent.videoRequestId!);
        }
      }
    });
  }, [pendingContent, approvedContent, rejectedContent]);

  const openVideoDialog = (content: GeneratedContent) => {
    setVideoDialogContent(content);
    setNegativePrompt("");
    const initialPrompt = (content.generationMetadata as any)?.videoPrompts?.visualDescription || "";
    setEditableVideoPrompt(initialPrompt);
    setVideoDialogOpen(true);
  };

  const handleGenerateVideo = () => {
    if (!checkAIAccess("AI Video Generation")) return;
    if (!videoDialogContent) return;
    if (!editableVideoPrompt.trim()) {
      toast({ title: "No video prompt", description: "Please enter a video prompt.", variant: "destructive" });
      return;
    }
    const aspectRatio = videoDialogContent.platforms.includes("TikTok") || videoDialogContent.platforms.includes("Instagram Reels") ? "9:16" : "16:9";
    videoMutation.mutate({ 
      contentId: videoDialogContent.id, 
      prompt: editableVideoPrompt.trim(), 
      aspectRatio,
      negativePrompt: negativePrompt || undefined
    });
    setVideoDialogOpen(false);
  };

  const handleGenerateSceneVideo = async (contentId: string, sceneNumber: number, prompt: string, platforms: string[]) => {
    if (!checkAIAccess("AI Scene Video Generation")) return;
    setSceneGenerating(prev => ({ ...prev, [contentId]: sceneNumber }));
    setSceneVideos(prev => ({
      ...prev,
      [contentId]: { ...(prev[contentId] || {}), [sceneNumber]: { status: "generating" } }
    }));

    try {
      const aspectRatio = platforms.includes("TikTok") || platforms.includes("Instagram Reels") ? "9:16" : "16:9";
      
      // Use A2E, Studio Package, or Fal.ai based on selected engine
      if (videoEngine === "a2e" && aiEngines?.a2e?.configured && selectedA2EAvatar) {
        // A2E lip-sync avatar video generation
        const res = await fetch("/api/a2e/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            text: prompt, 
            creatorId: selectedA2EAvatar, 
            aspectRatio 
          }),
        });
        
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to start A2E video generation");
        }
        
        const data = await res.json();
        setSceneVideos(prev => ({
          ...prev,
          [contentId]: { ...(prev[contentId] || {}), [sceneNumber]: { status: "processing", requestId: data.lipSyncId } }
        }));
        
        // Save request ID to database
        try {
          const contentRes = await fetch(`/api/content/${contentId}`);
          if (contentRes.ok) {
            const content = await contentRes.json();
            const existingMetadata = content?.generationMetadata || {};
            const sceneRequests = existingMetadata.sceneRequests || {};
            sceneRequests[sceneNumber] = { requestId: data.lipSyncId, status: "processing", engine: "a2e" };
            await fetch(`/api/content/${contentId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                generationMetadata: { ...existingMetadata, sceneRequests }
              }),
            });
          }
        } catch (e) {
          console.error("Failed to save scene request:", e);
        }
        
        toast({ title: `Scene ${sceneNumber} generating with A2E...`, description: "This may take a few minutes." });
        pollA2ESceneVideoStatus(contentId, sceneNumber, data.lipSyncId);
      } else if (videoEngine === "steveai" && aiEngines?.steveai?.configured) {
        // Studio Package video generation
        const res = await fetch("/api/steveai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            script: prompt, 
            style: steveAIStyle,
            aspectRatio,
            duration: 60
          }),
        });
        
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to start Studio Package video generation");
        }
        
        const data = await res.json();
        setSceneVideos(prev => ({
          ...prev,
          [contentId]: { ...(prev[contentId] || {}), [sceneNumber]: { status: "processing", requestId: data.requestId } }
        }));
        
        // Save request ID to database
        try {
          const contentRes = await fetch(`/api/content/${contentId}`);
          if (contentRes.ok) {
            const content = await contentRes.json();
            const existingMetadata = content?.generationMetadata || {};
            const sceneRequests = existingMetadata.sceneRequests || {};
            sceneRequests[sceneNumber] = { requestId: data.requestId, status: "processing", engine: "steveai" };
            await fetch(`/api/content/${contentId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                generationMetadata: { ...existingMetadata, sceneRequests }
              }),
            });
          }
        } catch (e) {
          console.error("Failed to save scene request:", e);
        }
        
        toast({ title: `Scene ${sceneNumber} generating with Studio Package...`, description: "This may take several minutes for longer videos." });
        pollSteveAISceneVideoStatus(contentId, sceneNumber, data.requestId);
      } else {
        // Fal.ai video generation (fallback)
        const res = await fetch("/api/fal/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentId, prompt, aspectRatio, duration: 10, sceneNumber }),
        });
        
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to start video generation");
        }
        
        const data = await res.json();
        setSceneVideos(prev => ({
          ...prev,
          [contentId]: { ...(prev[contentId] || {}), [sceneNumber]: { status: "processing", requestId: data.requestId } }
        }));
        
        // Save request ID to database for polling resume
        try {
          const contentRes = await fetch(`/api/content/${contentId}`);
          if (contentRes.ok) {
            const content = await contentRes.json();
            const existingMetadata = content?.generationMetadata || {};
            const sceneRequests = existingMetadata.sceneRequests || {};
            sceneRequests[sceneNumber] = { requestId: data.requestId, status: "processing", engine: "fal" };
            await fetch(`/api/content/${contentId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                generationMetadata: { ...existingMetadata, sceneRequests }
              }),
            });
          }
        } catch (e) {
          console.error("Failed to save scene request:", e);
        }
        
        toast({ title: `Scene ${sceneNumber} generating with Fal.ai...`, description: "This may take a few minutes." });
        pollSceneVideoStatus(contentId, sceneNumber, data.requestId);
      }
    } catch (error: any) {
      setSceneVideos(prev => ({
        ...prev,
        [contentId]: { ...(prev[contentId] || {}), [sceneNumber]: { status: "failed" } }
      }));
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    } finally {
      setSceneGenerating(prev => ({ ...prev, [contentId]: null }));
    }
  };

  // A2E polling function
  const pollA2ESceneVideoStatus = async (contentId: string, sceneNumber: number, lipSyncId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/a2e/status/${lipSyncId}`);
        if (!res.ok) return;
        
        const data = await res.json();
        if (data.status === "done" && data.output) {
          setSceneVideos(prev => ({
            ...prev,
            [contentId]: { ...(prev[contentId] || {}), [sceneNumber]: { status: "completed", videoUrl: data.output, requestId: lipSyncId } }
          }));
          
          // Save to database
          try {
            const contentRes = await fetch(`/api/content/${contentId}`);
            if (contentRes.ok) {
              const content = await contentRes.json();
              const existingMetadata = content?.generationMetadata || {};
              const existingClips = existingMetadata.generatedClips || [];
              const updatedClips = existingClips.filter((c: any) => c.sceneNumber !== sceneNumber);
              updatedClips.push({ sceneNumber, videoUrl: data.output, requestId: lipSyncId, engine: "a2e" });
              updatedClips.sort((a: any, b: any) => a.sceneNumber - b.sceneNumber);
              
              const sceneRequests = existingMetadata.sceneRequests || {};
              if (sceneRequests[sceneNumber]) {
                sceneRequests[sceneNumber] = { ...sceneRequests[sceneNumber], status: "completed" };
              }
              
              await fetch(`/api/content/${contentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  generationMetadata: { ...existingMetadata, generatedClips: updatedClips, sceneRequests }
                }),
              });
            }
          } catch (e) {
            console.error("Failed to save A2E scene video:", e);
          }
          
          toast({ title: `Scene ${sceneNumber} complete!`, description: "A2E video generated successfully." });
          invalidateContentQueries();
        } else if (data.status === "error") {
          setSceneVideos(prev => ({
            ...prev,
            [contentId]: { ...(prev[contentId] || {}), [sceneNumber]: { status: "failed", requestId: lipSyncId } }
          }));
          toast({ title: `Scene ${sceneNumber} failed`, description: data.error_message || "A2E generation failed", variant: "destructive" });
        } else {
          setTimeout(poll, 5000);
        }
      } catch {
        setTimeout(poll, 5000);
      }
    };
    poll();
  };

  // Studio Package polling function
  const pollSteveAISceneVideoStatus = async (contentId: string, sceneNumber: number, requestId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/steveai/status/${requestId}`);
        if (!res.ok) return;
        
        const data = await res.json();
        if (data.status === "completed" && data.videoUrl) {
          setSceneVideos(prev => ({
            ...prev,
            [contentId]: { ...(prev[contentId] || {}), [sceneNumber]: { status: "completed", videoUrl: data.videoUrl, requestId } }
          }));
          
          // Save to database
          try {
            const contentRes = await fetch(`/api/content/${contentId}`);
            if (contentRes.ok) {
              const content = await contentRes.json();
              const existingMetadata = content?.generationMetadata || {};
              const existingClips = existingMetadata.generatedClips || [];
              const updatedClips = existingClips.filter((c: any) => c.sceneNumber !== sceneNumber);
              updatedClips.push({ sceneNumber, videoUrl: data.videoUrl, requestId, engine: "steveai" });
              updatedClips.sort((a: any, b: any) => a.sceneNumber - b.sceneNumber);
              
              const sceneRequests = existingMetadata.sceneRequests || {};
              if (sceneRequests[sceneNumber]) {
                sceneRequests[sceneNumber] = { ...sceneRequests[sceneNumber], status: "completed" };
              }
              
              await fetch(`/api/content/${contentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  generationMetadata: { ...existingMetadata, generatedClips: updatedClips, sceneRequests }
                }),
              });
            }
          } catch (e) {
            console.error("Failed to save Studio Package scene video:", e);
          }
          
          toast({ title: `Scene ${sceneNumber} complete!`, description: "Studio Package video generated successfully." });
          invalidateContentQueries();
        } else if (data.status === "failed") {
          setSceneVideos(prev => ({
            ...prev,
            [contentId]: { ...(prev[contentId] || {}), [sceneNumber]: { status: "failed", requestId } }
          }));
          toast({ title: `Scene ${sceneNumber} failed`, description: data.error || "Studio Package generation failed", variant: "destructive" });
        } else {
          // Still processing - poll again in 10 seconds (Studio Package takes longer)
          setTimeout(poll, 10000);
        }
      } catch {
        setTimeout(poll, 10000);
      }
    };
    poll();
  };

  // Load existing generated clips and resume polling for in-progress scene video generation on page load
  const scenePollingStartedRef = useRef<Set<string>>(new Set());
  const clipLoadedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const allContent = [...pendingContent, ...approvedContent, ...rejectedContent];
    allContent.forEach((content) => {
      const metadata = content.generationMetadata as any;
      
      // Load already-completed clips into state
      const generatedClips = metadata?.generatedClips || [];
      generatedClips.forEach((clip: any) => {
        const key = `${content.id}-${clip.sceneNumber}`;
        if (!clipLoadedRef.current.has(key) && clip.videoUrl) {
          clipLoadedRef.current.add(key);
          setSceneVideos(prev => ({
            ...prev,
            [content.id]: { ...(prev[content.id] || {}), [clip.sceneNumber]: { status: "completed", videoUrl: clip.videoUrl, requestId: clip.requestId } }
          }));
        }
      });
      
      // Resume polling for in-progress requests
      const sceneRequests = metadata?.sceneRequests || {};
      Object.entries(sceneRequests).forEach(([sceneNumStr, reqData]: [string, any]) => {
        const sceneNumber = parseInt(sceneNumStr);
        if (reqData?.status === "processing" && reqData?.requestId) {
          const key = `${content.id}-${sceneNumber}`;
          if (!scenePollingStartedRef.current.has(key)) {
            scenePollingStartedRef.current.add(key);
            setSceneVideos(prev => ({
              ...prev,
              [content.id]: { ...(prev[content.id] || {}), [sceneNumber]: { status: "processing", requestId: reqData.requestId } }
            }));
            // Use the correct polling function based on engine
            if (reqData.engine === "a2e") {
              pollA2ESceneVideoStatus(content.id, sceneNumber, reqData.requestId);
            } else if (reqData.engine === "steveai") {
              pollSteveAISceneVideoStatus(content.id, sceneNumber, reqData.requestId);
            } else {
              pollSceneVideoStatus(content.id, sceneNumber, reqData.requestId);
            }
          }
        }
      });
    });
  }, [pendingContent, approvedContent, rejectedContent]);

  const pollSceneVideoStatus = async (contentId: string, sceneNumber: number, requestId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/fal/video-status/${requestId}`);
        if (!res.ok) return;
        
        const data = await res.json();
        if (data.status === "completed" && data.videoUrl) {
          setSceneVideos(prev => ({
            ...prev,
            [contentId]: { ...(prev[contentId] || {}), [sceneNumber]: { status: "completed", videoUrl: data.videoUrl, requestId } }
          }));
          
          // Save to database
          try {
            const contentRes = await fetch(`/api/content/${contentId}`);
            if (contentRes.ok) {
              const content = await contentRes.json();
              const existingMetadata = content?.generationMetadata || {};
              const existingClips = existingMetadata.generatedClips || [];
              const updatedClips = existingClips.filter((c: any) => c.sceneNumber !== sceneNumber);
              updatedClips.push({ sceneNumber, videoUrl: data.videoUrl, requestId });
              updatedClips.sort((a: any, b: any) => a.sceneNumber - b.sceneNumber);
              
              // Update scene request status to completed
              const sceneRequests = existingMetadata.sceneRequests || {};
              if (sceneRequests[sceneNumber]) {
                sceneRequests[sceneNumber] = { ...sceneRequests[sceneNumber], status: "completed" };
              }
              
              await fetch(`/api/content/${contentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  generationMetadata: { ...existingMetadata, generatedClips: updatedClips, sceneRequests }
                }),
              });
            }
          } catch (e) {
            console.error("Failed to save scene video:", e);
          }
          
          toast({ title: `Scene ${sceneNumber} complete!`, description: "Video generated successfully." });
          invalidateContentQueries();
        } else if (data.status === "failed") {
          setSceneVideos(prev => ({
            ...prev,
            [contentId]: { ...(prev[contentId] || {}), [sceneNumber]: { status: "failed", requestId } }
          }));
          toast({ title: `Scene ${sceneNumber} failed`, variant: "destructive" });
        } else {
          setTimeout(poll, 5000);
        }
      } catch {
        setTimeout(poll, 5000);
      }
    };
    poll();
  };

  // Scene edit and delete handlers
  const openEditSceneDialog = (contentId: string, sceneNumber: number, sceneDescription: string, visualPrompt: string) => {
    setEditingScene({ contentId, sceneNumber, sceneDescription, visualPrompt });
    setEditSceneDialogOpen(true);
  };

  const handleSaveScene = async () => {
    if (!editingScene) return;
    
    try {
      const contentRes = await fetch(`/api/content/${editingScene.contentId}`);
      if (!contentRes.ok) throw new Error("Failed to fetch content");
      
      const content = await contentRes.json();
      const metadata = content.generationMetadata || {};
      const videoPrompts = metadata.videoPrompts || {};
      const scenePrompts = videoPrompts.scenePrompts || [];
      
      const updatedScenes = scenePrompts.map((scene: any) => 
        scene.sceneNumber === editingScene.sceneNumber 
          ? { ...scene, sceneDescription: editingScene.sceneDescription, visualPrompt: editingScene.visualPrompt }
          : scene
      );
      
      await fetch(`/api/content/${editingScene.contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationMetadata: { ...metadata, videoPrompts: { ...videoPrompts, scenePrompts: updatedScenes } }
        }),
      });
      
      toast({ title: "Scene updated", description: `Scene ${editingScene.sceneNumber} has been updated.` });
      invalidateContentQueries();
      setEditSceneDialogOpen(false);
      setEditingScene(null);
    } catch (error) {
      toast({ title: "Failed to update scene", variant: "destructive" });
    }
  };

  const handleDeleteScene = async (contentId: string, sceneNumber: number) => {
    try {
      const contentRes = await fetch(`/api/content/${contentId}`);
      if (!contentRes.ok) throw new Error("Failed to fetch content");
      
      const content = await contentRes.json();
      const metadata = content.generationMetadata || {};
      const videoPrompts = metadata.videoPrompts || {};
      const scenePrompts = videoPrompts.scenePrompts || [];
      
      const updatedScenes = scenePrompts
        .filter((scene: any) => scene.sceneNumber !== sceneNumber)
        .map((scene: any, idx: number) => ({ ...scene, sceneNumber: idx + 1 }));
      
      // Also remove generated clips for this scene
      const generatedClips = (metadata.generatedClips || []).filter((c: any) => c.sceneNumber !== sceneNumber);
      
      await fetch(`/api/content/${contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationMetadata: { ...metadata, videoPrompts: { ...videoPrompts, scenePrompts: updatedScenes }, generatedClips }
        }),
      });
      
      toast({ title: "Scene deleted", description: `Scene ${sceneNumber} has been removed.` });
      invalidateContentQueries();
    } catch (error) {
      toast({ title: "Failed to delete scene", variant: "destructive" });
    }
  };

  // Voiceover edit handlers
  const openEditVoiceoverDialog = (contentId: string, voiceoverText: string, voiceStyle: string) => {
    setEditingVoiceover({ contentId, voiceoverText, voiceStyle: voiceStyle || "" });
    setEditVoiceoverDialogOpen(true);
  };

  const handleSaveVoiceover = async () => {
    if (!editingVoiceover) return;
    
    try {
      const contentRes = await fetch(`/api/content/${editingVoiceover.contentId}`);
      if (!contentRes.ok) throw new Error("Failed to fetch content");
      
      const content = await contentRes.json();
      const metadata = content.generationMetadata || {};
      const videoPrompts = metadata.videoPrompts || {};
      
      await fetch(`/api/content/${editingVoiceover.contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationMetadata: { 
            ...metadata, 
            videoPrompts: { 
              ...videoPrompts, 
              voiceoverText: editingVoiceover.voiceoverText,
              voiceStyle: editingVoiceover.voiceStyle
            } 
          }
        }),
      });
      
      toast({ title: "Voiceover updated", description: "The voiceover text has been updated." });
      invalidateContentQueries();
      setEditVoiceoverDialogOpen(false);
      setEditingVoiceover(null);
    } catch (error) {
      toast({ title: "Failed to update voiceover", variant: "destructive" });
    }
  };

  // Thumbnail edit handlers
  const openEditThumbnailDialog = (contentId: string, thumbnailPrompt: string) => {
    setEditingThumbnail({ contentId, thumbnailPrompt });
    setEditThumbnailDialogOpen(true);
  };

  const handleSaveThumbnail = async () => {
    if (!editingThumbnail) return;
    
    try {
      const contentRes = await fetch(`/api/content/${editingThumbnail.contentId}`);
      if (!contentRes.ok) throw new Error("Failed to fetch content");
      
      const content = await contentRes.json();
      const metadata = content.generationMetadata || {};
      const videoPrompts = metadata.videoPrompts || {};
      
      await fetch(`/api/content/${editingThumbnail.contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationMetadata: { 
            ...metadata, 
            videoPrompts: { 
              ...videoPrompts, 
              thumbnailPrompt: editingThumbnail.thumbnailPrompt
            } 
          }
        }),
      });
      
      toast({ title: "Thumbnail prompt updated" });
      invalidateContentQueries();
      setEditThumbnailDialogOpen(false);
      setEditingThumbnail(null);
    } catch (error) {
      toast({ title: "Failed to update thumbnail", variant: "destructive" });
    }
  };

  // Image prompt edit handlers
  const openEditImageDialog = (contentId: string, imagePrompts: any) => {
    setEditingImage({ 
      contentId, 
      mainImagePrompt: imagePrompts.mainImagePrompt || "",
      textOverlay: imagePrompts.textOverlay || "",
      colorScheme: imagePrompts.colorScheme || "",
      style: imagePrompts.style || ""
    });
    setEditImageDialogOpen(true);
  };

  const handleSaveImage = async () => {
    if (!editingImage) return;
    
    try {
      const contentRes = await fetch(`/api/content/${editingImage.contentId}`);
      if (!contentRes.ok) throw new Error("Failed to fetch content");
      
      const content = await contentRes.json();
      const metadata = content.generationMetadata || {};
      const imagePrompts = metadata.imagePrompts || {};
      
      await fetch(`/api/content/${editingImage.contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationMetadata: { 
            ...metadata, 
            imagePrompts: { 
              ...imagePrompts, 
              mainImagePrompt: editingImage.mainImagePrompt,
              textOverlay: editingImage.textOverlay,
              colorScheme: editingImage.colorScheme,
              style: editingImage.style
            } 
          }
        }),
      });
      
      toast({ title: "Image prompt updated" });
      invalidateContentQueries();
      setEditImageDialogOpen(false);
      setEditingImage(null);
    } catch (error) {
      toast({ title: "Failed to update image prompt", variant: "destructive" });
    }
  };

  const openRejectDialog = (content: GeneratedContent) => {
    setRejectingContent(content);
    setRejectionReason("");
    setAvoidPatterns("");
    setRejectDialogOpen(true);
  };

  const handleRejectWithFeedback = async () => {
    if (!rejectingContent || !rejectionReason.trim()) {
      toast({ title: "Please provide a reason", variant: "destructive" });
      return;
    }
    
    try {
      await apiRequest("PATCH", `/api/content/${rejectingContent.id}/reject`);
      
      const patterns = avoidPatterns.split(",").map(p => p.trim()).filter(Boolean);
      await fetch("/api/prompt-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefId: rejectingContent.briefId,
          contentId: rejectingContent.id,
          feedbackType: "content_rejection",
          originalPrompt: (rejectingContent.generationMetadata as any)?.videoPrompts?.visualDescription || "",
          rejectionReason: rejectionReason,
          avoidPatterns: patterns,
        }),
      });
      
      invalidateContentQueries();
      toast({ title: "Content rejected", description: "Your feedback will help improve future content." });
      setRejectDialogOpen(false);
    } catch (error) {
      toast({ title: "Failed to reject", variant: "destructive" });
    }
  };

  const getVideoUrlFromContent = (content: GeneratedContent): string | null => {
    const metadata = content.generationMetadata as any;
    return metadata?.mergedVideoUrl || metadata?.generatedVideoUrl || content.videoUrl || null;
  };

  const openPublishDialog = (content: GeneratedContent, platform?: string) => {
    setSelectedContent(content);
    setSelectedPublishPlatform(platform || null);
    const videoUrl = getVideoUrlFromContent(content);
    const accounts = platform ? (platformAccounts as any)[platform] || [] : youtubeAccounts;
    setPublishForm({
      title: content.script?.substring(0, 100) || "My Post",
      description: content.caption || "",
      tags: content.hashtags?.join(", ") || "",
      privacyStatus: "private",
      accountId: accounts.length > 0 ? accounts[0].id : "",
    });
    setSelectedVideoFile(null);
    setUseGeneratedVideo(!!videoUrl);
    setScheduleEnabled(false);
    setScheduleDate("");
    setScheduleTime("");
    setPublishDialogOpen(true);
  };

  const handlePublish = () => {
    const videoUrl = selectedContent ? getVideoUrlFromContent(selectedContent) : null;
    const imageUrl = selectedContent ? getImageUrlFromContent(selectedContent) : null;
    const mediaUrl = videoUrl || imageUrl;
    
    // For YouTube, use the upload mutation (video upload)
    if (selectedPublishPlatform === "YouTube" || !selectedPublishPlatform) {
      if (!selectedVideoFile && !useGeneratedVideo) {
        toast({
          title: "No Video Selected",
          description: "Please select a video source",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      
      if (useGeneratedVideo && videoUrl) {
        formData.append("videoUrl", videoUrl);
      } else if (selectedVideoFile) {
        formData.append("video", selectedVideoFile);
      }
      
      formData.append("title", publishForm.title);
      formData.append("description", publishForm.description);
      formData.append("tags", JSON.stringify(publishForm.tags.split(",").map(t => t.trim()).filter(Boolean)));
      formData.append("privacyStatus", publishForm.privacyStatus);
      if (publishForm.accountId) {
        formData.append("accountId", publishForm.accountId);
      }
      if (scheduleEnabled && scheduleDate && scheduleTime) {
        formData.append("scheduledTime", new Date(`${scheduleDate}T${scheduleTime}`).toISOString());
      }

      uploadMutation.mutate(formData);
    } else {
      // For other platforms, use the universal social post endpoint
      if (!publishForm.accountId) {
        toast({
          title: "No Account Selected",
          description: "Please connect your account first",
          variant: "destructive",
        });
        return;
      }

      const postText = `${publishForm.title}\n\n${publishForm.description}${publishForm.tags ? `\n\n${publishForm.tags.split(",").map(t => `#${t.trim()}`).join(" ")}` : ""}`;
      
      socialPostMutation.mutate({
        accountId: publishForm.accountId,
        text: postText,
        mediaUrl: mediaUrl || undefined,
        scheduleTime: scheduleEnabled && scheduleDate && scheduleTime 
          ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString() 
          : undefined,
      });
    }
  };

  const getImageUrlFromContent = (content: GeneratedContent): string | null => {
    const metadata = content.generationMetadata as any;
    return metadata?.uploadedImageUrl || metadata?.generatedImageUrl || content.thumbnailUrl || null;
  };

  const ContentCard = ({ content, showActions = true }: { content: GeneratedContent; showActions?: boolean }) => (
    <Card key={content.id} className="border shadow-sm hover:shadow-md transition-shadow" data-testid={`card-content-${content.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize" data-testid={`badge-type-${content.id}`}>
              {content.contentType}
            </Badge>
            <Badge 
              variant={content.status === "approved" ? "default" : content.status === "rejected" ? "destructive" : "secondary"}
              data-testid={`badge-status-${content.id}`}
            >
              {content.status}
            </Badge>
          </div>
          <div className="flex gap-1">
            {content.platforms.map((platform) => (
              <span
                key={platform}
                className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                data-testid={`text-platform-${content.id}-${platform}`}
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {content.script && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Video className="w-4 h-4" />
              Script
            </div>
            <p className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-wrap" data-testid={`text-script-${content.id}`}>
              {content.script}
            </p>
          </div>
        )}
        
        {content.caption && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="w-4 h-4" />
              Caption
            </div>
            <p className="text-sm bg-muted/50 rounded-lg p-3" data-testid={`text-caption-${content.id}`}>
              {content.caption}
            </p>
          </div>
        )}

        {content.hashtags && content.hashtags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Hash className="w-4 h-4" />
              Hashtags
            </div>
            <div className="flex flex-wrap gap-1" data-testid={`text-hashtags-${content.id}`}>
              {content.hashtags.map((tag) => (
                <span key={tag} className="text-xs text-primary">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {(content.generationMetadata as any)?.videoPrompts && (
          <div className="space-y-3 border-t pt-4 mt-4" data-testid={`video-prompts-${content.id}`}>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Wand2 className="w-4 h-4" />
              AI Video Prompts
            </div>
            
            {(content.generationMetadata as any).videoPrompts.voiceoverText && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">ElevenLabs Voiceover</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => openEditVoiceoverDialog(
                      content.id,
                      (content.generationMetadata as any).videoPrompts.voiceoverText,
                      (content.generationMetadata as any).videoPrompts.voiceStyle
                    )}
                    data-testid={`button-edit-voiceover-${content.id}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 whitespace-pre-wrap border border-blue-200 dark:border-blue-800">
                  {(content.generationMetadata as any).videoPrompts.voiceoverText}
                </p>
                {(content.generationMetadata as any).videoPrompts.voiceStyle && (
                  <p className="text-xs text-muted-foreground italic">
                    Voice style: {(content.generationMetadata as any).videoPrompts.voiceStyle}
                  </p>
                )}
                
                {(generatedAudio[content.id] || (content.generationMetadata as any)?.voiceoverAudioUrl) && (
                  <div className="mt-2">
                    <audio controls className="w-full h-10" data-testid={`audio-voiceover-${content.id}`}>
                      <source src={generatedAudio[content.id] || (content.generationMetadata as any)?.voiceoverAudioUrl} type="audio/mpeg" />
                    </audio>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <Button
                    size="sm"
                    variant={generatedAudio[content.id] || (content.generationMetadata as any)?.voiceoverAudioUrl ? "outline" : "default"}
                    onClick={() => handleGenerateVoiceover(content)}
                    disabled={generatingVoiceoverId === content.id}
                    className="gap-2 w-full sm:w-auto"
                    data-testid={`button-generate-voiceover-${content.id}`}
                  >
                    {generatingVoiceoverId === content.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        {generatedAudio[content.id] || (content.generationMetadata as any)?.voiceoverAudioUrl ? "Regenerate" : "Generate Voiceover"}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openLipSyncDialog(content)}
                    className="gap-2 w-full sm:w-auto"
                    data-testid={`button-lipsync-${content.id}`}
                  >
                    <Film className="w-4 h-4" />
                    Create Lip-Sync Video
                  </Button>
                </div>
              </div>
            )}
            
            {(content.generationMetadata as any).videoPrompts.visualDescription && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Video Generation Prompt</p>
                <p className="text-sm bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 whitespace-pre-wrap border border-purple-200 dark:border-purple-800">
                  {(content.generationMetadata as any).videoPrompts.visualDescription}
                </p>
                
                {(generatedVideos[content.id] || (content.generationMetadata as any)?.generatedVideoUrl) && (
                  <div className="mt-2">
                    <video controls className="w-full rounded-lg max-h-48" data-testid={`video-generated-${content.id}`}>
                      <source src={generatedVideos[content.id] || (content.generationMetadata as any)?.generatedVideoUrl} type="video/mp4" />
                    </video>
                    <a
                      href={generatedVideos[content.id] || (content.generationMetadata as any)?.generatedVideoUrl}
                      download="generated-video.mp4"
                      className="text-xs text-primary underline mt-1 inline-block"
                    >
                      Download Video
                    </a>
                  </div>
                )}
                
                <Button
                  size="sm"
                  variant={generatedVideos[content.id] || (content.generationMetadata as any)?.generatedVideoUrl ? "outline" : "default"}
                  onClick={() => openVideoDialog(content)}
                  disabled={generatingVideoId === content.id || videoRequests[content.id]?.status === "processing"}
                  className="gap-2 w-full sm:w-auto"
                  data-testid={`button-generate-video-${content.id}`}
                >
                  {generatingVideoId === content.id || videoRequests[content.id]?.status === "processing" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Video...
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      {generatedVideos[content.id] || (content.generationMetadata as any)?.generatedVideoUrl ? "Regenerate Video" : "Generate Video (Fal.ai)"}
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {(content.generationMetadata as any).videoPrompts.scenePrompts?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-indigo-600" />
                  <p className="text-xs font-medium text-muted-foreground">Scene-by-Scene Video Generation</p>
                </div>
                
                {/* Video Engine Selector */}
                <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium">Video Engine:</Label>
                      <Select value={videoEngine} onValueChange={(v: "a2e" | "fal" | "steveai") => setVideoEngine(v)}>
                        <SelectTrigger className="w-40 h-8 text-xs" data-testid="select-video-engine">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="a2e" disabled={!aiEngines?.a2e?.configured}>
                            <span className="flex items-center gap-2">
                              A2E Avatar {!aiEngines?.a2e?.configured && "(Not configured)"}
                            </span>
                          </SelectItem>
                          <SelectItem value="fal" disabled={!aiEngines?.fal?.configured}>
                            <span className="flex items-center gap-2">
                              Fal.ai Video {!aiEngines?.fal?.configured && "(Not configured)"}
                            </span>
                          </SelectItem>
                          <SelectItem value="steveai" disabled={!aiEngines?.steveai?.configured}>
                            <span className="flex items-center gap-2">
                              Studio Package {!aiEngines?.steveai?.configured && "(Not configured)"}
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {videoEngine === "a2e" && aiEngines?.a2e?.configured && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-medium">Avatar:</Label>
                        {loadingAvatars ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                          </div>
                        ) : (
                          <Select value={selectedA2EAvatar} onValueChange={setSelectedA2EAvatar}>
                            <SelectTrigger className="w-48 h-8 text-xs" data-testid="select-a2e-avatar">
                              <SelectValue placeholder="Select avatar..." />
                            </SelectTrigger>
                            <SelectContent>
                              {a2eAvatars.map((avatar) => (
                                <SelectItem key={avatar.id || (avatar as any).creator_id} value={avatar.id || (avatar as any).creator_id}>
                                  {avatar.name || `Avatar ${avatar.id || (avatar as any).creator_id}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}

                    {videoEngine === "steveai" && aiEngines?.steveai?.configured && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-medium">Style:</Label>
                        <Select value={steveAIStyle} onValueChange={(v: any) => setSteveAIStyle(v)}>
                          <SelectTrigger className="w-40 h-8 text-xs" data-testid="select-steveai-style">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="animation">Animation</SelectItem>
                            <SelectItem value="live_action">Live Action</SelectItem>
                            <SelectItem value="generative">Generative AI</SelectItem>
                            <SelectItem value="talking_head">Talking Head</SelectItem>
                            <SelectItem value="documentary">Documentary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {videoEngine === "a2e" 
                      ? "A2E creates realistic lip-sync avatar videos from your script text." 
                      : videoEngine === "steveai"
                      ? "Studio Package creates polished videos in multiple styles (animation, live action, AI-generated). Up to 3 minutes."
                      : "Fal.ai generates AI video clips from visual prompts."}
                  </p>
                </div>
                
                <div className="space-y-3">
                  {(content.generationMetadata as any).videoPrompts.scenePrompts.map((scene: { sceneNumber: number; duration: number; visualPrompt: string; sceneDescription: string }) => {
                    const sceneState = sceneVideos[content.id]?.[scene.sceneNumber];
                    const isGenerating = sceneGenerating[content.id] === scene.sceneNumber || sceneState?.status === "generating" || sceneState?.status === "processing";
                    const existingClip = (content.generationMetadata as any)?.generatedClips?.find((c: any) => c.sceneNumber === scene.sceneNumber);
                    const videoUrl = sceneState?.videoUrl || existingClip?.videoUrl;
                    
                    return (
                      <div key={scene.sceneNumber} className="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-3 border border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">Scene {scene.sceneNumber}</Badge>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground mr-1">{scene.duration}s</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => openEditSceneDialog(content.id, scene.sceneNumber, scene.sceneDescription, scene.visualPrompt)}
                              data-testid={`button-edit-scene-${content.id}-${scene.sceneNumber}`}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteScene(content.id, scene.sceneNumber)}
                              data-testid={`button-delete-scene-${content.id}-${scene.sceneNumber}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm font-medium mb-1">{scene.sceneDescription}</p>
                        <p className="text-xs text-muted-foreground italic mb-2">"{scene.visualPrompt}"</p>
                        
                        {videoUrl && (
                          <div className="mb-2">
                            <video controls className="w-full rounded max-h-32" data-testid={`video-scene-${content.id}-${scene.sceneNumber}`}>
                              <source src={videoUrl} type="video/mp4" />
                            </video>
                          </div>
                        )}
                        
                        <Button
                          size="sm"
                          variant={videoUrl ? "outline" : "default"}
                          onClick={() => handleGenerateSceneVideo(content.id, scene.sceneNumber, scene.visualPrompt, content.platforms)}
                          disabled={isGenerating}
                          className="gap-2 w-full"
                          data-testid={`button-generate-scene-${content.id}-${scene.sceneNumber}`}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Video className="w-4 h-4" />
                              {videoUrl ? "Regenerate" : "Generate"} Scene {scene.sceneNumber}
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(content.generationMetadata as any).videoPrompts.thumbnailPrompt && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Thumbnail Image Prompt</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => openEditThumbnailDialog(
                      content.id,
                      (content.generationMetadata as any).videoPrompts.thumbnailPrompt
                    )}
                    data-testid={`button-edit-thumbnail-${content.id}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                  {(content.generationMetadata as any).videoPrompts.thumbnailPrompt}
                </p>
              </div>
            )}
            
            {(content.generationMetadata as any).videoPrompts.brollSuggestions?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">B-Roll Suggestions</p>
                <ul className="text-sm bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 list-disc list-inside space-y-1 border border-amber-200 dark:border-amber-800">
                  {(content.generationMetadata as any).videoPrompts.brollSuggestions.map((suggestion: string, i: number) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 w-full sm:w-auto"
                  onClick={() => {
                    const suggestions = (content.generationMetadata as any).videoPrompts.brollSuggestions;
                    if (suggestions && suggestions.length > 0) {
                      setBrollSearchQuery(suggestions[0]);
                    }
                    setBrollDialogOpen(true);
                  }}
                  data-testid={`button-broll-${content.id}`}
                >
                  <Clapperboard className="w-4 h-4" />
                  Find B-Roll Footage (Pexels)
                </Button>
              </div>
            )}

          </div>
        )}

        {(content.generationMetadata as any)?.imagePrompts && (
          <div className="space-y-3 border-t pt-4 mt-4" data-testid={`image-prompts-${content.id}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <ImageIcon className="w-4 h-4" />
                AI Image Prompts
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => openEditImageDialog(content.id, (content.generationMetadata as any).imagePrompts)}
                data-testid={`button-edit-image-${content.id}`}
              >
                <Pencil className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Image Generation Prompt</p>
              <p className="text-sm bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 whitespace-pre-wrap border border-purple-200 dark:border-purple-800">
                {(content.generationMetadata as any).imagePrompts.mainImagePrompt}
              </p>
              
              {(content.generationMetadata as any).imagePrompts.textOverlay && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-muted-foreground">Text Overlay</p>
                  <p className="text-sm bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800 font-medium">
                    {(content.generationMetadata as any).imagePrompts.textOverlay}
                  </p>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {(content.generationMetadata as any).imagePrompts.colorScheme && (
                  <span className="bg-muted px-2 py-1 rounded">Colors: {(content.generationMetadata as any).imagePrompts.colorScheme}</span>
                )}
                {(content.generationMetadata as any).imagePrompts.style && (
                  <span className="bg-muted px-2 py-1 rounded">Style: {(content.generationMetadata as any).imagePrompts.style}</span>
                )}
                {(content.generationMetadata as any).imagePrompts.aspectRatio && (
                  <span className="bg-muted px-2 py-1 rounded">Ratio: {(content.generationMetadata as any).imagePrompts.aspectRatio}</span>
                )}
              </div>

              {(generatedImages[content.id] || (content.generationMetadata as any)?.generatedImageUrl || (content.generationMetadata as any)?.uploadedImageUrl) && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Generated/Uploaded Image</p>
                  <img 
                    src={generatedImages[content.id] || (content.generationMetadata as any)?.generatedImageUrl || (content.generationMetadata as any)?.uploadedImageUrl} 
                    alt="Generated content" 
                    className="rounded-lg max-h-48 object-contain border"
                    data-testid={`img-generated-${content.id}`}
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <Button
                  size="sm"
                  variant={generatedImages[content.id] || (content.generationMetadata as any)?.generatedImageUrl ? "outline" : "default"}
                  className="gap-2"
                  onClick={() => handleGenerateImage(content)}
                  disabled={generatingImageId === content.id}
                  data-testid={`button-generate-image-${content.id}`}
                >
                  {generatingImageId === content.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      {generatedImages[content.id] || (content.generationMetadata as any)?.generatedImageUrl ? "Regenerate" : "Generate Image"}
                    </>
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleImageUpload(content, file);
                    };
                    input.click();
                  }}
                  disabled={uploadingImageId === content.id}
                  data-testid={`button-upload-image-${content.id}`}
                >
                  {uploadingImageId === content.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload My Image
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {(content.generationMetadata as any)?.carouselPrompts && (
          <div className="space-y-3 border-t pt-4 mt-4" data-testid={`carousel-prompts-${content.id}`}>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <LayoutGrid className="w-4 h-4" />
              Carousel Slides ({(content.generationMetadata as any).carouselPrompts.slides?.length || 0} slides)
            </div>
            
            {(content.generationMetadata as any).carouselPrompts.theme && (
              <p className="text-xs text-muted-foreground italic">Theme: {(content.generationMetadata as any).carouselPrompts.theme}</p>
            )}
            
            <div className="space-y-2">
              {(content.generationMetadata as any).carouselPrompts.slides?.map((slide: any, i: number) => (
                <div key={i} className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Slide {i + 1}</p>
                  <p className="text-sm mb-1">{slide.imagePrompt}</p>
                  {slide.textOverlay && (
                    <p className="text-xs bg-white/50 dark:bg-black/20 rounded px-2 py-1 inline-block font-medium">{slide.textOverlay}</p>
                  )}
                </div>
              ))}
            </div>

            <Button
              size="sm"
              className="gap-2 w-full sm:w-auto"
              data-testid={`button-generate-carousel-${content.id}`}
            >
              <LayoutGrid className="w-4 h-4" />
              Generate All Slides
            </Button>
          </div>
        )}

        {(content.generationMetadata as any)?.tiktokTextPost && (
          <div className="space-y-3 border-t pt-4 mt-4" data-testid={`tiktok-text-${content.id}`}>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Type className="w-4 h-4" />
              TikTok Text Post
            </div>
            
            <div className="bg-gray-900 text-white rounded-lg p-6 text-center space-y-3">
              <p className="text-lg font-bold whitespace-pre-wrap">
                {(content.generationMetadata as any).tiktokTextPost.mainText}
              </p>
              {(content.generationMetadata as any).tiktokTextPost.highlightedText && (
                <p className="text-xs text-purple-400">Highlight: {(content.generationMetadata as any).tiktokTextPost.highlightedText}</p>
              )}
              {(content.generationMetadata as any).tiktokTextPost.ctaText && (
                <p className="text-sm bg-white/10 rounded-full px-4 py-2 inline-block">{(content.generationMetadata as any).tiktokTextPost.ctaText}</p>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              Background: {(content.generationMetadata as any).tiktokTextPost.backgroundColor || "dark"}
            </p>
          </div>
        )}

        {showActions && content.status === "pending" && (
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={() => approveMutation.mutate(content.id)}
              disabled={approveMutation.isPending}
              data-testid={`button-approve-${content.id}`}
            >
              {approveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => openRejectDialog(content)}
              disabled={rejectMutation.isPending}
              data-testid={`button-reject-${content.id}`}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </div>
        )}

        {/* Content-type specific actions for approved content */}
        {content.status === "approved" && (() => {
          const metadata = content.generationMetadata as any;
          const contentFormat = metadata?.contentFormat || metadata?.contentType || 
            (metadata?.videoPrompts ? "video" : 
             metadata?.imagePrompts ? "image" : 
             metadata?.carouselPrompts ? "carousel" : 
             metadata?.tiktokTextPost ? "tiktok_text" : "video");
          const isImage = contentFormat === "image" || contentFormat === "carousel";
          const isTikTokText = contentFormat === "tiktok_text";
          
          return (
            <div className="pt-4 space-y-3 border-t mt-4">
              <p className="text-xs font-medium text-muted-foreground">Actions</p>
              
              {/* ALL CONTENT: Go to Edit & Merge */}
              <Link href={`/edit-merge/${content.id}`}>
                <Button className="w-full gap-2" variant="default" data-testid={`button-edit-merge-${content.id}`}>
                  <Scissors className="w-4 h-4" />
                  Go to Edit & Merge
                </Button>
              </Link>
              
              {/* IMAGE/CAROUSEL: Upload or Generate Image */}
              {isImage && (
                <>
                  {/* Image Engine Selector */}
                  <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium">Image Engine:</Label>
                      <Select value={imageEngine} onValueChange={(v: "a2e" | "dalle" | "fal" | "pexels" | "getty") => setImageEngine(v)}>
                        <SelectTrigger className="w-40 h-8 text-xs" data-testid="select-image-engine">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="a2e" disabled={!aiEngines?.a2e?.configured}>
                            A2E {!aiEngines?.a2e?.configured && "(not configured)"}
                          </SelectItem>
                          <SelectItem value="dalle" disabled={!aiEngines?.dalle?.configured}>
                            DALL-E 3 {!aiEngines?.dalle?.configured && "(not configured)"}
                          </SelectItem>
                          <SelectItem value="fal" disabled={!aiEngines?.fal?.configured}>
                            Fal.ai {!aiEngines?.fal?.configured && "(not configured)"}
                          </SelectItem>
                          <SelectItem value="pexels" disabled={!aiEngines?.pexels?.configured}>
                            Pexels {!aiEngines?.pexels?.configured && "(not configured)"}
                          </SelectItem>
                          {aiEngines?.getty && (
                            <SelectItem value="getty" disabled={!aiEngines?.getty?.configured}>
                              Getty {!aiEngines?.getty?.configured && "(not configured)"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {imageEngine === "a2e" 
                        ? "A2E generates high-quality images with general or manga styles." 
                        : imageEngine === "dalle"
                        ? "DALL-E 3 generates high-quality images with excellent text rendering."
                        : imageEngine === "pexels"
                        ? "Pexels searches free stock photos matching your content."
                        : imageEngine === "getty"
                        ? "Getty Images provides premium stock photos (Studio tier only)."
                        : "Fal.ai generates fast AI images with various style options."}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 gap-2"
                      onClick={() => handleGenerateImage(content)}
                      disabled={generatingImageId === content.id}
                      data-testid={`button-generate-image-${content.id}`}
                    >
                      {generatingImageId === content.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          Generate Image
                        </>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleImageUpload(content, file);
                        };
                        input.click();
                      }}
                      disabled={uploadingImageId === content.id}
                      data-testid={`button-upload-image-${content.id}`}
                    >
                      {uploadingImageId === content.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Image
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Show uploaded/generated image preview */}
                  {(generatedImages[content.id] || metadata?.generatedImageUrl || metadata?.uploadedImageUrl) && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Image Preview</p>
                      <img 
                        src={generatedImages[content.id] || metadata?.generatedImageUrl || metadata?.uploadedImageUrl} 
                        alt="Content image" 
                        className="rounded-lg max-h-32 object-contain border"
                        data-testid={`img-preview-${content.id}`}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Go to Edit & Merge above to finalize and move to Ready to Post
                      </p>
                    </div>
                  )}
                </>
              )}
              
              {/* TIKTOK TEXT: Ready immediately */}
              {isTikTokText && (
                <Button
                  className="w-full gap-2"
                  onClick={() => markReadyMutation.mutate(content.id)}
                  disabled={markingReadyId === content.id}
                  data-testid={`button-mark-ready-${content.id}`}
                >
                  {markingReadyId === content.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      Move to Ready to Post
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        })()}

        {content.status === "approved" && content.platforms.length > 0 && (
          <div className="pt-2 space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Post or Schedule to:</p>
            <div className="grid grid-cols-2 gap-2">
              {content.platforms.map((rawPlatform) => {
                const platform = normalizePlatformName(rawPlatform);
                const accounts = (platformAccounts as any)[platform] || [];
                const hasAccount = accounts.length > 0;
                const platformStyles: Record<string, { bg: string; icon: any }> = {
                  YouTube: { bg: "bg-red-600 hover:bg-red-700", icon: Youtube },
                  Twitter: { bg: "bg-black hover:bg-gray-800", icon: null },
                  LinkedIn: { bg: "bg-blue-700 hover:bg-blue-800", icon: null },
                  Facebook: { bg: "bg-blue-600 hover:bg-blue-700", icon: null },
                  Instagram: { bg: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600", icon: null },
                  TikTok: { bg: "bg-black hover:bg-gray-800", icon: null },
                  Threads: { bg: "bg-black hover:bg-gray-800", icon: null },
                  Pinterest: { bg: "bg-red-600 hover:bg-red-700", icon: null },
                  Bluesky: { bg: "bg-sky-400 hover:bg-sky-500", icon: null },
                };
                const style = platformStyles[platform] || { bg: "bg-gray-600 hover:bg-gray-700", icon: null };
                
                if (hasAccount) {
                  return (
                    <Button
                      key={`${rawPlatform}-${content.id}`}
                      className={`${style.bg} text-white text-xs py-1.5`}
                      size="sm"
                      onClick={() => openPublishDialog(content, platform)}
                      data-testid={`button-publish-${platform.toLowerCase()}-${content.id}`}
                    >
                      {platform === "YouTube" && <Youtube className="w-3 h-3 mr-1" />}
                      {rawPlatform}
                    </Button>
                  );
                } else {
                  const connectUrl = platform === "YouTube" ? "/api/youtube/connect"
                    : platform === "Twitter" ? "/api/auth/twitter"
                    : platform === "LinkedIn" ? "/api/auth/linkedin"
                    : platform === "Facebook" || platform === "Instagram" ? "/api/auth/facebook"
                    : platform === "TikTok" ? "/api/auth/tiktok"
                    : platform === "Threads" ? "/api/auth/threads"
                    : platform === "Pinterest" ? "/api/auth/pinterest"
                    : platform === "Bluesky" ? "/accounts" 
                    : "/accounts";
                  return (
                    <Button
                      key={`${rawPlatform}-${content.id}`}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => window.location.href = connectUrl}
                      data-testid={`button-connect-${platform.toLowerCase()}-${content.id}`}
                    >
                      Connect {platform}
                    </Button>
                  );
                }
              })}
            </div>
            
            {/* Download button */}
            {(getVideoUrlFromContent(content) || getImageUrlFromContent(content)) && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  const url = getVideoUrlFromContent(content) || getImageUrlFromContent(content);
                  if (url) {
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `content-${content.id}`;
                    link.click();
                  }
                }}
                data-testid={`button-download-${content.id}`}
              >
                <Download className="w-3 h-3 mr-2" />
                Download
              </Button>
            )}
          </div>
        )}

        {/* Legacy content without format prompts - direct to Edit & Merge */}
        {content.status === "approved" && 
         !(content.generationMetadata as any)?.manuallyReady &&
         !(content.generationMetadata as any)?.imagePrompts &&
         !(content.generationMetadata as any)?.carouselPrompts &&
         !(content.generationMetadata as any)?.tiktokTextPost &&
         !(content.generationMetadata as any)?.scenePrompts &&
         !(content.generationMetadata as any)?.videoPrompts && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">
              This content needs assets. Use Edit & Merge to add images or video clips before posting.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12 text-muted-foreground" data-testid="empty-state">
      <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-30" />
      <p>{message}</p>
    </div>
  );

  return (
    <Layout title="Content Queue">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-6" data-testid="tabs-content-status">
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending Review ({pendingContent.length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Approved ({approvedContent.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rejected ({rejectedContent.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loadingPending ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : pendingContent.length === 0 ? (
            <EmptyState message="No content pending review. Generate new content from Brand Briefs." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingContent.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {loadingApproved ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : approvedContent.length === 0 ? (
            <EmptyState message="No approved content yet." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {approvedContent.map((content) => (
                <ContentCard key={content.id} content={content} showActions={false} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {loadingRejected ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : rejectedContent.length === 0 ? (
            <EmptyState message="No rejected content." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rejectedContent.map((content) => (
                <ContentCard key={content.id} content={content} showActions={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPublishPlatform === "YouTube" && <Youtube className="w-5 h-5 text-red-600" />}
              Post to {selectedPublishPlatform || "Platform"}
            </DialogTitle>
            <DialogDescription>
              {selectedPublishPlatform === "YouTube" 
                ? "Upload your video and publish it to YouTube."
                : `Post your content to ${selectedPublishPlatform || "social media"}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Account selector for platforms with multiple accounts */}
            {(() => {
              const accounts = selectedPublishPlatform ? (platformAccounts as any)[selectedPublishPlatform] || [] : youtubeAccounts;
              if (accounts.length > 1) {
                return (
                  <div className="space-y-2">
                    <Label htmlFor="account-select">{selectedPublishPlatform} Account</Label>
                    <Select
                      value={publishForm.accountId}
                      onValueChange={(value) => setPublishForm(prev => ({ ...prev, accountId: value }))}
                    >
                      <SelectTrigger data-testid="select-account">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account: any) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.accountName || account.accountHandle || `${selectedPublishPlatform} Account`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }
              return null;
            })()}

            <div className="space-y-3">
              <Label>Video Source</Label>
              
              {selectedContent && getVideoUrlFromContent(selectedContent) && (
                <div 
                  className={cn(
                    "border rounded-lg p-3 cursor-pointer transition-colors",
                    useGeneratedVideo ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                  )}
                  onClick={() => {
                    setUseGeneratedVideo(true);
                    setSelectedVideoFile(null);
                  }}
                  data-testid="option-use-generated-video"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      useGeneratedVideo ? "border-primary" : "border-muted-foreground"
                    )}>
                      {useGeneratedVideo && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Use Generated Video</p>
                      <p className="text-xs text-muted-foreground">Ready to publish directly</p>
                    </div>
                    <Video className="w-5 h-5 text-primary" />
                  </div>
                  <video 
                    src={getVideoUrlFromContent(selectedContent)!} 
                    className="mt-2 rounded max-h-24 w-full object-contain bg-black"
                    controls
                  />
                </div>
              )}
              
              <div 
                className={cn(
                  "border rounded-lg p-3 cursor-pointer transition-colors",
                  !useGeneratedVideo ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                )}
                onClick={() => setUseGeneratedVideo(false)}
                data-testid="option-upload-video"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    !useGeneratedVideo ? "border-primary" : "border-muted-foreground"
                  )}>
                    {!useGeneratedVideo && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Upload Custom Video</p>
                    <p className="text-xs text-muted-foreground">Choose a file from your device</p>
                  </div>
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                
                {!useGeneratedVideo && (
                  <div className="mt-2">
                    <Input
                      id="video-file"
                      type="file"
                      accept="video/*"
                      ref={fileInputRef}
                      onChange={(e) => setSelectedVideoFile(e.target.files?.[0] || null)}
                      data-testid="input-video-file"
                    />
                    {selectedVideoFile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Selected: {selectedVideoFile.name} ({(selectedVideoFile.size / (1024 * 1024)).toFixed(1)} MB)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-title">Title</Label>
              <Input
                id="video-title"
                value={publishForm.title}
                onChange={(e) => setPublishForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter video title"
                data-testid="input-video-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-description">Description</Label>
              <Textarea
                id="video-description"
                value={publishForm.description}
                onChange={(e) => setPublishForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter video description"
                rows={4}
                data-testid="input-video-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-tags">Tags (comma-separated)</Label>
              <Input
                id="video-tags"
                value={publishForm.tags}
                onChange={(e) => setPublishForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="tag1, tag2, tag3"
                data-testid="input-video-tags"
              />
            </div>

            {/* Privacy only for YouTube */}
            {selectedPublishPlatform === "YouTube" && (
              <div className="space-y-2">
                <Label htmlFor="privacy-status">Privacy</Label>
                <Select
                  value={publishForm.privacyStatus}
                  onValueChange={(value: "private" | "unlisted" | "public") => 
                    setPublishForm(prev => ({ ...prev, privacyStatus: value }))
                  }
                >
                  <SelectTrigger data-testid="select-privacy-status">
                    <SelectValue placeholder="Select privacy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Scheduling */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="schedule-post"
                  checked={scheduleEnabled}
                  onChange={(e) => setScheduleEnabled(e.target.checked)}
                  className="rounded"
                  data-testid="checkbox-schedule"
                />
                <Label htmlFor="schedule-post" className="font-medium cursor-pointer">
                  Schedule for later
                </Label>
              </div>
              
              {scheduleEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="schedule-date">Date</Label>
                    <Input
                      id="schedule-date"
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      data-testid="input-schedule-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schedule-time">Time</Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      data-testid="input-schedule-time"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPublishDialogOpen(false)}
              disabled={uploadMutation.isPending || socialPostMutation.isPending}
              data-testid="button-cancel-publish"
            >
              Cancel
            </Button>
            <Button
              className={selectedPublishPlatform === "YouTube" ? "bg-red-600 hover:bg-red-700" : ""}
              onClick={handlePublish}
              disabled={
                uploadMutation.isPending || 
                socialPostMutation.isPending || 
                (selectedPublishPlatform === "YouTube" && !useGeneratedVideo && !selectedVideoFile) ||
                (scheduleEnabled && (!scheduleDate || !scheduleTime))
              }
              data-testid="button-confirm-publish"
            >
              {(uploadMutation.isPending || socialPostMutation.isPending) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {scheduleEnabled ? "Scheduling..." : "Posting..."}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {scheduleEnabled ? "Schedule" : "Post Now"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lipSyncDialogOpen} onOpenChange={setLipSyncDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="w-5 h-5 text-purple-600" />
              Create Lip-Sync Video
            </DialogTitle>
            <DialogDescription>
              Upload your avatar video and we'll automatically sync the lips to match your voiceover audio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lipsync-video">Video File (with person speaking)</Label>
              <Input
                id="lipsync-video"
                type="file"
                accept="video/*"
                ref={lipSyncVideoRef}
                onChange={(e) => setLipSyncVideoFile(e.target.files?.[0] || null)}
                data-testid="input-lipsync-video"
              />
              {lipSyncVideoFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {lipSyncVideoFile.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lipsync-audio">Audio File</Label>
              <Input
                id="lipsync-audio"
                type="file"
                accept="audio/*"
                onChange={(e) => setLipSyncAudioFile(e.target.files?.[0] || null)}
                data-testid="input-lipsync-audio"
              />
              {lipSyncAudioFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {lipSyncAudioFile.name}
                </p>
              )}
            </div>

            {lipSyncContent && (generatedAudio[lipSyncContent.id] || (lipSyncContent.generationMetadata as any)?.voiceoverAudioUrl) && (
              <div className="space-y-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="use-generated-audio"
                    checked={!lipSyncAudioFile}
                    onChange={() => {
                      if (lipSyncAudioFile) {
                        setLipSyncAudioFile(null);
                      }
                    }}
                    className="rounded"
                  />
                  <label htmlFor="use-generated-audio" className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    Use generated ElevenLabs voiceover (recommended)
                  </label>
                </div>
                <audio controls className="w-full h-10">
                  <source src={generatedAudio[lipSyncContent.id] || (lipSyncContent.generationMetadata as any)?.voiceoverAudioUrl} type="audio/mpeg" />
                </audio>
              </div>
            )}

            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-800 dark:text-green-200">
                Upload your avatar video and we'll automatically sync it with the audio using Fal.ai lip-sync technology.
              </p>
            </div>

            {lipSyncStatus === "processing" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing lip-sync... This may take a few minutes.
              </div>
            )}

            {lipSyncResult?.videoUrl && (
              <div className="space-y-2">
                <Label>Result Video</Label>
                <video controls className="w-full rounded-lg">
                  <source src={lipSyncResult.videoUrl} type="video/mp4" />
                </video>
                <a
                  href={lipSyncResult.videoUrl}
                  download
                  className="text-sm text-primary underline"
                >
                  Download Video
                </a>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLipSyncDialogOpen(false)}
              data-testid="button-cancel-lipsync"
            >
              {lipSyncResult?.videoUrl ? "Close" : "Cancel"}
            </Button>
            {!lipSyncResult?.videoUrl && (
              <Button
                onClick={async () => {
                  const hasGeneratedAudio = lipSyncContent && (generatedAudio[lipSyncContent.id] || (lipSyncContent.generationMetadata as any)?.voiceoverAudioUrl);
                  if (!lipSyncVideoFile || (!lipSyncAudioFile && !hasGeneratedAudio)) {
                    toast({ title: "Missing files", description: "Please upload a video file and ensure audio is available.", variant: "destructive" });
                    return;
                  }
                  
                  try {
                    setLipSyncStatus("uploading");
                    
                    // Build form data
                    const formData = new FormData();
                    formData.append("video", lipSyncVideoFile);
                    
                    if (lipSyncAudioFile) {
                      formData.append("audio", lipSyncAudioFile);
                    } else if (hasGeneratedAudio) {
                      // Use existing voiceover URL
                      const audioUrl = generatedAudio[lipSyncContent!.id] || (lipSyncContent!.generationMetadata as any)?.voiceoverAudioUrl;
                      formData.append("audioUrl", audioUrl);
                    }
                    
                    // Upload and submit lip-sync job
                    const response = await fetch("/api/fal/lipsync-upload", {
                      method: "POST",
                      body: formData,
                    });
                    
                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || "Failed to start lip-sync");
                    }
                    
                    const data = await response.json();
                    setLipSyncStatus("processing");
                    setLipSyncResult({ requestId: data.requestId });
                    
                    toast({ title: "Processing started", description: "Your lip-sync video is being generated. This may take a few minutes." });
                    
                    // Poll for completion with timeout
                    let pollCount = 0;
                    const maxPolls = 60; // 5 minutes max
                    const pollInterval = setInterval(async () => {
                      pollCount++;
                      if (pollCount > maxPolls) {
                        clearInterval(pollInterval);
                        setLipSyncStatus("idle");
                        toast({ title: "Timeout", description: "Lip-sync is taking longer than expected. Please try again later.", variant: "destructive" });
                        return;
                      }
                      try {
                        const statusRes = await fetch(`/api/fal/status/${data.requestId}`);
                        const statusData = await statusRes.json();
                        
                        if (statusData.status === "completed" && statusData.videoUrl) {
                          clearInterval(pollInterval);
                          setLipSyncStatus("complete");
                          setLipSyncResult({ requestId: data.requestId, videoUrl: statusData.videoUrl });
                          toast({ title: "Lip-sync complete!", description: "Your video is ready for download." });
                        } else if (statusData.status === "failed") {
                          clearInterval(pollInterval);
                          setLipSyncStatus("idle");
                          toast({ title: "Processing failed", description: "Lip-sync processing failed. Please try again.", variant: "destructive" });
                        }
                      } catch (err) {
                        console.error("Status poll error:", err);
                      }
                    }, 5000);
                    
                  } catch (error: any) {
                    console.error("Lip-sync error:", error);
                    setLipSyncStatus("idle");
                    toast({ title: "Error", description: error.message || "Failed to process lip-sync", variant: "destructive" });
                  }
                }}
                disabled={!lipSyncVideoFile || (!lipSyncAudioFile && !(lipSyncContent && (generatedAudio[lipSyncContent.id] || (lipSyncContent.generationMetadata as any)?.voiceoverAudioUrl))) || lipSyncStatus === "processing" || lipSyncStatus === "uploading"}
                className="gap-2 w-full sm:w-auto"
                data-testid="button-start-lipsync"
              >
                {lipSyncStatus === "uploading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : lipSyncStatus === "processing" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4" />
                    Start Lip-Sync
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Content</DialogTitle>
            <DialogDescription>
              Help us improve future content by explaining what was wrong.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">What was wrong with this content?</Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., The tone was too formal, the visuals didn't match the brand..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
                data-testid="input-rejection-reason"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avoid-patterns">Things to avoid in future (comma-separated)</Label>
              <Input
                id="avoid-patterns"
                placeholder="e.g., corporate jargon, stock photos, blue backgrounds"
                value={avoidPatterns}
                onChange={(e) => setAvoidPatterns(e.target.value)}
                data-testid="input-avoid-patterns"
              />
              <p className="text-xs text-muted-foreground">
                These patterns will be used to improve future content generation.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectWithFeedback} data-testid="button-confirm-reject">
              <X className="w-4 h-4 mr-2" />
              Reject & Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editSceneDialogOpen} onOpenChange={setEditSceneDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-indigo-600" />
              Edit Scene {editingScene?.sceneNumber}
            </DialogTitle>
            <DialogDescription>
              Update the scene description and video prompt.
            </DialogDescription>
          </DialogHeader>
          {editingScene && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="scene-description">Scene Description</Label>
                <Textarea
                  id="scene-description"
                  value={editingScene.sceneDescription}
                  onChange={(e) => setEditingScene({ ...editingScene, sceneDescription: e.target.value })}
                  placeholder="Describe what happens in this scene..."
                  className="min-h-[80px]"
                  data-testid="input-scene-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scene-prompt">Video Generation Prompt</Label>
                <Textarea
                  id="scene-prompt"
                  value={editingScene.visualPrompt}
                  onChange={(e) => setEditingScene({ ...editingScene, visualPrompt: e.target.value })}
                  placeholder="Detailed video prompt for AI generation..."
                  className="min-h-[120px]"
                  data-testid="input-scene-prompt"
                />
                <p className="text-xs text-muted-foreground">
                  This prompt will be used by the AI to generate the video for this scene.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditSceneDialogOpen(false); setEditingScene(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveScene} data-testid="button-save-scene">
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editVoiceoverDialogOpen} onOpenChange={setEditVoiceoverDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-blue-600" />
              Edit Voiceover Text
            </DialogTitle>
            <DialogDescription>
              Update the voiceover text and style before generating audio.
            </DialogDescription>
          </DialogHeader>
          {editingVoiceover && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="voiceover-text">Voiceover Text</Label>
                <Textarea
                  id="voiceover-text"
                  value={editingVoiceover.voiceoverText}
                  onChange={(e) => setEditingVoiceover({ ...editingVoiceover, voiceoverText: e.target.value })}
                  placeholder="Enter the text for voiceover..."
                  className="min-h-[150px]"
                  data-testid="input-voiceover-text"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voice-style">Voice Style</Label>
                <Input
                  id="voice-style"
                  value={editingVoiceover.voiceStyle}
                  onChange={(e) => setEditingVoiceover({ ...editingVoiceover, voiceStyle: e.target.value })}
                  placeholder="e.g., Friendly, energetic female voice..."
                  data-testid="input-voice-style"
                />
                <p className="text-xs text-muted-foreground">
                  Describe the voice style for ElevenLabs synthesis.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditVoiceoverDialogOpen(false); setEditingVoiceover(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveVoiceover} data-testid="button-save-voiceover">
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editThumbnailDialogOpen} onOpenChange={setEditThumbnailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-green-600" />
              Edit Thumbnail Prompt
            </DialogTitle>
            <DialogDescription>
              Update the thumbnail image generation prompt.
            </DialogDescription>
          </DialogHeader>
          {editingThumbnail && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="thumbnail-prompt">Thumbnail Prompt</Label>
                <Textarea
                  id="thumbnail-prompt"
                  value={editingThumbnail.thumbnailPrompt}
                  onChange={(e) => setEditingThumbnail({ ...editingThumbnail, thumbnailPrompt: e.target.value })}
                  placeholder="Describe the thumbnail image..."
                  className="min-h-[120px]"
                  data-testid="input-thumbnail-prompt"
                />
                <p className="text-xs text-muted-foreground">
                  This prompt will be used to generate the thumbnail image.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditThumbnailDialogOpen(false); setEditingThumbnail(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveThumbnail} data-testid="button-save-thumbnail">
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editImageDialogOpen} onOpenChange={setEditImageDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              Edit Image Prompts
            </DialogTitle>
            <DialogDescription>
              Update the image generation settings before creating your image.
            </DialogDescription>
          </DialogHeader>
          {editingImage && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="image-prompt">Main Image Prompt</Label>
                <Textarea
                  id="image-prompt"
                  value={editingImage.mainImagePrompt}
                  onChange={(e) => setEditingImage({ ...editingImage, mainImagePrompt: e.target.value })}
                  placeholder="Describe the image you want to generate..."
                  className="min-h-[120px]"
                  data-testid="input-image-prompt"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="text-overlay">Text Overlay</Label>
                <Input
                  id="text-overlay"
                  value={editingImage.textOverlay}
                  onChange={(e) => setEditingImage({ ...editingImage, textOverlay: e.target.value })}
                  placeholder="Text to overlay on the image..."
                  data-testid="input-text-overlay"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color-scheme">Color Scheme</Label>
                  <Input
                    id="color-scheme"
                    value={editingImage.colorScheme}
                    onChange={(e) => setEditingImage({ ...editingImage, colorScheme: e.target.value })}
                    placeholder="e.g., blue and gold"
                    data-testid="input-color-scheme"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="style">Style</Label>
                  <Input
                    id="style"
                    value={editingImage.style}
                    onChange={(e) => setEditingImage({ ...editingImage, style: e.target.value })}
                    placeholder="e.g., minimalist"
                    data-testid="input-style"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditImageDialogOpen(false); setEditingImage(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveImage} data-testid="button-save-image">
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-600" />
              Generate AI Video
            </DialogTitle>
            <DialogDescription>
              Create a video using Fal.ai from the visual description prompt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {videoDialogContent && (
              <div className="space-y-2">
                <Label htmlFor="video-prompt">Video Prompt (editable)</Label>
                <Textarea
                  id="video-prompt"
                  value={editableVideoPrompt}
                  onChange={(e) => setEditableVideoPrompt(e.target.value)}
                  placeholder="Describe the video you want to generate..."
                  className="min-h-[120px]"
                  data-testid="input-video-prompt"
                />
                <p className="text-xs text-muted-foreground">
                  Edit the prompt to customize the video output before generating.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="negative-prompt">What to avoid (optional)</Label>
              <Textarea
                id="negative-prompt"
                placeholder="e.g., blurry, low quality, distorted faces, unnatural movements..."
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="min-h-[80px]"
                data-testid="input-negative-prompt"
              />
              <p className="text-xs text-muted-foreground">
                Describe elements you want the AI to avoid in the generated video.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateVideo} data-testid="button-confirm-generate-video">
              <Video className="w-4 h-4 mr-2" />
              Generate Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={brollDialogOpen} onOpenChange={setBrollDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-amber-600" />
              Find B-Roll Footage
            </DialogTitle>
            <DialogDescription>
              Search Pexels for free stock photos and videos to use as B-Roll in your content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search for footage..."
                value={brollSearchQuery}
                onChange={(e) => setBrollSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && brollSearchQuery.trim()) {
                    handleBrollSearch();
                  }
                }}
                data-testid="input-broll-search"
              />
              <Select value={brollMediaType} onValueChange={(v: "both" | "photos" | "videos") => setBrollMediaType(v)}>
                <SelectTrigger className="w-32" data-testid="select-broll-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both</SelectItem>
                  <SelectItem value="photos">Photos</SelectItem>
                  <SelectItem value="videos">Videos</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleBrollSearch}
                disabled={brollLoading || !brollSearchQuery.trim()}
                data-testid="button-search-broll"
              >
                {brollLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </Button>
            </div>

            {brollResults.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {brollResults.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="relative group rounded-lg overflow-hidden border bg-muted">
                    {item.type === "photo" ? (
                      <img
                        src={item.previewUrl}
                        alt={item.attribution}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="relative">
                        <img
                          src={item.previewUrl}
                          alt={item.attribution}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                        {item.duration && (
                          <span className="absolute bottom-1 right-1 text-xs bg-black/70 text-white px-1 rounded">
                            {item.duration}s
                          </span>
                        )}
                      </div>
                    )}
                    <div className="p-2 space-y-1">
                      <Badge variant={item.type === "photo" ? "secondary" : "default"} className="text-xs">
                        {item.type === "photo" ? "Photo" : "Video"}
                      </Badge>
                      <p className="text-xs text-muted-foreground truncate">{item.attribution}</p>
                      <a
                        href={item.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {brollResults.length === 0 && !brollLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <Clapperboard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Search for stock footage to find B-Roll for your videos</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBrollDialogOpen(false)}>
              Close
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

  async function handleBrollSearch() {
    if (!brollSearchQuery.trim()) return;
    
    setBrollLoading(true);
    try {
      const params = new URLSearchParams({
        query: brollSearchQuery,
        type: brollMediaType,
        perPage: "12",
      });
      const res = await fetch(`/api/pexels/search?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to search Pexels");
      }
      const data = await res.json();
      setBrollResults(data);
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBrollLoading(false);
    }
  }
}
