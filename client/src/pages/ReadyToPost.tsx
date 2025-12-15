import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, CheckCircle, Video, Mic, ExternalLink, Loader2, Instagram, Youtube } from "lucide-react";
import type { GeneratedContent, BrandBrief } from "@shared/schema";

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
  const [filterBrief, setFilterBrief] = useState<string>("all");

  const { data: briefs = [] } = useQuery<BrandBrief[]>({
    queryKey: [`/api/brand-briefs?userId=${DEMO_USER_ID}`],
  });

  const { data: approvedContent = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=approved"],
  });

  const { data: postedContentRaw = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=posted"],
  });

  const hasGeneratedAssets = (content: GeneratedContent) => {
    const metadata = content.generationMetadata as any;
    return (
      metadata?.generatedVideoUrl || 
      metadata?.voiceoverAudioUrl || 
      content.videoUrl
    );
  };

  const readyContent = approvedContent.filter((content) => {
    const matchesBrief = filterBrief === "all" || content.briefId === filterBrief;
    return hasGeneratedAssets(content) && matchesBrief;
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

  const getBriefName = (briefId: string) => {
    const brief = briefs.find((b) => b.id === briefId);
    return brief?.name || "Unknown Brand";
  };

  const ContentCard = ({ content, showMarkAsPosted = true }: { content: GeneratedContent; showMarkAsPosted?: boolean }) => {
    const metadata = content.generationMetadata as any;
    const videoUrl = metadata?.generatedVideoUrl || content.videoUrl;
    const audioUrl = metadata?.voiceoverAudioUrl;

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
                  Generated Video
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
            <div className="pt-2 border-t">
              <Button
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
                Mark as Posted
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
    </Layout>
  );
}
