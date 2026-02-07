import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { 
  Wand2, 
  Image as ImageIcon, 
  Download, 
  RefreshCw, 
  TrendingUp,
  Eye,
  ThumbsUp,
  Sparkles
} from "lucide-react";
import { DecisionCardGrid, DecisionCard } from "@/components/ui/decision-card";

interface ThumbnailVariation {
  id: string;
  imageUrl: string;
  ctrScore: number;
  style: string;
  features: string[];
}

export default function ThumbnailGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<ThumbnailVariation[]>([]);

  const mockVariations: ThumbnailVariation[] = [
    {
      id: "1",
      imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600",
      ctrScore: 8.7,
      style: "Bold Text + Face",
      features: ["High Contrast", "Emotional Expression", "Clear Text"],
    },
    {
      id: "2",
      imageUrl: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600",
      ctrScore: 9.2,
      style: "Action Shot",
      features: ["Dynamic Movement", "Bright Colors", "Story Telling"],
    },
    {
      id: "3",
      imageUrl: "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=600",
      ctrScore: 7.8,
      style: "Minimal Clean",
      features: ["Simple Design", "Professional", "Easy to Read"],
    },
    {
      id: "4",
      imageUrl: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=600",
      ctrScore: 8.9,
      style: "Before/After Split",
      features: ["Comparison View", "Curiosity Gap", "Visual Contrast"],
    },
  ];

  const generateThumbnails = () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setVariations(mockVariations);
      setIsGenerating(false);
    }, 2000);
  };

  const getCTRColor = (score: number) => {
    if (score >= 9) return "text-green-400";
    if (score >= 8) return "text-blue-400";
    if (score >= 7) return "text-yellow-400";
    return "text-orange-400";
  };

  const getCTRLabel = (score: number) => {
    if (score >= 9) return "Excellent";
    if (score >= 8) return "Very Good";
    if (score >= 7) return "Good";
    return "Average";
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-orange-900/40 to-red-900/40 border-orange-700/50">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <ImageIcon className="w-8 h-8 text-orange-400" />
                AI Thumbnail Generator
              </CardTitle>
              <CardDescription className="text-lg">
                Generate multiple thumbnail variations with CTR prediction scores
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Describe Your Video</CardTitle>
              <CardDescription>
                Tell us about your video content and we'll generate optimized thumbnails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prompt">Video Topic / Main Message</Label>
                <Textarea
                  id="prompt"
                  placeholder="E.g., 'How to lose weight in 30 days - transformation story with before/after photos'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="style">Preferred Style (Optional)</Label>
                  <Input
                    id="style"
                    placeholder="E.g., 'Bold text, bright colors, face closeup'"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="emotion">Target Emotion (Optional)</Label>
                  <Input
                    id="emotion"
                    placeholder="E.g., 'Excitement', 'Curiosity', 'Shock'"
                    className="mt-2"
                  />
                </div>
              </div>

              <Button 
                onClick={generateThumbnails} 
                disabled={!prompt || isGenerating}
                size="lg"
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Generating Thumbnails...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate AI Thumbnails
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          {isGenerating && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Generating variations...</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Analyzing optimal thumbnail patterns for your niche</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {variations.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  Generated Thumbnails ({variations.length})
                </h2>
                <Button variant="outline" onClick={generateThumbnails}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {variations.map((variation) => (
                  <Card key={variation.id} className="overflow-hidden">
                    {/* Thumbnail Image */}
                    <div className="relative aspect-video">
                      <img
                        src={variation.imageUrl}
                        alt={variation.style}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* CTR Score Badge */}
                      <Badge className="absolute top-3 right-3 bg-black/70 text-white border-0">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {variation.ctrScore}/10 CTR
                      </Badge>
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{variation.style}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <span className={getCTRColor(variation.ctrScore)}>
                              {getCTRLabel(variation.ctrScore)}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span>Predicted Click-Through Rate</span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Features */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Eye className="w-4 h-4 text-blue-400" />
                          Key Features
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {variation.features.map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* CTR Score Details */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4 text-green-400" />
                          Engagement Prediction
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Click-Through Rate</span>
                            <span className={getCTRColor(variation.ctrScore)}>
                              {variation.ctrScore}/10
                            </span>
                          </div>
                          <Progress 
                            value={variation.ctrScore * 10} 
                            className="h-2"
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" className="flex-1">
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Tips Section */}
          {!isGenerating && variations.length === 0 && (
            <Card className="bg-blue-900/20 border-blue-700/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  Tips for Best Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Be specific about your video's main topic and key message</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Mention if you want to include text, faces, or specific elements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Higher CTR scores indicate better predicted performance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Test multiple variations to see what works best for your audience</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
