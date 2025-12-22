import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, MessageSquare, TrendingUp, Plus, Send, RefreshCw, ExternalLink, ThumbsUp, ThumbsDown, Copy, Sparkles, Flame, Radar, AlertCircle } from "lucide-react";
import type { ListeningHit, ReplyDraft, TrendingTopic, BrandBrief } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { UpgradePrompt } from "@/components/UpgradePrompt";

interface ApifyStatus {
  configured: boolean;
  availableActors: string[];
}

export default function SocialListening() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasFullAccess, user } = useAuth();
  const [addPostOpen, setAddPostOpen] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedHit, setSelectedHit] = useState<ListeningHit | null>(null);
  const [selectedBrief, setSelectedBrief] = useState<string>("");
  const [replyTone, setReplyTone] = useState<"helpful" | "promotional" | "educational" | "friendly">("helpful");
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

  const [scanBriefId, setScanBriefId] = useState<string>("");
  const [scanPlatforms, setScanPlatforms] = useState<string[]>(["reddit"]);

  const [newPost, setNewPost] = useState({
    platform: "youtube",
    postContent: "",
    postUrl: "",
    authorName: "",
    authorHandle: "",
    postType: "comment",
    briefId: "",
  });

  const { data: briefs = [] } = useQuery<BrandBrief[]>({
    queryKey: ["/api/brand-briefs"],
  });

  const { data: apifyStatus } = useQuery<ApifyStatus>({
    queryKey: ["/api/listening/apify-status"],
  });

  const { data: hits = [], isLoading: hitsLoading } = useQuery<ListeningHit[]>({
    queryKey: ["/api/listening/hits"],
  });

  const { data: drafts = [] } = useQuery<ReplyDraft[]>({
    queryKey: ["/api/listening/drafts"],
  });

  const { data: trending = [] } = useQuery<TrendingTopic[]>({
    queryKey: ["/api/listening/trending"],
  });

  const addHitMutation = useMutation({
    mutationFn: async (data: typeof newPost) => {
      const res = await apiRequest("POST", "/api/listening/hits", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listening/hits"] });
      toast({ title: "Post added", description: "The post has been analyzed and added to your listening feed." });
      setAddPostOpen(false);
      setNewPost({ platform: "youtube", postContent: "", postUrl: "", authorName: "", authorHandle: "", postType: "comment", briefId: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add post", variant: "destructive" });
    },
  });

  const generateReplyMutation = useMutation({
    mutationFn: async (data: { hitId: string; briefId: string; replyTone: string }) => {
      const res = await apiRequest("POST", "/api/listening/generate-reply", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listening/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listening/hits"] });
      toast({ title: "Reply generated", description: "AI has drafted a reply for you to review." });
      setReplyDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to generate reply", variant: "destructive" });
    },
  });

  const updateDraftMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ReplyDraft> }) => {
      const res = await apiRequest("PATCH", `/api/listening/drafts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listening/drafts"] });
      toast({ title: "Draft updated" });
    },
  });

  const scanMutation = useMutation({
    mutationFn: async (data: { briefId: string; platforms: string[] }) => {
      const res = await apiRequest("POST", "/api/listening/scan", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/listening/hits"] });
      toast({
        title: "Scan complete!",
        description: `Found ${data.totalImported} new posts matching your brand keywords.`,
      });
      setScanDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Scan failed",
        description: error.message || "Failed to scan for posts",
        variant: "destructive",
      });
    },
  });

  const togglePlatform = (platform: string) => {
    setScanPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const pendingHits = hits.filter((h) => h.replyStatus === "pending");
  const draftedHits = hits.filter((h) => h.replyStatus === "drafted");
  const sentHits = hits.filter((h) => h.replyStatus === "sent");

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "youtube": return "bg-red-500/10 text-red-500";
      case "tiktok": return "bg-pink-500/10 text-pink-500";
      case "instagram": return "bg-purple-500/10 text-purple-500";
      case "twitter": return "bg-blue-500/10 text-blue-500";
      case "reddit": return "bg-orange-500/10 text-orange-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive": return "bg-green-500/10 text-green-500";
      case "negative": return "bg-red-500/10 text-red-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display" data-testid="text-page-title">Social Listening</h1>
            <p className="text-muted-foreground mt-1">Monitor mentions, respond to comments, and track trending topics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/listening/hits"] })} data-testid="button-refresh">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" data-testid="button-scan-now">
                  <Radar className="w-4 h-4 mr-2" />
                  Scan Now
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Scan Social Media</DialogTitle>
                  <DialogDescription>
                    Use Apify scrapers to automatically find posts and comments matching your brand keywords.
                  </DialogDescription>
                </DialogHeader>
                {!apifyStatus?.configured ? (
                  <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-600">Apify not configured</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Add your APIFY_API_TOKEN environment variable to enable automated social media scanning.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium">Brand Brief *</label>
                      <Select value={scanBriefId} onValueChange={setScanBriefId}>
                        <SelectTrigger data-testid="select-scan-brief">
                          <SelectValue placeholder="Select brand brief for keywords..." />
                        </SelectTrigger>
                        <SelectContent>
                          {briefs.map((b) => (
                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Keywords will be extracted from your brand voice, target audience, and goals.
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Platforms to Scan</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["reddit", "instagram", "tiktok", "youtube"].map((platform) => (
                          <label
                            key={platform}
                            className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={scanPlatforms.includes(platform)}
                              onCheckedChange={() => togglePlatform(platform)}
                            />
                            <span className="capitalize">{platform}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (scanBriefId && scanPlatforms.length > 0) {
                          scanMutation.mutate({ briefId: scanBriefId, platforms: scanPlatforms });
                        }
                      }}
                      disabled={!scanBriefId || scanPlatforms.length === 0 || scanMutation.isPending}
                      data-testid="button-start-scan"
                    >
                      {scanMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Scanning... (this may take a few minutes)
                        </>
                      ) : (
                        <>
                          <Radar className="w-4 h-4 mr-2" />
                          Start Scan
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            <Dialog open={addPostOpen} onOpenChange={setAddPostOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-post">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Post to Monitor</DialogTitle>
                  <DialogDescription>Paste a comment or post you want to analyze and potentially respond to.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Platform</label>
                      <Select value={newPost.platform} onValueChange={(v) => setNewPost({ ...newPost, platform: v })}>
                        <SelectTrigger data-testid="select-platform">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="twitter">X / Twitter</SelectItem>
                          <SelectItem value="reddit">Reddit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Select value={newPost.postType} onValueChange={(v) => setNewPost({ ...newPost, postType: v })}>
                        <SelectTrigger data-testid="select-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comment">Comment</SelectItem>
                          <SelectItem value="post">Post</SelectItem>
                          <SelectItem value="mention">Mention</SelectItem>
                          <SelectItem value="dm">Direct Message</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Brand Brief (for reply context)</label>
                    <Select value={newPost.briefId} onValueChange={(v) => setNewPost({ ...newPost, briefId: v })}>
                      <SelectTrigger data-testid="select-brief">
                        <SelectValue placeholder="Select a brand brief..." />
                      </SelectTrigger>
                      <SelectContent>
                        {briefs.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Post/Comment Content *</label>
                    <Textarea
                      value={newPost.postContent}
                      onChange={(e) => setNewPost({ ...newPost, postContent: e.target.value })}
                      placeholder="Paste the comment or post text here..."
                      rows={4}
                      data-testid="input-post-content"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Author Name</label>
                      <Input
                        value={newPost.authorName}
                        onChange={(e) => setNewPost({ ...newPost, authorName: e.target.value })}
                        placeholder="John Doe"
                        data-testid="input-author-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Author Handle</label>
                      <Input
                        value={newPost.authorHandle}
                        onChange={(e) => setNewPost({ ...newPost, authorHandle: e.target.value })}
                        placeholder="@johndoe"
                        data-testid="input-author-handle"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Post URL (optional)</label>
                    <Input
                      value={newPost.postUrl}
                      onChange={(e) => setNewPost({ ...newPost, postUrl: e.target.value })}
                      placeholder="https://..."
                      data-testid="input-post-url"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => addHitMutation.mutate(newPost)}
                    disabled={!newPost.postContent || addHitMutation.isPending}
                    data-testid="button-submit-post"
                  >
                    {addHitMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add & Analyze
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inbox" data-testid="tab-inbox">
              Inbox {pendingHits.length > 0 && <Badge variant="secondary" className="ml-2">{pendingHits.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="drafts" data-testid="tab-drafts">
              Drafts {drafts.filter(d => d.status === "draft").length > 0 && <Badge variant="secondary" className="ml-2">{drafts.filter(d => d.status === "draft").length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="sent" data-testid="tab-sent">Sent</TabsTrigger>
            <TabsTrigger value="trending" data-testid="tab-trending">
              <Flame className="w-4 h-4 mr-1" />
              Trending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-4">
            {hitsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : pendingHits.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No new posts to review</p>
                  <p className="text-sm text-muted-foreground mt-1">Add posts manually or set up automatic scanning</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingHits.map((hit) => (
                  <Card key={hit.id} data-testid={`card-hit-${hit.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getPlatformColor(hit.platform)}>{hit.platform}</Badge>
                            <Badge variant="outline">{hit.postType}</Badge>
                            {hit.sentiment && <Badge className={getSentimentColor(hit.sentiment)}>{hit.sentiment}</Badge>}
                            {hit.isQuestion === "yes" && <Badge variant="secondary">Question</Badge>}
                          </div>
                          <p className="text-sm mb-2">{hit.postContent}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {hit.authorHandle && <span>@{hit.authorHandle}</span>}
                            {hit.authorName && <span>{hit.authorName}</span>}
                            {hit.matchedKeywords && hit.matchedKeywords.length > 0 && (
                              <span>Keywords: {hit.matchedKeywords.join(", ")}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedHit(hit);
                              setSelectedBrief(hit.briefId || "");
                              setReplyDialogOpen(true);
                            }}
                            data-testid={`button-reply-${hit.id}`}
                          >
                            <Sparkles className="w-4 h-4 mr-1" />
                            AI Reply
                          </Button>
                          {hit.postUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={hit.postUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-1" />
                                View
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="drafts" className="space-y-4">
            {drafts.filter(d => d.status === "draft").length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No reply drafts yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Generate AI replies from the Inbox tab</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {drafts.filter(d => d.status === "draft").map((draft) => {
                  const originalHit = hits.find(h => h.id === draft.listeningHitId);
                  const metadata = draft.generationMetadata as { alternativeReplies?: string[]; keyPointsAddressed?: string[] } | null;
                  
                  return (
                    <Card key={draft.id} data-testid={`card-draft-${draft.id}`}>
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {originalHit && (
                            <div className="bg-muted/50 rounded-lg p-3">
                              <p className="text-xs text-muted-foreground mb-1">Original post:</p>
                              <p className="text-sm">{originalHit.postContent}</p>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-muted-foreground">Your reply ({draft.replyTone} tone):</p>
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(draft.replyContent)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <Textarea
                              value={draft.replyContent}
                              onChange={(e) => updateDraftMutation.mutate({ id: draft.id, data: { replyContent: e.target.value } })}
                              rows={3}
                              data-testid={`textarea-draft-${draft.id}`}
                            />
                          </div>
                          {metadata?.alternativeReplies && metadata.alternativeReplies.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Alternative replies:</p>
                              <div className="space-y-2">
                                {metadata.alternativeReplies.map((alt, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm bg-muted/30 rounded p-2">
                                    <span className="flex-1">{alt}</span>
                                    <Button size="sm" variant="ghost" onClick={() => updateDraftMutation.mutate({ id: draft.id, data: { replyContent: alt } })}>
                                      Use
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => {
                                updateDraftMutation.mutate({ id: draft.id, data: { status: "approved" } });
                                toast({ title: "Reply approved!", description: "Now paste it manually on the platform." });
                              }}
                              data-testid={`button-approve-draft-${draft.id}`}
                            >
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => updateDraftMutation.mutate({ id: draft.id, data: { status: "rejected" } })}
                            >
                              <ThumbsDown className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                            {originalHit?.postUrl && (
                              <Button variant="outline" asChild>
                                <a href={originalHit.postUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Open Post
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {sentHits.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Send className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No sent replies yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {sentHits.map((hit) => (
                  <Card key={hit.id}>
                    <CardContent className="p-4">
                      <Badge className={getPlatformColor(hit.platform)}>{hit.platform}</Badge>
                      <p className="text-sm mt-2">{hit.postContent}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-4">
            {trending.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No trending topics detected yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Add more posts to start detecting patterns</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trending.map((topic) => (
                  <Card key={topic.id} data-testid={`card-trend-${topic.id}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        {topic.topic}
                      </CardTitle>
                      {topic.platform && <CardDescription>{topic.platform}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{topic.mentionCount} mentions</span>
                        <Badge className={getSentimentColor(topic.sentiment)}>{topic.sentiment}</Badge>
                      </div>
                      {topic.keywords && topic.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {topic.keywords.map((kw, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate AI Reply</DialogTitle>
              <DialogDescription>Select a brand brief and tone to generate a contextual reply.</DialogDescription>
            </DialogHeader>
            {selectedHit && (
              <div className="space-y-4 mt-4">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Replying to:</p>
                  <p className="text-sm">{selectedHit.postContent}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Brand Brief *</label>
                  <Select value={selectedBrief} onValueChange={setSelectedBrief}>
                    <SelectTrigger data-testid="select-reply-brief">
                      <SelectValue placeholder="Select brand brief..." />
                    </SelectTrigger>
                    <SelectContent>
                      {briefs.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Reply Tone</label>
                  <Select value={replyTone} onValueChange={(v: any) => setReplyTone(v)}>
                    <SelectTrigger data-testid="select-reply-tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="helpful">Helpful</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (!checkAIAccess("AI Reply Generation")) return;
                    if (selectedHit && selectedBrief) {
                      generateReplyMutation.mutate({
                        hitId: selectedHit.id,
                        briefId: selectedBrief,
                        replyTone,
                      });
                    }
                  }}
                  disabled={!selectedBrief || generateReplyMutation.isPending}
                  data-testid="button-generate-reply"
                >
                  {generateReplyMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate Reply
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <UpgradePrompt
          feature={upgradeFeatureName}
          open={upgradePromptOpen}
          onOpenChange={setUpgradePromptOpen}
        />
      </div>
    </Layout>
  );
}
