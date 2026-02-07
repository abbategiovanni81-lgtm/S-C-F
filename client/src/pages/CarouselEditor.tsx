import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  Download, 
  LayoutGrid, 
  Type, 
  Image as ImageIcon,
  Sticker,
  Palette,
  Move,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Save,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

interface CarouselSlide {
  id: string;
  background: string;
  elements: any[];
}

export default function CarouselEditor() {
  const [slides, setSlides] = useState<CarouselSlide[]>([
    { id: "1", background: "#8B5CF6", elements: [] },
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedTool, setSelectedTool] = useState<"text" | "image" | "sticker" | "move">("move");

  const currentSlide = slides[currentSlideIndex];

  const addSlide = () => {
    const newSlide: CarouselSlide = {
      id: Date.now().toString(),
      background: "#6366F1",
      elements: [],
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const deleteSlide = (index: number) => {
    if (slides.length === 1) return;
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    if (currentSlideIndex >= newSlides.length) {
      setCurrentSlideIndex(newSlides.length - 1);
    }
  };

  const duplicateSlide = (index: number) => {
    const slideToDuplicate = slides[index];
    const newSlide: CarouselSlide = {
      id: Date.now().toString(),
      background: slideToDuplicate.background,
      elements: JSON.parse(JSON.stringify(slideToDuplicate.elements)),
    };
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, newSlide);
    setSlides(newSlides);
    setCurrentSlideIndex(index + 1);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border-blue-700/50">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <LayoutGrid className="w-8 h-8 text-blue-400" />
                Carousel Editor
              </CardTitle>
              <CardDescription className="text-lg">
                Create stunning multi-slide carousels with text, images, and stickers
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Panel - Tools */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant={selectedTool === "move" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedTool("move")}
                  >
                    <Move className="w-4 h-4 mr-2" />
                    Select & Move
                  </Button>
                  <Button
                    variant={selectedTool === "text" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedTool("text")}
                  >
                    <Type className="w-4 h-4 mr-2" />
                    Add Text
                  </Button>
                  <Button
                    variant={selectedTool === "image" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedTool("image")}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Image
                  </Button>
                  <Button
                    variant={selectedTool === "sticker" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedTool("sticker")}
                  >
                    <Sticker className="w-4 h-4 mr-2" />
                    Add Sticker
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Background</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Color</Label>
                    <Input
                      type="color"
                      value={currentSlide.background}
                      onChange={(e) => {
                        const newSlides = [...slides];
                        newSlides[currentSlideIndex].background = e.target.value;
                        setSlides(newSlides);
                      }}
                      className="h-12 cursor-pointer"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"].map((color) => (
                      <button
                        key={color}
                        className="w-full h-10 rounded border-2 border-slate-700 hover:border-white transition-colors"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          const newSlides = [...slides];
                          newSlides[currentSlideIndex].background = color;
                          setSlides(newSlides);
                        }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Export</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export All Slides
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Center - Canvas */}
            <div className="lg:col-span-2 space-y-4">
              {/* Canvas Controls */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Undo className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Redo className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">
                        Slide {currentSlideIndex + 1} of {slides.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <span className="text-sm px-2">100%</span>
                      <Button size="sm" variant="outline">
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Canvas Area */}
              <Card className="bg-slate-800">
                <CardContent className="p-6">
                  <div className="aspect-square max-w-lg mx-auto rounded-lg overflow-hidden relative border-2 border-slate-700">
                    {/* Canvas with current background */}
                    <div
                      className="w-full h-full flex items-center justify-center text-white/50 text-lg font-medium"
                      style={{ backgroundColor: currentSlide.background }}
                    >
                      {currentSlide.elements.length === 0 && (
                        <div className="text-center">
                          <Palette className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Click a tool to add elements</p>
                        </div>
                      )}
                      {/* Canvas elements would be rendered here */}
                    </div>

                    {/* Navigation Arrows */}
                    {currentSlideIndex > 0 && (
                      <button
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2"
                        onClick={() => setCurrentSlideIndex(currentSlideIndex - 1)}
                      >
                        <ChevronLeft className="w-6 h-6 text-white" />
                      </button>
                    )}
                    {currentSlideIndex < slides.length - 1 && (
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2"
                        onClick={() => setCurrentSlideIndex(currentSlideIndex + 1)}
                      >
                        <ChevronRight className="w-6 h-6 text-white" />
                      </button>
                    )}
                  </div>

                  {/* Slide Indicator */}
                  <div className="flex justify-center gap-2 mt-4">
                    {slides.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentSlideIndex
                            ? "bg-blue-500 w-6"
                            : "bg-slate-600 hover:bg-slate-500"
                        }`}
                        onClick={() => setCurrentSlideIndex(index)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Slide Management */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Slides</CardTitle>
                    <Button size="sm" onClick={addSlide}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {slides.map((slide, index) => (
                      <div
                        key={slide.id}
                        className={`group relative cursor-pointer rounded-lg border-2 transition-all ${
                          index === currentSlideIndex
                            ? "border-blue-500 shadow-lg"
                            : "border-slate-700 hover:border-slate-500"
                        }`}
                        onClick={() => setCurrentSlideIndex(index)}
                      >
                        <div
                          className="aspect-square rounded-md overflow-hidden"
                          style={{ backgroundColor: slide.background }}
                        >
                          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
                            Slide {index + 1}
                          </div>
                        </div>
                        
                        {/* Slide Actions */}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateSlide(index);
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          {slides.length > 1 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSlide(index);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>

                        <Badge
                          className="absolute bottom-1 left-1 text-xs"
                          variant={index === currentSlideIndex ? "default" : "secondary"}
                        >
                          {index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
