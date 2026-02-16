import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface Caption {
  text: string;
  style: string;
}

interface CaptionCardsProps {
  captions: Caption[];
}

export function CaptionCards({ captions }: CaptionCardsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card className="bg-[#1a1a1a] border-purple-500/20" data-testid="caption-cards">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gray-100">
          Caption Variations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {captions.map((caption, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-[#0a0a0a] border border-purple-500/10"
            data-testid={`caption-${index}`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-xs font-semibold text-purple-400 uppercase">
                {caption.style}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-gray-400 hover:text-purple-400"
                onClick={() => handleCopy(caption.text, index)}
                data-testid={`copy-caption-${index}`}
              >
                {copiedIndex === index ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {caption.text}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
