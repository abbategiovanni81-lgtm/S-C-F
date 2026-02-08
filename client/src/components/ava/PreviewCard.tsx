import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, ExternalLink } from "lucide-react";

interface PreviewCardProps {
  contentType: string;
  previewUrl?: string;
  previewData?: any;
  onOpenEditor?: () => void;
}

export function PreviewCard({ contentType, previewUrl, previewData, onOpenEditor }: PreviewCardProps) {
  const renderPreview = () => {
    switch (contentType.toLowerCase()) {
      case "reel":
      case "video":
        return previewUrl ? (
          <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden max-w-xs mx-auto">
            <video 
              src={previewUrl} 
              controls 
              className="w-full h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <div className="aspect-[9/16] bg-muted rounded-lg flex items-center justify-center max-w-xs mx-auto">
            <p className="text-muted-foreground text-sm">Video generating...</p>
          </div>
        );

      case "carousel":
        return (
          <div className="space-y-2">
            {previewData?.slides?.map((slide: any, idx: number) => (
              <div key={idx} className="aspect-square bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg p-4 flex flex-col justify-center items-center text-center">
                <p className="font-semibold text-lg mb-2">{slide.headline}</p>
                {slide.subtext && (
                  <p className="text-sm text-muted-foreground">{slide.subtext}</p>
                )}
              </div>
            )) || (
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Carousel generating...</p>
              </div>
            )}
          </div>
        );

      case "blog":
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {previewData?.title && <h2>{previewData.title}</h2>}
            {previewData?.sections?.map((section: any, idx: number) => (
              <div key={idx}>
                <h3>{section.heading}</h3>
                <ul>
                  {section.keyPoints?.map((point: string, pidx: number) => (
                    <li key={pidx}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );

      case "caption":
        return (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="whitespace-pre-wrap">{previewData?.body || "Caption generating..."}</p>
            {previewData?.hashtags && (
              <div className="flex flex-wrap gap-1 text-primary text-sm">
                {previewData.hashtags.map((tag: string, idx: number) => (
                  <span key={idx}>#{tag}</span>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="bg-muted rounded-lg p-4">
            <p className="text-muted-foreground text-sm">Preview not available</p>
          </div>
        );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Preview</CardTitle>
          {onOpenEditor && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onOpenEditor}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Editor
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {renderPreview()}
      </CardContent>
    </Card>
  );
}
