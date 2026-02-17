import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, Link2, AlertCircle } from "lucide-react";

export default function MagicClips() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const processMutation = useMutation({
    mutationFn: async (videoUrl: string) => {
      const response = await apiRequest("POST", "/api/video-to-clips/url", {
        url: videoUrl,
      });
      return response.json();
    },
    onSuccess: () => {
      // Intentionally showing error message as backend integration is not complete
      setErrorMessage("Processing engine not connected.");
      toast({
        title: "Processing engine not connected",
        description: "This feature is currently unavailable.",
        variant: "destructive",
      });
    },
    onError: (error: any) => {
      setErrorMessage("Processing engine not connected.");
      toast({
        title: "Processing engine not connected",
        description: error.message || "Unable to process video at this time.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!url.trim()) {
      toast({
        title: "Missing URL",
        description: "Please enter a YouTube URL",
        variant: "destructive",
      });
      return;
    }

    // URL validation - ensure it's a YouTube URL
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      // Check if hostname is exactly youtube.com or www.youtube.com or youtu.be
      const isYouTube = hostname === 'youtube.com' || 
                       hostname === 'www.youtube.com' || 
                       hostname === 'youtu.be' ||
                       hostname === 'www.youtu.be' ||
                       hostname === 'm.youtube.com';
      
      if (!isYouTube) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid YouTube URL",
          variant: "destructive",
        });
        return;
      }
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setErrorMessage("");
    processMutation.mutate(url);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Wand2 className="h-8 w-8 text-purple-500" />
          <div>
            <h1 className="text-3xl font-bold">Magic Clips</h1>
            <p className="text-muted-foreground">
              Transform YouTube videos into viral clips with AI scene detection
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-500" />
              Enter YouTube URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">YouTube Video URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={processMutation.isPending}
              />
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={processMutation.isPending}
                className="flex-1"
              >
                {processMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Magic Clips
                  </>
                )}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-2 border-t pt-4">
              <p className="font-semibold">How it works:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Paste a YouTube video URL</li>
                <li>AI detects key moments and scenes</li>
                <li>Automatically splits video into viral-ready clips</li>
                <li>Download and share your clips instantly</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
