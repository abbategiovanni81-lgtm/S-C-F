import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaUpload } from "@/components/ui/media-upload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Wand2, 
  Mic, 
  Image, 
  Video, 
  Sparkles, 
  Lock,
  Crown,
  Upload,
  Play,
  Loader2,
  Languages,
  Scissors,
  Palette,
  Shirt,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Maximize2,
  Film
} from "lucide-react";

type CreatorStudioUsage = {
  voiceClones: { used: number; limit: number };
  talkingPhotos: { used: number; limit: number };
  talkingVideos: { used: number; limit: number };
  faceSwaps: { used: number; limit: number };
  aiDubbing: { used: number; limit: number };
  imageToVideo: { used: number; limit: number };
  captionRemoval: { used: number; limit: number };
  videoToVideo: { used: number; limit: number };
  virtualTryOn: { used: number; limit: number };
  imageReformat: { used: number; limit: number };
};

type CreatorStudioStatus = {
  hasAccess: boolean;
  usage?: CreatorStudioUsage;
  a2eConfigured: boolean;
};

export default function CreatorStudio() {
  const { user, hasFullAccess, tier, isOwner } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery<CreatorStudioStatus>({
    queryKey: ["/api/creator-studio/status"],
    queryFn: async () => {
      const res = await fetch("/api/creator-studio/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/creator-studio-checkout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to start subscription");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </Layout>
    );
  }

  // Show all tools but with upgrade boxes for non-subscribers
  // Studio tier has Creator Studio included, others need to subscribe
  const canUseCreatorStudio = status?.hasAccess || isOwner || tier === "studio";
  const showUpgradeOverlay = !canUseCreatorStudio;

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Wand2 className="h-8 w-8 text-purple-500" />
            <div>
              <h1 className="text-3xl font-bold">Creator Studio</h1>
              <p className="text-muted-foreground">Advanced AI creation tools</p>
            </div>
          </div>
          {canUseCreatorStudio ? (
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <Sparkles className="h-3 w-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="border-yellow-500 text-yellow-500">
              <Lock className="h-3 w-3 mr-1" />
              Upgrade Required
            </Badge>
          )}
        </div>

        {showUpgradeOverlay && (
          <Alert className="mb-6 border-purple-500/50 bg-purple-500/10">
            <Crown className="h-4 w-4 text-purple-500" />
            <AlertTitle className="text-purple-500">Unlock Creator Studio</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Get access to advanced AI tools: voice cloning, talking photos, face swap, AI dubbing, and more.
              {tier === "studio" ? " Studio tier includes Creator Studio." : " Add Creator Studio to your subscription for £20/month, or upgrade to Studio tier (£99.99/mo - Early adopter pricing, limited time) to get it included."}
              <Button 
                onClick={() => subscribeMutation.mutate()} 
                disabled={subscribeMutation.isPending}
                className="ml-4 bg-gradient-to-r from-purple-600 to-pink-600"
                size="sm"
              >
                {subscribeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Crown className="h-4 w-4 mr-2" />}
                Subscribe Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {status?.usage && <UsageOverview usage={status.usage} />}

        <Tabs defaultValue="voice-clone" className="space-y-6 mt-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="voice-clone" data-testid="tab-voice-clone">
              <Mic className="h-4 w-4 mr-2" />
              Voice Clone
            </TabsTrigger>
            <TabsTrigger value="talking-photo" data-testid="tab-talking-photo">
              <Image className="h-4 w-4 mr-2" />
              Talking Photo
            </TabsTrigger>
            <TabsTrigger value="talking-video" data-testid="tab-talking-video">
              <Video className="h-4 w-4 mr-2" />
              Talking Video
            </TabsTrigger>
            <TabsTrigger value="face-swap" data-testid="tab-face-swap">
              <Sparkles className="h-4 w-4 mr-2" />
              Face Swap
            </TabsTrigger>
            <TabsTrigger value="dubbing" data-testid="tab-dubbing">
              <Languages className="h-4 w-4 mr-2" />
              AI Dubbing
            </TabsTrigger>
            <TabsTrigger value="image-to-video" data-testid="tab-image-to-video">
              <Play className="h-4 w-4 mr-2" />
              Image to Video
            </TabsTrigger>
            <TabsTrigger value="caption-removal" data-testid="tab-caption-removal">
              <Scissors className="h-4 w-4 mr-2" />
              Caption Removal
            </TabsTrigger>
            <TabsTrigger value="video-style" data-testid="tab-video-style">
              <Palette className="h-4 w-4 mr-2" />
              Video Style
            </TabsTrigger>
            <TabsTrigger value="virtual-tryon" data-testid="tab-virtual-tryon">
              <Shirt className="h-4 w-4 mr-2" />
              Virtual Try-On
            </TabsTrigger>
            <TabsTrigger value="image-reformat" data-testid="tab-image-reformat">
              <Maximize2 className="h-4 w-4 mr-2" />
              Image Reformat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice-clone">
            <VoiceCloneTab usage={status?.usage?.voiceClones} />
          </TabsContent>

          <TabsContent value="talking-photo">
            <TalkingPhotoTab usage={status?.usage?.talkingPhotos} />
          </TabsContent>

          <TabsContent value="talking-video">
            <TalkingVideoTab usage={status?.usage?.talkingVideos} />
          </TabsContent>

          <TabsContent value="face-swap">
            <FaceSwapTab usage={status?.usage?.faceSwaps} />
          </TabsContent>

          <TabsContent value="dubbing">
            <DubbingTab usage={status?.usage?.aiDubbing} />
          </TabsContent>

          <TabsContent value="image-to-video">
            <ImageToVideoTab usage={status?.usage?.imageToVideo} />
          </TabsContent>

          <TabsContent value="caption-removal">
            <CaptionRemovalTab usage={status?.usage?.captionRemoval} />
          </TabsContent>

          <TabsContent value="video-style">
            <VideoStyleTab usage={status?.usage?.videoToVideo} />
          </TabsContent>

          <TabsContent value="virtual-tryon">
            <VirtualTryOnTab usage={status?.usage?.virtualTryOn} />
          </TabsContent>

          <TabsContent value="image-reformat">
            <ImageReformatTab usage={status?.usage?.imageReformat} />
          </TabsContent>
        </Tabs>

        {/* Steve AI Video Suite - Standalone Section for Studio Tier */}
        <SteveAISection />
      </div>
    </Layout>
  );
}

function LockedState({ title, description, action }: { title: string; description: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <Lock className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {action}
    </div>
  );
}

function FeatureCard({ icon, title, description, limit }: { icon: React.ReactNode; title: string; description: string; limit: string }) {
  return (
    <div className="p-4 rounded-lg border bg-card hover:border-purple-500/50 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-purple-500">{icon}</div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{description}</p>
      <Badge variant="secondary" className="text-xs">{limit}</Badge>
    </div>
  );
}

function UsageOverview({ usage }: { usage?: CreatorStudioUsage }) {
  if (!usage) return null;

  const items = [
    { label: "Voice Clones", ...usage.voiceClones },
    { label: "Talking Photos", ...usage.talkingPhotos },
    { label: "Talking Videos", ...usage.talkingVideos },
    { label: "Face Swaps", ...usage.faceSwaps },
    { label: "AI Dubbing", ...usage.aiDubbing },
    { label: "Image to Video", ...usage.imageToVideo },
    { label: "Caption Removal", ...usage.captionRemoval },
    { label: "Video Style", ...usage.videoToVideo },
    { label: "Virtual Try-On", ...usage.virtualTryOn },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Monthly Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-sm text-muted-foreground mb-1">{item.label}</div>
              <div className="font-semibold">
                {item.used}/{item.limit}
              </div>
              <Progress value={(item.used / item.limit) * 100} className="h-1 mt-1" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UsageBadge({ usage }: { usage?: { used: number; limit: number } }) {
  if (!usage) return null;
  const remaining = usage.limit - usage.used;
  return (
    <Badge variant={remaining > 0 ? "secondary" : "destructive"}>
      {remaining} remaining
    </Badge>
  );
}

function VoiceCloneTab({ usage }: { usage?: { used: number; limit: number } }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [audioUrl, setAudioUrl] = useState("");
  const [voiceName, setVoiceName] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/creator-studio/voice-clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ audioUrl, voiceName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to clone voice");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Voice cloning started!", description: "This may take a few minutes." });
      queryClient.invalidateQueries({ queryKey: ["/api/creator-studio/status"] });
      setAudioUrl("");
      setVoiceName("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-purple-500" />
              Voice Cloning
            </CardTitle>
            <CardDescription>Clone a voice from any audio or video file</CardDescription>
          </div>
          <UsageBadge usage={usage} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MediaUpload
          value={audioUrl}
          onChange={setAudioUrl}
          accept="audio,video"
          label="Audio/Video File"
          placeholder="https://example.com/audio.mp3"
          description="Upload or paste URL to audio/video (10-60 seconds recommended)"
          testId="voice-clone-audio"
        />
        <div className="space-y-2">
          <Label>Voice Name</Label>
          <Input
            placeholder="My Custom Voice"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            data-testid="input-voice-name"
          />
        </div>
        <Button 
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !audioUrl || !voiceName}
          className="gap-2"
          data-testid="button-clone-voice"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
          Clone Voice
        </Button>
      </CardContent>
    </Card>
  );
}

function TalkingPhotoTab({ usage }: { usage?: { used: number; limit: number } }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageUrl, setImageUrl] = useState("");
  const [text, setText] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/creator-studio/talking-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ imageUrl, text }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Talking photo started!", description: "Processing your request." });
      queryClient.invalidateQueries({ queryKey: ["/api/creator-studio/status"] });
      setImageUrl("");
      setText("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-purple-500" />
              Talking Photo
            </CardTitle>
            <CardDescription>Animate a photo to speak your text</CardDescription>
          </div>
          <UsageBadge usage={usage} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MediaUpload
          value={imageUrl}
          onChange={setImageUrl}
          accept="image"
          label="Portrait Photo"
          placeholder="https://example.com/photo.jpg"
          description="Use a clear front-facing portrait photo"
          testId="talking-photo-image"
        />
        <div className="space-y-2">
          <Label>Text to Speak</Label>
          <Textarea
            placeholder="Enter the text you want the photo to say..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            data-testid="input-speak-text"
          />
        </div>
        <Button 
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !imageUrl || !text}
          className="gap-2"
          data-testid="button-talking-photo"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Generate Talking Photo
        </Button>
      </CardContent>
    </Card>
  );
}

function TalkingVideoTab({ usage }: { usage?: { used: number; limit: number } }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [videoUrl, setVideoUrl] = useState("");
  const [text, setText] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/creator-studio/talking-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ videoUrl, text }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Talking video started!", description: "Processing your request." });
      queryClient.invalidateQueries({ queryKey: ["/api/creator-studio/status"] });
      setVideoUrl("");
      setText("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-500" />
              Talking Video
            </CardTitle>
            <CardDescription>Make a video speak new text with lip-sync</CardDescription>
          </div>
          <UsageBadge usage={usage} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MediaUpload
          value={videoUrl}
          onChange={setVideoUrl}
          accept="video"
          label="Video File"
          placeholder="https://example.com/video.mp4"
          description="Upload video with clear face visibility"
          testId="talking-video"
        />
        <div className="space-y-2">
          <Label>New Text to Speak</Label>
          <Textarea
            placeholder="Enter the new text for the video..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            data-testid="input-new-text"
          />
        </div>
        <Button 
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !videoUrl || !text}
          className="gap-2"
          data-testid="button-talking-video"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Generate Talking Video
        </Button>
      </CardContent>
    </Card>
  );
}

function FaceSwapTab({ usage }: { usage?: { used: number; limit: number } }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sourceImageUrl, setSourceImageUrl] = useState("");
  const [targetVideoUrl, setTargetVideoUrl] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/creator-studio/face-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sourceImageUrl, targetVideoUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Face swap started!", description: "Processing your request." });
      queryClient.invalidateQueries({ queryKey: ["/api/creator-studio/status"] });
      setSourceImageUrl("");
      setTargetVideoUrl("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Face Swap
            </CardTitle>
            <CardDescription>Swap a face from a photo into a video</CardDescription>
          </div>
          <UsageBadge usage={usage} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MediaUpload
          value={sourceImageUrl}
          onChange={setSourceImageUrl}
          accept="image"
          label="Source Face (Photo)"
          placeholder="https://example.com/face.jpg"
          description="Clear front-facing photo of the face to swap in"
          testId="face-swap-source"
        />
        <MediaUpload
          value={targetVideoUrl}
          onChange={setTargetVideoUrl}
          accept="video"
          label="Target Video"
          placeholder="https://example.com/video.mp4"
          description="Video where the face will be swapped"
          testId="face-swap-target"
        />
        <Button 
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !sourceImageUrl || !targetVideoUrl}
          className="gap-2"
          data-testid="button-face-swap"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Swap Face
        </Button>
      </CardContent>
    </Card>
  );
}

function DubbingTab({ usage }: { usage?: { used: number; limit: number } }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [videoUrl, setVideoUrl] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");

  const languages = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "it", label: "Italian" },
    { value: "pt", label: "Portuguese" },
    { value: "zh", label: "Chinese" },
    { value: "ja", label: "Japanese" },
    { value: "ko", label: "Korean" },
    { value: "ar", label: "Arabic" },
    { value: "hi", label: "Hindi" },
  ];

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/creator-studio/dubbing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ videoUrl, targetLanguage }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Dubbing started!", description: "This may take several minutes." });
      queryClient.invalidateQueries({ queryKey: ["/api/creator-studio/status"] });
      setVideoUrl("");
      setTargetLanguage("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-purple-500" />
              AI Dubbing
            </CardTitle>
            <CardDescription>Translate and dub video to another language</CardDescription>
          </div>
          <UsageBadge usage={usage} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MediaUpload
          value={videoUrl}
          onChange={setVideoUrl}
          accept="video"
          label="Video File"
          placeholder="https://example.com/video.mp4"
          description="Upload video to translate and dub"
          testId="dubbing-video"
        />
        <div className="space-y-2">
          <Label>Target Language</Label>
          <Select value={targetLanguage} onValueChange={setTargetLanguage}>
            <SelectTrigger data-testid="select-target-language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !videoUrl || !targetLanguage}
          className="gap-2"
          data-testid="button-dub-video"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
          Dub Video
        </Button>
      </CardContent>
    </Card>
  );
}

function ImageToVideoTab({ usage }: { usage?: { used: number; limit: number } }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageUrl, setImageUrl] = useState("");
  const [text, setText] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/creator-studio/image-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ imageUrl, text }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Image to video started!", description: "Processing your request." });
      queryClient.invalidateQueries({ queryKey: ["/api/creator-studio/status"] });
      setImageUrl("");
      setText("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-purple-500" />
              Image to Video
            </CardTitle>
            <CardDescription>Animate a still image into a video</CardDescription>
          </div>
          <UsageBadge usage={usage} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MediaUpload
          value={imageUrl}
          onChange={setImageUrl}
          accept="image"
          label="Image File"
          placeholder="https://example.com/image.jpg"
          description="Upload image to animate into video"
          testId="image-to-video"
        />
        <div className="space-y-2">
          <Label>Motion Description (optional)</Label>
          <Textarea
            placeholder="Describe how you want the image to animate..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            data-testid="input-motion-description"
          />
        </div>
        <Button 
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !imageUrl}
          className="gap-2"
          data-testid="button-img-to-video"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Animate Image
        </Button>
      </CardContent>
    </Card>
  );
}

function CaptionRemovalTab({ usage }: { usage?: { used: number; limit: number } }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [videoUrl, setVideoUrl] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/creator-studio/caption-removal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ videoUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Caption removal started!", description: "Processing your request." });
      queryClient.invalidateQueries({ queryKey: ["/api/creator-studio/status"] });
      setVideoUrl("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-purple-500" />
              Caption Removal
            </CardTitle>
            <CardDescription>Remove burned-in captions from videos</CardDescription>
          </div>
          <UsageBadge usage={usage} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MediaUpload
          value={videoUrl}
          onChange={setVideoUrl}
          accept="video"
          label="Video File"
          placeholder="https://example.com/video.mp4"
          description="Works best with clear, simple caption styles"
          testId="caption-removal"
        />
        <Button 
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !videoUrl}
          className="gap-2"
          data-testid="button-remove-captions"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
          Remove Captions
        </Button>
      </CardContent>
    </Card>
  );
}

function VideoStyleTab({ usage }: { usage?: { used: number; limit: number } }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [videoUrl, setVideoUrl] = useState("");
  const [prompt, setPrompt] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/creator-studio/video-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ videoUrl, prompt }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Style transfer started!", description: "Processing your request." });
      queryClient.invalidateQueries({ queryKey: ["/api/creator-studio/status"] });
      setVideoUrl("");
      setPrompt("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              Video Style Transfer
            </CardTitle>
            <CardDescription>Apply artistic styles to your videos</CardDescription>
          </div>
          <UsageBadge usage={usage} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MediaUpload
          value={videoUrl}
          onChange={setVideoUrl}
          accept="video"
          label="Video File"
          placeholder="https://example.com/video.mp4"
          description="Upload video to apply style transfer"
          testId="video-style"
        />
        <div className="space-y-2">
          <Label>Style Description</Label>
          <Textarea
            placeholder="e.g., Anime style, oil painting, cyberpunk aesthetic..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            data-testid="input-style-prompt"
          />
        </div>
        <Button 
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !videoUrl || !prompt}
          className="gap-2"
          data-testid="button-style-transfer"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Palette className="h-4 w-4" />}
          Apply Style
        </Button>
      </CardContent>
    </Card>
  );
}

function VirtualTryOnTab({ usage }: { usage?: { used: number; limit: number } }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [personImageUrl, setPersonImageUrl] = useState("");
  const [clothingImageUrl, setClothingImageUrl] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/creator-studio/virtual-tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ personImageUrl, clothingImageUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Virtual try-on started!", description: "Processing your request." });
      queryClient.invalidateQueries({ queryKey: ["/api/creator-studio/status"] });
      setPersonImageUrl("");
      setClothingImageUrl("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shirt className="h-5 w-5 text-purple-500" />
              Virtual Try-On
            </CardTitle>
            <CardDescription>Try clothes on a person photo</CardDescription>
          </div>
          <UsageBadge usage={usage} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MediaUpload
          value={personImageUrl}
          onChange={setPersonImageUrl}
          accept="image"
          label="Person Photo"
          placeholder="https://example.com/person.jpg"
          description="Full body or upper body photo works best"
          testId="virtual-tryon-person"
        />
        <MediaUpload
          value={clothingImageUrl}
          onChange={setClothingImageUrl}
          accept="image"
          label="Clothing Image"
          placeholder="https://example.com/clothing.jpg"
          description="Product photo of the clothing item"
          testId="virtual-tryon-clothing"
        />
        <Button 
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !personImageUrl || !clothingImageUrl}
          className="gap-2"
          data-testid="button-virtual-tryon"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shirt className="h-4 w-4" />}
          Try On
        </Button>
      </CardContent>
    </Card>
  );
}

function ImageReformatTab({ usage }: { usage?: { used: number; limit: number } }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageUrl, setImageUrl] = useState("");
  const [targetAspectRatio, setTargetAspectRatio] = useState<"landscape" | "portrait" | "square">("landscape");
  const [resultUrl, setResultUrl] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/creator-studio/image-reformat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ imageUrl, targetAspectRatio }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reformat");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Image reformatted!", description: "Your new image is ready." });
      queryClient.invalidateQueries({ queryKey: ["/api/creator-studio/status"] });
      setResultUrl(data.imageUrl);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Maximize2 className="h-5 w-5 text-purple-500" />
              Image Reformat
            </CardTitle>
            <CardDescription>Change image aspect ratio using AI</CardDescription>
          </div>
          <UsageBadge usage={usage} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <MediaUpload
          value={imageUrl}
          onChange={setImageUrl}
          accept="image"
          label="Source Image"
          placeholder="https://example.com/image.jpg"
          description="The image you want to reformat"
          testId="image-reformat-source"
        />
        <div className="space-y-2">
          <Label>Target Aspect Ratio</Label>
          <Select value={targetAspectRatio} onValueChange={(v: "landscape" | "portrait" | "square") => setTargetAspectRatio(v)}>
            <SelectTrigger data-testid="select-aspect-ratio">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="landscape">Landscape (16:9)</SelectItem>
              <SelectItem value="portrait">Portrait (9:16)</SelectItem>
              <SelectItem value="square">Square (1:1)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !imageUrl}
          className="gap-2"
          data-testid="button-image-reformat"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Maximize2 className="h-4 w-4" />}
          Reformat Image
        </Button>
        {resultUrl && (
          <div className="mt-4 border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Result:</p>
            <img src={resultUrl} alt="Reformatted image" className="max-w-full rounded" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SteveAISection() {
  const { tier, isOwner } = useAuth();
  const isStudioTier = tier === "studio" || isOwner;

  return (
    <div className="mt-10 pt-10 border-t">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
            <Film className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Steve AI Suite</h2>
            <p className="text-muted-foreground">Professional video and image generation powered by Steve AI</p>
          </div>
        </div>
        {isStudioTier ? (
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="border-orange-500 text-orange-500">
            <Lock className="h-3 w-3 mr-1" />
            Studio Tier Only
          </Badge>
        )}
      </div>

      {!isStudioTier ? (
        <Alert className="border-orange-500/50 bg-orange-500/10">
          <Crown className="h-4 w-4 text-orange-500" />
          <AlertTitle className="text-orange-500">Unlock Steve AI Suite</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Create stunning content with Steve AI's professional tools.
            Available exclusively for Studio tier subscribers (£99.99/mo - Early adopter pricing, limited time).
            <br /><br />
            <strong>Monthly Limits:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Videos:</strong> 200 minutes of long-form video generation</li>
              <li><strong>Generative AI:</strong> 7.5 minutes of AI-generated footage</li>
              <li><strong>Images:</strong> 1,600 AI-generated images</li>
            </ul>
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="videos" className="space-y-4">
          <TabsList className="bg-orange-500/10 border border-orange-500/30">
            <TabsTrigger value="videos" data-testid="tab-steve-videos" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Film className="h-4 w-4 mr-2" />
              Videos (200 min)
            </TabsTrigger>
            <TabsTrigger value="generative" data-testid="tab-steve-generative" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Sparkles className="h-4 w-4 mr-2" />
              Generative (7.5 min)
            </TabsTrigger>
            <TabsTrigger value="images" data-testid="tab-steve-images" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Image className="h-4 w-4 mr-2" />
              Images (1,600)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <SteveAIVideosTab />
          </TabsContent>

          <TabsContent value="generative">
            <SteveAIGenerativeTab />
          </TabsContent>

          <TabsContent value="images">
            <SteveAIImagesTab />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function SteveAIVideosTab() {
  const { toast } = useToast();
  const [script, setScript] = useState("");
  const [style, setStyle] = useState<"animation" | "live_action" | "generative" | "talking_head" | "documentary">("animation");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [duration, setDuration] = useState(60);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generationComplete, setGenerationComplete] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/steveai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ script, style, aspectRatio, duration }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate video");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Video generation started!", description: "Your video is being created." });
      setRequestId(data.requestId);
      setGenerationComplete(false);
      setVideoUrl(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const { data: statusData } = useQuery({
    queryKey: ["/api/steveai/status", requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const res = await fetch(`/api/steveai/status/${requestId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check status");
      return res.json();
    },
    enabled: !!requestId && !generationComplete,
    refetchInterval: requestId && !generationComplete ? 5000 : false,
  });

  const { data: resultData } = useQuery({
    queryKey: ["/api/steveai/result", requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const res = await fetch(`/api/steveai/result/${requestId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to get result");
      return res.json();
    },
    enabled: !!requestId && statusData?.status === "completed" && !videoUrl,
  });

  if (statusData?.status === "completed" && !generationComplete) {
    setGenerationComplete(true);
  }
  if (statusData?.status === "failed" && !generationComplete) {
    setGenerationComplete(true);
  }
  if (resultData?.videoUrl && !videoUrl) {
    setVideoUrl(resultData.videoUrl);
  }

  return (
    <Card className="border-orange-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="h-5 w-5 text-orange-500" />
          Long-Form Video Generation
        </CardTitle>
        <CardDescription>Create polished videos up to 3 minutes with AI-generated visuals, voiceover, and music</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Video Script</Label>
          <Textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Enter your video script or topic..."
            rows={6}
            data-testid="input-steve-script"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Video Style</Label>
            <Select value={style} onValueChange={(v: typeof style) => setStyle(v)}>
              <SelectTrigger data-testid="select-steve-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="animation">Animation</SelectItem>
                <SelectItem value="live_action">Live Action</SelectItem>
                <SelectItem value="generative">Generative AI</SelectItem>
                <SelectItem value="talking_head">Talking Head</SelectItem>
                <SelectItem value="documentary">Documentary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={(v: typeof aspectRatio) => setAspectRatio(v)}>
              <SelectTrigger data-testid="select-steve-aspect">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                <SelectItem value="1:1">Square (1:1)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Duration: {duration}s ({Math.floor(duration/60)}:{(duration%60).toString().padStart(2,'0')})</Label>
          <input
            type="range"
            min="30"
            max="180"
            step="30"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full"
            data-testid="slider-steve-duration"
          />
        </div>

        <Button 
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || !script.trim() || (!!requestId && !generationComplete)}
          className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          data-testid="button-generate-steve"
        >
          {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
          {generationComplete ? "Generate Another" : "Generate Video"}
        </Button>

        {requestId && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              {statusData?.status === "completed" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : statusData?.status === "failed" ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
              )}
              <span className="font-medium">
                {statusData?.status === "completed" ? "Video Ready!" : 
                 statusData?.status === "failed" ? "Generation Failed" : 
                 "Generating..."}
              </span>
            </div>
            {statusData?.progress && (
              <Progress value={statusData.progress} className="mb-2" />
            )}
            {videoUrl && (
              <video src={videoUrl} controls className="w-full rounded mt-2" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SteveAIGenerativeTab() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<"realistic" | "artistic" | "cinematic" | "anime">("cinematic");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [duration, setDuration] = useState(10);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generationComplete, setGenerationComplete] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/steveai/generative/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt, style, aspectRatio, duration }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate video");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Generative video started!", description: "AI is creating your footage." });
      setRequestId(data.requestId);
      setGenerationComplete(false);
      setVideoUrl(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const { data: statusData } = useQuery({
    queryKey: ["/api/steveai/generative/status", requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const res = await fetch(`/api/steveai/generative/status/${requestId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check status");
      return res.json();
    },
    enabled: !!requestId && !generationComplete,
    refetchInterval: requestId && !generationComplete ? 5000 : false,
  });

  if (statusData?.status === "completed" && !generationComplete) {
    setGenerationComplete(true);
    if (statusData.videoUrl) {
      setVideoUrl(statusData.videoUrl);
    }
  }
  if (statusData?.status === "failed" && !generationComplete) {
    setGenerationComplete(true);
  }

  return (
    <Card className="border-orange-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-orange-500" />
          Generative AI Video
        </CardTitle>
        <CardDescription>Create AI-generated footage from text prompts (max 30 seconds)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Video Prompt</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the scene you want to create... e.g., 'A drone shot flying over a futuristic city at sunset'"
            rows={4}
            data-testid="input-steve-generative-prompt"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Visual Style</Label>
            <Select value={style} onValueChange={(v: typeof style) => setStyle(v)}>
              <SelectTrigger data-testid="select-steve-generative-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realistic">Realistic</SelectItem>
                <SelectItem value="artistic">Artistic</SelectItem>
                <SelectItem value="cinematic">Cinematic</SelectItem>
                <SelectItem value="anime">Anime</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={(v: typeof aspectRatio) => setAspectRatio(v)}>
              <SelectTrigger data-testid="select-steve-generative-aspect">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                <SelectItem value="1:1">Square (1:1)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Duration: {duration} seconds</Label>
          <input
            type="range"
            min="5"
            max="30"
            step="5"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full"
            data-testid="slider-steve-generative-duration"
          />
          <p className="text-xs text-muted-foreground">5 to 30 seconds max</p>
        </div>

        <Button 
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || !prompt.trim() || (!!requestId && !generationComplete)}
          className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          data-testid="button-generate-steve-generative"
        >
          {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generationComplete ? "Generate Another" : "Generate AI Video"}
        </Button>

        {requestId && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              {statusData?.status === "completed" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : statusData?.status === "failed" ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
              )}
              <span className="font-medium">
                {statusData?.status === "completed" ? "Video Ready!" : 
                 statusData?.status === "failed" ? "Generation Failed" : 
                 "Generating..."}
              </span>
            </div>
            {statusData?.progress && (
              <Progress value={statusData.progress} className="mb-2" />
            )}
            {videoUrl && (
              <video src={videoUrl} controls className="w-full rounded mt-2" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SteveAIImagesTab() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<"photorealistic" | "illustration" | "3d" | "anime" | "digital_art">("photorealistic");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1" | "4:3" | "3:4">("1:1");
  const [count, setCount] = useState(1);
  const [images, setImages] = useState<{ url: string; id: string }[]>([]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/steveai/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt, style, aspectRatio, count }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate images");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.images && data.images.length > 0) {
        setImages(data.images);
        toast({ title: "Images generated!", description: `${data.images.length} image(s) created.` });
      } else {
        toast({ title: "Generation queued", description: "Your images are being created." });
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card className="border-orange-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5 text-orange-500" />
          AI Image Generation
        </CardTitle>
        <CardDescription>Generate high-quality images from text descriptions (1,600/month)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Image Prompt</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want... e.g., 'A professional product photo of a sleek smartphone on a marble surface'"
            rows={4}
            data-testid="input-steve-image-prompt"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Style</Label>
            <Select value={style} onValueChange={(v: typeof style) => setStyle(v)}>
              <SelectTrigger data-testid="select-steve-image-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photorealistic">Photorealistic</SelectItem>
                <SelectItem value="illustration">Illustration</SelectItem>
                <SelectItem value="3d">3D Render</SelectItem>
                <SelectItem value="anime">Anime</SelectItem>
                <SelectItem value="digital_art">Digital Art</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={(v: typeof aspectRatio) => setAspectRatio(v)}>
              <SelectTrigger data-testid="select-steve-image-aspect">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:1">Square (1:1)</SelectItem>
                <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                <SelectItem value="4:3">Standard (4:3)</SelectItem>
                <SelectItem value="3:4">Portrait (3:4)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Count: {count}</Label>
            <input
              type="range"
              min="1"
              max="4"
              step="1"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full"
              data-testid="slider-steve-image-count"
            />
          </div>
        </div>

        <Button 
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || !prompt.trim()}
          className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          data-testid="button-generate-steve-images"
        >
          {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
          Generate {count} Image{count > 1 ? 's' : ''}
        </Button>

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {images.map((img, idx) => (
              <div key={img.id || idx} className="border rounded-lg overflow-hidden">
                <img src={img.url} alt={`Generated ${idx + 1}`} className="w-full" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
