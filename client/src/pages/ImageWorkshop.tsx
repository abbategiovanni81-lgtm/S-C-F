import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Wand2, Upload, Download, Sparkles, ImageIcon, 
  Maximize2, Palette, Replace, Scissors, Trash2 
} from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";

export default function ImageWorkshop() {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<"gpt-image-1" | "nano-banana" | "flux-2-pro" | "seedream">("gpt-image-1");
  const [resolution, setResolution] = useState<"1k" | "2k" | "4k">("1k");
  const [aspectRatio, setAspectRatio] = useState<"square" | "portrait" | "landscape">("square");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const generateImageMutation = useMutation({
    mutationFn: async (params: {
      prompt: string;
      model: string;
      resolution: string;
      aspectRatio: string;
      referenceImage?: string;
    }) => {
      const res = await apiRequest("POST", "/api/image-workshop/generate", params);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl);
      toast({
        title: "Image Generated!",
        description: "Your image has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    },
  });

  const editImageMutation = useMutation({
    mutationFn: async (params: {
      sourceImage: string;
      referenceImage: string;
      prompt: string;
    }) => {
      const res = await apiRequest("POST", "/api/image-workshop/edit", params);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl);
      toast({
        title: "Image Edited!",
        description: "Your image has been edited successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Edit Failed",
        description: error.message || "Failed to edit image",
        variant: "destructive",
      });
    },
  });

  const upscaleImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const res = await apiRequest("POST", "/api/image-workshop/upscale", { imageUrl });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl);
      toast({
        title: "Image Upscaled!",
        description: "Your image has been enhanced to higher resolution.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upscale Failed",
        description: error.message || "Failed to upscale image",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description for the image.",
        variant: "destructive",
      });
      return;
    }

    generateImageMutation.mutate({
      prompt,
      model,
      resolution,
      aspectRatio,
      referenceImage: referenceImage || undefined,
    });
  };

  const handleEdit = () => {
    if (!selectedImage || !referenceImage) {
      toast({
        title: "Images Required",
        description: "Please upload both source and reference images.",
        variant: "destructive",
      });
      return;
    }

    editImageMutation.mutate({
      sourceImage: selectedImage,
      referenceImage,
      prompt,
    });
  };

  const handleUpscale = () => {
    if (!selectedImage) {
      toast({
        title: "Image Required",
        description: "Please upload an image to upscale.",
        variant: "destructive",
      });
      return;
    }

    upscaleImageMutation.mutate(selectedImage);
  };

  const isPending = generateImageMutation.isPending || editImageMutation.isPending || upscaleImageMutation.isPending;

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Wand2 className="h-8 w-8 text-primary" />
          Image Workshop
        </h1>
        <p className="text-muted-foreground">
          Advanced AI-powered image creation, editing, and enhancement tools
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="edit">
            <Palette className="h-4 w-4 mr-2" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="enhance">
            <Maximize2 className="h-4 w-4 mr-2" />
            Enhance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Image Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>AI Model</Label>
                    <Select value={model} onValueChange={(v: any) => setModel(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-image-1">
                          GPT Image-1 (Fast, Good Quality)
                        </SelectItem>
                        <SelectItem value="nano-banana">
                          <div className="flex items-center gap-2">
                            Nano Banana Pro
                            <Badge variant="secondary">Premium</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="flux-2-pro">
                          <div className="flex items-center gap-2">
                            Flux 2 Pro
                            <Badge variant="secondary">Photorealistic</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="seedream">
                          Seedream 4.5 (Creative)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Prompt</Label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the image you want to create..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Resolution</Label>
                      <Select value={resolution} onValueChange={(v: any) => setResolution(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1k">1K (1024px)</SelectItem>
                          <SelectItem value="2k">2K (2048px)</SelectItem>
                          <SelectItem value="4k">4K (4096px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Aspect Ratio</Label>
                      <Select value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="square">Square (1:1)</SelectItem>
                          <SelectItem value="portrait">Portrait (9:16)</SelectItem>
                          <SelectItem value="landscape">Landscape (16:9)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Reference Image (Optional)</Label>
                    <ObjectUploader
                      onUploadComplete={(path) => setReferenceImage(path)}
                      accept="image/*"
                      label="Upload Reference"
                    />
                    {referenceImage && (
                      <div className="mt-2 relative">
                        <img
                          src={referenceImage}
                          alt="Reference"
                          className="w-full rounded-md"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => setReferenceImage(null)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isPending || !prompt.trim()}
                    className="w-full"
                  >
                    {isPending ? "Generating..." : "Generate Image"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedImage ? (
                    <div className="space-y-4">
                      <img
                        src={generatedImage}
                        alt="Generated"
                        className="w-full rounded-md"
                      />
                      <div className="flex gap-2">
                        <Button className="flex-1" asChild>
                          <a href={generatedImage} download>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedImage(generatedImage)}
                        >
                          <Replace className="h-4 w-4 mr-2" />
                          Use as Source
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-muted rounded-md">
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Your generated image will appear here</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="edit" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Image Editor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Source Image</Label>
                  <ObjectUploader
                    onUploadComplete={(path) => setSelectedImage(path)}
                    accept="image/*"
                    label="Upload Source Image"
                  />
                  {selectedImage && (
                    <img
                      src={selectedImage}
                      alt="Source"
                      className="mt-2 w-full rounded-md"
                    />
                  )}
                </div>

                <div>
                  <Label>Reference Image</Label>
                  <ObjectUploader
                    onUploadComplete={(path) => setReferenceImage(path)}
                    accept="image/*"
                    label="Upload Reference Image"
                  />
                  {referenceImage && (
                    <img
                      src={referenceImage}
                      alt="Reference"
                      className="mt-2 w-full rounded-md"
                    />
                  )}
                </div>

                <div>
                  <Label>Edit Instructions</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe how you want to modify the image..."
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleEdit}
                  disabled={isPending || !selectedImage || !referenceImage}
                  className="w-full"
                >
                  {isPending ? "Editing..." : "Edit Image"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Result</CardTitle>
              </CardHeader>
              <CardContent>
                {generatedImage ? (
                  <div className="space-y-4">
                    <img
                      src={generatedImage}
                      alt="Edited"
                      className="w-full rounded-md"
                    />
                    <Button className="w-full" asChild>
                      <a href={generatedImage} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-muted rounded-md">
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Edited image will appear here</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enhance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Image Upscaler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Image to Upscale</Label>
                  <ObjectUploader
                    onUploadComplete={(path) => setSelectedImage(path)}
                    accept="image/*"
                    label="Upload Image"
                  />
                  {selectedImage && (
                    <img
                      src={selectedImage}
                      alt="Source"
                      className="mt-2 w-full rounded-md"
                    />
                  )}
                </div>

                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Enhance image resolution up to 4K quality. Perfect for improving
                    image quality for prints and high-resolution displays.
                  </p>
                </div>

                <Button
                  onClick={handleUpscale}
                  disabled={isPending || !selectedImage}
                  className="w-full"
                >
                  {isPending ? "Upscaling..." : "Upscale Image"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enhanced Result</CardTitle>
              </CardHeader>
              <CardContent>
                {generatedImage ? (
                  <div className="space-y-4">
                    <img
                      src={generatedImage}
                      alt="Upscaled"
                      className="w-full rounded-md"
                    />
                    <Button className="w-full" asChild>
                      <a href={generatedImage} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download HD Image
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-muted rounded-md">
                    <div className="text-center text-muted-foreground">
                      <Maximize2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Upscaled image will appear here</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
