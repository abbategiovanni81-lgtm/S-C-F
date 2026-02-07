import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DecisionCard, DecisionCardGrid } from "@/components/ui/decision-card";
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Video, 
  Image as ImageIcon, 
  FileText,
  Mic,
  Film,
  LayoutGrid,
  Wand2,
  Home
} from "lucide-react";

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  options: WorkflowOption[];
}

interface WorkflowOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  nextStepId?: string;
  action?: () => void;
  locked?: boolean;
  tier?: "silent" | "pro" | "enterprise";
}

const workflowSteps: Record<string, WorkflowStep> = {
  start: {
    id: "start",
    title: "What do you want to create?",
    description: "Choose your content format",
    options: [
      {
        id: "video",
        title: "Video Content",
        description: "Reels, TikToks, YouTube Shorts",
        icon: <Video className="w-12 h-12" />,
        gradient: "from-purple-600 to-pink-600",
        nextStepId: "video-type",
      },
      {
        id: "image",
        title: "Image Content",
        description: "Single images, carousels, thumbnails",
        icon: <ImageIcon className="w-12 h-12" />,
        gradient: "from-blue-600 to-cyan-600",
        nextStepId: "image-type",
      },
      {
        id: "text",
        title: "Text Content",
        description: "Captions, scripts, blogs",
        icon: <FileText className="w-12 h-12" />,
        gradient: "from-green-600 to-emerald-600",
        nextStepId: "text-type",
      },
    ],
  },
  "video-type": {
    id: "video-type",
    title: "What type of video?",
    description: "Select your video format",
    options: [
      {
        id: "short-form",
        title: "Short-Form Video",
        description: "15-60 second reels and TikToks",
        icon: <Film className="w-12 h-12" />,
        gradient: "from-purple-600 to-pink-600",
        nextStepId: "short-form-method",
      },
      {
        id: "long-form",
        title: "Long-Form Video",
        description: "YouTube videos, tutorials",
        icon: <Video className="w-12 h-12" />,
        gradient: "from-orange-600 to-red-600",
        nextStepId: "long-form-method",
        locked: true,
        tier: "pro",
      },
    ],
  },
  "short-form-method": {
    id: "short-form-method",
    title: "How do you want to create it?",
    description: "Choose your creation method",
    options: [
      {
        id: "template",
        title: "Use Template",
        description: "Start with pre-made templates",
        icon: <LayoutGrid className="w-12 h-12" />,
        gradient: "from-violet-600 to-purple-600",
        nextStepId: "template-selection",
      },
      {
        id: "ai-generate",
        title: "AI Generate",
        description: "Create from scratch with AI",
        icon: <Wand2 className="w-12 h-12" />,
        gradient: "from-pink-600 to-rose-600",
        nextStepId: "ai-generate-video",
      },
      {
        id: "magic-clips",
        title: "Magic Clips",
        description: "Turn long video into short clips",
        icon: <Sparkles className="w-12 h-12" />,
        gradient: "from-amber-600 to-orange-600",
        nextStepId: "magic-clips",
      },
    ],
  },
  "image-type": {
    id: "image-type",
    title: "What type of image?",
    description: "Select your image format",
    options: [
      {
        id: "single",
        title: "Single Image",
        description: "One image post",
        icon: <ImageIcon className="w-12 h-12" />,
        gradient: "from-blue-600 to-cyan-600",
        nextStepId: "single-image-method",
      },
      {
        id: "carousel",
        title: "Carousel",
        description: "Multi-image post",
        icon: <LayoutGrid className="w-12 h-12" />,
        gradient: "from-cyan-600 to-teal-600",
        nextStepId: "carousel-method",
      },
      {
        id: "thumbnail",
        title: "Video Thumbnail",
        description: "Eye-catching thumbnail",
        icon: <Film className="w-12 h-12" />,
        gradient: "from-purple-600 to-pink-600",
        nextStepId: "thumbnail-method",
      },
    ],
  },
  "text-type": {
    id: "text-type",
    title: "What type of text?",
    description: "Select your text format",
    options: [
      {
        id: "caption",
        title: "Social Caption",
        description: "Post captions with hooks",
        icon: <FileText className="w-12 h-12" />,
        gradient: "from-green-600 to-emerald-600",
        action: () => window.location.href = "/content-queue",
      },
      {
        id: "script",
        title: "Video Script",
        description: "Full video scripts",
        icon: <Mic className="w-12 h-12" />,
        gradient: "from-emerald-600 to-teal-600",
        action: () => window.location.href = "/content-queue",
      },
    ],
  },
};

export function AvaWorkflowGuide({ onComplete }: { onComplete?: (path: string[]) => void }) {
  const [currentStepId, setCurrentStepId] = useState("start");
  const [stepHistory, setStepHistory] = useState<string[]>(["start"]);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  const currentStep = workflowSteps[currentStepId];
  const stepNumber = stepHistory.length;
  const totalSteps = 3; // Average workflow depth
  const progress = (stepNumber / totalSteps) * 100;

  const handleOptionSelect = (option: WorkflowOption) => {
    if (option.locked) return;

    const newPath = [...selectedPath, option.id];
    setSelectedPath(newPath);

    if (option.action) {
      option.action();
      if (onComplete) onComplete(newPath);
      return;
    }

    if (option.nextStepId) {
      setStepHistory([...stepHistory, option.nextStepId]);
      setCurrentStepId(option.nextStepId);
    } else {
      if (onComplete) onComplete(newPath);
    }
  };

  const handleBack = () => {
    if (stepHistory.length > 1) {
      const newHistory = stepHistory.slice(0, -1);
      setStepHistory(newHistory);
      setCurrentStepId(newHistory[newHistory.length - 1]);
      setSelectedPath(selectedPath.slice(0, -1));
    }
  };

  const handleJumpTo = (stepId: string) => {
    setCurrentStepId(stepId);
    setStepHistory([stepId]);
    setSelectedPath([]);
  };

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-700/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="w-6 h-6 text-purple-400" />
                Ava AI Workflow Guide
              </CardTitle>
              <CardDescription className="mt-2">
                Step {stepNumber} of ~{totalSteps} • {currentStep.description}
              </CardDescription>
            </div>
            
            {/* Escape Hatch Dropdown */}
            <Select onValueChange={handleJumpTo} value={currentStepId}>
              <SelectTrigger className="w-48 bg-slate-800">
                <SelectValue placeholder="Jump to..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start">
                  <Home className="w-4 h-4 inline mr-2" />
                  Start Over
                </SelectItem>
                <SelectItem value="video-type">Video Content</SelectItem>
                <SelectItem value="image-type">Image Content</SelectItem>
                <SelectItem value="text-type">Text Content</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Progress Bar */}
          <Progress value={Math.min(progress, 100)} className="mt-4 h-2" />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Getting Started</span>
            <span>{Math.round(progress)}%</span>
            <span>Creating Content</span>
          </div>
        </CardHeader>
      </Card>

      {/* Current Step */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{currentStep.title}</h2>
          {stepHistory.length > 1 && (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
        </div>

        {/* Decision Cards */}
        <DecisionCardGrid>
          {currentStep.options.map((option) => (
            <DecisionCard
              key={option.id}
              title={option.title}
              description={option.description}
              icon={option.icon}
              gradient={option.gradient}
              locked={option.locked}
              tier={option.tier}
              onClick={() => handleOptionSelect(option)}
            />
          ))}
        </DecisionCardGrid>
      </div>

      {/* Breadcrumb Trail */}
      {selectedPath.length > 0 && (
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-400">Your selections:</span>
              {selectedPath.map((pathId, index) => (
                <Badge key={index} variant="secondary" className="bg-purple-900/30">
                  {pathId}
                  {index < selectedPath.length - 1 && (
                    <ArrowRight className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
