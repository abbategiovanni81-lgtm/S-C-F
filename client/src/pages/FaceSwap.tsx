import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Upload, Download, RefreshCw } from "lucide-react";

interface FaceSwapResult {
  beforeUrl: string;
  afterUrl: string;
}

export default function FaceSwap() {
  const { toast } = useToast();
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [result, setResult] = useState<FaceSwapResult | null>(null);

  const swapMutation = useMutation({
    mutationFn: async (data: { sourceUrl: string; faceUrl: string }) => {
      const response = await apiRequest("POST", "/api/tools/face-swap", data);
      return response.json() as Promise<FaceSwapResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "Face swap complete!",
        description: "Your face swap has been processed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Swap failed",
        description: error.message || "Failed to swap faces",
        variant: "destructive",
      });
    },
  });

  const handleSourceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPG, PNG, WEBP, MP4, or MOV files only.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Source file must be under 50MB.",
        variant: "destructive",
      });
      return;
    }

    setSourceFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSourcePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPG, PNG, or WEBP files only.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Face image must be under 10MB.",
        variant: "destructive",
      });
      return;
    }

    setFaceFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setFacePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSwap = () => {
    if (!sourceFile || !faceFile) {
      toast({
        title: "Missing files",
        description: "Please upload both source and face images.",
        variant: "destructive",
      });
      return;
    }

    // For now, using preview URLs as mock data
    // In production, these would be uploaded to cloud storage first
    swapMutation.mutate({
      sourceUrl: sourcePreview || "",
      faceUrl: facePreview || "",
    });
  };

  const handleReset = () => {
    setSourceFile(null);
    setSourcePreview(null);
    setFaceFile(null);
    setFacePreview(null);
    setResult(null);
  };

  const isProcessing = swapMutation.isPending;

  if (result) {
    return (
      <Layout>
        <div className="container mx-auto p-6 max-w-5xl space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-500" />
            <div>
              <h1 className="text-3xl font-bold">Face Swap</h1>
              <p className="text-muted-foreground">Results</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold">Before</h3>
                  <img
                    src={result.beforeUrl}
                    alt="Before"
                    className="w-full rounded-lg border"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">After</h3>
                  <img
                    src={result.afterUrl}
                    alt="After"
                    className="w-full rounded-lg border"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => window.open(result.afterUrl, "_blank")}
                  className="gap-2"
                  data-testid="download-button"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="gap-2"
                  data-testid="try-another-button"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-purple-500" />
          <div>
            <h1 className="text-3xl font-bold">Face Swap</h1>
            <p className="text-muted-foreground">Swap faces in photos and videos with AI precision</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Image/Video Panel */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Source Image or Video</h2>
              
              <div
                className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById("source-upload")?.click()}
                data-testid="source-upload-area"
              >
                {sourcePreview ? (
                  <div className="space-y-4">
                    {sourceFile?.type.startsWith("video/") ? (
                      <video
                        src={sourcePreview}
                        controls
                        className="w-full max-h-96 rounded-lg mx-auto"
                      />
                    ) : (
                      <img
                        src={sourcePreview}
                        alt="Source preview"
                        className="w-full max-h-96 object-contain rounded-lg mx-auto"
                      />
                    )}
                    <p className="text-sm text-muted-foreground">
                      Click to change
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="font-medium">Drop your file here or click to browse</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Supported formats: JPG, PNG, WEBP, MP4, MOV (max 50MB)
                      </p>
                    </div>
                  </div>
                )}
                <input
                  id="source-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                  onChange={handleSourceUpload}
                  className="hidden"
                  data-testid="source-upload-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Face Image Panel */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Face to Use</h2>
              
              <div
                className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById("face-upload")?.click()}
                data-testid="face-upload-area"
              >
                {facePreview ? (
                  <div className="space-y-4">
                    <img
                      src={facePreview}
                      alt="Face preview"
                      className="w-full max-h-96 object-contain rounded-lg mx-auto"
                    />
                    <p className="text-sm text-muted-foreground">
                      Click to change
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="font-medium">Drop your file here or click to browse</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Supported formats: JPG, PNG, WEBP (max 10MB)
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Use a clear, front-facing photo for best results
                      </p>
                    </div>
                  </div>
                )}
                <input
                  id="face-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFaceUpload}
                  className="hidden"
                  data-testid="face-upload-input"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSwap}
            disabled={!sourceFile || !faceFile || isProcessing}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-6 text-lg rounded-lg"
            data-testid="swap-face-button"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing... 30-60 seconds
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Swap Face
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
