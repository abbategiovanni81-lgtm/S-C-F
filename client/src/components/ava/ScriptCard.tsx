import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Edit2 } from "lucide-react";
import { useState } from "react";

interface ScriptSection {
  timestamp: string;
  content: string;
}

interface ScriptCardProps {
  sections: ScriptSection[];
  onEdit?: (index: number, content: string) => void;
}

export function ScriptCard({ sections, onEdit }: ScriptCardProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditContent(sections[index].content);
  };

  const handleSave = (index: number) => {
    onEdit?.(index, editContent);
    setEditingIndex(null);
  };

  return (
    <Card className="bg-[#1a1a1a] border-purple-500/20" data-testid="script-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-gray-100">
          <Clock className="w-5 h-5 text-purple-400" />
          Timed Script
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sections.map((section, index) => (
          <div
            key={index}
            className="p-3 rounded-lg bg-[#0a0a0a] border border-purple-500/10"
            data-testid={`script-section-${index}`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-mono text-purple-400">
                {section.timestamp}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-gray-400 hover:text-purple-400"
                onClick={() => handleEdit(index)}
                data-testid={`edit-script-${index}`}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </div>
            {editingIndex === index ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="text-sm bg-[#0a0a0a] border-purple-500/20"
                  rows={3}
                  data-testid={`edit-textarea-${index}`}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSave(index)}
                    className="bg-purple-600 hover:bg-purple-700"
                    data-testid={`save-script-${index}`}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingIndex(null)}
                    data-testid={`cancel-script-${index}`}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-300 leading-relaxed">
                {section.content}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
