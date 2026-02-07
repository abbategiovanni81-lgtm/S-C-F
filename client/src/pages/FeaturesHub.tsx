import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Video, 
  Image, 
  Type, 
  Zap,
  LayoutGrid,
  Brain,
  TrendingUp,
  Link as LinkIcon,
  Key,
  MessageCircle,
  Calendar as CalendarIcon,
  Scissors,
  Film,
  Eye,
  Crown
} from "lucide-react";
import { DecisionCard, DecisionCardGrid } from "@/components/ui/decision-card";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  path: string;
  category: string;
  isNew?: boolean;
  isPro?: boolean;
}

const features: Feature[] = [
  // AI Workflows
  {
    id: "ava-guide",
    title: "Ava AI Guide",
    description: "Guided workflow with decision tree",
    icon: Sparkles,
    gradient: "from-purple-600 to-pink-600",
    path: "/ava-guide",
    category: "Workflows",
    isNew: true,
  },
  {
    id: "quick-actions",
    title: "Quick Actions",
    description: "Fast-track content creation",
    icon: Zap,
    gradient: "from-yellow-600 to-orange-600",
    path: "/ava-guide",
    category: "Workflows",
    isNew: true,
  },
  
  // Content Creation
  {
    id: "reel-templates",
    title: "Reel Templates",
    description: "Beat-synced video templates",
    icon: Video,
    gradient: "from-purple-600 to-indigo-600",
    path: "/reel-templates",
    category: "Templates",
    isNew: true,
  },
  {
    id: "carousel-editor",
    title: "Carousel Editor",
    description: "Multi-slide carousel creator",
    icon: LayoutGrid,
    gradient: "from-blue-600 to-cyan-600",
    path: "/carousel-editor",
    category: "Templates",
    isNew: true,
  },
  {
    id: "thumbnail-gen",
    title: "Thumbnail Generator",
    description: "AI thumbnails with CTR scores",
    icon: Image,
    gradient: "from-orange-600 to-red-600",
    path: "/thumbnail-generator",
    category: "AI Tools",
    isNew: true,
  },
  {
    id: "magic-clips",
    title: "Magic Clips",
    description: "Long video → 20+ short clips",
    icon: Scissors,
    gradient: "from-fuchsia-600 to-purple-600",
    path: "/magic-clips",
    category: "AI Tools",
    isNew: true,
    isPro: true,
  },
  {
    id: "caption-styles",
    title: "Caption Styles",
    description: "Hormozi, MrBeast, Iman styles",
    icon: Type,
    gradient: "from-pink-600 to-rose-600",
    path: "/caption-styles",
    category: "AI Tools",
    isNew: true,
  },
  {
    id: "auto-trim",
    title: "Auto-Trim",
    description: "Remove silences & filler words",
    icon: Scissors,
    gradient: "from-red-600 to-orange-600",
    path: "/auto-trim",
    category: "AI Tools",
    isNew: true,
  },
  
  // Research & Planning
  {
    id: "keyword-research",
    title: "Keyword Research",
    description: "Topic clusters & brand tracking",
    icon: Brain,
    gradient: "from-indigo-600 to-purple-600",
    path: "/keyword-research",
    category: "Research",
    isNew: true,
  },
  {
    id: "hook-library",
    title: "Hook Library",
    description: "Proven hooks & CTAs",
    icon: MessageCircle,
    gradient: "from-yellow-600 to-orange-600",
    path: "/hook-library",
    category: "Research",
    isNew: true,
  },
  {
    id: "content-calendar",
    title: "Content Calendar",
    description: "AI weekly planning",
    icon: CalendarIcon,
    gradient: "from-green-600 to-emerald-600",
    path: "/content-calendar",
    category: "Planning",
    isNew: true,
  },
  
  // Integrations
  {
    id: "oauth",
    title: "Connect Accounts",
    description: "OAuth for all platforms",
    icon: LinkIcon,
    gradient: "from-blue-600 to-purple-600",
    path: "/oauth-connections",
    category: "Integrations",
    isNew: true,
  },
  {
    id: "byok",
    title: "BYOK Settings",
    description: "Your own API keys",
    icon: Key,
    gradient: "from-amber-600 to-orange-600",
    path: "/byok-settings",
    category: "Integrations",
    isNew: true,
  },
  
  // Existing Features
  {
    id: "content-queue",
    title: "Content Queue",
    description: "Generate & manage content",
    icon: Film,
    gradient: "from-violet-600 to-purple-600",
    path: "/content-queue",
    category: "Core",
  },
  {
    id: "creator-studio",
    title: "Creator Studio",
    description: "Advanced content creation",
    icon: Video,
    gradient: "from-rose-600 to-pink-600",
    path: "/creator-studio",
    category: "Core",
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Track performance",
    icon: TrendingUp,
    gradient: "from-emerald-600 to-teal-600",
    path: "/analytics",
    category: "Core",
  },
];

export default function FeaturesHub() {
  const categories = Array.from(new Set(features.map(f => f.category)));
  const newFeaturesCount = features.filter(f => f.isNew).length;

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-orange-900/40 border-purple-700/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-purple-400" />
                    All Features
                  </CardTitle>
                  <CardDescription className="text-lg mt-2">
                    Explore all the tools and features available in SocialCommand
                  </CardDescription>
                </div>
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg px-4 py-2">
                  {newFeaturesCount} New
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    {features.length}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">Total Features</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {newFeaturesCount}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">New This Month</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {features.filter(f => f.category === "AI Tools").length}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">AI Tools</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {features.filter(f => f.isPro).length}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">Pro Features</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features by Category */}
          {categories.map((category) => (
            <div key={category}>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                {category}
                {category === "Workflows" || category === "Templates" || category === "AI Tools" ? (
                  <Badge variant="secondary" className="bg-green-900/30 text-green-400 border-green-700">
                    NEW
                  </Badge>
                ) : null}
              </h2>
              
              <DecisionCardGrid>
                {features
                  .filter(f => f.category === category)
                  .map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <DecisionCard
                        key={feature.id}
                        title={feature.title}
                        description={feature.description}
                        icon={<Icon className="w-12 h-12" />}
                        gradient={feature.gradient}
                        badge={feature.isNew ? "NEW" : feature.isPro ? "PRO" : undefined}
                        locked={feature.isPro && false} // Set to true for actual tier checking
                        tier={feature.isPro ? "pro" : undefined}
                        onClick={() => window.location.href = feature.path}
                      />
                    );
                  })}
              </DecisionCardGrid>
            </div>
          ))}

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-700/50">
            <CardContent className="p-8 text-center">
              <Crown className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-2xl font-bold mb-2">Unlock All Features</h3>
              <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                Upgrade to Pro to access Magic Clips, advanced AI tools, and unlimited content generation
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600">
                  <Crown className="w-5 h-5 mr-2" />
                  Upgrade to Pro
                </Button>
                <Button size="lg" variant="outline">
                  View Pricing
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
