import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, Eye, Clock, ThumbsUp, MessageSquare, Share2, Youtube, Loader2, Upload, Image as ImageIcon, Trophy, Calendar, MapPin } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { AnalyticsSnapshot } from "@shared/schema";

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

  const { data: channel, isLoading: loadingChannel, error: channelError } = useQuery<YouTubeChannel>({
    queryKey: ["/api/youtube/channel"],
    retry: false,
  });

  const { data: analytics, isLoading: loadingAnalytics } = useQuery<YouTubeAnalytics>({
    queryKey: ["/api/youtube/analytics"],
    enabled: !!channel,
    retry: false,
  });

  const { data: snapshots = [] } = useQuery<AnalyticsSnapshot[]>({
    queryKey: ["/api/analytics/snapshots"],
  });

  const { data: topPatterns = [] } = useQuery<{ title: string; views: number; postedOn?: string }[]>({
    queryKey: ["/api/analytics/top-patterns"],
  });

  const isConnected = !!channel && !channelError;
  const isLoading = loadingChannel;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("screenshot", file);
      formData.append("userId", "demo-user");

      const response = await fetch("/api/analytics/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      toast({
        title: "Screenshot analyzed!",
        description: `Extracted ${result.extracted.platform} analytics with ${result.extracted.confidenceScore}% confidence`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/analytics/snapshots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/top-patterns"] });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                data-testid="input-screenshot-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2"
                data-testid="button-upload-screenshot"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    Upload Screenshot
                  </>
                )}
              </Button>
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
            <Button size="lg" data-testid="button-connect-youtube">
              <Youtube className="w-5 h-5 mr-2" />
              Connect YouTube Channel
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-secondary/30 border border-border/50">
            {channel.thumbnailUrl && (
              <img src={channel.thumbnailUrl} alt={channel.title} className="w-12 h-12 rounded-full" />
            )}
            <div>
              <h3 className="font-semibold" data-testid="text-channel-name">{channel.title}</h3>
              <p className="text-sm text-muted-foreground">@{channel.customUrl?.replace("@", "") || channel.channelId}</p>
            </div>
            <div className="ml-auto flex gap-6 text-sm">
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
              <div className="col-span-4 text-center py-8 text-muted-foreground">
                <p>Analytics data not available. This may require YouTube Analytics API access.</p>
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
        </>
      )}
    </Layout>
  );
}
