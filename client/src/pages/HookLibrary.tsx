import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Copy, 
  Heart, 
  TrendingUp, 
  Filter,
  Zap,
  BookmarkPlus,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Hook {
  id: string;
  text: string;
  category: string;
  platform: string;
  style: string;
  saved: boolean;
  popularity: number;
}

const mockHooks: Hook[] = [
  {
    id: "1",
    text: "Stop scrolling. This will change your life in 30 seconds.",
    category: "curiosity",
    platform: "all",
    style: "direct",
    saved: false,
    popularity: 95,
  },
  {
    id: "2",
    text: "I made $10,000 this month doing this one simple thing...",
    category: "money",
    platform: "tiktok",
    style: "story",
    saved: true,
    popularity: 92,
  },
  {
    id: "3",
    text: "POV: You just discovered the secret that influencers don't want you to know",
    category: "secret",
    platform: "instagram",
    style: "pov",
    saved: false,
    popularity: 88,
  },
  {
    id: "4",
    text: "If you're still doing [X], you're already behind.",
    category: "fear",
    platform: "all",
    style: "direct",
    saved: false,
    popularity: 85,
  },
  {
    id: "5",
    text: "Here's what nobody tells you about [topic]:",
    category: "secret",
    platform: "youtube",
    style: "list",
    saved: true,
    popularity: 90,
  },
  {
    id: "6",
    text: "I wasted 5 years doing it wrong. Here's what I learned.",
    category: "lesson",
    platform: "all",
    style: "story",
    saved: false,
    popularity: 87,
  },
];

const mockCTAs: Hook[] = [
  {
    id: "c1",
    text: "Drop a 🔥 if you want part 2!",
    category: "engagement",
    platform: "all",
    style: "emoji",
    saved: false,
    popularity: 94,
  },
  {
    id: "c2",
    text: "Link in bio for the full guide 👆",
    category: "conversion",
    platform: "instagram",
    style: "direct",
    saved: true,
    popularity: 91,
  },
  {
    id: "c3",
    text: "Comment 'MORE' and I'll send you the template",
    category: "engagement",
    platform: "all",
    style: "direct",
    saved: false,
    popularity: 89,
  },
  {
    id: "c4",
    text: "Follow for daily tips like this ⚡",
    category: "growth",
    platform: "all",
    style: "simple",
    saved: false,
    popularity: 82,
  },
];

export default function HookLibrary() {
  const [hooks, setHooks] = useState<Hook[]>(mockHooks);
  const [ctas, setCTAs] = useState<Hook[]>(mockCTAs);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [styleFilter, setStyleFilter] = useState("all");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const { toast } = useToast();

  const categories = ["all", "curiosity", "money", "secret", "fear", "lesson", "engagement", "conversion", "growth"];
  const platforms = ["all", "tiktok", "instagram", "youtube"];
  const styles = ["all", "direct", "story", "pov", "list", "emoji", "simple"];

  const filterItems = (items: Hook[]) => {
    return items.filter((item) => {
      const matchesSearch = item.text.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesPlatform = platformFilter === "all" || item.platform === "all" || item.platform === platformFilter;
      const matchesStyle = styleFilter === "all" || item.style === styleFilter;
      const matchesSaved = !showSavedOnly || item.saved;
      return matchesSearch && matchesCategory && matchesPlatform && matchesStyle && matchesSaved;
    });
  };

  const toggleSaved = (id: string, isHook: boolean) => {
    if (isHook) {
      setHooks(hooks.map(h => h.id === id ? { ...h, saved: !h.saved } : h));
    } else {
      setCTAs(ctas.map(c => c.id === id ? { ...c, saved: !c.saved } : c));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Hook copied to clipboard",
    });
  };

  const filteredHooks = filterItems(hooks);
  const filteredCTAs = filterItems(ctas);

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border-yellow-700/50">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <Zap className="w-8 h-8 text-yellow-400" />
                Hook & CTA Library
              </CardTitle>
              <CardDescription className="text-lg">
                Browse proven hooks, captions, and CTAs. Filter by platform, style, and performance.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search hooks and CTAs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform === "all" ? "All Platforms" : platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={styleFilter} onValueChange={setStyleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Style" />
                  </SelectTrigger>
                  <SelectContent>
                    {styles.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style === "all" ? "All Styles" : style.charAt(0).toUpperCase() + style.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                <Button
                  variant={showSavedOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowSavedOnly(!showSavedOnly)}
                >
                  <BookmarkPlus className="w-4 h-4 mr-2" />
                  Saved Only
                </Button>
                <span className="text-sm text-slate-400">
                  {filteredHooks.length + filteredCTAs.length} results
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Hooks vs CTAs */}
          <Tabs defaultValue="hooks" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="hooks">
                Hooks ({filteredHooks.length})
              </TabsTrigger>
              <TabsTrigger value="ctas">
                CTAs ({filteredCTAs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hooks" className="mt-6">
              <div className="space-y-3">
                {filteredHooks.map((hook) => (
                  <Card key={hook.id} className="hover:border-purple-500/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-lg mb-3">{hook.text}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {hook.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {hook.platform}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {hook.style}
                            </Badge>
                            <Badge className="text-xs bg-green-900/30 text-green-400 border-green-700">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {hook.popularity}%
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(hook.text)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={hook.saved ? "default" : "outline"}
                            onClick={() => toggleSaved(hook.id, true)}
                          >
                            <Heart className={`w-4 h-4 ${hook.saved ? "fill-current" : ""}`} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ctas" className="mt-6">
              <div className="space-y-3">
                {filteredCTAs.map((cta) => (
                  <Card key={cta.id} className="hover:border-blue-500/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-lg mb-3">{cta.text}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {cta.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {cta.platform}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {cta.style}
                            </Badge>
                            <Badge className="text-xs bg-green-900/30 text-green-400 border-green-700">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {cta.popularity}%
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(cta.text)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={cta.saved ? "default" : "outline"}
                            onClick={() => toggleSaved(cta.id, false)}
                          >
                            <Heart className={`w-4 h-4 ${cta.saved ? "fill-current" : ""}`} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
