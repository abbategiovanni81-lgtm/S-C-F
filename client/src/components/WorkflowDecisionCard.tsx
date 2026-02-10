import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";

interface DecisionCardProps {
  title: string;
  description: string;
  imageSrc?: string;
  icon?: React.ReactNode;
  badge?: string;
  recommended?: boolean;
  onClick: () => void;
}

export function DecisionCard({
  title,
  description,
  imageSrc,
  icon,
  badge,
  recommended,
  onClick,
}: DecisionCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] relative overflow-hidden"
      onClick={onClick}
    >
      {recommended && (
        <Badge className="absolute top-2 right-2 z-10 bg-gradient-to-r from-purple-600 to-indigo-600">
          <Sparkles className="h-3 w-3 mr-1" />
          Recommended
        </Badge>
      )}
      
      <CardContent className="p-4">
        {imageSrc ? (
          <div className="aspect-video mb-3 rounded-md overflow-hidden bg-muted">
            <img
              src={imageSrc}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : icon ? (
          <div className="flex items-center justify-center h-20 mb-3 text-primary">
            {icon}
          </div>
        ) : null}
        
        {badge && (
          <Badge variant="secondary" className="mb-2">
            {badge}
          </Badge>
        )}
        
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        
        <Button className="w-full" variant="outline">
          Select <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

interface WorkflowStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabel?: string;
}

export function WorkflowStepIndicator({
  currentStep,
  totalSteps,
  stepLabel,
}: WorkflowStepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      <div className="flex items-center gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i < currentStep
                ? "bg-primary"
                : i === currentStep
                ? "bg-primary"
                : "bg-muted"
            }`}
          />
        ))}
      </div>
      <span>
        Step {currentStep + 1}/{totalSteps}
      </span>
      {stepLabel && <span>• {stepLabel}</span>}
    </div>
  );
}
