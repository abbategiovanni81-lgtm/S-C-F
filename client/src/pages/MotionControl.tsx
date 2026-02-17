import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useUpload } from "@/hooks/use-upload";
import { 
  Film, 
  Upload, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Play,
  Download,
  Image as ImageIcon,
  Video,
  Crown,
  Lock,
  X
} from "lucide-react";

interface MotionControlModel {
  id: string;
  name: string;
  description: string;
  supportedFormats: string[];
  maxDuration?: number;
}

interface MotionJob {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  model: string;
  characterImageUrl: string;
  motionVideoUrl: string;
  outputVideoUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export default function MotionControl() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState<string>("dreamactor");
  const [characterImageUrl, setCharacterImageUrl] = useState<string>("");
  const [motionVideoUrl, setMotionVideoUrl] = useState<string>("");
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);

  // Fetch available models
  const { data: modelsData } = useQuery<{ models: MotionControlModel[] }>({
    queryKey: ["/api/motion-control/models"],
  });

  // Fetch user's jobs
  const { data: jobsData, refetch: refetchJobs } = useQuery<{ jobs: MotionJob[] }>({
    queryKey: ["/api/motion-control/jobs"],
    refetchInterval: (query) => {
      // Auto-refresh if there are pending/processing jobs
      const data = query.state.data;
      const hasPendingJobs = data?.jobs?.some(
        job => job.status === "queued" || job.status === "processing"
      );
      return hasPendingJobs ? 5000 : false; // Poll every 5 seconds
    },
  });

  // Upload hooks
  const imageUpload = useUpload({
    onSuccess: (response) => {
      setCharacterImageUrl(response.objectPath);
      toast({ title: "Success", description: "Character image uploaded" });
    },
    onError: (error) => {
      toast({ 
        title: "Upload failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const videoUpload = useUpload({
    onSuccess: (response) => {
      setMotionVideoUrl(response.objectPath);
      toast({ title: "Success", description: "Motion video uploaded" });
    },
    onError: (error) => {
      toast({ 
        title: "Upload failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async (params: {
      characterImageUrl: string;
      motionVideoUrl: string;
      model: string;
    }) => {
      const res = await fetch("/api/motion-control/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate motion control video");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "Motion control job submitted. Processing will begin shortly." 
      });
      refetchJobs();
      // Reset form
      setCharacterImageUrl("");
      setMotionVideoUrl("");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Generation failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleGenerate = () => {
    if (!characterImageUrl || !motionVideoUrl) {
      toast({ 
        title: "Missing inputs", 
        description: "Please upload both a character image and motion video", 
        variant: "destructive" 
      });
      return;
    }

    generateMutation.mutate({
      characterImageUrl,
      motionVideoUrl,
      model: selectedModel,
    });
  };

  // Drag and drop handlers for photo
  const handlePhotoDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPhoto(true);
  }, []);

  const handlePhotoDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPhoto(false);
  }, []);

  const handlePhotoDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handlePhotoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPhoto(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (validTypes.includes(file.type)) {
        imageUpload.uploadFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPG, PNG, or WEBP)",
          variant: "destructive"
        });
      }
    }
  }, [imageUpload, toast]);

  // Drag and drop handlers for video
  const handleVideoDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(true);
  }, []);

  const handleVideoDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(false);
  }, []);

  const handleVideoDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleVideoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        videoUpload.uploadFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a video file",
          variant: "destructive"
        });
      }
    }
  }, [videoUpload, toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "processing":
        return <Badge className="bg-blue-600"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>;
      case "queued":
        return <Badge className="bg-yellow-600"><Clock className="w-3 h-3 mr-1" />Queued</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTierLimit = () => {
    if (!user?.tier) return 0;
    // Note: These limits are duplicated from TIER_LIMITS in shared/models/auth.ts
    // They are used here for display purposes only. Actual enforcement happens on backend.
    const limits: Record<string, number> = {
      free: 0,
      core: -1, // unlimited
      premium: 10,
      pro: 25,
      studio: 40,
    };
    return limits[user.tier] || 0;
  };

  const hasAccess = () => {
    const limit = getTierLimit();
    return limit !== 0; // 0 means no access, -1 means unlimited
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center md:justify-start gap-3">
              <Film className="w-8 h-8 md:w-10 md:h-10 text-purple-400" />
              Motion Control
            </h1>
            <p className="text-slate-300 mt-2 text-lg">
              Make anyone dance &mdash; upload a photo and a motion video
            </p>
          </div>

          {!hasAccess() && (
            <Alert className="border-yellow-600 bg-yellow-950/20">
              <Lock className="h-4 w-4" />
              <AlertTitle>Upgrade Required</AlertTitle>
              <AlertDescription>
                Motion Control is available for Premium, Pro, and Studio plans. 
                <Button variant="link" className="text-yellow-400 p-0 ml-1">
                  Upgrade now
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Two-column Layout: Desktop side-by-side, Mobile stacked */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Input Forms */}
            <div className="space-y-6">
              {/* Section 1: Your Photo */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-xl">Your Photo</CardTitle>
                  <CardDescription className="text-slate-400">
                    Upload a clear face photo of the person
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {characterImageUrl ? (
                    <div className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-green-500">
                        <img 
                          src={characterImageUrl} 
                          alt="Uploaded character" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <Button
                          variant="secondary"
                          onClick={() => setCharacterImageUrl("")}
                          className="mr-2"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Change
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragEnter={handlePhotoDragEnter}
                      onDragLeave={handlePhotoDragLeave}
                      onDragOver={handlePhotoDragOver}
                      onDrop={handlePhotoDrop}
                      className={`
                        relative aspect-square rounded-lg border-2 border-dashed transition-all cursor-pointer
                        ${isDraggingPhoto 
                          ? "border-purple-400 bg-gradient-to-br from-purple-600/30 to-blue-600/30" 
                          : "border-slate-600 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-600/10 hover:to-blue-600/10"
                        }
                        ${!hasAccess() && "opacity-50 cursor-not-allowed"}
                      `}
                      onClick={() => {
                        if (hasAccess()) {
                          document.getElementById('photo-upload')?.click();
                        }
                      }}
                    >
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) imageUpload.uploadFile(file);
                        }}
                        className="hidden"
                        disabled={!hasAccess() || imageUpload.isUploading}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        {imageUpload.isUploading ? (
                          <>
                            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                            <p className="text-white font-medium">Uploading...</p>
                            <p className="text-slate-400 text-sm mt-1">{Math.round(imageUpload.progress)}%</p>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-16 h-16 text-slate-500 mb-4" />
                            <p className="text-white font-medium mb-2">Drop photo here or click to browse</p>
                            <p className="text-slate-400 text-sm">Supported: JPG, PNG, WEBP</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Section 2: Motion Video */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-xl">Motion Video</CardTitle>
                  <CardDescription className="text-slate-400">
                    Upload a video of someone dancing or moving
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {motionVideoUrl ? (
                    <div className="relative group">
                      <div className="aspect-video rounded-lg overflow-hidden border-2 border-green-500">
                        <video 
                          src={motionVideoUrl} 
                          className="w-full h-full object-cover"
                          controls
                          loop
                        />
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setMotionVideoUrl("")}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Change
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragEnter={handleVideoDragEnter}
                      onDragLeave={handleVideoDragLeave}
                      onDragOver={handleVideoDragOver}
                      onDrop={handleVideoDrop}
                      className={`
                        relative aspect-video rounded-lg border-2 border-dashed transition-all cursor-pointer
                        ${isDraggingVideo 
                          ? "border-purple-400 bg-gradient-to-br from-purple-600/30 to-blue-600/30" 
                          : "border-slate-600 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-600/10 hover:to-blue-600/10"
                        }
                        ${!hasAccess() && "opacity-50 cursor-not-allowed"}
                      `}
                      onClick={() => {
                        if (hasAccess()) {
                          document.getElementById('video-upload')?.click();
                        }
                      }}
                    >
                      <input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) videoUpload.uploadFile(file);
                        }}
                        className="hidden"
                        disabled={!hasAccess() || videoUpload.isUploading}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        {videoUpload.isUploading ? (
                          <>
                            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                            <p className="text-white font-medium">Uploading...</p>
                            <p className="text-slate-400 text-sm mt-1">{Math.round(videoUpload.progress)}%</p>
                          </>
                        ) : (
                          <>
                            <Video className="w-16 h-16 text-slate-500 mb-4" />
                            <p className="text-white font-medium mb-2">Drop video here or click to browse</p>
                            <p className="text-slate-400 text-sm">Upload a video with dance moves</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Generation Settings */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      AI Model
                    </label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {modelsData?.models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {modelsData?.models.find(m => m.id === selectedModel) && (
                      <p className="text-xs text-slate-400">
                        {modelsData.models.find(m => m.id === selectedModel)?.description}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={
                      !hasAccess() ||
                      !characterImageUrl ||
                      !motionVideoUrl ||
                      generateMutation.isPending
                    }
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    size="lg"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Motion Video
                      </>
                    )}
                  </Button>

                  {getTierLimit() > 0 && (
                    <div className="text-xs text-slate-400 text-center">
                      {getTierLimit()} generations/month with your plan
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Output */}
            <div className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Play className="w-5 h-5 text-purple-400" />
                    Output Preview
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Your generated motion videos will appear here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!jobsData?.jobs || jobsData.jobs.length === 0 ? (
                    <div className="aspect-video rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-center p-8">
                      <Film className="w-16 h-16 text-slate-600 mb-4" />
                      <p className="text-slate-400 font-medium mb-2">No videos yet</p>
                      <p className="text-slate-500 text-sm">
                        Upload a photo and motion video to get started
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {jobsData.jobs.slice(0, 1).map((job) => (
                        <div key={job.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            {getStatusBadge(job.status)}
                            <span className="text-xs text-slate-400">
                              {new Date(job.createdAt).toLocaleString()}
                            </span>
                          </div>
                          
                          {job.status === "processing" && (
                            <div className="space-y-2">
                              <Progress value={undefined} className="h-2" />
                              <p className="text-sm text-slate-400 text-center">
                                Processing your video...
                              </p>
                            </div>
                          )}

                          {job.outputVideoUrl && (
                            <div className="space-y-3">
                              <div className="aspect-video rounded-lg overflow-hidden border-2 border-green-500">
                                <video 
                                  src={job.outputVideoUrl} 
                                  className="w-full h-full object-cover"
                                  controls
                                  loop
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  className="flex-1"
                                  variant="outline"
                                  onClick={() => window.open(job.outputVideoUrl, "_blank")}
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  View Full
                                </Button>
                                <Button
                                  className="flex-1"
                                  variant="outline"
                                  onClick={() => {
                                    const a = document.createElement("a");
                                    a.href = job.outputVideoUrl!;
                                    a.download = `motion-${job.id}.mp4`;
                                    a.click();
                                  }}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          )}

                          {job.errorMessage && (
                            <Alert variant="destructive">
                              <XCircle className="h-4 w-4" />
                              <AlertTitle>Generation Failed</AlertTitle>
                              <AlertDescription>{job.errorMessage}</AlertDescription>
                            </Alert>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Jobs */}
              {jobsData?.jobs && jobsData.jobs.length > 1 && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-400" />
                      Recent Jobs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {jobsData.jobs.slice(1, 4).map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            {job.characterImageUrl && (
                              <img
                                src={job.characterImageUrl}
                                alt="Character"
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {getStatusBadge(job.status)}
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(job.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {job.outputVideoUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(job.outputVideoUrl, "_blank")}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
