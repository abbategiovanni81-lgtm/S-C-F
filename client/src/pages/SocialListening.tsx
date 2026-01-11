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
import { ResponsiveTooltip } from "@/components/ui/responsive-tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, MessageSquare, TrendingUp, Plus, Send, RefreshCw, ExternalLink, ThumbsUp, ThumbsDown, Copy, Sparkles, Flame, Radar, AlertCircle, Link2, Youtube, Target, ArrowUpDown, Search, Zap, CheckCircle2, Circle, ChevronRight, MessageCircle, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { ListeningHit, ReplyDraft, TrendingTopic, BrandBrief, SocialAccount } from "@shared/schema";
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
  const [urlScrapeDialogOpen, setUrlScrapeDialogOpen] = useState(false);
  const [viralUrl, setViralUrl] = useState("");
  const [maxComments, setMaxComments] = useState(50);
  const [sortByOpportunity, setSortByOpportunity] = useState(true);
  const [quickKeywords, setQuickKeywords] = useState("");
  const [quickPlatforms, setQuickPlatforms] = useState<string[]>(["reddit", "youtube"]);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [selectedHitForComments, setSelectedHitForComments] = useState<ListeningHit | null>(null);
  const [commentsDialogFilter, setCommentsDialogFilter] = useState<string | null>(null);

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

  // Fetch YouTube accounts for direct posting
  const { data: socialAccounts = [] } = useQuery<SocialAccount[]>({
    queryKey: ["/api/social-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/social-accounts", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const youtubeAccounts = socialAccounts.filter(
    (a) => a.platform === "YouTube" && a.isConnected === "connected" && a.accessToken
  );

  // State for tracking which draft is being posted
  const [postingDraftId, setPostingDraftId] = useState<string | null>(null);
  
  // State for tracking selected alternative by draft ID (persists through edits)
  const [selectedAltByDraft, setSelectedAltByDraft] = useState<Record<string, number>>({});

  // Helper to extract YouTube video ID from URL
  const extractYouTubeVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  // Mutation for posting reply to YouTube
  const postToYouTubeMutation = useMutation({
    mutationFn: async (data: { draftId: string; accountId: string; text: string; videoId?: string; postUrl?: string; parentCommentId?: string }) => {
      const res = await apiRequest("POST", "/api/youtube/comment", {
        accountId: data.accountId,
        text: data.text,
        videoId: data.videoId,
        postUrl: data.postUrl,
        parentCommentId: data.parentCommentId,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to post comment");
      }
      return { ...await res.json(), draftId: data.draftId };
    },
    onSuccess: (data) => {
      updateDraftMutation.mutate({ id: data.draftId, data: { status: "sent" } });
      queryClient.invalidateQueries({ queryKey: ["/api/listening/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listening/hits"] });
      toast({ title: "Posted to YouTube!", description: "Your reply has been posted successfully." });
      setPostingDraftId(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to post", description: error.message || "Could not post to YouTube", variant: "destructive" });
      setPostingDraftId(null);
    },
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
      // Toast is handled by the caller when needed (e.g., approve, select alternative)
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

  const urlScrapeMutation = useMutation({
    mutationFn: async (data: { url: string; maxComments: number; briefId?: string }) => {
      const res = await apiRequest("POST", "/api/listening/scrape-url", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/listening/hits"] });
      toast({
        title: "Comments scraped!",
        description: `Found ${data.commentsImported} engagement opportunities from ${data.platform}.`,
      });
      setUrlScrapeDialogOpen(false);
      setViralUrl("");
    },
    onError: (error: any) => {
      toast({
        title: "Scrape failed",
        description: error.message || "Failed to scrape comments",
        variant: "destructive",
      });
    },
  });

  const quickScanMutation = useMutation({
    mutationFn: async (data: { keywords: string[]; platforms: string[] }) => {
      const res = await apiRequest("POST", "/api/listening/quick-scan", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/listening/hits"] });
      toast({
        title: "Scan complete!",
        description: `Found ${data.totalImported} engagement opportunities.`,
      });
      setQuickKeywords("");
    },
    onError: (error: any) => {
      toast({
        title: "Scan failed",
        description: error.message || "Failed to scan",
        variant: "destructive",
      });
    },
  });

  const scrapeCommentsMutation = useMutation({
    mutationFn: async (hitId: string) => {
      const res = await apiRequest("POST", `/api/listening/hits/${hitId}/scrape-comments`, { maxComments: 30 });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/listening/hits"] });
      toast({
        title: "Comments scraped!",
        description: `Found ${data.commentsImported} engagement opportunities from the comments.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Scrape failed",
        description: error.message || "Failed to scrape comments",
        variant: "destructive",
      });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/listening/hits/clear-all");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/listening/hits"] });
      toast({
        title: "Cleared!",
        description: `Removed ${data.deletedCount} posts and comments.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Clear failed",
        description: error.message || "Failed to clear posts",
        variant: "destructive",
      });
    },
  });

  const togglePlatform = (platform: string) => {
    setScanPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const pendingHits = hits
    .filter((h) => h.replyStatus === "pending")
    .sort((a, b) => {
      if (sortByOpportunity) {
        return ((b as any).opportunityScore || 0) - ((a as any).opportunityScore || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  const draftedHits = hits.filter((h) => h.replyStatus === "drafted");
  const sentHits = hits.filter((h) => h.replyStatus === "sent");
  const viralUrlHits = hits.filter((h) => (h as any).scanType === "viral_url");

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

  const toggleQuickPlatform = (platform: string) => {
    setQuickPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleQuickScan = () => {
    const keywords = quickKeywords.split(",").map(k => k.trim()).filter(k => k.length > 0);
    if (keywords.length > 0 && quickPlatforms.length > 0) {
      quickScanMutation.mutate({ keywords, platforms: quickPlatforms });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display" data-testid="text-page-title">Social Listening</h1>
            <p className="text-muted-foreground mt-1">Find engagement opportunities across social media</p>
          </div>
          <ResponsiveTooltip content="Refresh feed">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/listening/hits"] })} data-testid="button-refresh">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </ResponsiveTooltip>
        </div>

        {/* Quick Scan Section - Primary User Action */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="w-5 h-5 text-primary" />
              Quick Keyword Scan
            </CardTitle>
            <CardDescription>
              Enter keywords to find posts and comments where you can engage with your target audience
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!apifyStatus?.configured ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-600">Apify not configured</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add your APIFY_API_TOKEN environment variable to enable social media scanning.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      value={quickKeywords}
                      onChange={(e) => setQuickKeywords(e.target.value)}
                      placeholder="Enter keywords separated by commas (e.g., fitness tips, workout routine, gym motivation)"
                      className="h-11"
                      data-testid="input-quick-keywords"
                    />
                  </div>
                  <ResponsiveTooltip content="Find engagement posts">
                    <Button 
                      onClick={handleQuickScan}
                      disabled={!quickKeywords.trim() || quickPlatforms.length === 0 || quickScanMutation.isPending}
                      className="h-11 px-6"
                      data-testid="button-quick-scan"
                    >
                      {quickScanMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Scan Now
                        </>
                      )}
                    </Button>
                  </ResponsiveTooltip>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Scan on:</span>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { id: "reddit", label: "Reddit", color: "orange" },
                      { id: "youtube", label: "YouTube", color: "red" },
                      { id: "tiktok", label: "TikTok", color: "pink" },
                      { id: "instagram", label: "Instagram", color: "purple" },
                    ].map((platform) => (
                      <label
                        key={platform.id}
                        className={`flex items-center gap-2 px-3 py-1.5 border rounded-full cursor-pointer text-sm transition-colors ${
                          quickPlatforms.includes(platform.id) 
                            ? "bg-primary/10 border-primary text-primary" 
                            : "bg-muted/50 border-border hover:bg-muted"
                        }`}
                      >
                        <Checkbox
                          checked={quickPlatforms.includes(platform.id)}
                          onCheckedChange={() => toggleQuickPlatform(platform.id)}
                          className="w-4 h-4"
                        />
                        {platform.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alternative Actions */}
        <div className="flex gap-3 flex-wrap">
          <Dialog open={urlScrapeDialogOpen} onOpenChange={setUrlScrapeDialogOpen}>
              <DialogTrigger asChild>
                <ResponsiveTooltip content="Extract viral comments">
                  <Button variant="outline" data-testid="button-scrape-url">
                    <Link2 className="w-4 h-4 mr-2" />
                    Scrape Viral URL
                  </Button>
                </ResponsiveTooltip>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Scrape Viral Content
                  </DialogTitle>
                  <DialogDescription>
                    Extract comments from a viral video or post to find engagement opportunities. Works with YouTube, TikTok, and Instagram.
                  </DialogDescription>
                </DialogHeader>
                {!apifyStatus?.configured ? (
                  <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-600">Apify not configured</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Add your APIFY_API_TOKEN to scrape comments from viral content.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium">Video/Post URL *</label>
                      <Input
                        value={viralUrl}
                        onChange={(e) => setViralUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=... or TikTok/Instagram URL"
                        data-testid="input-viral-url"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Paste a YouTube, TikTok, or Instagram post URL
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Max Comments</label>
                      <Select value={maxComments.toString()} onValueChange={(v) => setMaxComments(parseInt(v))}>
                        <SelectTrigger data-testid="select-max-comments">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25 comments</SelectItem>
                          <SelectItem value="50">50 comments</SelectItem>
                          <SelectItem value="100">100 comments</SelectItem>
                          <SelectItem value="200">200 comments</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Brand Brief (optional)</label>
                      <Select value={scanBriefId} onValueChange={setScanBriefId}>
                        <SelectTrigger data-testid="select-url-brief">
                          <SelectValue placeholder="Select to link comments to a brand..." />
                        </SelectTrigger>
                        <SelectContent>
                          {briefs.map((b) => (
                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <ResponsiveTooltip content="Start comment scrape">
                      <Button
                        className="w-full"
                        onClick={() => {
                          if (viralUrl) {
                            urlScrapeMutation.mutate({ 
                              url: viralUrl, 
                              maxComments,
                              briefId: scanBriefId || undefined 
                            });
                          }
                        }}
                        disabled={!viralUrl || urlScrapeMutation.isPending}
                        data-testid="button-start-scrape"
                      >
                        {urlScrapeMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Scraping comments... (may take 1-2 minutes)
                          </>
                        ) : (
                          <>
                            <Target className="w-4 h-4 mr-2" />
                            Find Engagement Opportunities
                          </>
                        )}
                      </Button>
                    </ResponsiveTooltip>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
              <DialogTrigger asChild>
                <ResponsiveTooltip content="Scan with brand keywords">
                  <Button variant="outline" data-testid="button-brand-scan">
                    <Radar className="w-4 h-4 mr-2" />
                    Brand Brief Scan
                  </Button>
                </ResponsiveTooltip>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Scan with Brand Brief Keywords</DialogTitle>
                  <DialogDescription>
                    Automatically extract keywords from your brand brief and scan for relevant posts.
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
                    <ResponsiveTooltip content="Begin platform scan">
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
                    </ResponsiveTooltip>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            <Dialog open={addPostOpen} onOpenChange={setAddPostOpen}>
              <DialogTrigger asChild>
                <ResponsiveTooltip content="Add post manually">
                  <Button data-testid="button-add-post">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Post
                  </Button>
                </ResponsiveTooltip>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
            {/* Sort toggle and Clear All */}
            {pendingHits.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{hits.length} total items ({pendingHits.length} pending)</p>
                  <div className="flex items-center gap-2">
                    {pendingHits.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSortByOpportunity(!sortByOpportunity)}
                        data-testid="button-toggle-sort"
                      >
                        <ArrowUpDown className="w-4 h-4 mr-2" />
                        {sortByOpportunity ? "Sorted by Opportunity" : "Sorted by Date"}
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          data-testid="button-clear-all"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear All
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear all posts and comments?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all {hits.length} scraped posts and comments. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => clearAllMutation.mutate()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {clearAllMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Clear All"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            )}
            {hitsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : pendingHits.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No engagement opportunities yet</p>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                    Use the Quick Keyword Scan above to find posts and comments where you can engage with your target audience
                  </p>
                  <div className="flex gap-4 justify-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">1</div>
                      Enter keywords
                    </div>
                    <ChevronRight className="w-4 h-4" />
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">2</div>
                      Select platforms
                    </div>
                    <ChevronRight className="w-4 h-4" />
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">3</div>
                      Review results
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingHits.map((hit) => {
                  const extHit = hit as any;
                  const opportunityScore = extHit.opportunityScore || 0;
                  const getOpportunityColor = (score: number) => {
                    if (score >= 70) return "bg-green-500/10 text-green-600 border-green-500/30";
                    if (score >= 40) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
                    return "bg-gray-500/10 text-gray-600 border-gray-500/30";
                  };
                  return (
                    <Card key={hit.id} data-testid={`card-hit-${hit.id}`} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge className={getPlatformColor(hit.platform)}>{hit.platform}</Badge>
                              <Badge variant="outline">{hit.postType}</Badge>
                              {hit.sentiment && <Badge className={getSentimentColor(hit.sentiment)}>{hit.sentiment}</Badge>}
                              {hit.isQuestion === "yes" && <Badge variant="secondary">Question</Badge>}
                              {/* Only show comment type badges for actual comments, not posts */}
                              {hit.postType === "comment" && (extHit.commentTypes as string[] | null)?.map((type: string) => (
                                <Badge key={type} variant="outline" className={
                                  type === "question" ? "border-blue-500 text-blue-500" :
                                  type === "wants_info" ? "border-purple-500 text-purple-500" :
                                  type === "disagreeing" ? "border-red-500 text-red-500" :
                                  type === "expert" ? "border-green-500 text-green-500" :
                                  type === "most_liked" ? "border-yellow-500 text-yellow-500" : ""
                                }>
                                  {type === "wants_info" ? "Wants Info" : 
                                   type === "most_liked" ? "Top Liked" :
                                   type.charAt(0).toUpperCase() + type.slice(1)}
                                </Badge>
                              ))}
                              {opportunityScore > 0 && (
                                <Badge className={getOpportunityColor(opportunityScore)}>
                                  <Target className="w-3 h-3 mr-1" />
                                  {opportunityScore}% Opportunity
                                </Badge>
                              )}
                              {extHit.scanType === "viral_url" && (
                                <Badge variant="outline" className="text-xs">
                                  <Youtube className="w-3 h-3 mr-1" />
                                  Viral
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm mb-2">{hit.postContent}</p>
                            {extHit.sourceTitle && (
                              <div className="text-xs text-muted-foreground mb-2 bg-muted/50 rounded px-2 py-1 inline-block">
                                From: {extHit.sourceTitle} {extHit.sourceChannel && `by ${extHit.sourceChannel}`}
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {hit.authorHandle && <span>@{hit.authorHandle}</span>}
                              {hit.authorName && <span>{hit.authorName}</span>}
                              {hit.likes && <span>{hit.likes} likes</span>}
                              {hit.matchedKeywords && hit.matchedKeywords.length > 0 && (
                                <span>Keywords: {hit.matchedKeywords.join(", ")}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <ResponsiveTooltip content="Generate AI reply">
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
                            </ResponsiveTooltip>
                            <ResponsiveTooltip content="Copy post text">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => copyToClipboard(hit.postContent)}
                                data-testid={`button-copy-${hit.id}`}
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </Button>
                            </ResponsiveTooltip>
                            {(() => {
                              // Generate fallback URL for Reddit posts
                              let viewUrl = hit.postUrl || extHit.sourceUrl;
                              if (!viewUrl && hit.platform.toLowerCase() === "reddit" && hit.postId) {
                                viewUrl = `https://reddit.com/comments/${hit.postId}`;
                              }
                              if (!viewUrl) return null;
                              return (
                                <ResponsiveTooltip content="Open original post">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => window.open(viewUrl!, "_blank")}
                                    data-testid={`button-view-${hit.id}`}
                                  >
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                </ResponsiveTooltip>
                              );
                            })()}
                            {(hit.postUrl || hit.postId) && ["youtube", "reddit", "tiktok", "instagram"].includes(hit.platform.toLowerCase()) && hit.postType !== "comment" && (
                              <ResponsiveTooltip content="Scrape post comments">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedHitForComments(hit);
                                    setCommentsDialogFilter(null);
                                    setCommentsDialogOpen(true);
                                  }}
                                  data-testid={`button-scrape-comments-${hit.id}`}
                                >
                                  <MessageCircle className="w-4 h-4 mr-1" />
                                  Comments
                                </Button>
                              </ResponsiveTooltip>
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
                              <ResponsiveTooltip content="Copy reply">
                                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(draft.replyContent)}>
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </ResponsiveTooltip>
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
                                {metadata.alternativeReplies.map((alt, i) => {
                                  const isSelected = selectedAltByDraft[draft.id] === i;
                                  return (
                                    <div 
                                      key={i} 
                                      className={`flex items-start gap-2 text-sm rounded p-2 transition-colors ${
                                        isSelected 
                                          ? "bg-green-500/20 border border-green-500/50" 
                                          : "bg-muted/30 hover:bg-muted/50"
                                      }`}
                                    >
                                      {isSelected && <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />}
                                      <span className="flex-1">{alt}</span>
                                      <ResponsiveTooltip content={isSelected ? "Currently selected" : "Use this reply"}>
                                        <Button 
                                          size="sm" 
                                          variant={isSelected ? "default" : "ghost"}
                                          className={isSelected ? "bg-green-600 hover:bg-green-700" : ""}
                                          onClick={() => {
                                            setSelectedAltByDraft(prev => ({ ...prev, [draft.id]: i }));
                                            updateDraftMutation.mutate({ id: draft.id, data: { replyContent: alt } });
                                            toast({ title: "Reply selected", description: "This message will be used when you approve." });
                                          }}
                                        >
                                          {isSelected ? "Selected" : "Use"}
                                        </Button>
                                      </ResponsiveTooltip>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            {(() => {
                              const isYouTube = originalHit?.platform === "YouTube";
                              const hasYouTubeAccount = youtubeAccounts.length > 0;
                              const videoUrl = originalHit?.postUrl || (originalHit as any)?.sourceUrl;
                              const videoId = videoUrl ? extractYouTubeVideoId(videoUrl) : null;
                              const canAutoPost = isYouTube && hasYouTubeAccount && videoId;
                              const youTubeMissingInfo = isYouTube && (!hasYouTubeAccount || !videoId);
                              
                              const tooltipText = canAutoPost 
                                ? "Approve and post to YouTube" 
                                : isYouTube && !hasYouTubeAccount 
                                  ? "Connect a YouTube account to auto-post"
                                  : isYouTube && !videoId
                                    ? "Missing video URL - cannot auto-post"
                                    : "Approve and mark as sent";
                              
                              return (
                                <ResponsiveTooltip content={tooltipText}>
                                  <Button
                                    onClick={() => {
                                      // For YouTube with connected account and valid video ID, auto-post
                                      if (canAutoPost) {
                                        const parentCommentId = originalHit?.postType === "comment" ? originalHit.postId : undefined;
                                        setPostingDraftId(draft.id);
                                        postToYouTubeMutation.mutate({
                                          draftId: draft.id,
                                          accountId: youtubeAccounts[0].id,
                                          text: draft.replyContent,
                                          videoId: videoId!,
                                          postUrl: videoUrl,
                                          parentCommentId: parentCommentId || undefined,
                                        });
                                        return;
                                      }
                                      // YouTube but can't auto-post - show error, don't mark as sent
                                      if (youTubeMissingInfo) {
                                        if (!hasYouTubeAccount) {
                                          toast({ title: "Cannot auto-post", description: "Connect a YouTube account in Settings to auto-post replies.", variant: "destructive" });
                                        } else {
                                          toast({ title: "Cannot auto-post", description: "Missing video URL. Copy the reply manually from below.", variant: "destructive" });
                                        }
                                        return;
                                      }
                                      // For other platforms, mark as sent directly
                                      updateDraftMutation.mutate(
                                        { id: draft.id, data: { status: "sent" } },
                                        { onSuccess: () => toast({ title: "Reply approved!", description: "Moved to Sent. Copy and paste it on the platform." }) }
                                      );
                                    }}
                                    disabled={postToYouTubeMutation.isPending && postingDraftId === draft.id}
                                    data-testid={`button-approve-draft-${draft.id}`}
                                  >
                                    {postToYouTubeMutation.isPending && postingDraftId === draft.id ? (
                                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                    ) : canAutoPost ? (
                                      <Youtube className="w-4 h-4 mr-1" />
                                    ) : (
                                      <ThumbsUp className="w-4 h-4 mr-1" />
                                    )}
                                    {canAutoPost ? "Approve & Post" : "Approve"}
                                  </Button>
                                </ResponsiveTooltip>
                              );
                            })()}
                            <ResponsiveTooltip content="Discard this draft">
                              <Button
                                variant="outline"
                                onClick={() => updateDraftMutation.mutate({ id: draft.id, data: { status: "rejected" } })}
                              >
                                <ThumbsDown className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </ResponsiveTooltip>
                            {originalHit?.postUrl && (
                              <ResponsiveTooltip content="View original post">
                                <Button variant="outline" asChild>
                                  <a href={originalHit.postUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    Open Post
                                  </a>
                                </Button>
                              </ResponsiveTooltip>
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
                <ResponsiveTooltip content="Create AI reply">
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
                </ResponsiveTooltip>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Comments Dialog */}
        <Dialog open={commentsDialogOpen} onOpenChange={setCommentsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Scrape Comments</DialogTitle>
              <DialogDescription>
                Scrape and analyze comments from this post. Comments will be AI-classified for easy filtering.
              </DialogDescription>
            </DialogHeader>
            {selectedHitForComments && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">{selectedHitForComments.platform}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{selectedHitForComments.postContent}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Comment types to look for:</p>
                  <p className="text-xs text-muted-foreground">All comments will be scraped and AI will classify them into these categories:</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="outline" className="border-blue-500 text-blue-500">Questions</Badge>
                    <Badge variant="outline" className="border-purple-500 text-purple-500">Wants Info</Badge>
                    <Badge variant="outline" className="border-red-500 text-red-500">Disagreeing</Badge>
                    <Badge variant="outline" className="border-green-500 text-green-500">Expert</Badge>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-500">Top Liked</Badge>
                  </div>
                </div>

                {/* Show child comments if they exist */}
                {(() => {
                  const childComments = hits.filter(h => 
                    h.postType === "comment" && 
                    (h as any).sourceUrl === selectedHitForComments.postUrl
                  );
                  
                  if (childComments.length > 0) {
                    const filteredComments = commentsDialogFilter 
                      ? childComments.filter(c => {
                          const types = (c as any).commentTypes as string[] | null;
                          return types && types.includes(commentsDialogFilter);
                        })
                      : childComments;
                    
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{childComments.length} comments scraped</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={commentsDialogFilter === null ? "default" : "outline"}
                            onClick={() => setCommentsDialogFilter(null)}
                          >
                            All ({childComments.length})
                          </Button>
                          {["question", "wants_info", "disagreeing", "expert", "most_liked"].map(type => {
                            const count = childComments.filter(c => {
                              const types = (c as any).commentTypes as string[] | null;
                              return types && types.includes(type);
                            }).length;
                            if (count === 0) return null;
                            return (
                              <Button
                                key={type}
                                size="sm"
                                variant={commentsDialogFilter === type ? "default" : "outline"}
                                onClick={() => setCommentsDialogFilter(type)}
                              >
                                {type === "wants_info" ? "Wants Info" : 
                                 type === "most_liked" ? "Top Liked" : 
                                 type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                              </Button>
                            );
                          })}
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {filteredComments.slice(0, 20).map(comment => (
                            <div key={comment.id} className="p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-medium">{comment.authorName || comment.authorHandle}</span>
                                {comment.likes && <span className="text-xs text-muted-foreground">{comment.likes} likes</span>}
                                {((comment as any).commentTypes as string[] | null)?.map((type: string) => (
                                  <Badge key={type} variant="outline" className={`text-xs ${
                                    type === "question" ? "border-blue-500 text-blue-500" :
                                    type === "wants_info" ? "border-purple-500 text-purple-500" :
                                    type === "disagreeing" ? "border-red-500 text-red-500" :
                                    type === "expert" ? "border-green-500 text-green-500" :
                                    type === "most_liked" ? "border-yellow-500 text-yellow-500" : ""
                                  }`}>
                                    {type === "wants_info" ? "Wants Info" : 
                                     type === "most_liked" ? "Top Liked" :
                                     type.charAt(0).toUpperCase() + type.slice(1)}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-sm line-clamp-3">{comment.postContent}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <ResponsiveTooltip content="Extract comments">
                  <Button
                    className="w-full"
                    onClick={() => {
                      scrapeCommentsMutation.mutate(selectedHitForComments.id);
                    }}
                    disabled={scrapeCommentsMutation.isPending || !selectedHitForComments.postUrl}
                  >
                    {scrapeCommentsMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Scraping & Classifying...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {hits.filter(h => h.postType === "comment" && (h as any).sourceUrl === selectedHitForComments.postUrl).length > 0 
                          ? "Scrape More Comments" 
                          : "Scrape Comments"}
                      </>
                    )}
                  </Button>
                </ResponsiveTooltip>
                {!selectedHitForComments.postUrl && (
                  <p className="text-xs text-destructive text-center">Cannot scrape: No URL available for this post</p>
                )}
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
