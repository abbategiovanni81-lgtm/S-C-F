import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MediaUpload } from "@/components/ui/media-upload";
import { 
  Upload, 
  Wand2, 
  Download, 
  Scissors,
  Volume2,
  VolumeX,
  Gauge,
  Film
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

export default function AutoTrim() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [trimSettings, setTrimSettings] = useState({
    removeSilences: true,
    removeFillerWords: true,
    aggressiveness: [50],
  });
  const [result, setResult] = useState<{
    originalDuration: number;
    trimmedDuration: number;
    silencesRemoved: number;
    fillerWordsRemoved: number;
  } | null>(null);

  const handleVideoUpload = (file: File) => {
    setVideoFile(file);
  };

  const handleProcess = () => {
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setResult({
        originalDuration: 180,
        trimmedDuration: 145,
        silencesRemoved: 12,
        fillerWordsRemoved: 23,
      });
      setIsProcessing(false);
    }, 3000);
  };

  const timeSaved = result 
    ? result.originalDuration - result.trimmedDuration 
    : 0;

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-red-900/40 to-orange-900/40 border-red-700/50">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <Scissors className="w-8 h-8 text-red-400" />
                Auto-Trim
              </CardTitle>
              <CardDescription className="text-lg">
                Remove silences and filler words automatically to make your videos more engaging
              </CardDescription>
            </CardHeader>
          </Card>

          {!videoFile && (
            <Card>
              <CardContent className="p-12">
                <div className="text-center space-y-4">
                  <Upload className="w-16 h-16 mx-auto text-slate-500" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">Upload Your Video</h3>
                    <p className="text-slate-400">
                      We'll automatically remove awkward pauses and filler words
                    </p>
                  </div>
                  <MediaUpload
                    onUpload={(url) => {
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
          )}

          {videoFile && !result && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Trim Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <VolumeX className="w-5 h-5 text-slate-400" />
                        <div>
                          <h4 className="font-medium">Remove Silences</h4>
                          <p className="text-sm text-slate-400">Cut out long pauses and dead air</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={trimSettings.removeSilences}
                        onChange={(e) => setTrimSettings({
                          ...trimSettings,
                          removeSilences: e.target.checked
                        })}
                        className="w-5 h-5"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-5 h-5 text-slate-400" />
                        <div>
                          <h4 className="font-medium">Remove Filler Words</h4>
                          <p className="text-sm text-slate-400">Cut out "um", "uh", "like", etc.</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={trimSettings.removeFillerWords}
                        onChange={(e) => setTrimSettings({
                          ...trimSettings,
                          removeFillerWords: e.target.checked
                        })}
                        className="w-5 h-5"
                      />
                    </div>

                    <div className="p-4 bg-slate-800 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Gauge className="w-5 h-5 text-slate-400" />
                          <h4 className="font-medium">Aggressiveness</h4>
                        </div>
                        <Badge variant="secondary">
                          {trimSettings.aggressiveness[0]}%
                        </Badge>
                      </div>
                      <Slider
                        value={trimSettings.aggressiveness}
                        onValueChange={(value) => setTrimSettings({
                          ...trimSettings,
                          aggressiveness: value
                        })}
                        min={0}
                        max={100}
                        step={10}
                      />
                      <p className="text-xs text-slate-400">
                        Higher values = more aggressive trimming (faster pace)
                      </p>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleProcess}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Scissors className="w-5 h-5 mr-2 animate-pulse" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5 mr-2" />
                        Process Video
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {isProcessing && (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <Scissors className="w-12 h-12 mx-auto mb-4 text-orange-400 animate-pulse" />
                        <h3 className="text-xl font-bold mb-2">Analyzing Your Video...</h3>
                      </div>
                      <Progress value={45} className="h-2" />
                      <div className="space-y-2 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span>Detecting silences</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                          <span>Analyzing speech patterns...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-slate-600" />
                          <span>Trimming video</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {result && (
            <>
              <Card className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-700/50">
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                      <Scissors className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-green-400">
                        {timeSaved}s Saved!
                      </h2>
                      <p className="text-slate-300 mt-2">
                        Your video is now {((timeSaved / result.originalDuration) * 100).toFixed(1)}% shorter and more engaging
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Before</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Duration</span>
                      <Badge variant="secondary">
                        {Math.floor(result.originalDuration / 60)}:{(result.originalDuration % 60).toString().padStart(2, '0')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">After</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Duration</span>
                      <Badge className="bg-green-900/30 text-green-400 border-green-700">
                        {Math.floor(result.trimmedDuration / 60)}:{(result.trimmedDuration % 60).toString().padStart(2, '0')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Edits Made</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-800 rounded-lg">
                      <div className="text-3xl font-bold text-blue-400">
                        {result.silencesRemoved}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">Silences Removed</div>
                    </div>
                    <div className="text-center p-4 bg-slate-800 rounded-lg">
                      <div className="text-3xl font-bold text-purple-400">
                        {result.fillerWordsRemoved}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">Filler Words Cut</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button className="flex-1" size="lg">
                  <Download className="w-5 h-5 mr-2" />
                  Download Trimmed Video
                </Button>
                <Button variant="outline" className="flex-1" size="lg">
                  <Film className="w-5 h-5 mr-2" />
                  Preview
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
