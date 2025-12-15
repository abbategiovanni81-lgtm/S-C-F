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
import { Check, X, RefreshCw, FileText, Video, Hash, Loader2, Upload, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { GeneratedContent, SocialAccount } from "@shared/schema";

export default function ContentQueue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    </Layout>
  );
}
