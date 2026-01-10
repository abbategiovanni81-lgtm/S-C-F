import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Calendar, Activity, FileText } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { BrandBrief, GeneratedContent, SocialAccount } from "@shared/schema";
import { ResponsiveTooltip } from "@/components/ui/responsive-tooltip";

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

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-muted-foreground">Brand Briefs</p>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-3xl font-bold font-display tracking-tight" data-testid="stat-briefs">{briefs.length}</h2>
              <p className="text-xs text-muted-foreground mt-1">Create briefs to generate content</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-muted-foreground">Pending Content</p>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-3xl font-bold font-display tracking-tight" data-testid="stat-pending">{pendingContent.length}</h2>
              <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-muted-foreground">Ready to Post</p>
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-3xl font-bold font-display tracking-tight" data-testid="stat-scheduled">{readyToPostCount}</h2>
              <p className="text-xs text-muted-foreground mt-1">With generated assets</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-muted-foreground">Connected Accounts</p>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-3xl font-bold font-display tracking-tight" data-testid="stat-accounts">{connectedAccounts.length}</h2>
              <p className="text-xs text-muted-foreground mt-1">Social channels</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                <h3 className="font-medium mb-2">1. Check AI Engines</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  See which AI services are connected and configured.
                </p>
                <Link href="/ai-engines" className="text-sm text-primary font-medium hover:underline" data-testid="link-ai-engines">
                  View AI Engines →
                </Link>
              </div>

              <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                <h3 className="font-medium mb-2">2. Create a Brand Brief</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Define your brand voice, target audience, and content goals.
                </p>
                <Link href="/brand-briefs" className="text-sm text-primary font-medium hover:underline" data-testid="link-create-brief">
                  Go to Brand Briefs →
                </Link>
              </div>

              <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                <h3 className="font-medium mb-2">3. Generate Content</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  AI will create scripts, captions, and hashtags based on your brief.
                </p>
                <Link href="/content-queue" className="text-sm text-primary font-medium hover:underline" data-testid="link-content-queue">
                  View Content Queue →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <ResponsiveTooltip content="Define your brand voice">
                <Link href="/brand-briefs" className="block w-full p-3 rounded-lg bg-primary text-primary-foreground text-center font-medium hover:bg-primary/90 transition-colors" data-testid="button-new-brief">
                  + New Brand Brief
                </Link>
              </ResponsiveTooltip>
              <ResponsiveTooltip content="Approve pending content">
                <Link href="/content-queue" className="block w-full p-3 rounded-lg bg-secondary text-secondary-foreground text-center font-medium hover:bg-secondary/80 transition-colors" data-testid="button-review-content">
                  Review Content
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
      </div>
    </Layout>
  );
}
