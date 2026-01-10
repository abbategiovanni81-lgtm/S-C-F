import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveTooltip } from "@/components/ui/responsive-tooltip";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, Eye, Clock, ThumbsUp, MessageSquare, Share2, Youtube, Loader2, Upload, Image as ImageIcon, Trophy, Calendar, MapPin, Smartphone, Monitor, Tv, Globe, Play, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { AnalyticsSnapshot, SocialAccount } from "@shared/schema";

interface YouTubeChannel {
  channelId: string;
  title: string;
  customUrl: string;
  thumbnailUrl: string;
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
}

interface YouTubeAnalytics {
  views: number;
  watchTimeMinutes: number;
  avgViewDuration: number;
  likes: number;
  comments: number;
  shares: number;
  subscribersGained: number;
  period: { startDate: string; endDate: string };
}

function formatNumber(num: number | string): string {
  const n = typeof num === "string" ? parseInt(num, 10) : num;
  if (isNaN(n)) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

export default function Analytics() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedYouTubeAccountId, setSelectedYouTubeAccountId] = useState<string>("");

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery<SocialAccount[]>({
    queryKey: ["/api/social-accounts?userId=demo-user"],
  });

  // Check for YouTube accounts in database (connected via OAuth or manually added)
  const youtubeAccounts = accounts.filter(a => a.platform === "YouTube");
  const connectedYouTubeAccounts = youtubeAccounts.filter(a => a.isConnected === "connected");
  const hasYouTubeAccounts = youtubeAccounts.length > 0;

  // Auto-select first connected YouTube account if available
  const effectiveYouTubeAccountId = selectedYouTubeAccountId || (connectedYouTubeAccounts.length > 0 ? connectedYouTubeAccounts[0].id : "");

  const { data: channel, isLoading: loadingChannel, error: channelError, refetch: refetchChannel } = useQuery<YouTubeChannel>({
    queryKey: ["/api/youtube/channel", effectiveYouTubeAccountId],
    queryFn: async () => {
      const url = effectiveYouTubeAccountId 
        ? `/api/youtube/channel?accountId=${effectiveYouTubeAccountId}` 
        : "/api/youtube/channel";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch channel");
      return res.json();
    },
    enabled: connectedYouTubeAccounts.length > 0,
    retry: false,
    staleTime: 0, // Always refetch when query key changes
    refetchOnMount: true,
  });

  const { data: analytics, isLoading: loadingAnalytics, refetch: refetchAnalytics } = useQuery<YouTubeAnalytics>({
    queryKey: ["/api/youtube/analytics", effectiveYouTubeAccountId],
    queryFn: async () => {
      const url = effectiveYouTubeAccountId 
        ? `/api/youtube/analytics?accountId=${effectiveYouTubeAccountId}` 
        : "/api/youtube/analytics";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    enabled: !!channel || connectedYouTubeAccounts.length > 0,
    retry: false,
    staleTime: 0, // Always refetch when query key changes
    refetchOnMount: true,
  });

  const { data: snapshots = [] } = useQuery<AnalyticsSnapshot[]>({
    queryKey: ["/api/analytics/snapshots"],
  });

  const { data: topPatterns = [] } = useQuery<{ title: string; views: number; postedOn?: string }[]>({
    queryKey: ["/api/analytics/top-patterns"],
  });

  // Advanced YouTube Analytics queries
  const { data: trafficSources, isLoading: loadingTraffic, error: trafficError, refetch: refetchTraffic } = useQuery<{ trafficSources: { source: string; views: number; watchTimeMinutes: number }[] } | null>({
    queryKey: ["/api/youtube/analytics/traffic-sources", effectiveYouTubeAccountId],
    queryFn: async () => {
      const url = effectiveYouTubeAccountId 
        ? `/api/youtube/analytics/traffic-sources?accountId=${effectiveYouTubeAccountId}` 
        : "/api/youtube/analytics/traffic-sources";
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Traffic sources API error:", err);
        return null;
      }
      return res.json();
    },
    enabled: connectedYouTubeAccounts.length > 0,
    retry: false,
    staleTime: 0,
  });

  const { data: deviceAnalytics, isLoading: loadingDevices, error: deviceError, refetch: refetchDevices } = useQuery<{ devices: { device: string; views: number; watchTimeMinutes: number }[] } | null>({
    queryKey: ["/api/youtube/analytics/devices", effectiveYouTubeAccountId],
    queryFn: async () => {
      const url = effectiveYouTubeAccountId 
        ? `/api/youtube/analytics/devices?accountId=${effectiveYouTubeAccountId}` 
        : "/api/youtube/analytics/devices";
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Device analytics API error:", err);
        return null;
      }
      return res.json();
    },
    enabled: connectedYouTubeAccounts.length > 0,
    retry: false,
    staleTime: 0,
  });

  const { data: geoAnalytics, isLoading: loadingGeo, error: geoError, refetch: refetchGeo } = useQuery<{ countries: { country: string; views: number; watchTimeMinutes: number }[] } | null>({
    queryKey: ["/api/youtube/analytics/geography", effectiveYouTubeAccountId],
    queryFn: async () => {
      const url = effectiveYouTubeAccountId 
        ? `/api/youtube/analytics/geography?accountId=${effectiveYouTubeAccountId}` 
        : "/api/youtube/analytics/geography";
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Geography analytics API error:", err);
        return null;
      }
      return res.json();
    },
    enabled: connectedYouTubeAccounts.length > 0,
    retry: false,
    staleTime: 0,
  });

  const { data: peakTimes, isLoading: loadingPeakTimes, error: peakTimesError, refetch: refetchPeakTimes } = useQuery<{ byDayOfWeek: { day: string; views: number }[]; bestDay: string } | null>({
    queryKey: ["/api/youtube/analytics/peak-times", effectiveYouTubeAccountId],
    queryFn: async () => {
      const url = effectiveYouTubeAccountId 
        ? `/api/youtube/analytics/peak-times?accountId=${effectiveYouTubeAccountId}` 
        : "/api/youtube/analytics/peak-times";
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Peak times API error:", err);
        return null;
      }
      return res.json();
    },
    enabled: connectedYouTubeAccounts.length > 0,
    retry: false,
    staleTime: 0,
  });

  const { data: topVideosData, isLoading: loadingTopVideos, error: topVideosError, refetch: refetchTopVideos } = useQuery<{ topVideos: { videoId: string; title: string; thumbnail?: string; views: number; avgDuration: number; likes: number; comments: number }[] } | null>({
    queryKey: ["/api/youtube/analytics/top-videos", effectiveYouTubeAccountId],
    queryFn: async () => {
      const url = effectiveYouTubeAccountId 
        ? `/api/youtube/analytics/top-videos?accountId=${effectiveYouTubeAccountId}` 
        : "/api/youtube/analytics/top-videos";
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Top videos API error:", err);
        return null;
      }
      return res.json();
    },
    enabled: connectedYouTubeAccounts.length > 0,
    retry: false,
    staleTime: 0,
  });

  // Function to refresh all YouTube data
  const handleRefreshAllYouTubeData = async () => {
    try {
      toast({ title: "Refreshing...", description: "Fetching latest YouTube data" });
      await Promise.all([
        refetchChannel(),
        refetchAnalytics(),
        refetchTraffic(),
        refetchDevices(),
        refetchGeo(),
        refetchPeakTimes(),
        refetchTopVideos(),
      ]);
      toast({ title: "Refreshed!", description: "YouTube analytics updated" });
    } catch (error: any) {
      console.error("Error refreshing YouTube data:", error);
      toast({ 
        title: "Refresh failed", 
        description: "Some data could not be refreshed. Try reconnecting your YouTube account.",
        variant: "destructive"
      });
    }
  };

  const loadingAdvancedAnalytics = loadingTraffic || loadingDevices || loadingGeo || loadingPeakTimes || loadingTopVideos;
  const hasAdvancedData = trafficSources?.trafficSources?.length || deviceAnalytics?.devices?.length || geoAnalytics?.countries?.length || peakTimes?.byDayOfWeek?.length || topVideosData?.topVideos?.length;

  // Consider connected if we have YouTube accounts in database OR cookie-based connection
  const isConnected = hasYouTubeAccounts || (!!channel && !channelError);
  const isLoading = loadingAccounts || loadingChannel;

  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!selectedAccountId) {
      toast({
        title: "Please select an account",
        description: "Choose which account these screenshots belong to",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length });
      
      try {
        const formData = new FormData();
        formData.append("screenshot", file);
        formData.append("userId", "demo-user");
        formData.append("accountId", selectedAccountId);

        const response = await fetch("/api/analytics/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        successCount++;
      } catch (error: any) {
        failCount++;
        console.error(`Failed to upload ${file.name}:`, error.message);
      }
    }

    toast({
      title: `Uploaded ${successCount} screenshot${successCount !== 1 ? 's' : ''}`,
      description: failCount > 0 ? `${failCount} failed to process` : "AI extracted all metrics successfully",
      variant: failCount > 0 ? "destructive" : "default",
    });

    queryClient.invalidateQueries({ queryKey: ["/api/analytics/snapshots"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/top-patterns"] });
    
    setIsUploading(false);
    setUploadProgress({ current: 0, total: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const latestSnapshot = snapshots[0];

  return (
    <Layout title="Analytics">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold mb-2" data-testid="text-page-title">Analytics</h2>
        <p className="text-muted-foreground">Track your content performance across platforms.</p>
      </div>

      {/* Screenshot Upload Section */}
      <Card className="mb-8 border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Upload Analytics Screenshots
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload screenshots from TikTok, Instagram, or other platforms. AI will read and extract the metrics automatically to help learn what content performs best.
              </p>
              
              {/* Account Selector */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Select Account</label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger className="w-full max-w-xs" data-testid="select-account">
                    <SelectValue placeholder="Choose an account..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.length === 0 ? (
                      <SelectItem value="none" disabled>No accounts - add in Accounts tab</SelectItem>
                    ) : (
                      accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id} data-testid={`account-option-${account.id}`}>
                          {account.platform.toUpperCase()} - {account.accountName}
                          {account.accountHandle && ` (@${account.accountHandle})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                data-testid="input-screenshot-upload"
              />
              <ResponsiveTooltip content="Upload analytics images">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || !selectedAccountId}
                  className="gap-2"
                  data-testid="button-upload-screenshot"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing {uploadProgress.current}/{uploadProgress.total}...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      Upload Screenshots
                    </>
                  )}
                </Button>
              </ResponsiveTooltip>
            </div>
            <div className="flex gap-4 text-center">
              <div className="p-4 bg-background rounded-lg">
                <p className="text-2xl font-bold text-primary">{snapshots.length}</p>
                <p className="text-xs text-muted-foreground">Snapshots</p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <p className="text-2xl font-bold text-primary">{topPatterns.length}</p>
                <p className="text-xs text-muted-foreground">Top Posts</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extracted Analytics Summary */}
      {latestSnapshot && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Latest {latestSnapshot.platform?.toUpperCase()} Analytics
            {latestSnapshot.reportingRange && (
              <span className="text-xs bg-muted px-2 py-1 rounded ml-2">{String(latestSnapshot.reportingRange)}</span>
            )}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {latestSnapshot.postViews && (
              <Card className="border-none shadow-sm">
                <CardContent className="p-4 text-center">
                  <Eye className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{formatNumber(latestSnapshot.postViews)}</p>
                  <p className="text-xs text-muted-foreground">Post Views</p>
                </CardContent>
              </Card>
            )}
            {latestSnapshot.profileViews && (
              <Card className="border-none shadow-sm">
                <CardContent className="p-4 text-center">
                  <Users className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">{formatNumber(latestSnapshot.profileViews)}</p>
                  <p className="text-xs text-muted-foreground">Profile Views</p>
                </CardContent>
              </Card>
            )}
            {latestSnapshot.likes && (
              <Card className="border-none shadow-sm">
                <CardContent className="p-4 text-center">
                  <ThumbsUp className="w-5 h-5 mx-auto mb-2 text-pink-500" />
                  <p className="text-2xl font-bold">{formatNumber(latestSnapshot.likes)}</p>
                  <p className="text-xs text-muted-foreground">Likes</p>
                </CardContent>
              </Card>
            )}
            {latestSnapshot.comments && (
              <Card className="border-none shadow-sm">
                <CardContent className="p-4 text-center">
                  <MessageSquare className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{formatNumber(latestSnapshot.comments)}</p>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </CardContent>
              </Card>
            )}
            {latestSnapshot.shares && (
              <Card className="border-none shadow-sm">
                <CardContent className="p-4 text-center">
                  <Share2 className="w-5 h-5 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{formatNumber(latestSnapshot.shares)}</p>
                  <p className="text-xs text-muted-foreground">Shares</p>
                </CardContent>
              </Card>
            )}
            {latestSnapshot.confidenceScore && (
              <Card className="border-none shadow-sm">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-5 h-5 mx-auto mb-2 text-amber-500" />
                  <p className="text-2xl font-bold">{latestSnapshot.confidenceScore}%</p>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Audience Data */}
          {latestSnapshot.audienceData && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {(latestSnapshot.audienceData as any).gender && (
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" /> Gender Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-4">
                    {(latestSnapshot.audienceData as any).gender.male && (
                      <div className="flex-1 text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                        <p className="text-xl font-bold text-blue-600">{(latestSnapshot.audienceData as any).gender.male}%</p>
                        <p className="text-xs text-muted-foreground">Male</p>
                      </div>
                    )}
                    {(latestSnapshot.audienceData as any).gender.female && (
                      <div className="flex-1 text-center p-2 bg-pink-50 dark:bg-pink-950/30 rounded">
                        <p className="text-xl font-bold text-pink-600">{(latestSnapshot.audienceData as any).gender.female}%</p>
                        <p className="text-xs text-muted-foreground">Female</p>
                      </div>
                    )}
                    {(latestSnapshot.audienceData as any).gender.other && (
                      <div className="flex-1 text-center p-2 bg-purple-50 dark:bg-purple-950/30 rounded">
                        <p className="text-xl font-bold text-purple-600">{(latestSnapshot.audienceData as any).gender.other}%</p>
                        <p className="text-xs text-muted-foreground">Other</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {latestSnapshot.bestTimes && (
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Best Time to Post
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">
                      {(latestSnapshot.bestTimes as any).day} at {(latestSnapshot.bestTimes as any).time}
                    </p>
                    <p className="text-xs text-muted-foreground">When your audience is most active</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Top Posts */}
          {topPatterns.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Top Performing Posts
              </h4>
              <div className="space-y-2">
                {topPatterns.slice(0, 5).map((post, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{post.title}</p>
                      {post.postedOn && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {post.postedOn}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatNumber(post.views)}</p>
                      <p className="text-xs text-muted-foreground">views</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !isConnected ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-6">
            <Youtube className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Connect YouTube to See Analytics</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Connect your YouTube channel to view real-time analytics including views, subscribers, watch time, and engagement metrics.
          </p>
          <Link href="/accounts">
            <ResponsiveTooltip content="Link your channel">
              <Button size="lg" data-testid="button-connect-youtube">
                <Youtube className="w-5 h-5 mr-2" />
                Connect YouTube Channel
              </Button>
            </ResponsiveTooltip>
          </Link>
        </div>
      ) : (
        <>
          {connectedYouTubeAccounts.length > 1 && (
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">Select YouTube Channel</label>
              <Select value={effectiveYouTubeAccountId} onValueChange={setSelectedYouTubeAccountId}>
                <SelectTrigger className="w-full max-w-xs" data-testid="select-youtube-channel">
                  <SelectValue placeholder="Choose a channel..." />
                </SelectTrigger>
                <SelectContent>
                  {connectedYouTubeAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id} data-testid={`youtube-channel-option-${account.id}`}>
                      {account.accountName}
                      {account.accountHandle && ` (${account.accountHandle})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {channel && (
            <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-secondary/30 border border-border/50">
              {channel.thumbnailUrl && (
                <img src={channel.thumbnailUrl} alt={channel.title} className="w-12 h-12 rounded-full" />
              )}
              <div>
                <h3 className="font-semibold" data-testid="text-channel-name">{channel.title}</h3>
                <p className="text-sm text-muted-foreground">@{channel.customUrl?.replace("@", "") || channel.channelId}</p>
              </div>
              <div className="ml-auto flex items-center gap-6 text-sm">
                <ResponsiveTooltip content="Sync latest data">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRefreshAllYouTubeData}
                    disabled={loadingChannel || loadingAnalytics || loadingAdvancedAnalytics}
                    className="gap-2"
                    data-testid="button-refresh-youtube"
                  >
                    <RefreshCw className={`w-4 h-4 ${(loadingChannel || loadingAnalytics) ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </ResponsiveTooltip>
                <div className="text-center">
                  <p className="font-bold text-lg" data-testid="text-subscriber-count">{formatNumber(channel.subscriberCount)}</p>
                  <p className="text-muted-foreground">Subscribers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg" data-testid="text-video-count">{formatNumber(channel.videoCount)}</p>
                  <p className="text-muted-foreground">Videos</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg" data-testid="text-total-views">{formatNumber(channel.viewCount)}</p>
                  <p className="text-muted-foreground">Total Views</p>
                </div>
              </div>
            </div>
          )}

          {analytics && (
            <div className="mb-4 text-sm text-muted-foreground">
              Last 30 days ({analytics.period.startDate} to {analytics.period.endDate})
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {loadingAnalytics ? (
              <div className="col-span-4 flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : analytics ? (
              <>
                <Card className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between pb-2">
                      <p className="text-sm font-medium text-muted-foreground">Views (30d)</p>
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold font-display tracking-tight mt-2" data-testid="stat-views">
                      {formatNumber(analytics.views)}
                    </h2>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between pb-2">
                      <p className="text-sm font-medium text-muted-foreground">Watch Time</p>
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold font-display tracking-tight mt-2" data-testid="stat-watchtime">
                      {formatNumber(Math.round(analytics.watchTimeMinutes / 60))}h
                    </h2>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between pb-2">
                      <p className="text-sm font-medium text-muted-foreground">Likes</p>
                      <div className="w-8 h-8 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center">
                        <ThumbsUp className="w-4 h-4" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold font-display tracking-tight mt-2" data-testid="stat-likes">
                      {formatNumber(analytics.likes)}
                    </h2>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between pb-2">
                      <p className="text-sm font-medium text-muted-foreground">New Subscribers</p>
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold font-display tracking-tight mt-2" data-testid="stat-subs">
                      +{formatNumber(analytics.subscribersGained)}
                    </h2>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="col-span-4 text-center py-8">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-6 max-w-md mx-auto">
                  <p className="text-amber-800 dark:text-amber-200 font-medium mb-2">Analytics data not available</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                    This usually means the YouTube account needs to be reconnected with proper permissions, or the channel doesn't have YouTube Analytics API access yet.
                  </p>
                  <div className="flex flex-col gap-2">
                    <ResponsiveTooltip content="Retry fetching data">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRefreshAllYouTubeData}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Try Refresh
                      </Button>
                    </ResponsiveTooltip>
                    <Link href="/accounts">
                      <ResponsiveTooltip content="Reauthorize YouTube">
                        <Button size="sm" variant="default" className="gap-2 w-full">
                          <Youtube className="w-4 h-4" />
                          Reconnect YouTube
                        </Button>
                      </ResponsiveTooltip>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold" data-testid="stat-comments">{formatNumber(analytics.comments)}</p>
                  <p className="text-sm text-muted-foreground mt-1">in the last 30 days</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-green-500" />
                    Shares
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold" data-testid="stat-shares">{formatNumber(analytics.shares)}</p>
                  <p className="text-sm text-muted-foreground mt-1">in the last 30 days</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    Avg. View Duration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold" data-testid="stat-avg-duration">
                    {Math.round(analytics.avgViewDuration)}s
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">per video view</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Advanced Analytics Section */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Advanced Analytics
            </h3>

            {/* Loading state for advanced analytics */}
            {loadingAdvancedAnalytics && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                <span className="text-muted-foreground">Loading advanced analytics...</span>
              </div>
            )}

            {/* Check if any advanced analytics data is available after loading */}
            {!loadingAdvancedAnalytics && !hasAdvancedData && (
              <Card className="border-none shadow-sm mb-6">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                  <h4 className="font-medium mb-2">Advanced Analytics Not Available</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    To see traffic sources, device breakdown, geography, and more, you need to grant analytics permissions. Click below to revoke old permissions and reconnect with the required analytics scope.
                  </p>
                  <ResponsiveTooltip content="Reset permissions">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      data-testid="button-reconnect-youtube"
                      onClick={async () => {
                      if (!selectedYouTubeAccountId) {
                        toast({
                          title: "Select an account",
                          description: "Please select a YouTube account first",
                          variant: "destructive",
                        });
                        return;
                      }
                      try {
                        const res = await fetch(`/api/youtube/revoke-and-reconnect/${selectedYouTubeAccountId}`, {
                          method: "POST",
                          credentials: "include",
                        });
                        if (res.ok) {
                          const data = await res.json();
                          window.location.href = data.authUrl;
                        } else {
                          const error = await res.json();
                          toast({
                            title: "Failed to reconnect",
                            description: error.error || "Please try again",
                            variant: "destructive",
                          });
                        }
                      } catch (err) {
                        window.location.href = "/api/youtube/connect";
                      }
                    }}
                  >
                      <Youtube className="w-4 h-4 mr-2" />
                      Revoke &amp; Reconnect YouTube
                    </Button>
                  </ResponsiveTooltip>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Traffic Sources */}
              {trafficSources?.trafficSources && trafficSources.trafficSources.length > 0 && (
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-500" />
                      Traffic Sources
                    </CardTitle>
                    <CardDescription>Where your views come from</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trafficSources.trafficSources.slice(0, 5).map((source, i) => {
                        const totalViews = trafficSources.trafficSources.reduce((sum, s) => sum + s.views, 0);
                        const percentage = totalViews > 0 ? Math.round((source.views / totalViews) * 100) : 0;
                        const sourceName = source.source.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                        return (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm truncate flex-1">{sourceName}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percentage}%` }} />
                              </div>
                              <span className="text-sm font-medium w-12 text-right">{formatNumber(source.views)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Device Breakdown */}
              {deviceAnalytics?.devices && deviceAnalytics.devices.length > 0 && (
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-purple-500" />
                      Device Types
                    </CardTitle>
                    <CardDescription>How viewers watch your content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {deviceAnalytics.devices.map((device, i) => {
                        const totalViews = deviceAnalytics.devices.reduce((sum, d) => sum + d.views, 0);
                        const percentage = totalViews > 0 ? Math.round((device.views / totalViews) * 100) : 0;
                        const deviceIcon = device.device === "MOBILE" ? <Smartphone className="w-4 h-4" /> 
                          : device.device === "DESKTOP" ? <Monitor className="w-4 h-4" /> 
                          : device.device === "TV" ? <Tv className="w-4 h-4" /> 
                          : <Monitor className="w-4 h-4" />;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                              {deviceIcon}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between text-sm">
                                <span>{device.device}</span>
                                <span className="font-medium">{percentage}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Geographic Data */}
              {geoAnalytics?.countries && geoAnalytics.countries.length > 0 && (
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      Top Countries
                    </CardTitle>
                    <CardDescription>Where your audience is located</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {geoAnalytics.countries.slice(0, 5).map((country, i) => (
                        <div key={i} className="flex items-center justify-between py-1">
                          <span className="text-sm">{country.country}</span>
                          <span className="text-sm font-medium">{formatNumber(country.views)} views</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Best Posting Times */}
              {peakTimes?.byDayOfWeek && peakTimes.byDayOfWeek.length > 0 && (
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      Best Days to Post
                    </CardTitle>
                    <CardDescription>When your audience is most active</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3 p-3 bg-amber-500/10 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Best day to post</p>
                      <p className="text-lg font-bold text-amber-600">{peakTimes.bestDay}</p>
                    </div>
                    <div className="space-y-2">
                      {peakTimes.byDayOfWeek.slice(0, 4).map((day, i) => {
                        const maxViews = Math.max(...peakTimes.byDayOfWeek.map(d => d.views));
                        const percentage = maxViews > 0 ? Math.round((day.views / maxViews) * 100) : 0;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-sm w-20">{day.day.substring(0, 3)}</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-12 text-right">{formatNumber(day.views)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Top Videos with Retention */}
            {topVideosData?.topVideos && topVideosData.topVideos.length > 0 && (
              <Card className="border-none shadow-sm mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-red-500" />
                    Top Performing Videos (Last 30 Days)
                  </CardTitle>
                  <CardDescription>Your best videos with retention metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topVideosData.topVideos.slice(0, 5).map((video, i) => (
                      <div key={video.videoId} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                        {video.thumbnail && (
                          <img src={video.thumbnail} alt={video.title} className="w-20 h-12 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{video.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Avg. view: {Math.round(video.avgDuration)}s
                          </p>
                        </div>
                        <div className="flex gap-4 text-center">
                          <div>
                            <p className="font-bold text-primary">{formatNumber(video.views)}</p>
                            <p className="text-xs text-muted-foreground">views</p>
                          </div>
                          <div>
                            <p className="font-bold text-pink-500">{formatNumber(video.likes)}</p>
                            <p className="text-xs text-muted-foreground">likes</p>
                          </div>
                          <div>
                            <p className="font-bold text-blue-500">{formatNumber(video.comments)}</p>
                            <p className="text-xs text-muted-foreground">comments</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
