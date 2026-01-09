import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Download, CheckCircle, Video, Mic, ExternalLink, Loader2, Instagram, Youtube, Upload, Calendar, Clock, Image as ImageIcon, LayoutGrid, Archive, Trash2 } from "lucide-react";
import { format, addMinutes, addDays, isAfter, isBefore } from "date-fns";
import type { GeneratedContent, BrandBrief, SocialAccount } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const DEMO_USER_ID = "demo-user";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  youtube: Youtube,
  tiktok: TikTokIcon,
};

export default function ReadyToPost() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterBrief, setFilterBrief] = useState<string>("all");
  
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [useGeneratedVideo, setUseGeneratedVideo] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("12:00");
  const [publishForm, setPublishForm] = useState({
    title: "",
    description: "",
    tags: "",
    affiliateLink: "",
    privacyStatus: "private" as "private" | "unlisted" | "public",
    accountId: "",
  });

  const { data: briefs = [] } = useQuery<BrandBrief[]>({
    queryKey: [`/api/brand-briefs?userId=${DEMO_USER_ID}`],
  });

  const { data: approvedContent = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=approved"],
  });

  const { data: readyStatusContent = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=ready"],
  });

  const { data: postedContentRaw = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=posted"],
  });

  const { data: socialAccounts = [] } = useQuery<SocialAccount[]>({
    queryKey: [`/api/social-accounts?userId=${DEMO_USER_ID}`],
  });

  const youtubeAccounts = useMemo(() => 
    socialAccounts.filter(acc => acc.platform === "YouTube" && acc.isConnected === "connected"),
    [socialAccounts]
  );

  const hasYouTubeAccounts = youtubeAccounts.length > 0;

  const inferContentType = (content: GeneratedContent): string => {
    const metadata = content.generationMetadata as any;
    // Explicit contentType takes priority
    if (metadata?.contentType) return metadata.contentType;
    // Infer from metadata structure for older content
    if (metadata?.imagePrompt) return "image";
    if (metadata?.tiktokTextContent) return "tiktok_text";
    if (metadata?.videoPrompts || metadata?.scenePrompts) return "video";
    // Default to video for legacy content
    return "video";
  };

  const isReadyToPost = (content: GeneratedContent) => {
    const metadata = content.generationMetadata as any;
    const contentType = inferContentType(content);
    
    // Manually marked as ready (for legacy content)
    if (metadata?.manuallyReady) {
      return true;
    }
    
    // TikTok text posts are ready immediately upon approval
    if (contentType === "tiktok_text") {
      return true;
    }
    
    // Image content needs a generated or uploaded image
    if (contentType === "image") {
      return metadata?.generatedImageUrl || metadata?.uploadedImageUrl;
    }
    
    // Carousel needs carousel images or single image
    if (contentType === "carousel") {
      return (metadata?.generatedCarouselImages?.length > 0) || metadata?.generatedImageUrl || metadata?.uploadedImageUrl;
    }
    
    // Video content needs video or voiceover assets
    return (
      metadata?.mergedVideoUrl ||
      metadata?.generatedVideoUrl || 
      metadata?.voiceoverAudioUrl || 
      content.videoUrl
    );
  };

  const getVideoUrl = (content: GeneratedContent): string | null => {
    const metadata = content.generationMetadata as any;
    return metadata?.mergedVideoUrl || metadata?.generatedVideoUrl || content.videoUrl || null;
  };

  const getContentType = (content: GeneratedContent): string => {
    return inferContentType(content);
  };

  const readyContent = useMemo(() => {
    const approvedReady = approvedContent.filter((content) => {
      const matchesBrief = filterBrief === "all" || content.briefId === filterBrief;
      return isReadyToPost(content) && matchesBrief;
    });
    const statusReady = readyStatusContent.filter((content) => {
      const matchesBrief = filterBrief === "all" || content.briefId === filterBrief;
      return matchesBrief;
    });
    const combined = [...approvedReady, ...statusReady];
    const uniqueIds = new Set<string>();
    return combined.filter(c => {
      if (uniqueIds.has(c.id)) return false;
      uniqueIds.add(c.id);
      return true;
    });
  }, [approvedContent, readyStatusContent, filterBrief]);

  const postedContent = postedContentRaw.filter((content) => {
    const matchesBrief = filterBrief === "all" || content.briefId === filterBrief;
    return matchesBrief;
  });

  const invalidateContentQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=approved"] });
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=ready"] });
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=posted"] });
  };

  const markAsPostedMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const res = await fetch(`/api/content/${contentId}/posted`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark as posted");
      return res.json();
    },
    onSuccess: () => {
      invalidateContentQueries();
      toast({ title: "Marked as posted", description: "Content has been marked as posted." });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/youtube/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Video uploaded to YouTube!", 
        description: `Video ID: ${data.videoId}` 
      });
      setPublishDialogOpen(false);
      setSelectedVideoFile(null);
      if (selectedContent) {
        markAsPostedMutation.mutate(selectedContent.id);
      }
    },
    onError: (error: Error) => {
      toast({ 
        title: "Upload failed", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const res = await fetch(`/api/content/${contentId}/archive`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to archive content");
      return res.json();
    },
    onSuccess: () => {
      invalidateContentQueries();
      queryClient.invalidateQueries({ queryKey: ["/api/content/archived"] });
      toast({ title: "Content archived", description: "Content has been moved to archive." });
    },
    onError: (error: Error) => {
      toast({ title: "Archive failed", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const res = await fetch(`/api/content/${contentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete content");
      return res.json();
    },
    onSuccess: () => {
      invalidateContentQueries();
      toast({ title: "Content deleted", description: "Content has been permanently deleted." });
    },
    onError: (error: Error) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });

  const getBriefName = (briefId: string) => {
    const brief = briefs.find((b) => b.id === briefId);
    return brief?.name || "Unknown Brand";
  };

  const openPublishDialog = (content: GeneratedContent) => {
    setSelectedContent(content);
    const videoUrl = getVideoUrl(content);
    setPublishForm({
      title: content.script?.substring(0, 100) || "Video Title",
      description: content.caption || "",
      tags: content.hashtags?.join(", ") || "",
      affiliateLink: (content.generationMetadata as any)?.affiliateLink || "",
      privacyStatus: "private",
      accountId: youtubeAccounts.length > 0 ? youtubeAccounts[0].id : "",
    });
    setSelectedVideoFile(null);
    setUseGeneratedVideo(!!videoUrl);
    setScheduleEnabled(false);
    const tomorrow = addDays(new Date(), 1);
    setScheduleDate(format(tomorrow, 'yyyy-MM-dd'));
    setScheduleTime("12:00");
    setPublishDialogOpen(true);
  };

  const getScheduledDateTime = (): Date | null => {
    if (!scheduleEnabled || !scheduleDate || !scheduleTime) return null;
    const [hours, minutes] = scheduleTime.split(":").map(Number);
    const date = new Date(scheduleDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const isScheduleValid = (): boolean => {
    const scheduledAt = getScheduledDateTime();
    if (!scheduledAt) return true; // No schedule = instant publish
    const minTime = addMinutes(new Date(), 15);
    const maxTime = addDays(new Date(), 30);
    return isAfter(scheduledAt, minTime) && isBefore(scheduledAt, maxTime);
  };

  const createScheduledPostMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/scheduled-posts", data);
      return res.json();
    },
  });

  const handlePublish = async () => {
    if (!selectedContent) return;
    
    const videoUrl = getVideoUrl(selectedContent);
    
    if (!selectedVideoFile && !useGeneratedVideo) {
      toast({
        title: "No Video Selected",
        description: "Please select a video source",
        variant: "destructive",
      });
      return;
    }

    if (scheduleEnabled && !isScheduleValid()) {
      toast({
        title: "Invalid Schedule Time",
        description: "Schedule must be between 15 minutes and 30 days from now",
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
    const descriptionWithLink = publishForm.affiliateLink 
      ? `${publishForm.description}\n\n${publishForm.affiliateLink}`
      : publishForm.description;
    formData.append("description", descriptionWithLink);
    formData.append("tags", publishForm.tags);
    formData.append("accountId", publishForm.accountId || youtubeAccounts[0]?.id || "");

    if (scheduleEnabled) {
      const scheduledAt = getScheduledDateTime();
      formData.append("privacyStatus", "private");
      if (scheduledAt) {
        formData.append("publishAt", scheduledAt.toISOString());
      }
    } else {
      formData.append("privacyStatus", publishForm.privacyStatus);
    }

    uploadMutation.mutate(formData);
  };

  const ContentCard = ({ content, showMarkAsPosted = true }: { content: GeneratedContent; showMarkAsPosted?: boolean }) => {
    const metadata = content.generationMetadata as any;
    const videoUrl = getVideoUrl(content);
    const audioUrl = metadata?.voiceoverAudioUrl;
    const imageUrl = metadata?.generatedImageUrl || metadata?.uploadedImageUrl;
    const carouselImages = metadata?.generatedCarouselImages || [];
    const hasVideo = !!videoUrl;
    const hasImage = !!imageUrl;
    const hasCarouselImages = carouselImages.length > 0;
    const isMergedVideo = !!metadata?.mergedVideoUrl;

    return (
      <Card className="overflow-hidden" data-testid={`card-ready-${content.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{getBriefName(content.briefId)}</Badge>
              <div className="flex gap-1">
                {content.platforms?.map((platform) => {
                  const Icon = platformIcons[platform.toLowerCase()] || ExternalLink;
                  return (
                    <Badge key={platform} variant="secondary" className="gap-1 text-xs">
                      <Icon className="w-3 h-3" />
                      {platform}
                    </Badge>
                  );
                })}
              </div>
            </div>
            {content.status === "posted" && (
              <Badge className="bg-green-500">Posted</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.caption && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Caption</p>
              <p className="text-sm bg-muted/50 rounded-lg p-3">{content.caption}</p>
            </div>
          )}

          {content.hashtags && content.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {content.hashtags.map((tag, i) => (
                <span key={i} className="text-xs text-primary">#{tag}</span>
              ))}
            </div>
          )}

          {/* Single/Multiple Image Display - show both generated and uploaded */}
          {!hasCarouselImages && (() => {
            const genImg = metadata?.generatedImageUrl;
            const uploadImg = metadata?.uploadedImageUrl;
            const images = [
              genImg && { url: genImg, label: "AI Generated", type: "generated" },
              uploadImg && { url: uploadImg, label: "Uploaded", type: "uploaded" }
            ].filter(Boolean) as { url: string; label: string; type: string }[];
            
            if (images.length === 0) return null;
            
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                  Your Images ({images.length})
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img 
                        src={img.url} 
                        alt={img.label} 
                        className="w-full rounded-lg border"
                        data-testid={`image-preview-${content.id}-${img.type}`}
                      />
                      <span className={`absolute top-1 left-1 text-white text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        img.type === "generated" ? "bg-purple-600" : "bg-blue-600"
                      }`}>
                        {img.label}
                      </span>
                      <a
                        href={img.url}
                        download={`${img.type}-image-${content.id}.png`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-1 right-1 bg-black/60 hover:bg-black/80 text-white p-1 rounded"
                        data-testid={`link-download-${img.type}-${content.id}`}
                      >
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Carousel Images Display */}
          {hasCarouselImages && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <LayoutGrid className="w-4 h-4 text-purple-500" />
                  Carousel Images ({carouselImages.length} slides)
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    carouselImages.forEach((slide: any, i: number) => {
                      const link = document.createElement('a');
                      link.href = slide.imageUrl;
                      link.download = `slide-${slide.slideIndex + 1}.png`;
                      link.target = '_blank';
                      setTimeout(() => link.click(), i * 300);
                    });
                  }}
                  data-testid={`button-download-all-slides-${content.id}`}
                >
                  <Download className="w-4 h-4" />
                  Download All Slides
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {carouselImages.sort((a: any, b: any) => a.slideIndex - b.slideIndex).map((slide: any, i: number) => (
                  <div key={i} className="relative group">
                    <img 
                      src={slide.imageUrl} 
                      alt={`Slide ${slide.slideIndex + 1}`} 
                      className="w-full aspect-square object-cover rounded-lg border"
                    />
                    <span className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                      {slide.slideIndex + 1}
                    </span>
                    <a
                      href={slide.imageUrl}
                      download={`slide-${slide.slideIndex + 1}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Thumbnail */}
          {(() => {
            const thumbnailUrl = metadata?.generatedThumbnailUrl || metadata?.uploadedThumbnailUrl || content.thumbnailUrl;
            if (!thumbnailUrl || !videoUrl) return null;
            
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ImageIcon className="w-4 h-4 text-orange-500" />
                  Video Thumbnail
                </div>
                <div className="relative w-48">
                  <img 
                    src={thumbnailUrl} 
                    alt="Video Thumbnail" 
                    className="w-full rounded-lg border aspect-video object-cover"
                    data-testid={`thumbnail-preview-${content.id}`}
                  />
                  <a
                    href={thumbnailUrl}
                    download={`thumbnail-${content.id}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-1 right-1 bg-black/60 hover:bg-black/80 text-white p-1 rounded"
                    data-testid={`link-download-thumbnail-${content.id}`}
                  >
                    <Download className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })()}

          <div className="grid gap-4 md:grid-cols-2">
            {videoUrl && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Video className="w-4 h-4 text-purple-500" />
                  {isMergedVideo ? "Merged Video (with Voiceover)" : "Generated Video"}
                  {isMergedVideo && <Badge variant="secondary" className="text-xs">Ready to Upload</Badge>}
                </div>
                <video 
                  controls 
                  className="w-full rounded-lg aspect-video bg-black"
                  data-testid={`video-preview-${content.id}`}
                >
                  <source src={videoUrl} type="video/mp4" />
                </video>
                <a
                  href={videoUrl}
                  download={`video-${content.id}.mp4`}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  data-testid={`link-download-video-${content.id}`}
                >
                  <Download className="w-4 h-4" />
                  Download Video (MP4)
                </a>
              </div>
            )}

            {audioUrl && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Mic className="w-4 h-4 text-blue-500" />
                  Voiceover Audio
                </div>
                <audio 
                  controls 
                  className="w-full"
                  data-testid={`audio-preview-${content.id}`}
                >
                  <source src={audioUrl} type="audio/mpeg" />
                </audio>
                <a
                  href={audioUrl}
                  download={`voiceover-${content.id}.mp3`}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  data-testid={`link-download-audio-${content.id}`}
                >
                  <Download className="w-4 h-4" />
                  Download Audio (MP3)
                </a>
              </div>
            )}
          </div>

          {showMarkAsPosted && content.status !== "posted" && (
            <div className="pt-2 border-t space-y-2">
              {hasVideo && (
                <div>
                  {hasYouTubeAccounts ? (
                    <Button
                      onClick={() => openPublishDialog(content)}
                      className="w-full gap-2 bg-red-600 hover:bg-red-700"
                      data-testid={`button-youtube-publish-${content.id}`}
                    >
                      <Youtube className="w-4 h-4" />
                      Publish to YouTube
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = "/api/youtube/connect"}
                      className="w-full gap-2"
                      data-testid={`button-connect-youtube-${content.id}`}
                    >
                      <Youtube className="w-4 h-4" />
                      Connect YouTube to Publish
                    </Button>
                  )}
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => markAsPostedMutation.mutate(content.id)}
                disabled={markAsPostedMutation.isPending}
                className="w-full gap-2"
                data-testid={`button-mark-posted-${content.id}`}
              >
                {markAsPostedMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Mark as Posted (Manual Upload)
              </Button>
            </div>
          )}

          {/* Archive and Delete buttons */}
          <div className="flex gap-2 mt-3 pt-3 border-t">
            {content.status === "posted" && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => archiveMutation.mutate(content.id)}
                disabled={archiveMutation.isPending}
                data-testid={`button-archive-${content.id}`}
              >
                {archiveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
                Archive
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={`${content.status === "posted" ? "flex-1" : "w-full"} gap-2 text-destructive hover:text-destructive`}
              onClick={() => {
                if (confirm("Are you sure you want to delete this content? This cannot be undone.")) {
                  deleteMutation.mutate(content.id);
                }
              }}
              disabled={deleteMutation.isPending}
              data-testid={`button-delete-${content.id}`}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display" data-testid="text-page-title">Ready to Post</h1>
            <p className="text-muted-foreground mt-1">
              Review and download your approved content with generated videos and voiceovers
            </p>
          </div>

          <Select value={filterBrief} onValueChange={setFilterBrief}>
            <SelectTrigger className="w-48" data-testid="select-filter-brief">
              <SelectValue placeholder="Filter by brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {briefs.map((brief) => (
                <SelectItem key={brief.id} value={brief.id}>
                  {brief.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {readyContent.length === 0 && postedContent.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No content ready to post</h3>
              <p className="text-muted-foreground">
                Generate videos or voiceovers for your approved content in the Content Queue first.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {readyContent.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  Ready to Download ({readyContent.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {readyContent.map((content) => (
                    <ContentCard key={content.id} content={content} />
                  ))}
                </div>
              </div>
            )}

            {postedContent.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Already Posted ({postedContent.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {postedContent.map((content) => (
                    <ContentCard key={content.id} content={content} showMarkAsPosted={false} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-600" />
              Publish to YouTube
            </DialogTitle>
            <DialogDescription>
              Upload your video and publish it directly to YouTube.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {youtubeAccounts.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="youtube-channel">YouTube Channel</Label>
                <Select
                  value={publishForm.accountId}
                  onValueChange={(value) => setPublishForm(prev => ({ ...prev, accountId: value }))}
                >
                  <SelectTrigger data-testid="select-youtube-channel">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {youtubeAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountName || account.accountHandle || "YouTube Channel"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              <Label>Video Source</Label>
              
              {selectedContent && getVideoUrl(selectedContent) && (
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    useGeneratedVideo ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                  }`}
                  onClick={() => {
                    setUseGeneratedVideo(true);
                    setSelectedVideoFile(null);
                  }}
                  data-testid="option-use-generated-video"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      useGeneratedVideo ? "border-primary" : "border-muted-foreground"
                    }`}>
                      {useGeneratedVideo && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Use Generated Video</p>
                      <p className="text-xs text-muted-foreground">Ready to publish directly</p>
                    </div>
                    <Video className="w-5 h-5 text-primary" />
                  </div>
                  <video 
                    src={getVideoUrl(selectedContent)!} 
                    className="mt-2 rounded max-h-24 w-full object-contain bg-black"
                    controls
                  />
                </div>
              )}
              
              <div 
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  !useGeneratedVideo ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                }`}
                onClick={() => setUseGeneratedVideo(false)}
                data-testid="option-upload-video"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    !useGeneratedVideo ? "border-primary" : "border-muted-foreground"
                  }`}>
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

            <div className="space-y-2">
              <Label htmlFor="affiliate-link">Affiliate Link</Label>
              <Input
                id="affiliate-link"
                value={publishForm.affiliateLink}
                onChange={(e) => setPublishForm(prev => ({ ...prev, affiliateLink: e.target.value }))}
                placeholder="https://your-affiliate-link.com"
                data-testid="input-affiliate-link"
              />
              <p className="text-xs text-muted-foreground">
                This link will be added to your video description
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <div>
                    <Label htmlFor="schedule-toggle" className="text-sm font-medium">Schedule for Later</Label>
                    <p className="text-xs text-muted-foreground">YouTube will auto-publish at your scheduled time</p>
                  </div>
                </div>
                <Switch
                  id="schedule-toggle"
                  checked={scheduleEnabled}
                  onCheckedChange={setScheduleEnabled}
                  data-testid="switch-schedule-enabled"
                />
              </div>

              {scheduleEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="schedule-date">Date</Label>
                    <Input
                      id="schedule-date"
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      max={format(addDays(new Date(), 30), 'yyyy-MM-dd')}
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
                  <div className="col-span-2 text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Your timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </div>
                  {!isScheduleValid() && (
                    <div className="col-span-2 text-xs text-red-500">
                      Schedule must be 15 minutes to 30 days in the future
                    </div>
                  )}
                </div>
              )}
            </div>

            {!scheduleEnabled && (
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPublishDialogOpen(false)}
              disabled={uploadMutation.isPending}
              data-testid="button-cancel-publish"
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handlePublish}
              disabled={uploadMutation.isPending || (!useGeneratedVideo && !selectedVideoFile) || (scheduleEnabled && !isScheduleValid())}
              data-testid="button-confirm-publish"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {scheduleEnabled ? "Scheduling..." : "Uploading..."}
                </>
              ) : scheduleEnabled ? (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Upload
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Publish to YouTube
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
