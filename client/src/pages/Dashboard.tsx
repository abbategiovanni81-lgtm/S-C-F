import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Calendar, Activity, FileText, Sparkles, TrendingUp, Clock, Target, Video, Image as ImageIcon, Zap, ArrowRight, CheckCircle2, AlertCircle, Users } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { BrandBrief, GeneratedContent, SocialAccount } from "@shared/schema";
import { ResponsiveTooltip } from "@/components/ui/responsive-tooltip";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";

const DEMO_USER_ID = "demo-user";

export default function Dashboard() {
  const { data: briefs = [] } = useQuery<BrandBrief[]>({
    queryKey: [`/api/brand-briefs?userId=${DEMO_USER_ID}`],
  });

  const { data: pendingContent = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=pending"],
  });

  const { data: approvedContent = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=approved"],
  });
  
  const { data: allContent = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content"],
  });

  const { data: socialAccounts = [] } = useQuery<SocialAccount[]>({
    queryKey: [`/api/social-accounts?userId=${DEMO_USER_ID}`],
  });

  const connectedAccounts = socialAccounts.filter(acc => acc.isConnected === "connected");
  
  const inferContentType = (metadata: any): string => {
    if (metadata?.contentType) return metadata.contentType;
    if (metadata?.imagePrompt) return "image";
    if (metadata?.tiktokTextContent) return "tiktok_text";
    return "video";
  };
  
  const readyToPostCount = approvedContent.filter(c => {
    const metadata = c.generationMetadata as any;
    const contentType = inferContentType(metadata);
    // Manually marked as ready (for legacy content)
    if (metadata?.manuallyReady) return true;
    // TikTok text ready immediately
    if (contentType === "tiktok_text") return true;
    // Image/carousel needs generated or uploaded image
    if (contentType === "image" || contentType === "carousel") {
      return metadata?.generatedImageUrl || metadata?.uploadedImageUrl;
    }
    // Video needs assets
    return metadata?.mergedVideoUrl || metadata?.generatedVideoUrl || metadata?.voiceoverAudioUrl;
  }).length;
  
  // Calculate week's schedule
  const weekStart = startOfWeek(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Get scheduled content for this week
  const scheduledThisWeek = allContent.filter(c => 
    c.scheduledFor && new Date(c.scheduledFor) >= weekStart && 
    new Date(c.scheduledFor) < addDays(weekStart, 7)
  );
  
  // AI Suggestions (simulated based on brand briefs and content patterns)
  // TODO: Replace with actual AI-powered suggestions from analytics and trends
  const aiSuggestions = [
    {
      icon: TrendingUp,
      title: "Trending Format Alert",
      description: "Carousel posts are performing 47% better this week",
      action: "Create Carousel",
      href: "/content-queue",
      color: "text-purple-500"
    },
    {
      icon: Clock,
      title: "Optimal Posting Time",
      description: "Your audience is most active at 6-8 PM on weekdays",
      action: "Schedule Now",
      href: "/schedule",
      color: "text-blue-500"
    },
    {
      icon: Sparkles,
      title: "Content Gap Detected",
      description: "You haven't posted a Reel in 5 days",
      action: "Generate Reel",
      href: "/content-queue",
      color: "text-amber-500"
    },
    {
      icon: Target,
      title: "Engagement Opportunity",
      description: "3 comments need replies on your latest posts",
      action: "View Comments",
      href: "/social-listening",
      color: "text-emerald-500"
    }
  ];
  
  // Content format breakdown
  const contentByFormat = {
    video: allContent.filter(c => c.contentType.includes("video") || c.videoUrl).length,
    image: allContent.filter(c => c.contentType.includes("image") || c.contentType.includes("carousel")).length,
    text: allContent.filter(c => c.contentType.includes("text") || c.caption).length,
  };
  
  // Weekly engagement stats (simulated)
  // TODO: Fetch real engagement data from connected social accounts via platform APIs
  const engagementStats = {
    totalViews: 45230,
    totalLikes: 3847,
    totalComments: 294,
    totalShares: 156,
    viewsChange: "+12.4%",
    likesChange: "+8.7%",
    commentsChange: "+15.2%",
    sharesChange: "+5.3%"
  };

  return (
    <Layout title="Dashboard">
      {/* Hero Section with Brand Overview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight mb-2">
              Welcome to SocialCommand 🚀
            </h1>
            <p className="text-muted-foreground">Your Saturday Morning Content Factory</p>
          </div>
          <Link href="/brand-briefs" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Create Content
          </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-muted-foreground">Brand Briefs</p>
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-4xl font-bold font-display tracking-tight" data-testid="stat-briefs">{briefs.length}</h2>
              <p className="text-xs text-muted-foreground mt-2">Active brand profiles</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-4xl font-bold font-display tracking-tight" data-testid="stat-pending">{pendingContent.length}</h2>
              <p className="text-xs text-muted-foreground mt-2">Awaiting approval</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-muted-foreground">Ready to Post</p>
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-4xl font-bold font-display tracking-tight" data-testid="stat-scheduled">{readyToPostCount}</h2>
              <p className="text-xs text-muted-foreground mt-2">With generated assets</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-muted-foreground">Connected Accounts</p>
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-4xl font-bold font-display tracking-tight" data-testid="stat-accounts">{connectedAccounts.length}</h2>
              <p className="text-xs text-muted-foreground mt-2">Social channels</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Main Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Content (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Ava AI Suggestions */}
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <CardTitle className="text-lg font-display">Ava's AI Suggestions</CardTitle>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
                AI Powered
              </span>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${suggestion.color.replace('text-', 'bg-').replace('500', '500/20')} flex items-center justify-center shrink-0`}>
                        <suggestion.icon className={`w-5 h-5 ${suggestion.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium mb-1 text-sm">{suggestion.title}</h4>
                        <p className="text-xs text-muted-foreground mb-3">{suggestion.description}</p>
                        <Link href={suggestion.href} className={`text-xs ${suggestion.color} font-medium hover:underline inline-flex items-center gap-1`}>
                          {suggestion.action}
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Content Schedule */}
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-display">This Week's Schedule</CardTitle>
              </div>
              <Link href="/schedule" className="text-sm text-primary hover:underline font-medium">
                View Calendar →
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => {
                  const dayContent = scheduledThisWeek.filter(c => 
                    c.scheduledFor && isSameDay(new Date(c.scheduledFor), day)
                  );
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div key={index} className={`p-3 rounded-lg text-center ${
                      isToday 
                        ? 'bg-primary/20 border-2 border-primary' 
                        : 'bg-secondary/50 border border-border/50'
                    }`}>
                      <div className="text-xs text-muted-foreground mb-1">
                        {format(day, 'EEE')}
                      </div>
                      <div className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      {dayContent.length > 0 && (
                        <div className="mt-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto"></div>
                          <div className="text-[10px] text-muted-foreground mt-1">{dayContent.length}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {scheduledThisWeek.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No content scheduled for this week</p>
                  <Link href="/content-queue" className="text-sm text-primary hover:underline mt-2 inline-block">
                    Create and schedule content
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Engagement Stats */}
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-display">Engagement Overview</CardTitle>
              </div>
              <Link href="/analytics" className="text-sm text-primary hover:underline font-medium">
                View Analytics →
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-muted-foreground">Views</span>
                  </div>
                  <p className="text-2xl font-bold">{engagementStats.totalViews.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{engagementStats.viewsChange}</p>
                </div>
                
                <div className="p-4 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 border border-pink-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                    <span className="text-xs font-medium text-muted-foreground">Likes</span>
                  </div>
                  <p className="text-2xl font-bold">{engagementStats.totalLikes.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{engagementStats.likesChange}</p>
                </div>
                
                <div className="p-4 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-medium text-muted-foreground">Comments</span>
                  </div>
                  <p className="text-2xl font-bold">{engagementStats.totalComments.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{engagementStats.commentsChange}</p>
                </div>
                
                <div className="p-4 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-medium text-muted-foreground">Shares</span>
                  </div>
                  <p className="text-2xl font-bold">{engagementStats.totalShares.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{engagementStats.sharesChange}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Format Breakdown */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-display">Content by Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Videos</span>
                    </div>
                    <span className="text-sm font-bold">{contentByFormat.video}</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600" 
                      style={{ width: `${(contentByFormat.video / (allContent.length || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Images & Carousels</span>
                    </div>
                    <span className="text-sm font-bold">{contentByFormat.image}</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600" 
                      style={{ width: `${(contentByFormat.image / (allContent.length || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium">Text Posts</span>
                    </div>
                    <span className="text-sm font-bold">{contentByFormat.text}</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600" 
                      style={{ width: `${(contentByFormat.text / (allContent.length || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar (1/3 width) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <ResponsiveTooltip content="Define your brand voice">
                  <Link href="/brand-briefs" className="block w-full p-4 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white text-center font-medium hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg" data-testid="button-new-brief">
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>New Brand Brief</span>
                    </div>
                  </Link>
                </ResponsiveTooltip>
                
                <ResponsiveTooltip content="Generate AI content">
                  <Link href="/content-queue" className="block w-full p-3 rounded-lg border-2 border-primary text-primary text-center font-medium hover:bg-primary hover:text-primary-foreground transition-all" data-testid="button-generate-content">
                    Generate Content
                  </Link>
                </ResponsiveTooltip>
                
                <ResponsiveTooltip content="Approve pending content">
                  <Link href="/content-queue" className="block w-full p-3 rounded-lg bg-secondary text-secondary-foreground text-center font-medium hover:bg-secondary/80 transition-colors" data-testid="button-review-content">
                    Review Pending ({pendingContent.length})
                  </Link>
                </ResponsiveTooltip>
                
                <ResponsiveTooltip content="Link social platforms">
                  <Link href="/accounts" className="block w-full p-3 rounded-lg bg-secondary text-secondary-foreground text-center font-medium hover:bg-secondary/80 transition-colors" data-testid="button-connect-account">
                    Connect Account
                  </Link>
                </ResponsiveTooltip>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started Guide */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-display">Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${briefs.length > 0 ? 'bg-emerald-500 text-white' : 'bg-secondary text-muted-foreground'}`}>
                    {briefs.length > 0 ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">1</span>}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">Check AI Engines</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Verify AI services are connected
                    </p>
                    <Link href="/ai-engines" className="text-xs text-primary hover:underline" data-testid="link-ai-engines">
                      View AI Engines →
                    </Link>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${briefs.length > 0 ? 'bg-emerald-500 text-white' : 'bg-secondary text-muted-foreground'}`}>
                    {briefs.length > 0 ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">2</span>}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">Create Brand Brief</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Define brand voice and goals
                    </p>
                    <Link href="/brand-briefs" className="text-xs text-primary hover:underline" data-testid="link-create-brief">
                      Go to Brand Briefs →
                    </Link>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${allContent.length > 0 ? 'bg-emerald-500 text-white' : 'bg-secondary text-muted-foreground'}`}>
                    {allContent.length > 0 ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">3</span>}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">Generate Content</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      AI creates scripts and assets
                    </p>
                    <Link href="/content-queue" className="text-xs text-primary hover:underline" data-testid="link-content-queue">
                      View Content Queue →
                    </Link>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${connectedAccounts.length > 0 ? 'bg-emerald-500 text-white' : 'bg-secondary text-muted-foreground'}`}>
                    {connectedAccounts.length > 0 ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">4</span>}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">Connect Accounts</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Link your social platforms
                    </p>
                    <Link href="/accounts" className="text-xs text-primary hover:underline">
                      Manage Accounts →
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Status */}
          {connectedAccounts.length > 0 && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-display">Connected Platforms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {connectedAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <div>
                          <p className="text-sm font-medium">{account.platform}</p>
                          <p className="text-xs text-muted-foreground">{account.accountName}</p>
                        </div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
