import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hash } from "lucide-react";

interface HashtagCloudProps {
  hashtags: string[];
}

export function HashtagCloud({ hashtags }: HashtagCloudProps) {
  return (
    <Card className="bg-[#1a1a1a] border-purple-500/20" data-testid="hashtag-cloud">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-gray-100">
          <Hash className="w-5 h-5 text-purple-400" />
          Recommended Hashtags
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag, index) => (
            <Badge
              key={index}
              variant="outline"
              className="bg-purple-600/10 border-purple-500/30 text-purple-300 hover:bg-purple-600/20 cursor-pointer"
              data-testid={`hashtag-${index}`}
            >
              #{tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
