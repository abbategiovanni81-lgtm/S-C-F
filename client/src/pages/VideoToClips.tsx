import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Video, Sparkles, Lightbulb, Clock, Download, Send, Play, Pause, Link2, Info, Edit, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClipSuggestion {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface GeneratedClip {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
  transcript: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  hook?: string;
  caption?: string;
  hashtags?: string[];
}

const defaultSuggestions: ClipSuggestion[] = [
  { id: "key_insights", title: "Key insights and tips", description: "Extract the most valuable advice and insights", icon: "lightbulb" },
  { id: "emotional_highs", title: "Emotional highs", description: "Find the most engaging, emotional moments", icon: "heart" },
  { id: "unique_strategies", title: "Unique strategies", description: "Identify actionable strategies and tactics", icon: "target" },
];

export default function VideoToClips() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showAnalyzingModal, setShowAnalyzingModal] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState("");
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedClips, setGeneratedClips] = useState<GeneratedClip[]>([]);
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [isUrlProcessing, setIsUrlProcessing] = useState(false);

  const [sourceVideoPath, setSourceVideoPath] = useState<string | null>(null);
  const [editingClip, setEditingClip] = useState<GeneratedClip | null>(null);
  const [editHook, setEditHook] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editHashtags, setEditHashtags] = useState("");
  const queryClient = useQueryClient();

  const handleDownload = async (clip: GeneratedClip) => {
    if (!clip.videoUrl) {
      toast({ title: "No video", description: "Video not available for download", variant: "destructive" });
      return;
    }
    const link = document.createElement("a");
    link.href = clip.videoUrl;
    link.download = `${clip.title.replace(/[^a-z0-9]/gi, "_")}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Downloading", description: "Your clip is being downloaded" });
  };

  const openEditModal = (clip: GeneratedClip) => {
    setEditingClip(clip);
    setEditHook(clip.hook || "");
    setEditCaption(clip.caption || clip.transcript || "");
    setEditHashtags(clip.hashtags?.join(" ") || "");
  };

  const generateCaptionMutation = useMutation({
    mutationFn: async (transcript: string) => {
      const res = await fetch("/api/generate/clip-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) throw new Error("Failed to generate caption");
      return res.json();
    },
    onSuccess: (data) => {
      setEditHook(data.hook || "");
      setEditCaption(data.caption || "");
      setEditHashtags(data.hashtags?.join(" ") || "");
      toast({ title: "AI Generated!", description: "Hook, caption and hashtags ready" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate content", variant: "destructive" });
    },
  });

  const addToQueueMutation = useMutation({
    mutationFn: async (params: { clip: GeneratedClip; hook: string; caption: string; hashtags: string }) => {
      const res = await fetch("/api/content-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: params.clip.title,
          mediaUrl: params.clip.videoUrl,
          mediaType: "video",
          caption: params.caption,
          hook: params.hook,
          hashtags: params.hashtags.split(/[\s,]+/).filter(Boolean),
          status: "draft",
        }),
      });
      if (!res.ok) throw new Error("Failed to add to queue");
      return res.json();
    },
    onSuccess: () => {
      setEditingClip(null);
      queryClient.invalidateQueries({ queryKey: ["/api/content-queue"] });
      toast({ title: "Added to Queue!", description: "Your clip is now in the content queue" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add to queue", variant: "destructive" });
    },
  });

  const handleAddToQueue = () => {
    if (!editingClip) return;
    addToQueueMutation.mutate({
      clip: editingClip,
      hook: editHook,
      caption: editCaption,
      hashtags: editHashtags,
    });
  };

  const processMutation = useMutation({
    mutationFn: async (params: { file: File; suggestions: string[]; customPrompt: string }) => {
      const formData = new FormData();
      formData.append("video", params.file);
      formData.append("suggestions", JSON.stringify(params.suggestions));
      formData.append("customPrompt", params.customPrompt);
      
      const res = await fetch("/api/video-to-clips/process", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Processing failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedClips(data.clips);
      setSourceVideoPath(data.sourceVideoPath);
      setShowAnalyzingModal(false);
      setShowSuggestionsModal(false);
      toast({ title: "Clips generated!", description: `Found ${data.clips.length} potential clips using AI` });
    },
    onError: (error: Error) => {
      setShowAnalyzingModal(false);
      setShowSuggestionsModal(false);
      toast({ title: "Processing failed", description: error.message, variant: "destructive" });
    },
  });

  const urlMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch("/api/video-to-clips/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "URL processing failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedClips(data.clips);
      setShowAnalyzingModal(false);
      toast({ title: "Clips generated!", description: `Found ${data.clips.length} potential clips from URL` });
    },
    onError: (error: Error) => {
      setShowAnalyzingModal(false);
      toast({ title: "URL failed", description: error.message, variant: "destructive" });
    },
  });

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast({ title: "Enter a URL", description: "Please paste a video URL", variant: "destructive" });
      return;
    }
    setShowAnalyzingModal(true);
    setAnalysisProgress(0);
    setAnalysisStep("Downloading video from URL...");
    
    const steps = [
      "Downloading video from URL...", 
      "Extracting audio...", 
      "Transcribing with Whisper AI...", 
      "Analyzing for best clips...",
      "Extracting clips...",
      "Finalizing results..."
    ];
    let stepIndex = 0;
    
    const interval = setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      setAnalysisStep(steps[stepIndex]);
      setAnalysisProgress(prev => Math.min(prev + 12, 90));
    }, 5000);
    
    urlMutation.mutate(urlInput.trim(), {
      onSettled: () => {
        clearInterval(interval);
        setAnalysisProgress(100);
      },
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({ title: "Invalid file", description: "Please upload a video file", variant: "destructive" });
      return;
    }

    setUploadedVideo(file);
    setShowSuggestionsModal(true);
  };

  const handleGenerateClips = async () => {
    if (!uploadedVideo) {
      toast({ title: "No video", description: "Please upload a video first", variant: "destructive" });
      return;
    }
    
    setShowSuggestionsModal(false);
    setShowAnalyzingModal(true);
    setAnalysisProgress(0);
    setAnalysisStep("Starting AI analysis...");
    
    const steps = [
      "Uploading video...", 
      "Extracting audio...", 
      "Transcribing with Whisper AI...", 
      "Analyzing for best clips...",
      "Finalizing results..."
    ];
    let stepIndex = 0;
    
    const interval = setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      setAnalysisStep(steps[stepIndex]);
      setAnalysisProgress(prev => Math.min(prev + 15, 90));
    }, 3000);
    
    try {
      await processMutation.mutateAsync({
        file: uploadedVideo,
        suggestions: selectedSuggestions,
        customPrompt,
      });
    } finally {
      clearInterval(interval);
      setAnalysisProgress(100);
    }
  };

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Video to Clips</h1>
          <p className="text-slate-400">Upload a long-form video and AI will extract the best short clips</p>
        </div>

        {generatedClips.length === 0 ? (
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">Which option should I use?</p>
                <p className="text-blue-300/80">
                  <strong>Upload</strong> for videos under 5 minutes (up to 500MB). 
                  <strong> Paste URL</strong> for longer videos from YouTube, Vimeo, Dropbox, or Google Drive.
                </p>
              </div>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-8">
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload File
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      Paste URL
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload">
                    <div 
                      className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center hover:border-purple-500 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="upload-area"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleFileSelect}
                        data-testid="video-input"
                      />
                      <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Upload className="w-10 h-10 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Upload your video</h3>
                      <p className="text-slate-400 mb-4">Drag and drop or click to browse</p>
                      <p className="text-sm text-slate-500">Best for videos under 5 minutes (MP4, MOV, AVI up to 500MB)</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="url">
                    <div className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center">
                      <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Link2 className="w-10 h-10 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Paste Video URL</h3>
                      <p className="text-slate-400 mb-6">YouTube, Vimeo, Twitter/X, TikTok, and more</p>
                      
                      <div className="max-w-lg mx-auto space-y-4">
                        <div className="flex gap-2">
                          <Input
                            type="url"
                            placeholder="https://youtube.com/watch?v=..."
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white flex-1"
                            disabled={urlMutation.isPending}
                            data-testid="input-video-url"
                          />
                          <Button
                            onClick={handleUrlSubmit}
                            disabled={urlMutation.isPending || !urlInput.trim()}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            data-testid="button-process-url"
                          >
                            {urlMutation.isPending ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Downloading...</>
                            ) : (
                              <><Sparkles className="w-4 h-4 mr-2" />Process</>
                            )}
                          </Button>
                        </div>
                        
                        <p className="text-xs text-slate-500">
                          Supports YouTube, Vimeo, Twitter/X, TikTok, Instagram, Facebook, and 1000+ sites
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Generated Clips ({generatedClips.length})</h2>
              <Button 
                variant="outline" 
                onClick={() => {
                  setGeneratedClips([]);
                  setUploadedVideo(null);
                  setVideoUrl(null);
                }}
                data-testid="button-new-video"
              >
                Upload New Video
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedClips.map((clip, index) => (
                <Card key={clip.id} className="bg-slate-800/50 border-slate-700 overflow-hidden">
                  <div className="aspect-[9/16] bg-slate-900 relative">
                    {clip.videoUrl ? (
                      <video
                        src={clip.videoUrl}
                        className="w-full h-full object-cover"
                        poster={clip.thumbnailUrl}
                        controls
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                        <Video className="w-12 h-12 text-slate-600 mb-2" />
                        <p className="text-xs text-slate-500">Clip ready for extraction</p>
                        <p className="text-xs text-slate-600 mt-1">{clip.startTime}s - {clip.endTime}s</p>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                      {Math.round(clip.endTime - clip.startTime)}s
                    </div>
                    <div className="absolute top-2 left-2 bg-purple-500/80 px-2 py-1 rounded text-xs text-white font-medium">
                      Clip {index + 1}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-medium text-white mb-2 line-clamp-2">{clip.title}</h4>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-3">{clip.transcript}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1" 
                        onClick={() => handleDownload(clip)}
                        disabled={!clip.videoUrl}
                        data-testid={`button-download-${clip.id}`}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-purple-600 hover:bg-purple-700" 
                        onClick={() => openEditModal(clip)}
                        data-testid={`button-queue-${clip.id}`}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit & Queue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Dialog open={showAnalyzingModal} onOpenChange={setShowAnalyzingModal}>
          <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-center text-xl">Analyzing your video</DialogTitle>
            </DialogHeader>
            <div className="py-6">
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={`aspect-video bg-slate-800 rounded-lg ${analysisProgress > i * 30 ? 'animate-pulse bg-slate-700' : ''}`}
                  />
                ))}
              </div>
              <Progress value={analysisProgress} className="h-2 mb-3" />
              <p className="text-center text-slate-400 text-sm">{analysisStep}</p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showSuggestionsModal} onOpenChange={setShowSuggestionsModal}>
          <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white text-center text-xl">Tell AI what to look for</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="grid grid-cols-3 gap-3 mb-6">
                {defaultSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => toggleSuggestion(suggestion.id)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedSuggestions.includes(suggestion.id)
                        ? 'bg-purple-500/20 border-purple-500'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    }`}
                    data-testid={`suggestion-${suggestion.id}`}
                  >
                    <Lightbulb className={`w-5 h-5 mb-2 ${selectedSuggestions.includes(suggestion.id) ? 'text-purple-400' : 'text-slate-400'}`} />
                    <p className="text-sm text-white font-medium">{suggestion.title}</p>
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <div className="relative">
                  <Input
                    placeholder="Highlight my most over-the-top reactions"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white pr-10"
                    data-testid="input-custom-prompt"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Sparkles className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  These instructions apply only to this video. Your future videos will not be affected.
                </p>
              </div>

              <Button
                onClick={handleGenerateClips}
                disabled={processMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                data-testid="button-generate-clips"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {processMutation.isPending ? "Generating clips..." : "Generate new clips"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingClip} onOpenChange={(open) => !open && setEditingClip(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Edit Clip Before Queueing</DialogTitle>
            </DialogHeader>
            {editingClip && (
              <div className="py-4 space-y-4">
                <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden">
                  {editingClip.videoUrl && (
                    <video
                      src={editingClip.videoUrl}
                      className="w-full h-full object-contain"
                      controls
                      playsInline
                    />
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => generateCaptionMutation.mutate(editingClip.transcript)}
                    disabled={generateCaptionMutation.isPending}
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    {generateCaptionMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" />Generate Hook & Caption</>
                    )}
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-slate-300">Hook (opening line)</Label>
                    <Input
                      value={editHook}
                      onChange={(e) => setEditHook(e.target.value)}
                      placeholder="Attention-grabbing opening..."
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Caption</Label>
                    <Textarea
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      placeholder="Your caption here..."
                      className="bg-slate-800 border-slate-700 text-white mt-1 min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Hashtags (space or comma separated)</Label>
                    <Input
                      value={editHashtags}
                      onChange={(e) => setEditHashtags(e.target.value)}
                      placeholder="#viral #fyp #trending"
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(editingClip)}
                    disabled={!editingClip.videoUrl}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={handleAddToQueue}
                    disabled={addToQueueMutation.isPending}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {addToQueueMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" />Add to Queue</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
