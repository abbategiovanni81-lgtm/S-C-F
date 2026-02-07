import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DecisionCard, DecisionCardGrid } from "@/components/ui/decision-card";
import { 
  Type, 
  Play, 
  Wand2,
  Download,
  Eye
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CaptionStyle {
  id: string;
  name: string;
  creator: string;
  description: string;
  previewText: string;
  animation: "word" | "line" | "karaoke" | "pop";
  fontFamily: string;
  color: string;
  bgColor: string;
  position: "top" | "center" | "bottom";
  gradient: string;
}

const captionStyles: CaptionStyle[] = [
  {
    id: "hormozi",
    name: "Hormozi Style",
    creator: "Alex Hormozi",
    description: "Bold, uppercase text with high contrast",
    previewText: "THIS IS HOW YOU MAKE $100M",
    animation: "word",
    fontFamily: "font-black",
    color: "text-white",
    bgColor: "bg-black",
    position: "center",
    gradient: "from-orange-600 to-red-600",
  },
  {
    id: "mrbeast",
    name: "MrBeast Style",
    creator: "MrBeast",
    description: "Large, bold text with drop shadow",
    previewText: "I Gave Away $1,000,000",
    animation: "pop",
    fontFamily: "font-black",
    color: "text-yellow-400",
    bgColor: "bg-transparent",
    position: "top",
    gradient: "from-yellow-600 to-orange-600",
  },
  {
    id: "iman",
    name: "Iman Gadzhi Style",
    creator: "Iman Gadzhi",
    description: "Minimal, clean captions with elegant font",
    previewText: "Here's what nobody tells you",
    animation: "line",
    fontFamily: "font-semibold",
    color: "text-white",
    bgColor: "bg-black/50",
    position: "bottom",
    gradient: "from-purple-600 to-indigo-600",
  },
  {
    id: "viral-tiktok",
    name: "Viral TikTok",
    creator: "TikTok Trend",
    description: "Animated word-by-word with color highlights",
    previewText: "Wait for it... 👀",
    animation: "karaoke",
    fontFamily: "font-bold",
    color: "text-white",
    bgColor: "bg-gradient-to-r from-pink-500 to-purple-500",
    position: "center",
    gradient: "from-pink-600 to-purple-600",
  },
];

export default function CaptionStyles() {
  const [selectedStyle, setSelectedStyle] = useState<CaptionStyle | null>(null);
  const [customText, setCustomText] = useState("This is your custom text");
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-pink-900/40 to-rose-900/40 border-pink-700/50">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <Type className="w-8 h-8 text-pink-400" />
                AI Caption Styles
              </CardTitle>
              <CardDescription className="text-lg">
                Apply viral caption styles from top creators with word-by-word animations
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Style Selection */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Select Caption Style</h2>
                <DecisionCardGrid>
                  {captionStyles.map((style) => (
                    <DecisionCard
                      key={style.id}
                      title={style.name}
                      description={style.description}
                      gradient={style.gradient}
                      selected={selectedStyle?.id === style.id}
                      onClick={() => setSelectedStyle(style)}
                      badge={style.creator}
                    />
                  ))}
                </DecisionCardGrid>
              </div>

              {/* Custom Text Input */}
              {selectedStyle && (
                <Card>
                  <CardHeader>
                    <CardTitle>Preview Your Text</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      rows={3}
                      placeholder="Enter your caption text..."
                    />
                    <Button 
                      className="w-full"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {isPlaying ? "Stop" : "Play"} Animation
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Panel - Preview */}
            <div className="space-y-4">
              {selectedStyle ? (
                <>
                  <Card className="bg-gradient-to-br from-slate-800 to-slate-900">
                    <CardHeader>
                      <CardTitle className="text-lg">Live Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Phone Mockup */}
                      <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden relative">
                        {/* Gradient Border Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${selectedStyle.gradient} opacity-20`} />
                        
                        {/* Video Background Placeholder */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 opacity-50" />
                        
                        {/* Caption Overlay */}
                        <div className={`absolute inset-0 flex items-${selectedStyle.position === 'top' ? 'start' : selectedStyle.position === 'bottom' ? 'end' : 'center'} justify-center p-6`}>
                          <div className={`${selectedStyle.bgColor} ${selectedStyle.color} ${selectedStyle.fontFamily} text-2xl text-center px-4 py-2 rounded-lg max-w-full`}>
                            {isPlaying ? (
                              <div className="animate-pulse">
                                {customText}
                              </div>
                            ) : (
                              customText
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Style Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{selectedStyle.name}</CardTitle>
                      <CardDescription>by {selectedStyle.creator}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Animation:</span>
                          <Badge variant="secondary">{selectedStyle.animation}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Position:</span>
                          <Badge variant="secondary">{selectedStyle.position}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Font Style:</span>
                          <Badge variant="secondary">{selectedStyle.fontFamily}</Badge>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-700">
                        <Button className="w-full" size="sm">
                          <Wand2 className="w-4 h-4 mr-2" />
                          Apply to Video
                        </Button>
                        <Button variant="outline" className="w-full mt-2" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Export Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Animation Details */}
                  <Card className="bg-blue-900/20 border-blue-700/50">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-400" />
                        Animation Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-300 mb-3">
                        {selectedStyle.animation === "word" && "Words appear one at a time"}
                        {selectedStyle.animation === "line" && "Lines appear sequentially"}
                        {selectedStyle.animation === "karaoke" && "Words highlight as they're spoken"}
                        {selectedStyle.animation === "pop" && "Words pop in with bounce effect"}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {["Word 1", "Word 2", "Word 3"].map((word, i) => (
                          <div
                            key={i}
                            className="bg-slate-800 p-2 rounded text-center text-xs"
                            style={{
                              animation: isPlaying ? `fadeIn 0.5s ease-in ${i * 0.2}s both` : "none"
                            }}
                          >
                            {word}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="bg-slate-800/50">
                  <CardContent className="p-12 text-center">
                    <Type className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400">
                      Select a caption style to preview
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Tips Section */}
          <Card className="bg-pink-900/20 border-pink-700/50">
            <CardHeader>
              <CardTitle className="text-lg">Caption Style Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                <div>
                  <h4 className="font-bold mb-2 text-white">Hormozi Style</h4>
                  <p>Best for: Educational content, money/business topics</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-white">MrBeast Style</h4>
                  <p>Best for: Challenges, giveaways, high-energy content</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-white">Iman Style</h4>
                  <p>Best for: Lifestyle, personal development, vlogs</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-white">Viral TikTok</h4>
                  <p>Best for: Trending topics, relatable content, hooks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Layout>
  );
}
