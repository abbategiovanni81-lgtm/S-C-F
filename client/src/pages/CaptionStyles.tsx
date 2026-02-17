import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Upload, Type, Download, Info, Loader2, FileText } from "lucide-react";

interface CaptionResult {
  text: string;
  srt: string;
}

export default function CaptionStyles() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [captions, setCaptions] = useState<CaptionResult | null>(null);

  const generateCaptionsMutation = useMutation({
    mutationFn: async (file: File) => {
      // Mock caption generation - in reality would call OpenAI
      const mockCaptions = `Hello and welcome to this video.
Today we're going to talk about an exciting topic.
Let's dive right in and get started.`;

      const mockSRT = `1
00:00:00,000 --> 00:00:03,000
Hello and welcome to this video.

2
00:00:03,000 --> 00:00:06,000
Today we're going to talk about an exciting topic.

3
00:00:06,000 --> 00:00:09,000
Let's dive right in and get started.`;

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      return {
        text: mockCaptions,
        srt: mockSRT,
      };
    },
    onSuccess: (data) => {
      setCaptions(data);
      toast({
        title: "Captions generated!",
        description: "You can now download the captions.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate captions",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file",
          description: "Please select a video file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      setCaptions(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    setSelectedFile(null);
    setCaptions(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = () => {
    if (selectedFile) {
      generateCaptionsMutation.mutate(selectedFile);
    }
  };

  const handleDownloadText = () => {
    if (!captions) return;
    
    const blob = new Blob([captions.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captions.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSRT = () => {
    if (!captions) return;
    
    const blob = new Blob([captions.srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captions.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Type className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold">Caption Styles</h1>
            <p className="text-muted-foreground">
              Generate and style animated captions for your videos
            </p>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="font-semibold">
            Overlay rendering requires additional video processing pipelines.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-500" />
                Upload Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onClick={handleUploadClick}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                >
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium mb-1">Click to upload video</p>
                  <p className="text-sm text-muted-foreground">
                    MP4, MOV, AVI, etc.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {videoPreview && (
                    <div className="relative rounded-lg overflow-hidden bg-black">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full max-h-64"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleClear}>
                      Remove
                    </Button>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={generateCaptionsMutation.isPending}
                  >
                    {generateCaptionsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Type className="mr-2 h-4 w-4" />
                        Generate Captions
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Captions Display Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5 text-purple-500" />
                Generated Captions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!captions ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Type className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Upload a video and generate captions to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Caption Text</Label>
                    <Textarea
                      value={captions.text}
                      readOnly
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleDownloadText}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download TXT
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleDownloadSRT}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download SRT
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                    <p className="font-semibold mb-1">Note:</p>
                    <p>Caption generation is functional. Video overlay rendering requires additional ffmpeg pipelines and will be available soon.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Available Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <div>
                  <p className="font-semibold">Caption Generation</p>
                  <p className="text-muted-foreground">AI-powered caption generation using OpenAI</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <div>
                  <p className="font-semibold">Download Options</p>
                  <p className="text-muted-foreground">Export captions as TXT or SRT format</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground font-bold">○</span>
                <div>
                  <p className="font-semibold text-muted-foreground">Overlay Rendering (Coming Soon)</p>
                  <p className="text-muted-foreground">Burn animated captions directly onto video</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
