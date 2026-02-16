import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface Hook {
  text: string;
  type: string;
}

interface HookCardsProps {
  hooks: Hook[];
}

export function HookCards({ hooks }: HookCardsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card className="bg-[#1a1a1a] border-purple-500/20" data-testid="hook-cards">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gray-100">
          Opening Hooks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hooks.map((hook, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-[#0a0a0a] border border-purple-500/10"
            data-testid={`hook-${index}`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-xs font-semibold text-purple-400 uppercase">
                {hook.type}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-gray-400 hover:text-purple-400"
                onClick={() => handleCopy(hook.text, index)}
                data-testid={`copy-hook-${index}`}
              >
                {copiedIndex === index ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed font-medium">
              "{hook.text}"
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
