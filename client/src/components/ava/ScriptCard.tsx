import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScriptSection {
  name: string;
  duration: number;
  content: string;
  timing: string;
}

interface Script {
  sections: ScriptSection[];
  totalDuration: number;
  wordCount: number;
}

interface ScriptCardProps {
  script: Script;
}

export function ScriptCard({ script }: ScriptCardProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Script copied to clipboard",
    });
  };

  const copyFullScript = () => {
    const fullScript = script.sections
      .map(section => `[${section.name} - ${section.duration}s]\n${section.content}`)
      .join("\n\n");
    copyToClipboard(fullScript);
  };

  const getSectionColor = (name: string) => {
    const colors: { [key: string]: string } = {
      Hook: "bg-red-500",
      Introduction: "bg-blue-500",
      "Build-up": "bg-purple-500",
      Punchline: "bg-yellow-500",
      "Call to Action": "bg-green-500",
    };
    return colors[name] || "bg-gray-500";
  };

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Generated Script
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{script.totalDuration}s</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{script.wordCount} words</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {script.sections.map((section, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${getSectionColor(section.name)}`} />
              <h4 className="font-semibold text-sm">{section.name}</h4>
              <Badge variant="outline" className="text-xs">
                {section.duration}s
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">{section.timing}</span>
            </div>
            <p className="text-sm leading-relaxed pl-4 border-l-2 border-gray-200 dark:border-gray-800">
              {section.content}
            </p>
          </div>
        ))}
        
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={copyFullScript}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Full Script
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
