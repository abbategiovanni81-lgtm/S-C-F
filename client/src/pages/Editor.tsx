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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Slider } from "@/components/ui/slider";
import { 
  Type, Image as ImageIcon, Video, Clock, Loader2, Upload, 
  Trash2, Download, RefreshCw, Scissors, Zap, Moon, CheckCircle,
  XCircle, AlertCircle, Play, Pause, ArrowRight, Send,
  ChevronLeft, ChevronRight, Bold, Italic, Underline, Move,
  Wand2, Sparkles, Film, Shuffle, PenTool
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ResponsiveTooltip } from "@/components/ui/responsive-tooltip";
import type { EditJob, GeneratedContent } from "@shared/schema";
import { VideoEditor, ProcessingOverlay } from "@/components/VideoEditor";
import { GoogleDriveBrowser } from "@/components/GoogleDriveBrowser";

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
  const videoInputRef = useRef<HTMLInputElement>(null);
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
  
  // Track original image dimensions for accurate scaling
  const [originalImageSize, setOriginalImageSize] = useState<{ width: number; height: number } | null>(null);
  const [previewScale, setPreviewScale] = useState(1);

  // Video job state
  const [videoJobName, setVideoJobName] = useState("");
  const [videoJobType, setVideoJobType] = useState("video_trim");
  const [videoSourceUrl, setVideoSourceUrl] = useState("");
  const [videoPriority, setVideoPriority] = useState("standard");
  const [trimStart, setTrimStart] = useState("0");
  const [trimEnd, setTrimEnd] = useState("10");
  const [speedMultiplier, setSpeedMultiplier] = useState("1.5");
  const [videoSourceMode, setVideoSourceMode] = useState<"upload" | "url">("upload");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadedVideoName, setUploadedVideoName] = useState<string | null>(null);

  // AI Actions state
  const [aiActionLoading, setAiActionLoading] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [animatePrompt, setAnimatePrompt] = useState("");
  const [videoGeneratePrompt, setVideoGeneratePrompt] = useState("");
  const [remixPrompt, setRemixPrompt] = useState("");
  const [lastGeneratedVideoId, setLastGeneratedVideoId] = useState<string | null>(null);
  
  // Video Editor state
  const [videoEditorOpen, setVideoEditorOpen] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  
  const [showDriveBrowser, setShowDriveBrowser] = useState(false);
  const [showPexelsSearch, setShowPexelsSearch] = useState(false);
  const [showAiGenerateDialog, setShowAiGenerateDialog] = useState(false);
  const [pexelsQuery, setPexelsQuery] = useState("");
  const [pexelsVideos, setPexelsVideos] = useState<any[]>([]);
  const [pexelsLoading, setPexelsLoading] = useState(false);

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
        const dataUrl = event.target?.result as string;
        setImagePreview(dataUrl);
        
        // Get original image dimensions
        const img = new Image();
        img.onload = () => {
          setOriginalImageSize({ width: img.width, height: img.height });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Load original dimensions when imagePreview changes (for URL-loaded images)
  useEffect(() => {
    if (imagePreview && !selectedImage) {
      const img = new Image();
      img.onload = () => {
        setOriginalImageSize({ width: img.width, height: img.height });
      };
      img.src = imagePreview;
    }
  }, [imagePreview, selectedImage]);
  
  // Calculate scale factor when preview container or image changes
  useEffect(() => {
    if (previewRef.current && originalImageSize) {
      const containerWidth = previewRef.current.offsetWidth;
      const scale = containerWidth / originalImageSize.width;
      setPreviewScale(Math.min(scale, 1)); // Never scale up
    }
  }, [originalImageSize, imagePreview]);

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
  const handleSendToEditMerge = async () => {
    if (sourceContentId) {
      setLocation(`/edit-merge/${sourceContentId}`);
    } else if (outputUrl) {
      // Create content from direct upload before navigating
      try {
        const res = await fetch("/api/editor/create-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            outputUrl,
            originalImageUrl: imagePreview,
          }),
        });
        
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create content");
        }
        
        const data = await res.json();
        toast({ title: "Content saved!" });
        queryClient.invalidateQueries({ queryKey: ["/api/content"] });
        setLocation(`/edit-merge/${data.contentId}`);
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Please apply text overlay first", variant: "destructive" });
    }
  };

  // Move content to Ready to Post
  const handleSendToReadyToPost = async () => {
    if (!outputUrl) {
      toast({ title: "Please apply text overlay first", variant: "destructive" });
      return;
    }

    try {
      if (sourceContentId) {
        // Update existing content and move to ready status
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
      } else {
        // Create new content for direct uploads and set to ready
        const res = await fetch("/api/editor/create-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            outputUrl,
            originalImageUrl: imagePreview,
          }),
        });
        
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create content");
        }
        
        const data = await res.json();
        
        // Now update the new content to ready status
        await fetch(`/api/content/${data.contentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ready" }),
        });
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
      setUploadedVideoName(null);
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

  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({ title: "Please select a video file", variant: "destructive" });
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      toast({ title: "Video must be under 500MB", variant: "destructive" });
      return;
    }

    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append("video", file);

      const res = await fetch("/api/edit-jobs/upload-video", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      setVideoSourceUrl(data.videoUrl);
      setUploadedVideoName(file.name);
      toast({ title: "Video uploaded!", description: file.name });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleCreateVideoJob = () => {
    if (!videoJobName || !videoSourceUrl) {
      toast({ title: "Please fill in job name and add a video", variant: "destructive" });
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

  // AI Action handlers
  const handleEditImage = async () => {
    if (!imagePreview || !editPrompt) {
      toast({ title: "Please select an image and enter edit instructions", variant: "destructive" });
      return;
    }
    setAiActionLoading("edit");
    try {
      const imageBase64 = imagePreview.startsWith("data:") 
        ? imagePreview.split(",")[1] 
        : await fetchImageAsBase64(imagePreview);
      
      const res = await fetch("/api/dalle/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ imageBase64, prompt: editPrompt }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setImagePreview(data.imageUrl);
      setOutputUrl(data.imageUrl);
      toast({ title: "Image edited successfully!" });
    } catch (error: any) {
      toast({ title: "Edit failed", description: error.message, variant: "destructive" });
    } finally {
      setAiActionLoading(null);
    }
  };

  const handleCreateVariation = async () => {
    if (!imagePreview) {
      toast({ title: "Please select an image first", variant: "destructive" });
      return;
    }
    setAiActionLoading("variation");
    try {
      const prompt = sourceContent?.generationMetadata 
        ? (sourceContent.generationMetadata as any).imagePrompts?.prompt || "Generate a similar image"
        : "Generate a similar image with the same style and composition";
      
      const res = await fetch("/api/dalle/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt, quality: "medium" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setImagePreview(data.imageUrl);
      setOutputUrl(data.imageUrl);
      toast({ title: "Variation created!" });
    } catch (error: any) {
      toast({ title: "Variation failed", description: error.message, variant: "destructive" });
    } finally {
      setAiActionLoading(null);
    }
  };

  const handleAnimateToVideo = async () => {
    if (!imagePreview) {
      toast({ title: "Please select an image first", variant: "destructive" });
      return;
    }
    setAiActionLoading("animate");
    try {
      const imageUrl = imagePreview.startsWith("data:") 
        ? await uploadBase64Image(imagePreview)
        : imagePreview;
      
      const res = await fetch("/api/sora/image-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          prompt: animatePrompt || "Subtle cinematic motion with gentle movement", 
          imageUrl,
          duration: 4 
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      toast({ 
        title: "Video generation started!", 
        description: `Video ID: ${data.videoId}. Check Video tab for status.` 
      });
    } catch (error: any) {
      toast({ title: "Animation failed", description: error.message, variant: "destructive" });
    } finally {
      setAiActionLoading(null);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoGeneratePrompt) {
      toast({ title: "Please enter a video description", variant: "destructive" });
      return;
    }
    setAiActionLoading("generate-video");
    try {
      const res = await fetch("/api/sora/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: videoGeneratePrompt, duration: 4 }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setLastGeneratedVideoId(data.videoId);
      toast({ 
        title: "Video generation started!", 
        description: `Video ID: ${data.videoId}. You can now use this ID to remix the video.` 
      });
    } catch (error: any) {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    } finally {
      setAiActionLoading(null);
    }
  };

  const handleRemixVideo = async () => {
    if (!lastGeneratedVideoId) {
      toast({ title: "Generate a video first to get a video ID for remixing", variant: "destructive" });
      return;
    }
    if (!remixPrompt) {
      toast({ title: "Please enter remix instructions", variant: "destructive" });
      return;
    }
    setAiActionLoading("remix");
    try {
      const res = await fetch("/api/sora/remix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ videoId: lastGeneratedVideoId, prompt: remixPrompt }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setLastGeneratedVideoId(data.videoId);
      toast({ 
        title: "Remix started!", 
        description: `New Video ID: ${data.videoId}` 
      });
    } catch (error: any) {
      toast({ title: "Remix failed", description: error.message, variant: "destructive" });
    } finally {
      setAiActionLoading(null);
    }
  };

  // Helper to fetch image as base64
  const fetchImageAsBase64 = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Helper to upload base64 image and get URL
  const uploadBase64Image = async (dataUri: string): Promise<string> => {
    const base64 = dataUri.split(",")[1];
    const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: "image/png" });
    const formData = new FormData();
    formData.append("file", blob, "image.png");
    const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
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

  const handleVideoSourceSelect = (source: "upload" | "drive" | "pexels" | "ai") => {
    switch (source) {
      case "upload":
        videoInputRef.current?.click();
        break;
      case "drive":
        setShowDriveBrowser(true);
        break;
      case "pexels":
        setShowPexelsSearch(true);
        break;
      case "ai":
        setShowAiGenerateDialog(true);
        break;
    }
  };

  const handleDriveVideoSelected = (videoUrl: string, fileName: string) => {
    setShowDriveBrowser(false);
    setVideoSourceUrl(videoUrl);
    toast({ title: "Video added", description: fileName });
  };

  const handleSearchPexels = async () => {
    if (!pexelsQuery.trim()) return;
    setPexelsLoading(true);
    try {
      const res = await fetch(`/api/pexels/popular-videos?query=${encodeURIComponent(pexelsQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setPexelsVideos(data.videos || []);
      }
    } catch (error) {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setPexelsLoading(false);
    }
  };

  const handleSelectPexelsVideo = async (video: any) => {
    const videoFile = video.video_files?.find((f: any) => f.quality === "hd") || video.video_files?.[0];
    if (videoFile?.link) {
      setVideoSourceUrl(videoFile.link);
      setShowPexelsSearch(false);
      setPexelsVideos([]);
      setPexelsQuery("");
      toast({ title: "Video added from Pexels" });
    }
  };

  const handleVideoEditorExport = async () => {
    setIsExportingVideo(true);
    setProcessingProgress(0);
    const interval = setInterval(() => {
      setProcessingProgress(prev => Math.min(prev + Math.random() * 15, 95));
    }, 500);
    
    setTimeout(() => {
      clearInterval(interval);
      setProcessingProgress(100);
      setIsExportingVideo(false);
      toast({ title: "Export complete!", description: "Your video is ready." });
    }, 3000);
  };

  return (
    <Layout>
      {videoEditorOpen && (
        isExportingVideo ? (
          <ProcessingOverlay
            progress={Math.min(processingProgress, 100)}
            videoUrl={videoSourceUrl || undefined}
            caption=""
            onClose={() => {
              setVideoEditorOpen(false);
              setIsExportingVideo(false);
            }}
          />
        ) : (
          <VideoEditor
            videoUrl={videoSourceUrl || undefined}
            clips={[]}
            captions={[]}
            projectName="Video Project"
            onClose={() => setVideoEditorOpen(false)}
            onExport={handleVideoEditorExport}
            onAddClip={() => videoInputRef.current?.click()}
            onSelectSource={handleVideoSourceSelect}
          />
        )
      )}
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Editor</h1>
            <p className="text-muted-foreground">Add text to images and queue video editing jobs</p>
          </div>
        </div>

        <Tabs defaultValue="image" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="image" data-testid="tab-image">
              <ImageIcon className="w-4 h-4 mr-2" /> Image
            </TabsTrigger>
            <TabsTrigger value="video" data-testid="tab-video">
              <Video className="w-4 h-4 mr-2" /> Video
            </TabsTrigger>
            <TabsTrigger value="job-queue" data-testid="tab-job-queue">
              <Clock className="w-4 h-4 mr-2" /> Job Queue ({editJobs.length})
            </TabsTrigger>
          </TabsList>

          {/* Image Tab */}
          <TabsContent value="image" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" /> Image Editor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* AI Actions Section */}
                  <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="font-medium text-sm">AI Actions</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <ResponsiveTooltip content="Edit with AI">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("edit-prompt-section")?.scrollIntoView({ behavior: "smooth" })}
                          disabled={!imagePreview || aiActionLoading !== null}
                          className="flex flex-col h-auto py-2"
                          data-testid="button-edit-image"
                        >
                          <PenTool className="w-4 h-4 mb-1" />
                          <span className="text-xs">Edit Image</span>
                        </Button>
                      </ResponsiveTooltip>
                      <ResponsiveTooltip content="Create variation">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCreateVariation}
                          disabled={!imagePreview || aiActionLoading !== null}
                          className="flex flex-col h-auto py-2"
                          data-testid="button-create-variation"
                        >
                          {aiActionLoading === "variation" ? (
                            <Loader2 className="w-4 h-4 mb-1 animate-spin" />
                          ) : (
                            <Shuffle className="w-4 h-4 mb-1" />
                          )}
                          <span className="text-xs">Variation</span>
                        </Button>
                      </ResponsiveTooltip>
                      <ResponsiveTooltip content="Animate to video">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("animate-prompt-section")?.scrollIntoView({ behavior: "smooth" })}
                          disabled={!imagePreview || aiActionLoading !== null}
                          className="flex flex-col h-auto py-2"
                          data-testid="button-animate-video"
                        >
                          <Film className="w-4 h-4 mb-1" />
                          <span className="text-xs">Animate</span>
                        </Button>
                      </ResponsiveTooltip>
                    </div>
                    
                    {/* Edit Image Section */}
                    <div id="edit-prompt-section" className="space-y-2 mb-3">
                      <Label className="text-xs">Edit Instructions</Label>
                      <div className="flex gap-2">
                        <Input
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          placeholder="e.g., Remove background, add sunset lighting..."
                          className="text-sm"
                          data-testid="input-edit-prompt"
                        />
                        <ResponsiveTooltip content="Apply changes">
                          <Button
                            size="sm"
                            onClick={handleEditImage}
                            disabled={!imagePreview || !editPrompt || aiActionLoading !== null}
                            data-testid="button-apply-edit"
                          >
                            {aiActionLoading === "edit" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                          </Button>
                        </ResponsiveTooltip>
                      </div>
                    </div>

                    {/* Animate Section */}
                    <div id="animate-prompt-section" className="space-y-2">
                      <Label className="text-xs">Animation Description (optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={animatePrompt}
                          onChange={(e) => setAnimatePrompt(e.target.value)}
                          placeholder="e.g., Gentle camera pan, subtle motion..."
                          className="text-sm"
                          data-testid="input-animate-prompt"
                        />
                        <ResponsiveTooltip content="Animate image">
                          <Button
                            size="sm"
                            onClick={handleAnimateToVideo}
                            disabled={!imagePreview || aiActionLoading !== null}
                            data-testid="button-apply-animate"
                          >
                            {aiActionLoading === "animate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                          </Button>
                        </ResponsiveTooltip>
                      </div>
                    </div>
                  </div>

                  {/* Manual Adjustments Accordion */}
                  <Accordion type="single" collapsible defaultValue="text-overlay">
                    <AccordionItem value="text-overlay">
                      <AccordionTrigger className="text-sm">
                        <div className="flex items-center gap-2">
                          <Type className="w-4 h-4" />
                          Text Overlay
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        <div>
                          <Label>Upload Image</Label>
                          <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <ResponsiveTooltip content="Upload image">
                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => imageInputRef.current?.click()}
                        data-testid="button-upload-image"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {selectedImage ? selectedImage.name : "Choose Image"}
                      </Button>
                    </ResponsiveTooltip>
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
                    {originalImageSize && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Image: {originalImageSize.width}×{originalImageSize.height}px — Preview scales to match final output
                      </p>
                    )}
                  </div>

                  {/* Text Styles */}
                  <div>
                    <Label className="mb-2 block">Text Styles</Label>
                    <div className="flex flex-wrap gap-2">
                      <ResponsiveTooltip content="Bold text">
                        <Button
                          type="button"
                          variant={isBold ? "default" : "outline"}
                          size="sm"
                          onClick={() => setIsBold(!isBold)}
                          data-testid="button-bold"
                        >
                          <Bold className="w-4 h-4" />
                        </Button>
                      </ResponsiveTooltip>
                      <ResponsiveTooltip content="Italic text">
                        <Button
                          type="button"
                          variant={isItalic ? "default" : "outline"}
                          size="sm"
                          onClick={() => setIsItalic(!isItalic)}
                          data-testid="button-italic"
                        >
                          <Italic className="w-4 h-4" />
                        </Button>
                      </ResponsiveTooltip>
                      <ResponsiveTooltip content="Underline text">
                        <Button
                          type="button"
                          variant={isUnderline ? "default" : "outline"}
                          size="sm"
                          onClick={() => setIsUnderline(!isUnderline)}
                          data-testid="button-underline"
                        >
                          <Underline className="w-4 h-4" />
                        </Button>
                      </ResponsiveTooltip>
                      <ResponsiveTooltip content="Text stroke">
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
                      </ResponsiveTooltip>
                      <ResponsiveTooltip content="Text shadow">
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
                      </ResponsiveTooltip>
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

                        <ResponsiveTooltip content="Apply changes">
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
                        </ResponsiveTooltip>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
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
                        <ResponsiveTooltip content="Previous slide">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePrevImage}
                            disabled={currentImageIndex === 0}
                            data-testid="button-prev-slide"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                        </ResponsiveTooltip>
                        <span className="text-sm font-normal min-w-[60px] text-center">
                          {currentImageIndex + 1} / {carouselImages.length}
                        </span>
                        <ResponsiveTooltip content="Next slide">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNextImage}
                            disabled={currentImageIndex === carouselImages.length - 1}
                            data-testid="button-next-slide"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </ResponsiveTooltip>
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
                              fontSize: `${Math.max(fontSize * previewScale, 8)}px`,
                              color: fontColor,
                              fontFamily: fontFamily,
                              fontWeight: isBold ? "bold" : "normal",
                              fontStyle: isItalic ? "italic" : "normal",
                              textDecoration: isUnderline ? "underline" : "none",
                              WebkitTextStroke: hasStroke ? `${Math.max(1 * previewScale, 0.5)}px ${strokeColor}` : "none",
                              textShadow: hasShadow ? `${2 * previewScale}px ${2 * previewScale}px ${4 * previewScale}px rgba(0,0,0,0.5)` : "none",
                              backgroundColor: backgroundColor !== "transparent" ? `${backgroundColor}b3` : "transparent",
                              padding: backgroundColor !== "transparent" ? `${8 * previewScale}px ${16 * previewScale}px` : `${4 * previewScale}px`,
                              borderRadius: `${4 * previewScale}px`,
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
                        <ResponsiveTooltip content="Download image">
                          <Button asChild className="flex-1" data-testid="button-download-image">
                            <a href={outputUrl} download>
                              <Download className="w-4 h-4 mr-2" /> Download
                            </a>
                          </Button>
                        </ResponsiveTooltip>
                        <ResponsiveTooltip content="Reset preview">
                          <Button
                            variant="outline"
                            onClick={() => setOutputUrl(null)}
                            data-testid="button-reset-preview"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </ResponsiveTooltip>
                      </div>
                      
                      {/* Destination options */}
                      <div className="border-t pt-3 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Send to next step:</p>
                        <div className="flex gap-2">
                          <ResponsiveTooltip content="Go to Edit & Merge">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={handleSendToEditMerge}
                              data-testid="button-send-to-edit-merge"
                            >
                              <Scissors className="w-4 h-4 mr-2" /> Edit & Merge
                            </Button>
                          </ResponsiveTooltip>
                          <ResponsiveTooltip content="Send to Ready">
                            <Button
                              className="flex-1"
                              onClick={handleSendToReadyToPost}
                              data-testid="button-send-to-ready"
                            >
                              <Send className="w-4 h-4 mr-2" /> Ready to Post
                            </Button>
                          </ResponsiveTooltip>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Video Tab */}
          <TabsContent value="video" className="space-y-6">
            {/* AI Actions Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" /> AI Video Actions
                  </CardTitle>
                  <ResponsiveTooltip content="Open full video editor">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setVideoEditorOpen(true)}
                      className="gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                      data-testid="button-open-video-editor"
                    >
                      <Film className="w-4 h-4" />
                      Video Editor
                    </Button>
                  </ResponsiveTooltip>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Generate from Text */}
                  <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <Film className="w-4 h-4 text-purple-500" />
                      <span className="font-medium text-sm">Generate from Text</span>
                    </div>
                    <Textarea
                      value={videoGeneratePrompt}
                      onChange={(e) => setVideoGeneratePrompt(e.target.value)}
                      placeholder="Describe the video you want to create..."
                      rows={3}
                      className="mb-3"
                      data-testid="input-video-generate-prompt"
                    />
                    <ResponsiveTooltip content="Generate video">
                      <Button
                        onClick={handleGenerateVideo}
                        disabled={!videoGeneratePrompt || aiActionLoading !== null}
                        className="w-full"
                        data-testid="button-generate-video"
                      >
                        {aiActionLoading === "generate-video" ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                        ) : (
                          <><Wand2 className="w-4 h-4 mr-2" /> Generate Video</>
                        )}
                      </Button>
                    </ResponsiveTooltip>
                  </div>

                  {/* Remix Clip */}
                  <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <Shuffle className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-sm">Remix AI-Generated Video</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted/50 rounded">
                      Remix videos created with "Generate from Text". First generate a video, then use the video ID to remix it.
                    </div>
                    <Input
                      value={remixPrompt}
                      onChange={(e) => setRemixPrompt(e.target.value)}
                      placeholder="e.g., Make it more cinematic, add slow motion..."
                      className="mb-3"
                      data-testid="input-remix-prompt"
                    />
                    <ResponsiveTooltip content="Remix video">
                      <Button
                        onClick={handleRemixVideo}
                        disabled={!lastGeneratedVideoId || !remixPrompt || aiActionLoading !== null}
                        variant="outline"
                        className="w-full"
                        data-testid="button-remix-video"
                      >
                        {aiActionLoading === "remix" ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Remixing...</>
                        ) : (
                          <><Shuffle className="w-4 h-4 mr-2" /> Remix Video</>
                        )}
                      </Button>
                    </ResponsiveTooltip>
                    {lastGeneratedVideoId && (
                      <p className="text-xs text-green-600 mt-2">Ready to remix: {lastGeneratedVideoId}</p>
                    )}
                    {!lastGeneratedVideoId && (
                      <p className="text-xs text-muted-foreground mt-2">Generate a video first to enable remixing</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manual Video Jobs Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" /> Manual Video Edit Jobs
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
                  <Label>Source Video</Label>
                  <div className="flex gap-2 mt-2 mb-3">
                    <ResponsiveTooltip content="Upload file">
                      <Button
                        type="button"
                        variant={videoSourceMode === "upload" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setVideoSourceMode("upload")}
                        data-testid="button-source-upload"
                      >
                        <Upload className="w-4 h-4 mr-2" /> Upload File
                      </Button>
                    </ResponsiveTooltip>
                    <ResponsiveTooltip content="Paste video URL">
                      <Button
                        type="button"
                        variant={videoSourceMode === "url" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setVideoSourceMode("url")}
                        data-testid="button-source-url"
                      >
                        <Video className="w-4 h-4 mr-2" /> Paste URL
                      </Button>
                    </ResponsiveTooltip>
                  </div>

                  {videoSourceMode === "upload" ? (
                    <div>
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoFileSelect}
                        className="hidden"
                      />
                      <ResponsiveTooltip content="Upload video">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={uploadingVideo}
                          data-testid="button-upload-video"
                        >
                          {uploadingVideo ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                          ) : uploadedVideoName ? (
                            <><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> {uploadedVideoName}</>
                          ) : (
                            <><Upload className="w-4 h-4 mr-2" /> Choose Video (MP4, MOV - up to 500MB)</>
                          )}
                        </Button>
                      </ResponsiveTooltip>
                      {uploadedVideoName && (
                        <ResponsiveTooltip content="Clear video">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setUploadedVideoName(null);
                              setVideoSourceUrl("");
                            }}
                            data-testid="button-clear-video"
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> Clear
                          </Button>
                        </ResponsiveTooltip>
                      )}
                    </div>
                  ) : (
                    <Input
                      value={videoSourceUrl}
                      onChange={(e) => setVideoSourceUrl(e.target.value)}
                      placeholder="https://... or /objects/..."
                      data-testid="input-source-url"
                    />
                  )}
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

                <ResponsiveTooltip content="Create new job">
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
                </ResponsiveTooltip>
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
                  <ResponsiveTooltip content="Refresh jobs">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/edit-jobs"] })}
                      data-testid="button-refresh-jobs"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                  </ResponsiveTooltip>
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
                              <ResponsiveTooltip content="Download">
                                <Button asChild size="sm" variant="outline">
                                  <a href={job.outputUrl} download>
                                    <Download className="w-4 h-4" />
                                  </a>
                                </Button>
                              </ResponsiveTooltip>
                              <Link href="/edit-merge">
                                <ResponsiveTooltip content="Edit & Merge">
                                  <Button size="sm" variant="outline" data-testid={`button-job-edit-merge-${job.id}`}>
                                    <Scissors className="w-4 h-4 mr-1" /> Edit & Merge
                                  </Button>
                                </ResponsiveTooltip>
                              </Link>
                              <Link href="/ready-to-post">
                                <ResponsiveTooltip content="Ready to Post">
                                  <Button size="sm" data-testid={`button-job-ready-${job.id}`}>
                                    <Send className="w-4 h-4 mr-1" /> Ready to Post
                                  </Button>
                                </ResponsiveTooltip>
                              </Link>
                            </>
                          )}
                          {job.status !== "completed" && job.outputUrl && (
                            <ResponsiveTooltip content="Download">
                              <Button asChild size="sm" variant="outline">
                                <a href={job.outputUrl} download>
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                            </ResponsiveTooltip>
                          )}
                          <ResponsiveTooltip content="Delete job">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteJobMutation.mutate(job.id)}
                              data-testid={`button-delete-job-${job.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </ResponsiveTooltip>
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
      
      <GoogleDriveBrowser
        open={showDriveBrowser}
        onOpenChange={setShowDriveBrowser}
        onVideoSelected={handleDriveVideoSelected}
      />
      
      <Dialog open={showPexelsSearch} onOpenChange={setShowPexelsSearch}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Search Pexels Stock Videos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={pexelsQuery}
                onChange={(e) => setPexelsQuery(e.target.value)}
                placeholder="Search for videos..."
                onKeyDown={(e) => e.key === "Enter" && handleSearchPexels()}
                data-testid="input-pexels-search"
              />
              <Button onClick={handleSearchPexels} disabled={pexelsLoading} data-testid="button-pexels-search">
                {pexelsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {pexelsVideos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => handleSelectPexelsVideo(video)}
                  className="relative aspect-video rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all group"
                  data-testid={`button-pexels-video-${video.id}`}
                >
                  <video
                    src={video.video_files?.[0]?.link}
                    className="w-full h-full object-cover"
                    muted
                    onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                    onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </button>
              ))}
            </div>
            {pexelsVideos.length === 0 && !pexelsLoading && (
              <p className="text-center text-muted-foreground py-8">
                Search for free stock videos from Pexels
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showAiGenerateDialog} onOpenChange={setShowAiGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Generate Video with AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={videoGeneratePrompt}
              onChange={(e) => setVideoGeneratePrompt(e.target.value)}
              placeholder="Describe the video you want to create..."
              rows={4}
              data-testid="input-ai-prompt-dialog"
            />
            <Button
              onClick={() => {
                handleGenerateVideo();
                setShowAiGenerateDialog(false);
              }}
              disabled={aiActionLoading === "generate-video" || !videoGeneratePrompt.trim()}
              className="w-full"
              data-testid="button-generate-ai-video-dialog"
            >
              {aiActionLoading === "generate-video" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Video
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
