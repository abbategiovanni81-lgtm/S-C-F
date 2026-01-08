import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Slider } from "@/components/ui/slider";
import { 
  Type, Image as ImageIcon, Video, Clock, Loader2, Upload, 
  Trash2, Download, RefreshCw, Scissors, Zap, Moon, CheckCircle,
  XCircle, AlertCircle, Play, Pause, ArrowRight, Send,
  ChevronLeft, ChevronRight, Bold, Italic, Underline, Move
} from "lucide-react";
import type { EditJob, GeneratedContent } from "@shared/schema";

const POSITIONS = [
  { value: "top", label: "Top Center" },
  { value: "center", label: "Center" },
  { value: "bottom", label: "Bottom Center" },
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
];

const FONT_FAMILIES = [
  // Sans-Serif Modern
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "'Helvetica Neue', Helvetica, sans-serif", label: "Helvetica" },
  { value: "system-ui, sans-serif", label: "System UI" },
  { value: "'Segoe UI', sans-serif", label: "Segoe UI" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Tahoma, sans-serif", label: "Tahoma" },
  // Bold Display
  { value: "Impact, sans-serif", label: "Impact" },
  { value: "'Arial Black', sans-serif", label: "Arial Black" },
  { value: "'Trebuchet MS', sans-serif", label: "Trebuchet" },
  // Serif Classic
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "'Palatino Linotype', Palatino, serif", label: "Palatino" },
  { value: "'Book Antiqua', serif", label: "Book Antiqua" },
  // Handwritten/Script
  { value: "'Comic Sans MS', cursive", label: "Comic Sans" },
  { value: "'Brush Script MT', cursive", label: "Brush Script" },
  { value: "'Lucida Handwriting', cursive", label: "Lucida Handwriting" },
  // Monospace
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "'Lucida Console', monospace", label: "Lucida Console" },
  { value: "Consolas, monospace", label: "Consolas" },
];

const JOB_TYPES = [
  { value: "video_trim", label: "Trim Video", icon: Scissors },
  { value: "video_split", label: "Split Video", icon: Scissors },
  { value: "video_speed", label: "Change Speed", icon: Zap },
  { value: "audio_sync", label: "Sync Audio", icon: Play },
];

export default function Editor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const params = useParams<{ contentId?: string }>();
  const [, setLocation] = useLocation();

  // Source content tracking
  const [sourceContentId, setSourceContentId] = useState<string | null>(null);
  const [sourceContent, setSourceContent] = useState<GeneratedContent | null>(null);

  // Carousel/multi-image state
  const [carouselImages, setCarouselImages] = useState<Array<{
    imageUrl: string;
    textOverlay: string;
    outputUrl?: string;
  }>>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Text overlay state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [overlayText, setOverlayText] = useState("Your Text Here");
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");
  const [textPosition, setTextPosition] = useState("center");
  const [backgroundColor, setBackgroundColor] = useState("transparent");
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  
  // Text style options
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [hasStroke, setHasStroke] = useState(true);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [hasShadow, setHasShadow] = useState(false);
  
  // Drag positioning
  const [isDragging, setIsDragging] = useState(false);
  const [customPosition, setCustomPosition] = useState<{ x: number; y: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Video job state
  const [videoJobName, setVideoJobName] = useState("");
  const [videoJobType, setVideoJobType] = useState("video_trim");
  const [videoSourceUrl, setVideoSourceUrl] = useState("");
  const [videoPriority, setVideoPriority] = useState("standard");
  const [trimStart, setTrimStart] = useState("0");
  const [trimEnd, setTrimEnd] = useState("10");
  const [speedMultiplier, setSpeedMultiplier] = useState("1.5");

  // Fetch edit jobs
  const { data: editJobs = [], isLoading: jobsLoading } = useQuery<EditJob[]>({
    queryKey: ["/api/edit-jobs"],
  });

  // Fetch approved content for loading from URL params
  const { data: approvedContent = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=approved"],
  });

  // Load content from URL params - supports carousels with multiple images
  useEffect(() => {
    if (params.contentId && approvedContent.length > 0 && !sourceContentId) {
      const content = approvedContent.find(c => c.id === params.contentId);
      if (content) {
        setSourceContentId(content.id);
        setSourceContent(content);
        
        const metadata = content.generationMetadata as any;
        
        // Check for carousel content with multiple images
        if (metadata?.generatedCarouselImages && metadata.generatedCarouselImages.length > 0) {
          // Load all carousel images
          const slides = metadata.carouselPrompts?.slides || [];
          const images = metadata.generatedCarouselImages.map((img: any, idx: number) => ({
            imageUrl: img.imageUrl,
            textOverlay: slides[idx]?.textOverlay || "",
            outputUrl: undefined,
          }));
          
          setCarouselImages(images);
          setCurrentImageIndex(0);
          setImagePreview(images[0].imageUrl);
          setOverlayText(images[0].textOverlay || "Your Text Here");
          
          toast({ 
            title: "Carousel loaded", 
            description: `${images.length} images loaded. Use arrows to navigate between slides.` 
          });
        } else {
          // Single image content - load BOTH generated and uploaded images
          const genImageUrl = metadata?.generatedImageUrl;
          const uploadedImageUrl = metadata?.uploadedImageUrl;
          const textOverlay = metadata?.imagePrompts?.textOverlay || "";
          
          // Build array of all available images
          const allImages: { imageUrl: string; textOverlay: string; label: string }[] = [];
          
          if (genImageUrl) {
            allImages.push({ imageUrl: genImageUrl, textOverlay, label: "AI Generated" });
          }
          if (uploadedImageUrl) {
            allImages.push({ imageUrl: uploadedImageUrl, textOverlay, label: "Uploaded" });
          }
          
          // Fallback to thumbnailUrl if no images
          if (allImages.length === 0 && content.thumbnailUrl) {
            allImages.push({ imageUrl: content.thumbnailUrl, textOverlay, label: "Thumbnail" });
          }
          
          if (allImages.length > 0) {
            setCarouselImages(allImages);
            setCurrentImageIndex(0);
            setImagePreview(allImages[0].imageUrl);
            
            if (textOverlay) {
              setOverlayText(textOverlay);
            }
            
            const msg = allImages.length > 1 
              ? `${allImages.length} images loaded. Use arrows to navigate between them.`
              : "Image loaded from Content Queue. Add your text overlay.";
            toast({ title: "Content loaded", description: msg });
          }
        }
      }
    }
  }, [params.contentId, approvedContent, sourceContentId, toast]);
  
  // Navigate carousel images
  const handlePrevImage = () => {
    if (carouselImages.length > 1 && currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
      setImagePreview(carouselImages[newIndex].outputUrl || carouselImages[newIndex].imageUrl);
      setOverlayText(carouselImages[newIndex].textOverlay || "Your Text Here");
      setOutputUrl(carouselImages[newIndex].outputUrl || null);
    }
  };
  
  const handleNextImage = () => {
    if (carouselImages.length > 1 && currentImageIndex < carouselImages.length - 1) {
      const newIndex = currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
      setImagePreview(carouselImages[newIndex].outputUrl || carouselImages[newIndex].imageUrl);
      setOverlayText(carouselImages[newIndex].textOverlay || "Your Text Here");
      setOutputUrl(carouselImages[newIndex].outputUrl || null);
    }
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setOutputUrl(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Process text overlay
  const handleTextOverlay = async () => {
    if (!selectedImage && !imagePreview) {
      toast({ title: "No image selected", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      
      // If we have a file, use it; otherwise use the URL from current carousel image
      if (selectedImage) {
        formData.append("image", selectedImage);
      } else if (carouselImages.length > 0) {
        // Use original image URL for processing (not output which may already have overlay)
        formData.append("imageUrl", carouselImages[currentImageIndex].imageUrl);
      } else if (imagePreview) {
        formData.append("imageUrl", imagePreview);
      }
      
      formData.append("text", overlayText);
      formData.append("fontSize", String(fontSize));
      formData.append("fontColor", fontColor);
      formData.append("fontFamily", fontFamily);
      formData.append("position", customPosition ? "custom" : textPosition);
      formData.append("backgroundColor", backgroundColor);
      
      // Text styles
      formData.append("isBold", String(isBold));
      formData.append("isItalic", String(isItalic));
      formData.append("isUnderline", String(isUnderline));
      formData.append("hasStroke", String(hasStroke));
      formData.append("strokeColor", strokeColor);
      formData.append("hasShadow", String(hasShadow));
      
      // Custom position coordinates (percentage-based)
      if (customPosition) {
        formData.append("customX", String(customPosition.x));
        formData.append("customY", String(customPosition.y));
      }
      
      if (sourceContentId) {
        formData.append("sourceContentId", sourceContentId);
      }

      const res = await fetch("/api/edit-jobs/text-overlay", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process image");
      }

      const data = await res.json();
      setOutputUrl(data.outputUrl);
      
      // Save output to carousel array
      if (carouselImages.length > 0) {
        const updatedImages = [...carouselImages];
        updatedImages[currentImageIndex] = {
          ...updatedImages[currentImageIndex],
          outputUrl: data.outputUrl,
          textOverlay: overlayText,
        };
        setCarouselImages(updatedImages);
        
        const editedCount = updatedImages.filter(img => img.outputUrl).length;
        toast({ 
          title: "Text overlay applied!", 
          description: carouselImages.length > 1 
            ? `Slide ${currentImageIndex + 1}/${carouselImages.length} edited (${editedCount} total)` 
            : undefined 
        });
      } else {
        toast({ title: "Text overlay applied successfully!" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  // Navigate to Edit & Merge
  const handleSendToEditMerge = () => {
    if (sourceContentId) {
      setLocation(`/edit-merge/${sourceContentId}`);
    } else {
      setLocation("/edit-merge");
    }
  };

  // Move content to Ready to Post
  const handleSendToReadyToPost = async () => {
    if (!sourceContentId || !outputUrl) {
      toast({ title: "No processed image available", variant: "destructive" });
      return;
    }

    try {
      // Update content thumbnail with the edited image and move to ready status
      const res = await fetch(`/api/content/${sourceContentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thumbnailUrl: outputUrl,
          status: "ready"
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update content");
      }

      toast({ title: "Success!", description: "Content moved to Ready to Post" });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setLocation("/ready-to-post");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Create video edit job
  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const res = await fetch("/api/edit-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create job");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/edit-jobs"] });
      toast({ title: "Job created!", description: videoPriority === "rush" ? "Processing immediately..." : "Queued for overnight processing" });
      setVideoJobName("");
      setVideoSourceUrl("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete job
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/edit-jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete job");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/edit-jobs"] });
      toast({ title: "Job deleted" });
    },
  });

  const handleCreateVideoJob = () => {
    if (!videoJobName || !videoSourceUrl) {
      toast({ title: "Please fill in job name and source URL", variant: "destructive" });
      return;
    }

    const instructions: any = { jobType: videoJobType };
    if (videoJobType === "video_trim") {
      instructions.startTime = parseFloat(trimStart);
      instructions.endTime = parseFloat(trimEnd);
    } else if (videoJobType === "video_speed") {
      instructions.speedMultiplier = parseFloat(speedMultiplier);
    }

    createJobMutation.mutate({
      name: videoJobName,
      jobType: videoJobType,
      priority: videoPriority,
      sourceUrl: videoSourceUrl,
      sourceType: "video",
      editInstructions: instructions,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case "processing":
        return <Badge className="bg-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>;
      case "queued":
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Queued</Badge>;
      default:
        return <Badge variant="secondary"><Moon className="w-3 h-3 mr-1" /> Pending (Overnight)</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Editor</h1>
            <p className="text-muted-foreground">Add text to images and queue video editing jobs</p>
          </div>
        </div>

        <Tabs defaultValue="text-overlay" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text-overlay" data-testid="tab-text-overlay">
              <Type className="w-4 h-4 mr-2" /> Text on Image
            </TabsTrigger>
            <TabsTrigger value="video-jobs" data-testid="tab-video-jobs">
              <Video className="w-4 h-4 mr-2" /> Video Jobs
            </TabsTrigger>
            <TabsTrigger value="job-queue" data-testid="tab-job-queue">
              <Clock className="w-4 h-4 mr-2" /> Job Queue ({editJobs.length})
            </TabsTrigger>
          </TabsList>

          {/* Text on Image Tab */}
          <TabsContent value="text-overlay" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5" /> Text Overlay Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Upload Image</Label>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => imageInputRef.current?.click()}
                      data-testid="button-upload-image"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {selectedImage ? selectedImage.name : "Choose Image"}
                    </Button>
                  </div>

                  <div>
                    <Label>Text Content (use \n for new lines)</Label>
                    <Textarea
                      value={overlayText}
                      onChange={(e) => setOverlayText(e.target.value)}
                      placeholder="Your text here..."
                      rows={3}
                      data-testid="input-overlay-text"
                    />
                  </div>

                  {/* Font Size Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Font Size</Label>
                      <span className="text-sm text-muted-foreground">{fontSize}px</span>
                    </div>
                    <Slider
                      value={[fontSize]}
                      onValueChange={(val) => setFontSize(val[0])}
                      min={12}
                      max={200}
                      step={2}
                      className="w-full"
                      data-testid="slider-font-size"
                    />
                  </div>

                  {/* Text Styles */}
                  <div>
                    <Label className="mb-2 block">Text Styles</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={isBold ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsBold(!isBold)}
                        data-testid="button-bold"
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={isItalic ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsItalic(!isItalic)}
                        data-testid="button-italic"
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={isUnderline ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsUnderline(!isUnderline)}
                        data-testid="button-underline"
                      >
                        <Underline className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={hasStroke ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHasStroke(!hasStroke)}
                        className="gap-1"
                        data-testid="button-stroke"
                      >
                        <span className="text-xs font-bold" style={{ WebkitTextStroke: "1px currentColor" }}>A</span>
                        <span className="text-xs">Stroke</span>
                      </Button>
                      <Button
                        type="button"
                        variant={hasShadow ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHasShadow(!hasShadow)}
                        className="gap-1"
                        data-testid="button-shadow"
                      >
                        <span className="text-xs" style={{ textShadow: "2px 2px 2px rgba(0,0,0,0.5)" }}>A</span>
                        <span className="text-xs">Shadow</span>
                      </Button>
                    </div>
                  </div>

                  {/* Stroke Color (when stroke is enabled) */}
                  {hasStroke && (
                    <div>
                      <Label>Stroke Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={strokeColor}
                          onChange={(e) => setStrokeColor(e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                          data-testid="input-stroke-color"
                        />
                        <Input
                          value={strokeColor}
                          onChange={(e) => setStrokeColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Font Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={fontColor}
                          onChange={(e) => setFontColor(e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                          data-testid="input-font-color"
                        />
                        <Input
                          value={fontColor}
                          onChange={(e) => setFontColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Font Family</Label>
                      <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger className="mt-1" data-testid="select-font-family">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {FONT_FAMILIES.map(f => (
                            <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Text Position</Label>
                      <Select 
                        value={customPosition ? "custom" : textPosition} 
                        onValueChange={(val) => {
                          if (val !== "custom") {
                            setTextPosition(val);
                            setCustomPosition(null);
                          }
                        }}
                      >
                        <SelectTrigger className="mt-1" data-testid="select-text-position">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {POSITIONS.map(p => (
                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                          ))}
                          {customPosition && (
                            <SelectItem value="custom">Custom (Drag)</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Background</Label>
                      <Select value={backgroundColor} onValueChange={setBackgroundColor}>
                        <SelectTrigger className="mt-1" data-testid="select-bg-color">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transparent">None</SelectItem>
                          <SelectItem value="#000000">Black</SelectItem>
                          <SelectItem value="#ffffff">White</SelectItem>
                          <SelectItem value="#ff0000">Red</SelectItem>
                          <SelectItem value="#00ff00">Green</SelectItem>
                          <SelectItem value="#0000ff">Blue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Drag instruction */}
                  {imagePreview && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-sm text-muted-foreground">
                      <Move className="w-4 h-4" />
                      <span>Drag text on preview to position</span>
                    </div>
                  )}

                  <Button
                    onClick={handleTextOverlay}
                    disabled={(!selectedImage && !imagePreview) || processing}
                    className="w-full"
                    data-testid="button-apply-text"
                  >
                    {processing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      <><Type className="w-4 h-4 mr-2" /> Apply Text Overlay</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" /> Preview
                    </div>
                    {carouselImages.length > 1 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handlePrevImage}
                          disabled={currentImageIndex === 0}
                          data-testid="button-prev-slide"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-normal min-w-[60px] text-center">
                          {currentImageIndex + 1} / {carouselImages.length}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleNextImage}
                          disabled={currentImageIndex === carouselImages.length - 1}
                          data-testid="button-next-slide"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Carousel thumbnail strip */}
                  {carouselImages.length > 1 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {carouselImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentImageIndex(idx);
                            setImagePreview(img.outputUrl || img.imageUrl);
                            setOverlayText(img.textOverlay || "Your Text Here");
                            setOutputUrl(img.outputUrl || null);
                          }}
                          className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                            idx === currentImageIndex ? "border-primary ring-2 ring-primary/50" : "border-muted hover:border-muted-foreground/50"
                          }`}
                          data-testid={`button-slide-${idx}`}
                        >
                          <img src={img.outputUrl || img.imageUrl} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                          {img.outputUrl && (
                            <div className="absolute bottom-0 right-0 bg-green-500 text-white p-0.5 rounded-tl">
                              <CheckCircle className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div 
                    ref={previewRef}
                    className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden relative"
                  >
                    {outputUrl ? (
                      <img
                        src={outputUrl}
                        alt="Output"
                        className="max-w-full max-h-full object-contain"
                        data-testid="img-output-preview"
                      />
                    ) : imagePreview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-full max-h-full object-contain mx-auto"
                          data-testid="img-input-preview"
                        />
                        {/* Draggable text overlay preview */}
                        <div
                          className={`absolute cursor-move select-none ${isDragging ? "opacity-80" : ""}`}
                          style={{
                            ...(customPosition 
                              ? { 
                                  left: `${customPosition.x}%`, 
                                  top: `${customPosition.y}%`, 
                                  transform: "translate(-50%, -50%)" 
                                }
                              : {
                                  left: textPosition.includes("left") ? "20px" : textPosition.includes("right") ? "auto" : "50%",
                                  right: textPosition.includes("right") ? "20px" : "auto",
                                  top: textPosition.includes("top") ? "20px" : textPosition.includes("bottom") ? "auto" : "50%",
                                  bottom: textPosition.includes("bottom") ? "40px" : "auto",
                                  transform: !textPosition.includes("left") && !textPosition.includes("right") ? "translateX(-50%)" : "none",
                                }
                            ),
                          }}
                          onMouseDown={(e) => {
                            if (!previewRef.current) return;
                            setIsDragging(true);
                            const rect = previewRef.current.getBoundingClientRect();
                            const handleMove = (moveEvent: MouseEvent) => {
                              const x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
                              const y = ((moveEvent.clientY - rect.top) / rect.height) * 100;
                              setCustomPosition({ 
                                x: Math.max(5, Math.min(95, x)), 
                                y: Math.max(5, Math.min(95, y)) 
                              });
                            };
                            const handleUp = () => {
                              setIsDragging(false);
                              document.removeEventListener("mousemove", handleMove);
                              document.removeEventListener("mouseup", handleUp);
                            };
                            document.addEventListener("mousemove", handleMove);
                            document.addEventListener("mouseup", handleUp);
                          }}
                          onTouchStart={(e) => {
                            if (!previewRef.current) return;
                            setIsDragging(true);
                            const rect = previewRef.current.getBoundingClientRect();
                            const handleMove = (moveEvent: TouchEvent) => {
                              const touch = moveEvent.touches[0];
                              const x = ((touch.clientX - rect.left) / rect.width) * 100;
                              const y = ((touch.clientY - rect.top) / rect.height) * 100;
                              setCustomPosition({ 
                                x: Math.max(5, Math.min(95, x)), 
                                y: Math.max(5, Math.min(95, y)) 
                              });
                            };
                            const handleUp = () => {
                              setIsDragging(false);
                              document.removeEventListener("touchmove", handleMove);
                              document.removeEventListener("touchend", handleUp);
                            };
                            document.addEventListener("touchmove", handleMove);
                            document.addEventListener("touchend", handleUp);
                          }}
                          data-testid="draggable-text"
                        >
                          <span
                            style={{
                              fontSize: `${Math.min(fontSize / 2, 48)}px`,
                              color: fontColor,
                              fontFamily: fontFamily,
                              fontWeight: isBold ? "bold" : "normal",
                              fontStyle: isItalic ? "italic" : "normal",
                              textDecoration: isUnderline ? "underline" : "none",
                              WebkitTextStroke: hasStroke ? `1px ${strokeColor}` : "none",
                              textShadow: hasShadow ? "2px 2px 4px rgba(0,0,0,0.5)" : "none",
                              backgroundColor: backgroundColor !== "transparent" ? `${backgroundColor}b3` : "transparent",
                              padding: backgroundColor !== "transparent" ? "8px 16px" : "4px",
                              borderRadius: "4px",
                              textAlign: "center",
                              whiteSpace: "pre-line",
                              display: "inline-block",
                            }}
                          >
                            {overlayText}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-20" />
                        <p>Upload an image to preview</p>
                      </div>
                    )}
                  </div>

                  {outputUrl && (
                    <div className="mt-4 space-y-3">
                      <div className="flex gap-2">
                        <Button asChild className="flex-1" data-testid="button-download-image">
                          <a href={outputUrl} download>
                            <Download className="w-4 h-4 mr-2" /> Download
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setOutputUrl(null)}
                          data-testid="button-reset-preview"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Destination options */}
                      <div className="border-t pt-3 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Send to next step:</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleSendToEditMerge}
                            data-testid="button-send-to-edit-merge"
                          >
                            <Scissors className="w-4 h-4 mr-2" /> Edit & Merge
                          </Button>
                          {sourceContentId && (
                            <Button
                              className="flex-1"
                              onClick={handleSendToReadyToPost}
                              data-testid="button-send-to-ready"
                            >
                              <Send className="w-4 h-4 mr-2" /> Ready to Post
                            </Button>
                          )}
                        </div>
                        {!sourceContentId && (
                          <p className="text-xs text-muted-foreground">
                            Tip: Content from Content Queue can be sent directly to Ready to Post
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Video Jobs Tab */}
          <TabsContent value="video-jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" /> Create Video Edit Job
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Job Name</Label>
                    <Input
                      value={videoJobName}
                      onChange={(e) => setVideoJobName(e.target.value)}
                      placeholder="My video edit..."
                      data-testid="input-job-name"
                    />
                  </div>
                  <div>
                    <Label>Edit Type</Label>
                    <Select value={videoJobType} onValueChange={setVideoJobType}>
                      <SelectTrigger data-testid="select-job-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {JOB_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            <span className="flex items-center gap-2">
                              <t.icon className="w-4 h-4" /> {t.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Source Video URL</Label>
                  <Input
                    value={videoSourceUrl}
                    onChange={(e) => setVideoSourceUrl(e.target.value)}
                    placeholder="https://... or /objects/..."
                    data-testid="input-source-url"
                  />
                </div>

                {videoJobType === "video_trim" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Time (seconds)</Label>
                      <Input
                        type="number"
                        value={trimStart}
                        onChange={(e) => setTrimStart(e.target.value)}
                        min="0"
                        data-testid="input-trim-start"
                      />
                    </div>
                    <div>
                      <Label>End Time (seconds)</Label>
                      <Input
                        type="number"
                        value={trimEnd}
                        onChange={(e) => setTrimEnd(e.target.value)}
                        min="0"
                        data-testid="input-trim-end"
                      />
                    </div>
                  </div>
                )}

                {videoJobType === "video_speed" && (
                  <div>
                    <Label>Speed Multiplier (0.5 = half speed, 2 = double speed)</Label>
                    <Input
                      type="number"
                      value={speedMultiplier}
                      onChange={(e) => setSpeedMultiplier(e.target.value)}
                      min="0.25"
                      max="4"
                      step="0.25"
                      data-testid="input-speed-multiplier"
                    />
                  </div>
                )}

                <div>
                  <Label>Processing Priority</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value="standard"
                        checked={videoPriority === "standard"}
                        onChange={(e) => setVideoPriority(e.target.value)}
                        data-testid="radio-priority-standard"
                      />
                      <Moon className="w-4 h-4" />
                      <span>Standard (Overnight)</span>
                      <Badge variant="secondary">Free</Badge>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value="rush"
                        checked={videoPriority === "rush"}
                        onChange={(e) => setVideoPriority(e.target.value)}
                        data-testid="radio-priority-rush"
                      />
                      <Zap className="w-4 h-4" />
                      <span>Rush (Immediate)</span>
                      <Badge>Uses Credits</Badge>
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleCreateVideoJob}
                  disabled={createJobMutation.isPending}
                  className="w-full"
                  data-testid="button-create-job"
                >
                  {createJobMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    <><Video className="w-4 h-4 mr-2" /> Create Edit Job</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Job Queue Tab */}
          <TabsContent value="job-queue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5" /> Edit Job Queue
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/edit-jobs"] })}
                    data-testid="button-refresh-jobs"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : editJobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>No edit jobs yet</p>
                    <p className="text-sm">Create a video edit job to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {editJobs.map((job) => (
                      <div
                        key={job.id}
                        className="border rounded-lg p-4 flex items-center justify-between"
                        data-testid={`job-card-${job.id}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{job.name}</h3>
                            {getStatusBadge(job.status)}
                            {job.priority === "rush" && (
                              <Badge variant="outline"><Zap className="w-3 h-3 mr-1" /> Rush</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Type: {job.jobType.replace("_", " ")} | Created: {new Date(job.createdAt).toLocaleString()}
                          </p>
                          {job.progress != null && job.progress > 0 && job.progress < 100 && (
                            <div className="mt-2">
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${job.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{job.progress}%</span>
                            </div>
                          )}
                          {job.errorMessage && (
                            <p className="text-sm text-red-500 mt-1">{job.errorMessage}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {job.status === "completed" && job.outputUrl && (
                            <>
                              <Button asChild size="sm" variant="outline">
                                <a href={job.outputUrl} download>
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                              <Link href="/edit-merge">
                                <Button size="sm" variant="outline" data-testid={`button-job-edit-merge-${job.id}`}>
                                  <Scissors className="w-4 h-4 mr-1" /> Edit & Merge
                                </Button>
                              </Link>
                              <Link href="/ready-to-post">
                                <Button size="sm" data-testid={`button-job-ready-${job.id}`}>
                                  <Send className="w-4 h-4 mr-1" /> Ready to Post
                                </Button>
                              </Link>
                            </>
                          )}
                          {job.status !== "completed" && job.outputUrl && (
                            <Button asChild size="sm" variant="outline">
                              <a href={job.outputUrl} download>
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteJobMutation.mutate(job.id)}
                            data-testid={`button-delete-job-${job.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
