import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Upload, Video, Info } from "lucide-react";

export default function AutoTrim() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

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
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Video className="h-8 w-8 text-green-500" />
          <div>
            <h1 className="text-3xl font-bold">Auto-Trim</h1>
            <p className="text-muted-foreground">
              Automatically remove silences and filler sounds from your videos
            </p>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="font-semibold">
            Coming soon — audio processing engine required.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-500" />
              Upload Video
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
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
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    Click to upload video
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports MP4, MOV, AVI, and other video formats
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {videoPreview && (
                    <div className="relative rounded-lg overflow-hidden bg-black">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full max-h-96"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleClear}>
                      Remove
                    </Button>
                  </div>

                  <Button className="w-full" disabled>
                    Process Video (Coming Soon)
                  </Button>
                </div>
              )}
            </div>

            <div className="text-sm text-muted-foreground space-y-2 border-t pt-4">
              <p className="font-semibold">Planned Features:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Automatically detect and remove silence</li>
                <li>Remove filler words and sounds (um, uh, etc.)</li>
                <li>Smart scene detection for clean cuts</li>
                <li>Preserve natural speech rhythm</li>
                <li>Export trimmed video instantly</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
