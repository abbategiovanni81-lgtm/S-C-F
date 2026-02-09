import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Caption {
  text: string;
  hashtagCount: number;
  characterCount: number;
  variation: string;
}

interface CaptionCardsProps {
  captions: Caption[];
}

export function CaptionCards({ captions }: CaptionCardsProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Caption copied to clipboard",
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-purple-500" />
        Caption Variations
      </h3>

      <div className="grid gap-4 md:grid-cols-3">
        {captions.map((caption, index) => (
          <Card key={index} className="border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <Badge variant="outline" className="text-xs">
                  {caption.variation}
                </Badge>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>{caption.characterCount} chars</span>
                  {caption.hashtagCount > 0 && (
                    <span>#{caption.hashtagCount}</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                {caption.text}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => copyToClipboard(caption.text)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Caption
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
