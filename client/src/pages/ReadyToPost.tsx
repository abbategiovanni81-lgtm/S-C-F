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
import { useToast } from "@/hooks/use-toast";
import { Download, CheckCircle, Video, Mic, ExternalLink, Loader2, Instagram, Youtube, Upload } from "lucide-react";
import type { GeneratedContent, BrandBrief, SocialAccount } from "@shared/schema";

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
  const [publishForm, setPublishForm] = useState({
    title: "",
    description: "",
    tags: "",
    privacyStatus: "private" as "private" | "unlisted" | "public",
    accountId: "",
  });

  const { data: briefs = [] } = useQuery<BrandBrief[]>({
    queryKey: [`/api/brand-briefs?userId=${DEMO_USER_ID}`],
  });

  const { data: approvedContent = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=approved"],
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

  const isReadyToPost = (content: GeneratedContent) => {
    const metadata = content.generationMetadata as any;
    const contentType = metadata?.contentType || "video";
    
    // Image and TikTok text posts are ready immediately upon approval
    if (contentType === "image" || contentType === "tiktok_text") {
      return true;
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
    const metadata = content.generationMetadata as any;
    return metadata?.contentType || "video";
  };

  const readyContent = approvedContent.filter((content) => {
    const matchesBrief = filterBrief === "all" || content.briefId === filterBrief;
    return isReadyToPost(content) && matchesBrief;
  });

  const postedContent = postedContentRaw.filter((content) => {
    const matchesBrief = filterBrief === "all" || content.briefId === filterBrief;
    return matchesBrief;
  });

  const invalidateContentQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=approved"] });
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

  const getBriefName = (briefId: string) => {
    const brief = briefs.find((b) => b.id === briefId);
    return brief?.name || "Unknown Brand";
  };

  const openPublishDialog = (content: GeneratedContent) => {
    setSelectedContent(content);
    const metadata = content.generationMetadata as any;
    setPublishForm({
      title: content.script?.substring(0, 100) || "Video Title",
      description: content.caption || "",
      tags: content.hashtags?.join(", ") || "",
      privacyStatus: "private",
      accountId: youtubeAccounts.length > 0 ? youtubeAccounts[0].id : "",
    });
    setSelectedVideoFile(null);
    setPublishDialogOpen(true);
  };

  const handlePublish = async () => {
    if (!selectedContent || !selectedVideoFile) return;

    const formData = new FormData();
    formData.append("video", selectedVideoFile);
    formData.append("title", publishForm.title);
    formData.append("description", publishForm.description);
    formData.append("tags", publishForm.tags);
    formData.append("privacyStatus", publishForm.privacyStatus);
    formData.append("accountId", publishForm.accountId || youtubeAccounts[0]?.id || "");

    uploadMutation.mutate(formData);
  };

  const ContentCard = ({ content, showMarkAsPosted = true }: { content: GeneratedContent; showMarkAsPosted?: boolean }) => {
    const metadata = content.generationMetadata as any;
    const videoUrl = getVideoUrl(content);
    const audioUrl = metadata?.voiceoverAudioUrl;
    const hasVideo = !!videoUrl;
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
                      onClick={() => window.location.href = "/api/auth/google"}
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
        <DialogContent className="max-w-lg">
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

            <div className="space-y-2">
              <Label htmlFor="video-file">Video File</Label>
              <p className="text-xs text-muted-foreground">
                Download your generated video first, then select it here to upload.
              </p>
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                ref={fileInputRef}
                onChange={(e) => setSelectedVideoFile(e.target.files?.[0] || null)}
                data-testid="input-video-file"
              />
              {selectedVideoFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedVideoFile.name} ({(selectedVideoFile.size / (1024 * 1024)).toFixed(1)} MB)
                </p>
              )}
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
              disabled={uploadMutation.isPending || !selectedVideoFile}
              data-testid="button-confirm-publish"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
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
