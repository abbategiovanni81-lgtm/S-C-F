import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Loader2, User } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import avaAvatar from "@assets/generated_images/hybrid_ai_human_avatar.png";
import { ResponsiveTooltip } from "@/components/ui/responsive-tooltip";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function formatChatMessage(text: string): React.ReactNode {
  const lines = text.split(/\n+/);
  
  return lines.map((line, lineIndex) => {
    let formatted = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-200 dark:bg-slate-700 px-1 rounded text-xs">$1</code>');
    
    const numberedMatch = line.match(/^(\d+)\.\s*\*\*(.*?)\*\*:?\s*(.*)/);
    if (numberedMatch) {
      return (
        <div key={lineIndex} className="mb-2">
          <div className="font-semibold text-primary">{numberedMatch[1]}. {numberedMatch[2]}</div>
          {numberedMatch[3] && <div className="ml-4 text-muted-foreground">{numberedMatch[3]}</div>}
        </div>
      );
    }
    
    const bulletMatch = line.match(/^[-•]\s*(.*)/);
    if (bulletMatch) {
      return (
        <div key={lineIndex} className="ml-2 mb-1 flex gap-1">
          <span>•</span>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
        </div>
      );
    }
    
    if (line.trim()) {
      return (
        <p key={lineIndex} className="mb-2" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    }
    return null;
  });
}

export function HelpChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey! I'm Ava, your AI guide to SocialCommand. Ask me anything - how to create content, which tools to use, tips for your niche, or any platform questions!",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/help-chat", {
        message,
        history: messages,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I had trouble responding. Please try again." },
      ]);
    },
  });

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    chatMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <>
      {!isOpen && (
        <ResponsiveTooltip content="Chat with Ava">
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 overflow-hidden border-2 border-primary hover:scale-105 transition-transform"
            data-testid="button-open-help-chat"
          >
            <img src={avaAvatar} alt="Ask Ava" className="w-full h-full object-cover" />
          </button>
        </ResponsiveTooltip>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[380px] h-[500px] shadow-2xl z-50 flex flex-col overflow-hidden" data-testid="help-chat-panel">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <CardTitle className="text-base flex items-center gap-2">
              <img src={avaAvatar} alt="Ava" className="h-7 w-7 rounded-full object-cover" />
              Ask Ava
            </CardTitle>
            <ResponsiveTooltip content="Close chat">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-help-chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </ResponsiveTooltip>
          </CardHeader>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                      <img src={avaAvatar} alt="Ava" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                    data-testid={`message-${msg.role}-${i}`}
                  >
                    {msg.role === "assistant" ? formatChatMessage(msg.content) : msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                    <img src={avaAvatar} alt="Ava" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <CardContent className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1"
                disabled={chatMutation.isPending}
                data-testid="input-help-chat"
              />
              <ResponsiveTooltip content="Send message">
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || chatMutation.isPending}
                  size="icon"
                  data-testid="button-send-help-chat"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </ResponsiveTooltip>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
