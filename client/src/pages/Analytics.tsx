import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, Eye, Clock, ThumbsUp, MessageSquare, Share2, Youtube, Loader2 } from "lucide-react";
import { Link } from "wouter";

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
  const { data: channel, isLoading: loadingChannel, error: channelError } = useQuery<YouTubeChannel>({
    queryKey: ["/api/youtube/channel"],
    retry: false,
  });

  const { data: analytics, isLoading: loadingAnalytics } = useQuery<YouTubeAnalytics>({
    queryKey: ["/api/youtube/analytics"],
    enabled: !!channel,
    retry: false,
  });

  const isConnected = !!channel && !channelError;
  const isLoading = loadingChannel;

  return (
    <Layout title="Analytics">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold mb-2" data-testid="text-page-title">Analytics</h2>
        <p className="text-muted-foreground">Track your content performance across platforms.</p>
      </div>

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
