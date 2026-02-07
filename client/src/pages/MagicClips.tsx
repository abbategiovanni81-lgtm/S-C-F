import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MediaUpload } from "@/components/ui/media-upload";
import { 
  Upload, 
  Sparkles, 
  TrendingUp, 
  Download, 
  Play,
  Scissors,
  Clock,
  Eye,
  ThumbsUp
} from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface VideoClip {
  id: string;
  thumbnailUrl: string;
  duration: number;
  startTime: number;
  viralityScore: number;
  hookStrength: number;
  hasCaption: boolean;
}

export default function MagicClips() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [minClipDuration, setMinClipDuration] = useState([15]);
  const [maxClipDuration, setMaxClipDuration] = useState([60]);

  const mockClips: VideoClip[] = Array.from({ length: 24 }, (_, i) => ({
    id: `clip-${i + 1}`,
    thumbnailUrl: `https://images.unsplash.com/photo-${1611162616305 + i}?w=400`,
    duration: Math.floor(Math.random() * 45) + 15,
    startTime: i * 30,
    viralityScore: Math.floor(Math.random() * 30) + 70,
    hookStrength: Math.floor(Math.random() * 30) + 70,
    hasCaption: Math.random() > 0.3,
  }));

  const handleVideoUpload = (file: File) => {
    setVideoFile(file);
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setClips(mockClips);
      setIsProcessing(false);
    }, 3000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 80) return "text-blue-400";
    if (score >= 70) return "text-yellow-400";
    return "text-orange-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Viral Potential";
    if (score >= 80) return "High";
    if (score >= 70) return "Good";
    return "Medium";
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-fuchsia-900/40 to-purple-900/40 border-fuchsia-700/50">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-fuchsia-400" />
                Magic Clips
              </CardTitle>
              <CardDescription className="text-lg">
                Upload a long video and AI splits it into 20+ viral-ready short clips with auto-captions
              </CardDescription>
            </CardHeader>
          </Card>

          {!videoFile && !isProcessing && clips.length === 0 && (
            <>
              {/* Upload Section */}
              <Card>
                <CardContent className="p-12">
                  <div className="text-center space-y-4">
                    <Upload className="w-16 h-16 mx-auto text-slate-500" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">Upload Your Long-Form Video</h3>
                      <p className="text-slate-400">
                        We'll analyze it and create multiple short clips optimized for virality
                      </p>
                    </div>
                    <MediaUpload
                      onUpload={(url) => {
                        // Simulate file upload
                        const file = new File([""], "video.mp4", { type: "video/mp4" });
                        handleVideoUpload(file);
                      }}
                      accept="video/*"
                      maxSizeMB={500}
                    >
                      <Button size="lg" className="mt-4">
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Video
                      </Button>
                    </MediaUpload>
                  </div>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Clip Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Minimum Clip Duration: {minClipDuration[0]}s
                    </label>
                    <Slider
                      value={minClipDuration}
                      onValueChange={setMinClipDuration}
                      min={10}
                      max={30}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Maximum Clip Duration: {maxClipDuration[0]}s
                    </label>
                    <Slider
                      value={maxClipDuration}
                      onValueChange={setMaxClipDuration}
                      min={30}
                      max={90}
                      step={10}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="bg-purple-900/20 border-purple-700/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Tips for Best Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Upload videos with clear speech and good audio quality</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Content with strong hooks and storytelling performs best</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>We automatically detect scene changes and speaker transitions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>Clips are ranked by virality score for easy selection</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </>
          )}

          {/* Processing State */}
          {isProcessing && (
            <Card>
              <CardContent className="p-12">
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-pulse" />
                    <h3 className="text-xl font-bold mb-2">Analyzing Your Video...</h3>
                    <p className="text-slate-400">
                      This may take a few minutes for longer videos
                    </p>
                  </div>
                  
                  <Progress value={45} className="h-2" />
                  
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Transcribing audio</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Detecting scene changes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                      <span>Analyzing viral potential...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-600" />
                      <span>Generating clips</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {clips.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    Generated {clips.length} Clips
                  </h2>
                  <p className="text-slate-400 mt-1">
                    Sorted by virality score • Click to preview
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    Download All
                  </Button>
                  <Button>
                    Select Best 10
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {clips
                  .sort((a, b) => b.viralityScore - a.viralityScore)
                  .map((clip) => (
                    <Card key={clip.id} className="overflow-hidden hover:border-purple-500 transition-colors cursor-pointer group">
                      <div className="relative aspect-[9/16] bg-slate-800">
                        <img
                          src={clip.thumbnailUrl}
                          alt={`Clip ${clip.id}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Play Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-12 h-12 text-white" />
                        </div>

                        {/* Duration Badge */}
                        <Badge className="absolute top-2 right-2 bg-black/70 text-white border-0 text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {clip.duration}s
                        </Badge>

                        {/* Caption Badge */}
                        {clip.hasCaption && (
                          <Badge className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs">
                            Auto-Caption
                          </Badge>
                        )}
                      </div>

                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Virality</span>
                          <span className={`font-bold ${getScoreColor(clip.viralityScore)}`}>
                            {clip.viralityScore}%
                          </span>
                        </div>
                        <Progress value={clip.viralityScore} className="h-1" />
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Hook</span>
                          <span className={`font-bold ${getScoreColor(clip.hookStrength)}`}>
                            {clip.hookStrength}%
                          </span>
                        </div>
                        <Progress value={clip.hookStrength} className="h-1" />

                        <div className="flex gap-1 pt-2">
                          <Button size="sm" variant="outline" className="flex-1 text-xs h-7">
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button size="sm" className="flex-1 text-xs h-7">
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              {/* Summary Stats */}
              <Card className="bg-gradient-to-r from-purple-900/20 to-fuchsia-900/20 border-purple-700/50">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-400">{clips.length}</div>
                      <div className="text-sm text-slate-400 mt-1">Total Clips</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">
                        {clips.filter(c => c.viralityScore >= 80).length}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">High Potential</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">
                        {clips.filter(c => c.hasCaption).length}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">With Captions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400">
                        {Math.round(clips.reduce((sum, c) => sum + c.duration, 0) / 60)}m
                      </div>
                      <div className="text-sm text-slate-400 mt-1">Total Duration</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
