import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Sparkles } from "lucide-react";

interface ContentPlanCardProps {
  plan: {
    id: string;
    contentType: string;
    status: string;
    planData: any;
  };
  onApprove?: () => void;
  onEdit?: () => void;
}

export function ContentPlanCard({ plan, onApprove, onEdit }: ContentPlanCardProps) {
  const { contentType, status, planData } = plan;

  const renderPlanDetails = () => {
    switch (contentType.toLowerCase()) {
      case "reel":
      case "video":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Duration:</span>
              <span className="font-medium">{planData.duration}s</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block mb-2">Hook:</span>
              <p className="text-sm bg-muted/50 p-2 rounded">{planData.hook}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block mb-2">Scenes:</span>
              <div className="space-y-2">
                {planData.scenes?.map((scene: any, idx: number) => (
                  <div key={idx} className="bg-muted/30 p-3 rounded space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Scene {scene.sceneNumber}</Badge>
                      <span className="text-xs text-muted-foreground">{scene.duration}s</span>
                    </div>
                    <p className="text-sm">{scene.visualDescription}</p>
                    {scene.scriptNarration && (
                      <p className="text-xs text-muted-foreground italic">"{scene.scriptNarration}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {planData.cta && (
              <div>
                <span className="text-sm text-muted-foreground block mb-1">CTA:</span>
                <p className="text-sm bg-primary/10 p-2 rounded">{planData.cta}</p>
              </div>
            )}
          </div>
        );

      case "carousel":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Format:</span>
              <Badge>{planData.format}</Badge>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block mb-2">Slides:</span>
              <div className="space-y-2">
                {planData.slides?.map((slide: any, idx: number) => (
                  <div key={idx} className="bg-muted/30 p-3 rounded space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Slide {slide.slideNumber}</Badge>
                      <Badge variant="secondary" className="text-xs">{slide.type}</Badge>
                    </div>
                    <p className="font-medium text-sm">{slide.headline}</p>
                    {slide.subtext && (
                      <p className="text-xs text-muted-foreground">{slide.subtext}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {planData.caption && (
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Caption:</span>
                <p className="text-sm bg-muted/50 p-2 rounded">{planData.caption}</p>
              </div>
            )}
          </div>
        );

      case "blog":
        return (
          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground block mb-1">Title:</span>
              <h3 className="font-semibold">{planData.title}</h3>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block mb-2">Sections:</span>
              <div className="space-y-2">
                {planData.sections?.map((section: any, idx: number) => (
                  <div key={idx} className="bg-muted/30 p-3 rounded space-y-1">
                    <p className="font-medium text-sm">{section.heading}</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      {section.keyPoints?.map((point: string, pidx: number) => (
                        <li key={pidx}>{point}</li>
                      ))}
                    </ul>
                    <span className="text-xs text-muted-foreground">~{section.wordCount} words</span>
                  </div>
                ))}
              </div>
            </div>
            {planData.seoKeywords && (
              <div>
                <span className="text-sm text-muted-foreground block mb-1">SEO Keywords:</span>
                <div className="flex flex-wrap gap-1">
                  {planData.seoKeywords.map((keyword: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">{keyword}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "caption":
        return (
          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground block mb-1">Hook:</span>
              <p className="text-sm bg-muted/50 p-2 rounded">{planData.hookLine}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block mb-1">Body:</span>
              <p className="text-sm whitespace-pre-wrap">{planData.body}</p>
            </div>
            {planData.cta && (
              <div>
                <span className="text-sm text-muted-foreground block mb-1">CTA:</span>
                <p className="text-sm bg-primary/10 p-2 rounded">{planData.cta}</p>
              </div>
            )}
            {planData.hashtags && (
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Hashtags:</span>
                <div className="flex flex-wrap gap-1">
                  {planData.hashtags.map((tag: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">#{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div>
            <pre className="text-xs bg-muted/30 p-3 rounded overflow-auto">
              {JSON.stringify(planData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "generating":
        return <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getStatusIcon()}
            {contentType.charAt(0).toUpperCase() + contentType.slice(1)} Plan
          </CardTitle>
          <Badge variant={status === "approved" ? "default" : "secondary"}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderPlanDetails()}
        
        {status === "draft" && (
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={onApprove} 
              className="flex-1"
              size="sm"
            >
              Approve & Generate
            </Button>
            <Button 
              onClick={onEdit} 
              variant="outline"
              size="sm"
            >
              Edit Plan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
