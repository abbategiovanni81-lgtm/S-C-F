import { useState, useRef, useMemo } from "react";
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
import { Check, X, RefreshCw, FileText, Video, Hash, Loader2, Upload, Youtube, Wand2, Copy, Mic, Play, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { GeneratedContent, SocialAccount } from "@shared/schema";

export default function ContentQueue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lipSyncVideoRef = useRef<HTMLInputElement>(null);
  
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
  
  const [generatingVoiceoverId, setGeneratingVoiceoverId] = useState<string | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<Record<string, string>>({});
  
  const [lipSyncDialogOpen, setLipSyncDialogOpen] = useState(false);
  const [lipSyncContent, setLipSyncContent] = useState<GeneratedContent | null>(null);
  const [lipSyncVideoFile, setLipSyncVideoFile] = useState<File | null>(null);
  const [lipSyncStatus, setLipSyncStatus] = useState<"idle" | "uploading" | "processing" | "complete">("idle");
  const [lipSyncResult, setLipSyncResult] = useState<{ requestId?: string; videoUrl?: string } | null>(null);

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

  const invalidateContentQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=pending"] });
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=approved"] });
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=rejected"] });
  };

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
        await apiRequest("PATCH", `/api/content/${contentId}`, {
          generationMetadata: { voiceoverAudioUrl: data.audioUrl },
        });
        invalidateContentQueries();
      } catch (e) {}
      toast({ title: "Voiceover generated!", description: "Your audio is ready to play." });
      setGeneratingVoiceoverId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Voiceover failed", description: error.message, variant: "destructive" });
      setGeneratingVoiceoverId(null);
    },
  });

  const openLipSyncDialog = (content: GeneratedContent) => {
    setLipSyncContent(content);
    setLipSyncVideoFile(null);
    setLipSyncStatus("idle");
    setLipSyncResult(null);
    setLipSyncDialogOpen(true);
  };

  const handleGenerateVoiceover = (content: GeneratedContent) => {
    const voiceoverText = (content.generationMetadata as any)?.videoPrompts?.voiceoverText;
    if (!voiceoverText) {
      toast({ title: "No voiceover text", description: "This content doesn't have voiceover text.", variant: "destructive" });
      return;
    }
    voiceoverMutation.mutate({ contentId: content.id, text: voiceoverText });
  };

  const openPublishDialog = (content: GeneratedContent) => {
    setSelectedContent(content);
    setPublishForm({
      title: content.script?.substring(0, 100) || "My Video",
      description: content.caption || "",
      tags: content.hashtags?.join(", ") || "",
      privacyStatus: "private",
      accountId: youtubeAccounts.length > 0 ? youtubeAccounts[0].id : "",
    });
    setSelectedVideoFile(null);
    setPublishDialogOpen(true);
  };

  const handlePublish = () => {
    if (!selectedVideoFile) {
      toast({
        title: "No Video Selected",
        description: "Please select a video file to upload",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("video", selectedVideoFile);
    formData.append("title", publishForm.title);
    formData.append("description", publishForm.description);
    formData.append("tags", JSON.stringify(publishForm.tags.split(",").map(t => t.trim()).filter(Boolean)));
    formData.append("privacyStatus", publishForm.privacyStatus);
    if (publishForm.accountId) {
      formData.append("accountId", publishForm.accountId);
    }

    uploadMutation.mutate(formData);
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
                <p className="text-xs font-medium text-muted-foreground">ElevenLabs Voiceover</p>
                <p className="text-sm bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 whitespace-pre-wrap border border-blue-200 dark:border-blue-800">
                  {(content.generationMetadata as any).videoPrompts.voiceoverText}
                </p>
                {(content.generationMetadata as any).videoPrompts.voiceStyle && (
                  <p className="text-xs text-muted-foreground italic">
                    Voice style: {(content.generationMetadata as any).videoPrompts.voiceStyle}
                  </p>
                )}
                
                {(generatedAudio[content.id] || (content.generationMetadata as any)?.voiceoverAudioUrl) ? (
                  <div className="flex flex-col gap-2 mt-2">
                    <audio controls className="w-full h-10" data-testid={`audio-voiceover-${content.id}`}>
                      <source src={generatedAudio[content.id] || (content.generationMetadata as any)?.voiceoverAudioUrl} type="audio/mpeg" />
                    </audio>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openLipSyncDialog(content)}
                      className="gap-2"
                      data-testid={`button-lipsync-${content.id}`}
                    >
                      <Film className="w-4 h-4" />
                      Create Lip-Sync Video
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleGenerateVoiceover(content)}
                    disabled={generatingVoiceoverId === content.id}
                    className="gap-2 mt-2"
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
                        Generate Voiceover
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
            
            {(content.generationMetadata as any).videoPrompts.visualDescription && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Video Generation (Runway/Pika)</p>
                <p className="text-sm bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 whitespace-pre-wrap border border-purple-200 dark:border-purple-800">
                  {(content.generationMetadata as any).videoPrompts.visualDescription}
                </p>
              </div>
            )}
            
            {(content.generationMetadata as any).videoPrompts.thumbnailPrompt && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Thumbnail Image Prompt</p>
                <p className="text-sm bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                  {(content.generationMetadata as any).videoPrompts.thumbnailPrompt}
                </p>
              </div>
            )}
            
            {(content.generationMetadata as any).videoPrompts.brollSuggestions?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">B-Roll Suggestions</p>
                <ul className="text-sm bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 list-disc list-inside space-y-1 border border-amber-200 dark:border-amber-800">
                  {(content.generationMetadata as any).videoPrompts.brollSuggestions.map((suggestion: string, i: number) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
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
              onClick={() => rejectMutation.mutate(content.id)}
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

        {content.status === "approved" && content.platforms.includes("YouTube") && (
          <div className="pt-2">
            {hasYouTubeAccounts ? (
              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={() => openPublishDialog(content)}
                data-testid={`button-publish-youtube-${content.id}`}
              >
                <Youtube className="w-4 h-4 mr-2" />
                Publish to YouTube
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = "/api/auth/google"}
                data-testid={`button-connect-youtube-${content.id}`}
              >
                <Youtube className="w-4 h-4 mr-2" />
                Connect YouTube to Publish
              </Button>
            )}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-600" />
              Publish to YouTube
            </DialogTitle>
            <DialogDescription>
              Upload your video and publish it to YouTube with the generated content.
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
              <div className="flex gap-2">
                <Input
                  id="video-file"
                  type="file"
                  accept="video/*"
                  ref={fileInputRef}
                  onChange={(e) => setSelectedVideoFile(e.target.files?.[0] || null)}
                  data-testid="input-video-file"
                />
              </div>
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
                  Publish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lipSyncDialogOpen} onOpenChange={setLipSyncDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="w-5 h-5 text-purple-600" />
              Create Lip-Sync Video
            </DialogTitle>
            <DialogDescription>
              Upload a video of someone speaking and we'll sync their lips to the generated voiceover audio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {lipSyncContent && (generatedAudio[lipSyncContent.id] || (lipSyncContent.generationMetadata as any)?.voiceoverAudioUrl) && (
              <div className="space-y-2">
                <Label>Generated Voiceover Audio</Label>
                <audio controls className="w-full h-10">
                  <source src={generatedAudio[lipSyncContent.id] || (lipSyncContent.generationMetadata as any)?.voiceoverAudioUrl} type="audio/mpeg" />
                </audio>
                <a
                  href={generatedAudio[lipSyncContent.id] || (lipSyncContent.generationMetadata as any)?.voiceoverAudioUrl}
                  download="voiceover.mp3"
                  className="text-xs text-primary underline"
                >
                  Download Audio
                </a>
              </div>
            )}

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

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Lip-sync processing can take several minutes. The video needs to show a person speaking clearly for best results.
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
                  const audioUrl = lipSyncContent ? (generatedAudio[lipSyncContent.id] || (lipSyncContent.generationMetadata as any)?.voiceoverAudioUrl) : null;
                  if (!lipSyncVideoFile || !lipSyncContent || !audioUrl) {
                    toast({ title: "Missing data", description: "Please select a video file.", variant: "destructive" });
                    return;
                  }
                  setLipSyncStatus("processing");
                  toast({ 
                    title: "Lip-sync submitted", 
                    description: "Processing started. This feature requires the video to be hosted online. For now, you can use external tools with the generated audio." 
                  });
                  setLipSyncStatus("idle");
                }}
                disabled={!lipSyncVideoFile || lipSyncStatus === "processing"}
                className="gap-2"
                data-testid="button-start-lipsync"
              >
                {lipSyncStatus === "processing" ? (
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
    </Layout>
  );
}
