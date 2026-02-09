import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { FaceUploader } from "./FaceUploader";
import type { StylePack, StylePackTemplate } from "@shared/schema";

interface StylePackDetailProps {
  pack: StylePack;
  onBack: () => void;
}

export function StylePackDetail({ pack, onBack }: StylePackDetailProps) {
  const [faceImageUrl, setFaceImageUrl] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<{ templates: StylePackTemplate[] }>({
    queryKey: [`/api/image-workshop/style-pack/${pack.id}/templates`],
    select: (data) => data.templates,
  });

  const processMutation = useMutation({
    mutationFn: async (faceUrl: string) => {
      const response = await fetch("/api/image-workshop/style-pack-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: pack.id,
          faceImageUrl: faceUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start face swap");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Face swap started! Check the Gallery for results.");
      queryClient.invalidateQueries({ queryKey: ["/api/image-workshop/jobs"] });
      onBack();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleFaceUpload = (url: string) => {
    setFaceImageUrl(url);
    setShowUploader(false);
  };

  const handleGetPack = () => {
    if (!faceImageUrl) {
      setShowUploader(true);
      return;
    }
    processMutation.mutate(faceImageUrl);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (showUploader) {
    return (
      <FaceUploader
        onUpload={handleFaceUpload}
        onBack={() => setShowUploader(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{pack.name}</h2>
          <p className="text-muted-foreground text-sm">{pack.description}</p>
        </div>
      </div>

      {/* Face photo status */}
      <Card>
        <CardHeader>
          <CardTitle>Your Face Photo</CardTitle>
          <CardDescription>
            {faceImageUrl
              ? "Face photo uploaded. Click 'Get This Pack' to start processing."
              : "Upload a clear, front-facing photo of your face"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {faceImageUrl ? (
              <img
                src={faceImageUrl}
                alt="Your face"
                className="w-24 h-24 rounded-lg object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowUploader(true)}
              >
                {faceImageUrl ? "Change Photo" : "Upload Face Photo"}
              </Button>
              {faceImageUrl && (
                <Button
                  onClick={handleGetPack}
                  disabled={processMutation.isPending}
                >
                  {processMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get This Pack
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template preview */}
      <Card>
        <CardHeader>
          <CardTitle>Pack Templates ({templates.length})</CardTitle>
          <CardDescription>
            Your face will be swapped into each of these professional templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="space-y-2">
                <div className="w-full aspect-square rounded-md overflow-hidden">
                  <img
                    src={template.templateImageUrl}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-center font-medium truncate">
                  {template.name}
                </p>
              </div>
            ))}
          </div>

          {!faceImageUrl && (
            <div className="mt-6 text-center">
              <Button size="lg" onClick={() => setShowUploader(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Face Photo to Get Started
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
