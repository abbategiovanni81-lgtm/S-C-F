import { useState, useEffect } from "react";
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
  Lock
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

// Hardcoded motion templates as placeholders
const MOTION_TEMPLATES = [
  { id: "1", name: "Dance Move 1", thumbnail: "/motion-templates/dance1.jpg", previewVideo: "" },
  { id: "2", name: "Dance Move 2", thumbnail: "/motion-templates/dance2.jpg", previewVideo: "" },
  { id: "3", name: "Hand Gesture", thumbnail: "/motion-templates/gesture1.jpg", previewVideo: "" },
  { id: "4", name: "Walking", thumbnail: "/motion-templates/walk1.jpg", previewVideo: "" },
  { id: "5", name: "Running", thumbnail: "/motion-templates/run1.jpg", previewVideo: "" },
  { id: "6", name: "Jump", thumbnail: "/motion-templates/jump1.jpg", previewVideo: "" },
  { id: "7", name: "Wave", thumbnail: "/motion-templates/wave1.jpg", previewVideo: "" },
  { id: "8", name: "Spin", thumbnail: "/motion-templates/spin1.jpg", previewVideo: "" },
  { id: "9", name: "Boxing", thumbnail: "/motion-templates/boxing1.jpg", previewVideo: "" },
  { id: "10", name: "Yoga Pose", thumbnail: "/motion-templates/yoga1.jpg", previewVideo: "" },
  { id: "11", name: "Kick", thumbnail: "/motion-templates/kick1.jpg", previewVideo: "" },
  { id: "12", name: "Celebrate", thumbnail: "/motion-templates/celebrate1.jpg", previewVideo: "" },
];

export default function MotionControl() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState<string>("dreamactor");
  const [characterImageUrl, setCharacterImageUrl] = useState<string>("");
  const [motionVideoUrl, setMotionVideoUrl] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Fetch available models
  const { data: modelsData } = useQuery<{ models: MotionControlModel[] }>({
    queryKey: ["/api/motion-control/models"],
  });

  // Fetch user's jobs
  const { data: jobsData, refetch: refetchJobs } = useQuery<{ jobs: MotionJob[] }>({
    queryKey: ["/api/motion-control/jobs"],
    refetchInterval: (data) => {
      // Auto-refresh if there are pending/processing jobs
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
      setSelectedTemplate(null);
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

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    // In a real implementation, this would set the motion video URL from the template
    toast({ 
      title: "Template selected", 
      description: "Coming soon: Pre-made motion templates will be available in the next update" 
    });
  };

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Film className="w-8 h-8 text-purple-400" />
                Motion Control Studio
              </h1>
              <p className="text-slate-400 mt-1">
                Transform your characters with AI-powered motion transfer
              </p>
            </div>
            {user?.tier && (
              <Badge variant="outline" className="text-purple-400 border-purple-400">
                <Crown className="w-3 h-3 mr-1" />
                {user.tier.toUpperCase()} Plan
              </Badge>
            )}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Motion Library & Upload */}
            <div className="lg:col-span-2 space-y-6">
              {/* Motion Library */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Motion Library
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Choose from pre-made motion templates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                    {MOTION_TEMPLATES.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => hasAccess() && handleTemplateSelect(template.id)}
                        className={`
                          relative aspect-square rounded-lg overflow-hidden cursor-pointer
                          border-2 transition-all
                          ${selectedTemplate === template.id 
                            ? "border-purple-500 ring-2 ring-purple-500/50" 
                            : "border-slate-600 hover:border-purple-400"
                          }
                          ${!hasAccess() && "opacity-50 cursor-not-allowed"}
                        `}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white/60" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                          <p className="text-xs text-white font-medium truncate">
                            {template.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Upload Section */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-400" />
                    Upload Your Content
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Upload a character image and reference motion video
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Character Image Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Character Image
                    </label>
                    <div className="flex items-center gap-4">
                      {characterImageUrl ? (
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-green-500">
                          <img 
                            src={characterImageUrl} 
                            alt="Character" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-32 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-slate-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) imageUpload.uploadFile(file);
                          }}
                          className="hidden"
                          id="character-image"
                          disabled={!hasAccess() || imageUpload.isUploading}
                        />
                        <label htmlFor="character-image">
                          <Button 
                            asChild
                            disabled={!hasAccess() || imageUpload.isUploading}
                            className="cursor-pointer"
                          >
                            <span>
                              {imageUpload.isUploading ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Uploading... {Math.round(imageUpload.progress)}%
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Image
                                </>
                              )}
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Motion Video Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Motion Reference Video
                    </label>
                    <div className="flex items-center gap-4">
                      {motionVideoUrl ? (
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-green-500">
                          <video 
                            src={motionVideoUrl} 
                            className="w-full h-full object-cover"
                            muted
                            loop
                            autoPlay
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-32 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center">
                          <Video className="w-8 h-8 text-slate-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) videoUpload.uploadFile(file);
                          }}
                          className="hidden"
                          id="motion-video"
                          disabled={!hasAccess() || videoUpload.isUploading}
                        />
                        <label htmlFor="motion-video">
                          <Button 
                            asChild
                            disabled={!hasAccess() || videoUpload.isUploading}
                            className="cursor-pointer"
                          >
                            <span>
                              {videoUpload.isUploading ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Uploading... {Math.round(videoUpload.progress)}%
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Video
                                </>
                              )}
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Controls & Generate */}
            <div className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Generation Settings</CardTitle>
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
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Motion
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
          </div>

          {/* Job History */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Your Jobs
              </CardTitle>
              <CardDescription className="text-slate-400">
                Track your motion control generation history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!jobsData?.jobs || jobsData.jobs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No jobs yet. Create your first motion control video above!
                </div>
              ) : (
                <div className="space-y-3">
                  {jobsData.jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex-shrink-0">
                        {job.characterImageUrl && (
                          <img
                            src={job.characterImageUrl}
                            alt="Character"
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(job.status)}
                          <span className="text-sm text-slate-400">
                            {modelsData?.models.find(m => m.id === job.model)?.name || job.model}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(job.createdAt).toLocaleString()}
                        </p>
                        {job.errorMessage && (
                          <p className="text-xs text-red-400 mt-1">{job.errorMessage}</p>
                        )}
                      </div>
                      {job.outputVideoUrl && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(job.outputVideoUrl, "_blank")}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = job.outputVideoUrl!;
                              a.download = `motion-${job.id}.mp4`;
                              a.click();
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
