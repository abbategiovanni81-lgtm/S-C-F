import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import ContentPlanStep from "./ContentPlanStep";
import SocialListeningStep from "./SocialListeningStep";
import ContentIdeasStep from "./ContentIdeasStep";
import GenerationMethodStep from "./GenerationMethodStep";
import ReviewBoardStep from "./ReviewBoardStep";

export interface BatchState {
  // Step 1: Content Plan
  timeframe: 7 | 14 | 30;
  platforms: string[];
  
  // Step 2: Social Listening
  scanTrends: boolean;
  trendTopics?: string[];
  pinnedTopics?: string[];
  
  // Step 3: Content Ideas
  generatedIdeas?: Array<{
    id: string;
    title: string;
    format: string;
    thumbnail?: string;
    selected: boolean;
  }>;
  
  // Step 4: Generation Method
  generationMethod?: "ai" | "manual";
  jobId?: string;
  
  // Step 5: Review Board
  generatedItems?: any[];
}

interface BatchWizardProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  { id: 1, title: "Content Plan", component: ContentPlanStep },
  { id: 2, title: "Social Listening", component: SocialListeningStep },
  { id: 3, title: "Content Ideas", component: ContentIdeasStep },
  { id: 4, title: "Generation Method", component: GenerationMethodStep },
  { id: 5, title: "Review Board", component: ReviewBoardStep },
];

export default function BatchWizard({ open, onClose }: BatchWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [batchState, setBatchState] = useState<BatchState>({
    timeframe: 7,
    platforms: [],
    scanTrends: false,
  });

  const CurrentStepComponent = STEPS.find(s => s.id === currentStep)?.component;
  const progress = (currentStep / STEPS.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return batchState.platforms.length > 0;
      case 2:
        return true; // Optional step
      case 3:
        return batchState.generatedIdeas && batchState.generatedIdeas.some(i => i.selected);
      case 4:
        return batchState.generationMethod !== undefined;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStateUpdate = (updates: Partial<BatchState>) => {
    setBatchState(prev => ({ ...prev, ...updates }));
  };

  const handleClose = () => {
    setCurrentStep(1);
    setBatchState({
      timeframe: 7,
      platforms: [],
      scanTrends: false,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Batch Content Creation</h2>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {CurrentStepComponent && (
              <CurrentStepComponent
                batchState={batchState}
                onUpdateState={handleStateUpdate}
              />
            )}
          </div>

          {/* Footer Navigation */}
          <div className="px-6 py-4 border-t bg-muted/30">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {currentStep === STEPS.length ? (
                <Button onClick={handleClose}>
                  Complete
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
