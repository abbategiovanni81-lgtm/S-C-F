import { DecisionCard, DecisionCardGrid } from "@/components/ui/decision-card";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Image, 
  Video, 
  FileText, 
  Sparkles,
  TrendingUp,
  Users,
  Calendar,
  MessageSquare
} from "lucide-react";

interface QuickPostOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  action: () => void;
  locked?: boolean;
  tier?: "silent" | "pro" | "enterprise";
  badge?: string;
}

const quickPostOptions: QuickPostOption[] = [
  {
    id: "ai-video",
    title: "AI Video",
    description: "Generate a video in seconds",
    icon: <Video className="w-8 h-8" />,
    gradient: "from-purple-600 via-pink-600 to-rose-600",
    action: () => window.location.href = "/content-queue",
    badge: "Popular",
  },
  {
    id: "ai-image",
    title: "AI Image",
    description: "Create stunning visuals",
    icon: <Image className="w-8 h-8" />,
    gradient: "from-blue-600 via-cyan-600 to-teal-600",
    action: () => window.location.href = "/content-queue",
  },
  {
    id: "quick-caption",
    title: "Quick Caption",
    description: "Write engaging captions",
    icon: <FileText className="w-8 h-8" />,
    gradient: "from-green-600 via-emerald-600 to-teal-600",
    action: () => window.location.href = "/content-queue",
  },
  {
    id: "trending-topic",
    title: "Trending Topic",
    description: "Jump on trends fast",
    icon: <TrendingUp className="w-8 h-8" />,
    gradient: "from-orange-600 via-amber-600 to-yellow-600",
    action: () => window.location.href = "/content-queue",
    badge: "Hot",
  },
  {
    id: "magic-clips",
    title: "Magic Clips",
    description: "Long video → clips",
    icon: <Sparkles className="w-8 h-8" />,
    gradient: "from-fuchsia-600 via-purple-600 to-indigo-600",
    action: () => window.location.href = "/video-to-clips",
    locked: true,
    tier: "pro",
  },
  {
    id: "hook-generator",
    title: "Hook Generator",
    description: "Viral opening lines",
    icon: <Zap className="w-8 h-8" />,
    gradient: "from-red-600 via-rose-600 to-pink-600",
    action: () => alert("Hook generator coming soon!"),
  },
  {
    id: "content-calendar",
    title: "Content Calendar",
    description: "Plan your week",
    icon: <Calendar className="w-8 h-8" />,
    gradient: "from-indigo-600 via-blue-600 to-cyan-600",
    action: () => window.location.href = "/schedule",
  },
  {
    id: "competitor-analysis",
    title: "Competitor Analysis",
    description: "Learn from the best",
    icon: <Users className="w-8 h-8" />,
    gradient: "from-slate-600 via-gray-600 to-zinc-600",
    action: () => window.location.href = "/content-analyzer",
  },
];

export function QuickPostGrid({ 
  onSelect,
  className 
}: { 
  onSelect?: (optionId: string) => void;
  className?: string;
}) {
  const handleSelect = (option: QuickPostOption) => {
    if (option.locked) return;
    if (onSelect) {
      onSelect(option.id);
    } else {
      option.action();
    }
  };

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          Quick Actions
        </h2>
        <p className="text-slate-400">
          Fast-track your content creation with one-click shortcuts
        </p>
      </div>

      <DecisionCardGrid>
        {quickPostOptions.map((option) => (
          <DecisionCard
            key={option.id}
            title={option.title}
            description={option.description}
            icon={option.icon}
            gradient={option.gradient}
            locked={option.locked}
            tier={option.tier}
            badge={option.badge}
            onClick={() => handleSelect(option)}
          />
        ))}
      </DecisionCardGrid>
    </div>
  );
}
