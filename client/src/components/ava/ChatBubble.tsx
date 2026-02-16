import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: React.ReactNode;
  showAvatar?: boolean;
}

export function ChatBubble({ role, content, showAvatar = true }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
      data-testid={`chat-bubble-${role}`}
    >
      {!isUser && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-purple-600/20 text-purple-400">
            A
          </AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={cn(
          "rounded-2xl px-4 py-3 max-w-[80%] text-sm",
          isUser
            ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white"
            : "bg-[#1a1a1a] text-gray-100 border border-purple-500/20"
        )}
      >
        {content}
      </div>
      
      {isUser && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-blue-600">
            <User className="h-4 w-4 text-white" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
