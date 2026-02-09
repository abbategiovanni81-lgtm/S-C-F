import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FaceUploaderProps {
  onUpload: (url: string) => void;
  onBack: () => void;
}

export function FaceUploader({ onUpload, onBack }: FaceUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      onUpload(data.imageUrl);
      toast.success("Face photo uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload face photo");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Upload Face Photo</h2>
          <p className="text-muted-foreground text-sm">
            Upload a clear, front-facing photo for best results
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Face Photo Guidelines</CardTitle>
          <CardDescription>
            For best results, please ensure:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Face is clearly visible and front-facing</li>
            <li>Good lighting with no harsh shadows</li>
            <li>Neutral expression works best</li>
            <li>No sunglasses or face coverings</li>
            <li>High resolution image (at least 512x512px)</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Photo</CardTitle>
        </CardHeader>
        <CardContent>
          {!previewUrl ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                className="hidden"
              />
              <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              {isDragging ? (
                <p className="text-sm text-muted-foreground">Drop your photo here...</p>
              ) : (
                <div>
                  <p className="text-base font-medium mb-2">
                    Drop your face photo here or click to upload
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG, JPEG, or WEBP
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Face preview"
                  className="w-full max-w-md mx-auto rounded-lg"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
              </div>
              {!isUploading && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreviewUrl(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    Choose Different Photo
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
