import { BatchState } from "./BatchWizard";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Instagram, Twitter, Linkedin, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentPlanStepProps {
  batchState: BatchState;
  onUpdateState: (updates: Partial<BatchState>) => void;
}

const TIMEFRAME_OPTIONS = [
  { days: 7, label: "1 Week", description: "7 days of content" },
  { days: 14, label: "2 Weeks", description: "14 days of content" },
  { days: 30, label: "1 Month", description: "30 days of content" },
] as const;

const PLATFORM_OPTIONS = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    description: "Posts, Stories, Reels",
    color: "text-pink-600",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
      </svg>
    ),
    description: "Short-form videos",
    color: "text-slate-900 dark:text-slate-100",
  },
  {
    id: "twitter",
    name: "Twitter/X",
    icon: Twitter,
    description: "Tweets & Threads",
    color: "text-blue-400",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    description: "Professional posts",
    color: "text-blue-600",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    description: "Long-form videos",
    color: "text-red-600",
  },
];

export default function ContentPlanStep({
  batchState,
  onUpdateState,
}: ContentPlanStepProps) {
  const handleTimeframeSelect = (days: 7 | 14 | 30) => {
    onUpdateState({ timeframe: days });
  };

  const handlePlatformToggle = (platformId: string) => {
    const platforms = batchState.platforms.includes(platformId)
      ? batchState.platforms.filter(p => p !== platformId)
      : [...batchState.platforms, platformId];
    onUpdateState({ platforms });
  };

  const POSTS_PER_WEEK_PER_PLATFORM = 3;
  const estimatedPosts = Math.ceil((batchState.timeframe / 7) * batchState.platforms.length * POSTS_PER_WEEK_PER_PLATFORM);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Content Plan</h3>
        <p className="text-muted-foreground">How much content do you need?</p>
      </div>

      {/* Timeframe Selector */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h4 className="font-medium">Timeframe</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {TIMEFRAME_OPTIONS.map(({ days, label, description }) => (
            <Card
              key={days}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                batchState.timeframe === days
                  ? "border-cyan-500 dark:border-teal-500 ring-2 ring-cyan-500/20 dark:ring-teal-500/20"
                  : "border-border hover:border-cyan-500/50 dark:hover:border-teal-500/50"
              )}
              onClick={() => handleTimeframeSelect(days)}
            >
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold mb-2">{days}</div>
                <div className="font-medium mb-1">{label}</div>
                <div className="text-sm text-muted-foreground">{description}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Platform Selector */}
      <div className="space-y-4">
        <h4 className="font-medium">Select Platforms</h4>
        <div className="space-y-3">
          {PLATFORM_OPTIONS.map(({ id, name, icon: Icon, description, color }) => (
            <Card
              key={id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                batchState.platforms.includes(id)
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => handlePlatformToggle(id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn("flex-shrink-0", color)}>
                    <Icon />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{name}</div>
                    <div className="text-sm text-muted-foreground">{description}</div>
                  </div>
                  <Checkbox
                    checked={batchState.platforms.includes(id)}
                    onCheckedChange={() => handlePlatformToggle(id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Summary Bar */}
      <div className="sticky bottom-0 -mx-6 -mb-6 p-4 bg-muted/50 backdrop-blur-sm border-t">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">
              {batchState.platforms.length} Platform{batchState.platforms.length !== 1 ? 's' : ''} Selected
            </div>
            <div className="text-sm text-muted-foreground">
              {batchState.timeframe} days • ~{estimatedPosts} posts estimated
            </div>
          </div>
          {batchState.platforms.length === 0 && (
            <div className="text-sm text-amber-600 dark:text-amber-400">
              Select at least one platform to continue
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
