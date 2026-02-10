import { createContext, useContext, useState, ReactNode } from "react";

export type WorkflowStep =
  | "select-action"
  | "select-format"
  | "select-creation-method"
  | "select-template"
  | "ai-content-cards"
  | "select-creator"
  | "select-visuals"
  | "editor"
  | "review-score"
  | "schedule";

export type ContentFormat =
  | "reel"
  | "carousel"
  | "story"
  | "ad"
  | "video"
  | "static-post"
  | "blog";

export type CreationMethod = "scratch" | "template" | "batch-plan";

interface WorkflowState {
  currentStep: WorkflowStep;
  format?: ContentFormat;
  creationMethod?: CreationMethod;
  selectedTemplate?: string;
  aiCreator?: "platform" | "openai" | "elevenlabs" | "a2e";
  selections: Record<string, any>;
}

interface WorkflowContextType {
  workflowState: WorkflowState;
  updateWorkflow: (updates: Partial<WorkflowState>) => void;
  resetWorkflow: () => void;
  goToStep: (step: WorkflowStep) => void;
  isInWorkflow: boolean;
  setIsInWorkflow: (value: boolean) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

const initialWorkflowState: WorkflowState = {
  currentStep: "select-action",
  selections: {},
};

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [workflowState, setWorkflowState] = useState<WorkflowState>(initialWorkflowState);
  const [isInWorkflow, setIsInWorkflow] = useState(false);

  const updateWorkflow = (updates: Partial<WorkflowState>) => {
    setWorkflowState((prev) => ({
      ...prev,
      ...updates,
      selections: { ...prev.selections, ...updates.selections },
    }));
  };

  const resetWorkflow = () => {
    setWorkflowState(initialWorkflowState);
    setIsInWorkflow(false);
  };

  const goToStep = (step: WorkflowStep) => {
    setWorkflowState((prev) => ({ ...prev, currentStep: step }));
  };

  return (
    <WorkflowContext.Provider
      value={{
        workflowState,
        updateWorkflow,
        resetWorkflow,
        goToStep,
        isInWorkflow,
        setIsInWorkflow,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return context;
}
