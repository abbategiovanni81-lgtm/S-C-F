import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, Video, Sparkles, Lightbulb, Clock, Download, Send, Play, Pause } from "lucide-react";

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

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("video", file);
      const res = await fetch("/api/video-to-clips/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: (data) => {
      setVideoUrl(data.videoUrl);
      setShowAnalyzingModal(false);
      setShowSuggestionsModal(true);
    },
    onError: (error: Error) => {
      setShowAnalyzingModal(false);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (params: { videoUrl: string; suggestions: string[]; customPrompt: string }) => {
      const res = await fetch("/api/video-to-clips/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error("Analysis failed");
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedClips(data.clips);
      setShowSuggestionsModal(false);
      toast({ title: "Clips generated!", description: `Found ${data.clips.length} potential clips` });
    },
    onError: (error: Error) => {
      toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({ title: "Invalid file", description: "Please upload a video file", variant: "destructive" });
      return;
    }

    setUploadedVideo(file);
    setShowAnalyzingModal(true);
    
    let progress = 0;
    const steps = ["Uploading video...", "Processing frames...", "Extracting audio...", "Ready for analysis"];
    const interval = setInterval(() => {
      progress += 8;
      setAnalysisProgress(Math.min(progress, 95));
      const stepIndex = Math.floor(progress / 25);
      if (stepIndex < steps.length) {
        setAnalysisStep(steps[stepIndex]);
      }
    }, 200);

    try {
      await uploadMutation.mutateAsync(file);
      setAnalysisProgress(100);
    } finally {
      clearInterval(interval);
    }
  };

  const handleGenerateClips = () => {
    if (!videoUrl) return;
    analyzeMutation.mutate({
      videoUrl,
      suggestions: selectedSuggestions,
      customPrompt,
    });
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
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-12">
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
                <p className="text-sm text-slate-500">Supports MP4, MOV, AVI up to 500MB</p>
              </div>
            </CardContent>
          </Card>
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
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-12 h-12 text-slate-600" />
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
                      <Button size="sm" variant="outline" className="flex-1" data-testid={`button-download-${clip.id}`}>
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700" data-testid={`button-queue-${clip.id}`}>
                        <Send className="w-4 h-4 mr-1" />
                        To Queue
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
                disabled={analyzeMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                data-testid="button-generate-clips"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {analyzeMutation.isPending ? "Generating clips..." : "Generate new clips"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
