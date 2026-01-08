import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Loader2, Search, Youtube, Trash2, Play, BarChart2, 
  FileText, Lightbulb, Target, TrendingUp, AlertCircle, CheckCircle,
  GitCompare, Clock, Eye, ThumbsUp, MessageSquare
} from "lucide-react";

interface AnalyzedVideo {
  id: string;
  videoId: string;
  videoUrl: string;
  title: string;
  channelName?: string;
  duration?: number;
  viewCount?: number;
  likeCount?: number;
  thumbnailUrl?: string;
  transcript?: string;
  status: string;
  createdAt: string;
}

interface VideoAnalysisResult {
  id: string;
  videoId: string;
  analysisType: string;
  summary?: string;
  hookAnalysis?: { type: string; duration: number; strength: number; transcript: string };
  contentStructure?: { section: string; startTime: number; endTime: number; summary: string }[];
  keyTopics?: string[];
  ctaAnalysis?: { hasCta: boolean; type: string; placement: string; strength: number };
  toneAnalysis?: { primary: string; secondary: string; consistency: number };
  engagementTips?: string[];
  scriptIdeas?: string[];
  strengths?: string[];
  weaknesses?: string[];
}

interface VideoComparison {
  id: string;
  name: string;
  videoIds: string[];
  winningPatterns?: string[];
  contentGaps?: string[];
  recommendations?: string[];
  comparisonResult?: { comparisonSummary: string };
  createdAt: string;
}

export default function ContentResearch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [comparisonName, setComparisonName] = useState("");
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("videos");

  const { data: videos = [], isLoading: loadingVideos } = useQuery<AnalyzedVideo[]>({
    queryKey: ["/api/content-analysis/videos"],
  });

  const { data: comparisons = [] } = useQuery<VideoComparison[]>({
    queryKey: ["/api/content-analysis/comparisons"],
  });

  const selectedVideo = videos.find(v => v.id === selectedVideoId);

  const { data: analysisResults = [] } = useQuery<VideoAnalysisResult[]>({
    queryKey: ["/api/content-analysis/videos", selectedVideoId, "results"],
    enabled: !!selectedVideoId,
    queryFn: async () => {
      if (!selectedVideoId) return [];
      const res = await fetch(`/api/content-analysis/videos/${selectedVideoId}/results`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  const addVideoMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch("/api/content-analysis/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add video");
      }
      return res.json();
    },
    onSuccess: (video) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-analysis/videos"] });
      setNewVideoUrl("");
      setSelectedVideoId(video.id);
      toast({ title: "Video added! Click 'Fetch Transcript' to get the content." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add video", description: error.message, variant: "destructive" });
    },
  });

  const scrapeVideoMutation = useMutation({
    mutationFn: async (videoDbId: string) => {
      const res = await fetch(`/api/content-analysis/videos/${videoDbId}/scrape`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to scrape video");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-analysis/videos"] });
      toast({ title: "Transcript fetched successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to fetch transcript", description: error.message, variant: "destructive" });
    },
  });

  const analyzeVideoMutation = useMutation({
    mutationFn: async (videoDbId: string) => {
      const res = await fetch(`/api/content-analysis/videos/${videoDbId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisType: "full" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to analyze video");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-analysis/videos", selectedVideoId, "results"] });
      toast({ title: "Analysis complete!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to analyze video", description: error.message, variant: "destructive" });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoDbId: string) => {
      const res = await fetch(`/api/content-analysis/videos/${videoDbId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete video");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-analysis/videos"] });
      setSelectedVideoId(null);
      toast({ title: "Video deleted" });
    },
  });

  const compareVideosMutation = useMutation({
    mutationFn: async ({ videoIds, name }: { videoIds: string[]; name: string }) => {
      const res = await fetch("/api/content-analysis/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoIds, name }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to compare videos");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-analysis/comparisons"] });
      setShowComparisonDialog(false);
      setSelectedForComparison([]);
      setComparisonName("");
      setActiveTab("comparisons");
      toast({ title: "Comparison complete!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to compare videos", description: error.message, variant: "destructive" });
    },
  });

  const toggleVideoForComparison = (videoId: string) => {
    setSelectedForComparison(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatNumber = (num?: number) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const latestAnalysis = analysisResults[0];

  return (
    <Layout title="Content Research">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="page-title">Content Research</h1>
            <p className="text-muted-foreground">Analyze competitor YouTube videos to find winning patterns</p>
          </div>
          {selectedForComparison.length >= 2 && (
            <Button onClick={() => setShowComparisonDialog(true)} data-testid="button-compare-selected">
              <GitCompare className="w-4 h-4 mr-2" />
              Compare {selectedForComparison.length} Videos
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="videos" data-testid="tab-videos">
              <Youtube className="w-4 h-4 mr-2" />
              Videos ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="comparisons" data-testid="tab-comparisons">
              <GitCompare className="w-4 h-4 mr-2" />
              Comparisons ({comparisons.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add YouTube Video
                </CardTitle>
                <CardDescription>Paste a YouTube URL to analyze its content and structure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://youtube.com/watch?v=..."
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    data-testid="input-video-url"
                  />
                  <Button 
                    onClick={() => addVideoMutation.mutate(newVideoUrl)}
                    disabled={!newVideoUrl || addVideoMutation.isPending}
                    data-testid="button-add-video"
                  >
                    {addVideoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Your Videos</CardTitle>
                  <CardDescription>Select to view analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingVideos ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : videos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Youtube className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No videos added yet</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {videos.map((video) => (
                          <div
                            key={video.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedVideoId === video.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                            }`}
                            onClick={() => setSelectedVideoId(video.id)}
                            data-testid={`video-item-${video.id}`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={selectedForComparison.includes(video.id)}
                                onCheckedChange={() => toggleVideoForComparison(video.id)}
                                onClick={(e) => e.stopPropagation()}
                                disabled={video.status !== "completed"}
                                data-testid={`checkbox-video-${video.id}`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{video.title}</p>
                                {video.channelName && (
                                  <p className="text-xs text-muted-foreground truncate">{video.channelName}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant={video.status === "completed" ? "default" : video.status === "failed" ? "destructive" : "secondary"}
                                    className="text-xs"
                                  >
                                    {video.status}
                                  </Badge>
                                  {video.viewCount && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Eye className="w-3 h-3" />
                                      {formatNumber(video.viewCount)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Video Details</CardTitle>
                      <CardDescription>
                        {selectedVideo ? selectedVideo.title : "Select a video to view details"}
                      </CardDescription>
                    </div>
                    {selectedVideo && (
                      <div className="flex gap-2">
                        {selectedVideo.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => scrapeVideoMutation.mutate(selectedVideo.id)}
                            disabled={scrapeVideoMutation.isPending}
                            data-testid="button-fetch-transcript"
                          >
                            {scrapeVideoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                            Fetch Transcript
                          </Button>
                        )}
                        {selectedVideo.status === "completed" && (
                          <Button
                            size="sm"
                            onClick={() => analyzeVideoMutation.mutate(selectedVideo.id)}
                            disabled={analyzeVideoMutation.isPending}
                            data-testid="button-analyze"
                          >
                            {analyzeVideoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BarChart2 className="w-4 h-4 mr-2" />}
                            Analyze with AI
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteVideoMutation.mutate(selectedVideo.id)}
                          data-testid="button-delete-video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedVideo ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Select a video from the list to view its analysis</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        {selectedVideo.thumbnailUrl && (
                          <img 
                            src={selectedVideo.thumbnailUrl} 
                            alt={selectedVideo.title}
                            className="w-40 h-24 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{selectedVideo.title}</h3>
                          <p className="text-sm text-muted-foreground">{selectedVideo.channelName}</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDuration(selectedVideo.duration)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {formatNumber(selectedVideo.viewCount)} views
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4" />
                              {formatNumber(selectedVideo.likeCount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selectedVideo.transcript && (
                        <div>
                          <h4 className="font-medium mb-2">Transcript Preview</h4>
                          <div className="p-3 bg-muted/50 rounded-lg text-sm max-h-32 overflow-y-auto">
                            {selectedVideo.transcript.slice(0, 500)}...
                          </div>
                        </div>
                      )}

                      {latestAnalysis && (
                        <div className="space-y-4">
                          <h4 className="font-medium flex items-center gap-2">
                            <BarChart2 className="w-4 h-4" />
                            AI Analysis Results
                          </h4>

                          {latestAnalysis.summary && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                              <p className="text-sm">{latestAnalysis.summary}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            {latestAnalysis.hookAnalysis && (
                              <div className="p-3 border rounded-lg">
                                <h5 className="text-sm font-medium mb-2">Hook Strength</h5>
                                <Progress value={latestAnalysis.hookAnalysis.strength} className="h-2 mb-1" />
                                <p className="text-xs text-muted-foreground">
                                  {latestAnalysis.hookAnalysis.type} hook ({latestAnalysis.hookAnalysis.strength}%)
                                </p>
                              </div>
                            )}
                            {latestAnalysis.ctaAnalysis && (
                              <div className="p-3 border rounded-lg">
                                <h5 className="text-sm font-medium mb-2">CTA Strength</h5>
                                <Progress value={latestAnalysis.ctaAnalysis.strength} className="h-2 mb-1" />
                                <p className="text-xs text-muted-foreground">
                                  {latestAnalysis.ctaAnalysis.type} at {latestAnalysis.ctaAnalysis.placement}
                                </p>
                              </div>
                            )}
                          </div>

                          {latestAnalysis.keyTopics && latestAnalysis.keyTopics.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium mb-2">Key Topics</h5>
                              <div className="flex flex-wrap gap-2">
                                {latestAnalysis.keyTopics.map((topic, i) => (
                                  <Badge key={i} variant="secondary">{topic}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            {latestAnalysis.strengths && latestAnalysis.strengths.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  Strengths
                                </h5>
                                <ul className="text-sm space-y-1">
                                  {latestAnalysis.strengths.slice(0, 3).map((s, i) => (
                                    <li key={i} className="text-muted-foreground">• {s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {latestAnalysis.weaknesses && latestAnalysis.weaknesses.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                                  Could Improve
                                </h5>
                                <ul className="text-sm space-y-1">
                                  {latestAnalysis.weaknesses.slice(0, 3).map((w, i) => (
                                    <li key={i} className="text-muted-foreground">• {w}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {latestAnalysis.scriptIdeas && latestAnalysis.scriptIdeas.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                                <Lightbulb className="w-4 h-4 text-yellow-500" />
                                Content Ideas Inspired by This Video
                              </h5>
                              <ul className="text-sm space-y-2">
                                {latestAnalysis.scriptIdeas.map((idea, i) => (
                                  <li key={i} className="p-2 bg-muted/50 rounded">• {idea}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparisons" className="space-y-6 mt-4">
            {comparisons.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <GitCompare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">No Comparisons Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Select 2+ videos from the Videos tab and compare them to find winning patterns
                  </p>
                  <Button onClick={() => setActiveTab("videos")}>
                    Go to Videos
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {comparisons.map((comparison) => (
                  <Card key={comparison.id}>
                    <CardHeader>
                      <CardTitle>{comparison.name}</CardTitle>
                      <CardDescription>
                        Compared {comparison.videoIds.length} videos • {new Date(comparison.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {comparison.comparisonResult?.comparisonSummary && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                          <p className="text-sm">{comparison.comparisonResult.comparisonSummary}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {comparison.winningPatterns && comparison.winningPatterns.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              Winning Patterns
                            </h5>
                            <ul className="text-sm space-y-1">
                              {comparison.winningPatterns.map((p, i) => (
                                <li key={i} className="text-muted-foreground">• {p}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {comparison.contentGaps && comparison.contentGaps.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                              <Target className="w-4 h-4 text-yellow-600" />
                              Content Gaps
                            </h5>
                            <ul className="text-sm space-y-1">
                              {comparison.contentGaps.map((g, i) => (
                                <li key={i} className="text-muted-foreground">• {g}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {comparison.recommendations && comparison.recommendations.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                              <Lightbulb className="w-4 h-4 text-purple-600" />
                              Recommendations
                            </h5>
                            <ul className="text-sm space-y-1">
                              {comparison.recommendations.map((r, i) => (
                                <li key={i} className="text-muted-foreground">• {r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showComparisonDialog} onOpenChange={setShowComparisonDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compare Videos</DialogTitle>
              <DialogDescription>
                Analyze {selectedForComparison.length} videos to find winning patterns and content gaps
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Comparison Name</label>
                <Input
                  placeholder="e.g., Competitor Hook Analysis"
                  value={comparisonName}
                  onChange={(e) => setComparisonName(e.target.value)}
                  data-testid="input-comparison-name"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Selected videos:</p>
                <ul className="space-y-1">
                  {selectedForComparison.map(id => {
                    const video = videos.find(v => v.id === id);
                    return video ? (
                      <li key={id} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {video.title.slice(0, 50)}...
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowComparisonDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => compareVideosMutation.mutate({ 
                  videoIds: selectedForComparison, 
                  name: comparisonName || `Comparison - ${new Date().toLocaleDateString()}` 
                })}
                disabled={compareVideosMutation.isPending}
                data-testid="button-confirm-compare"
              >
                {compareVideosMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <GitCompare className="w-4 h-4 mr-2" />}
                Compare Videos
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
