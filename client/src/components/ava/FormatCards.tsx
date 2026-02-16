import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormatCardProps {
  format: string;
  icon: string;
  selected?: boolean;
  onSelect: (format: string) => void;
}

const FORMAT_OPTIONS = [
  { name: "Reel", icon: "📱", description: "15-90s vertical video" },
  { name: "TikTok", icon: "🎵", description: "Short-form vertical" },
  { name: "Story", icon: "📖", description: "24h ephemeral content" },
  { name: "Post", icon: "📸", description: "Feed image post" },
  { name: "Carousel", icon: "🎠", description: "Multi-image swipe" },
  { name: "Video", icon: "🎬", description: "Long-form video" },
  { name: "Short", icon: "⚡", description: "YouTube Shorts" },
  { name: "Tweet", icon: "🐦", description: "Twitter/X post" },
  { name: "Thread", icon: "🧵", description: "Tweet thread" },
  { name: "LinkedIn", icon: "💼", description: "Professional post" },
  { name: "Blog", icon: "📝", description: "Long-form article" },
  { name: "Newsletter", icon: "📧", description: "Email content" },
  { name: "Ad", icon: "📣", description: "Paid advertisement" },
  { name: "Caption", icon: "💬", description: "Post caption only" },
];

interface FormatCardsProps {
  selectedFormat?: string;
  onFormatSelect: (format: string) => void;
}

export function FormatCards({ selectedFormat, onFormatSelect }: FormatCardsProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-300 mb-3">
        Choose a content format:
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {FORMAT_OPTIONS.map((format) => (
          <Card
            key={format.name}
            className={cn(
              "cursor-pointer transition-all hover:border-purple-500/50",
              selectedFormat === format.name
                ? "bg-purple-600/20 border-purple-500"
                : "bg-[#1a1a1a] border-purple-500/20 hover:bg-purple-900/10"
            )}
            onClick={() => onFormatSelect(format.name)}
            data-testid={`format-card-${format.name.toLowerCase()}`}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="text-2xl">{format.icon}</div>
                <div>
                  <div className="font-semibold text-sm text-gray-100 flex items-center justify-center gap-1">
                    {format.name}
                    {selectedFormat === format.name && (
                      <Check className="w-3 h-3 text-purple-400" />
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {format.description}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
