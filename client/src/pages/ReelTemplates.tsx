import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DecisionCard, DecisionCardGrid } from "@/components/ui/decision-card";
import { 
  Play, 
  Pause, 
  Music, 
  Video, 
  Download, 
  Wand2,
  Filter,
  Search,
  TrendingUp,
  Heart,
  Clock,
  Layers
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReelTemplate {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  category: string;
  duration: number;
  clipSlots: number;
  musicTrack?: string;
  popularity: number;
  isPro?: boolean;
}

const mockTemplates: ReelTemplate[] = [
  {
    id: "1",
    name: "Trending Dance",
    description: "Viral dance template with beat drops",
    thumbnailUrl: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=400",
    category: "dance",
    duration: 15,
    clipSlots: 4,
    musicTrack: "Trending Beat #1",
    popularity: 95,
  },
  {
    id: "2",
    name: "Product Showcase",
    description: "Dynamic product reveal with transitions",
    thumbnailUrl: "https://images.unsplash.com/photo-1556155092-490a1ba16284?w=400",
    category: "product",
    duration: 30,
    clipSlots: 6,
    musicTrack: "Upbeat Corporate",
    popularity: 88,
  },
  {
    id: "3",
    name: "Before/After",
    description: "Split-screen transformation template",
    thumbnailUrl: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=400",
    category: "transformation",
    duration: 20,
    clipSlots: 2,
    musicTrack: "Epic Build",
    popularity: 92,
  },
  {
    id: "4",
    name: "Quick Tips",
    description: "Fast-paced educational content",
    thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400",
    category: "education",
    duration: 45,
    clipSlots: 8,
    musicTrack: "Lo-Fi Study",
    popularity: 85,
    isPro: true,
  },
  {
    id: "5",
    name: "Vlog Intro",
    description: "Eye-catching intro for vlogs",
    thumbnailUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400",
    category: "vlog",
    duration: 10,
    clipSlots: 3,
    musicTrack: "Energetic Pop",
    popularity: 80,
  },
  {
    id: "6",
    name: "Recipe Quick",
    description: "Food content with timer overlays",
    thumbnailUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
    category: "food",
    duration: 60,
    clipSlots: 10,
    musicTrack: "Kitchen Vibes",
    popularity: 87,
  },
];

export default function ReelTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<ReelTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [isPlaying, setIsPlaying] = useState(false);

  const categories = ["all", "dance", "product", "transformation", "education", "vlog", "food"];

  const filteredTemplates = mockTemplates
    .filter((template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "popularity") return b.popularity - a.popularity;
      if (sortBy === "duration") return a.duration - b.duration;
      return 0;
    });

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-700/50">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <Video className="w-8 h-8 text-purple-400" />
                Reel Templates
              </CardTitle>
              <CardDescription className="text-lg">
                Professional templates with beat-synced music and customizable clip slots
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Filters & Search */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popularity">Popularity</SelectItem>
                        <SelectItem value="duration">Duration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Stats */}
                  <div className="pt-4 border-t border-slate-700">
                    <div className="text-sm text-slate-400">
                      Showing {filteredTemplates.length} of {mockTemplates.length} templates
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Template Info */}
              {selectedTemplate && (
                <Card className="bg-purple-900/20 border-purple-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{selectedTemplate.name}</CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{selectedTemplate.duration}s duration</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span>{selectedTemplate.clipSlots} clip slots</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Music className="w-4 h-4 text-slate-400" />
                      <span>{selectedTemplate.musicTrack}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-slate-400" />
                      <span>{selectedTemplate.popularity}% popularity</span>
                    </div>
                    <Button className="w-full mt-4" size="lg">
                      <Wand2 className="w-4 h-4 mr-2" />
                      Use This Template
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Panel - Template Grid */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="grid" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="grid">Grid View</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="grid" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-all hover:scale-105 hover:shadow-xl ${
                          selectedTemplate?.id === template.id 
                            ? "border-purple-500 shadow-lg shadow-purple-500/30" 
                            : "border-slate-700"
                        }`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="relative h-48 overflow-hidden rounded-t-lg">
                          <img
                            src={template.thumbnailUrl}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          
                          {/* Overlay Info */}
                          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                            <div>
                              <Badge className="bg-purple-600 text-white mb-1">
                                {template.category}
                              </Badge>
                              <div className="text-sm text-white/90 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                {template.duration}s
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-white">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-sm font-bold">{template.popularity}%</span>
                            </div>
                          </div>

                          {template.isPro && (
                            <Badge className="absolute top-2 right-2 bg-yellow-600 text-white">
                              PRO
                            </Badge>
                          )}
                        </div>
                        
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription className="text-xs line-clamp-2">
                            {template.description}
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <div className="flex items-center gap-1">
                              <Music className="w-3 h-3" />
                              <span>{template.musicTrack}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              <span>{template.clipSlots} slots</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-6">
                  {selectedTemplate ? (
                    <Card className="bg-slate-800">
                      <CardContent className="p-6">
                        {/* CapCut-style Preview */}
                        <div className="aspect-[9/16] max-w-sm mx-auto bg-black rounded-lg overflow-hidden relative">
                          <img
                            src={selectedTemplate.thumbnailUrl}
                            alt={selectedTemplate.name}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Button
                              size="lg"
                              variant="outline"
                              className="rounded-full w-16 h-16 p-0"
                              onClick={() => setIsPlaying(!isPlaying)}
                            >
                              {isPlaying ? (
                                <Pause className="w-8 h-8" />
                              ) : (
                                <Play className="w-8 h-8 ml-1" />
                              )}
                            </Button>
                          </div>

                          {/* Beat Markers */}
                          <div className="absolute bottom-20 left-0 right-0 px-4">
                            <div className="flex gap-1">
                              {Array.from({ length: selectedTemplate.clipSlots }).map((_, i) => (
                                <div key={i} className="flex-1 h-1 bg-white/30 rounded-full" />
                              ))}
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white text-sm">
                              <Music className="w-4 h-4" />
                              <span>{selectedTemplate.musicTrack}</span>
                            </div>
                            <Button size="sm" variant="ghost" className="text-white">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-slate-800/50">
                      <CardContent className="p-12 text-center">
                        <Video className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                        <p className="text-slate-400">
                          Select a template to preview
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
