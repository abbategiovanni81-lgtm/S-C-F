import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { 
  Type, Image as ImageIcon, Video, Clock, Loader2, Upload, 
  Trash2, Download, RefreshCw, Scissors, Zap, Moon, CheckCircle,
  XCircle, AlertCircle, Play, Pause
} from "lucide-react";
import type { EditJob } from "@shared/schema";

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
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Impact, sans-serif", label: "Impact" },
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "'Comic Sans MS', cursive", label: "Comic Sans" },
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

  // Text overlay state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [overlayText, setOverlayText] = useState("Your Text Here");
  const [fontSize, setFontSize] = useState("48");
  const [fontColor, setFontColor] = useState("#ffffff");
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");
  const [textPosition, setTextPosition] = useState("center");
  const [backgroundColor, setBackgroundColor] = useState("transparent");
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

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
    if (!selectedImage) {
      toast({ title: "No image selected", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("text", overlayText);
      formData.append("fontSize", fontSize);
      formData.append("fontColor", fontColor);
      formData.append("fontFamily", fontFamily);
      formData.append("position", textPosition);
      formData.append("backgroundColor", backgroundColor);

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
      toast({ title: "Text overlay applied successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Font Size</Label>
                      <Input
                        type="number"
                        value={fontSize}
                        onChange={(e) => setFontSize(e.target.value)}
                        min="12"
                        max="200"
                        data-testid="input-font-size"
                      />
                    </div>
                    <div>
                      <Label>Font Color</Label>
                      <div className="flex gap-2">
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
                  </div>

                  <div>
                    <Label>Font Family</Label>
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                      <SelectTrigger data-testid="select-font-family">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map(f => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Text Position</Label>
                    <Select value={textPosition} onValueChange={setTextPosition}>
                      <SelectTrigger data-testid="select-text-position">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Background Color (for text background)</Label>
                    <div className="flex gap-2">
                      <Select value={backgroundColor} onValueChange={setBackgroundColor}>
                        <SelectTrigger className="flex-1" data-testid="select-bg-color">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transparent">None (Transparent)</SelectItem>
                          <SelectItem value="#000000">Black</SelectItem>
                          <SelectItem value="#ffffff">White</SelectItem>
                          <SelectItem value="#ff0000">Red</SelectItem>
                          <SelectItem value="#00ff00">Green</SelectItem>
                          <SelectItem value="#0000ff">Blue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleTextOverlay}
                    disabled={!selectedImage || processing}
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
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" /> Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
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
                        <div
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          style={{
                            alignItems: textPosition.includes("top") ? "flex-start" : textPosition.includes("bottom") ? "flex-end" : "center",
                            justifyContent: textPosition.includes("left") ? "flex-start" : textPosition.includes("right") ? "flex-end" : "center",
                            padding: "20px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: `${Math.min(parseInt(fontSize) / 2, 48)}px`,
                              color: fontColor,
                              fontFamily: fontFamily,
                              backgroundColor: backgroundColor !== "transparent" ? `${backgroundColor}b3` : "transparent",
                              padding: backgroundColor !== "transparent" ? "8px 16px" : "0",
                              borderRadius: "4px",
                              textAlign: "center",
                              whiteSpace: "pre-line",
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
                    <div className="mt-4 flex gap-2">
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
                          {job.progress > 0 && job.progress < 100 && (
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
                          {job.outputUrl && (
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
