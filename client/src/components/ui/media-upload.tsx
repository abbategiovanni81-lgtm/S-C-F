import { useState, useRef, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Link, X, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept: "image" | "video" | "audio" | "image,video" | "audio,video";
  label: string;
  placeholder?: string;
  description?: string;
  testId?: string;
}

const ACCEPT_MAP = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
  "image,video": "image/*,video/*",
  "audio,video": "audio/*,video/*",
};

export function MediaUpload({
  value,
  onChange,
  accept,
  label,
  placeholder = "https://example.com/file",
  description,
  testId = "media-upload",
}: MediaUploadProps) {
  const [mode, setMode] = useState<"url" | "upload">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileName(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/creator-studio/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      onChange(data.url);
      setUploadedFileName(file.name);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    onChange("");
    setUploadedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={mode === "upload" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("upload")}
            className="h-7 text-xs gap-1"
          >
            <Upload className="h-3 w-3" />
            Upload
          </Button>
          <Button
            type="button"
            variant={mode === "url" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("url")}
            className="h-7 text-xs gap-1"
          >
            <Link className="h-3 w-3" />
            URL
          </Button>
        </div>
      </div>

      {mode === "upload" ? (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_MAP[accept]}
            onChange={handleFileChange}
            className="hidden"
            data-testid={`${testId}-file-input`}
          />
          
          {value && uploadedFileName ? (
            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm truncate flex-1">{uploadedFileName}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors",
                "hover:border-primary hover:bg-muted/50",
                isUploading && "pointer-events-none opacity-50"
              )}
              data-testid={`${testId}-dropzone`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {accept === "image" && "PNG, JPG, WEBP up to 20MB"}
                    {accept === "video" && "MP4, MOV, WEBM up to 100MB"}
                    {accept === "audio" && "MP3, WAV, M4A up to 50MB"}
                    {accept === "image,video" && "Images or videos up to 100MB"}
                    {accept === "audio,video" && "Audio or video up to 100MB"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setUploadedFileName(null);
            }}
            data-testid={`${testId}-url-input`}
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
