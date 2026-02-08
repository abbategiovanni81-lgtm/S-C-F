import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Sparkles, User } from "lucide-react";
import { ContentPlanCard } from "./ava/ContentPlanCard";
import { ProgressCard } from "./ava/ProgressCard";
import { PreviewCard } from "./ava/PreviewCard";
import { ScheduleCard } from "./ava/ScheduleCard";
import { toast } from "sonner";

interface Message {
  id: string;
  role: string;
  messageType: string;
  content: string;
  metadata?: any;
  createdAt: string;
}

interface AvaChatProps {
  sessionId: string;
  userId: string;
}

export function AvaChat({ sessionId, userId }: AvaChatProps) {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch session and messages
  const { data: sessionData } = useQuery({
    queryKey: [`/api/ava/sessions/${sessionId}`],
    refetchInterval: 3000, // Poll every 3 seconds
  });

  const messages: Message[] = sessionData?.messages || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/ava/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ava/sessions/${sessionId}`] });
      setInput("");
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    },
    onSettled: () => {
      setIsTyping(false);
    },
  });

  // Approve plan mutation
  const approvePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch(`/api/ava/plans/${planId}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to approve plan");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Plan approved! Generation will begin shortly.");
      queryClient.invalidateQueries({ queryKey: [`/api/ava/sessions/${sessionId}`] });
    },
    onError: (error) => {
      console.error("Error approving plan:", error);
      toast.error("Failed to approve plan");
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessageMutation.mutate(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === "user";
    const isAssistant = message.role === "assistant";

    return (
      <div
        key={message.id}
        className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
      >
        <Avatar className="w-8 h-8">
          <AvatarFallback className={isUser ? "bg-primary text-primary-foreground" : "bg-purple-500 text-white"}>
            {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </AvatarFallback>
        </Avatar>

        <div className={`flex-1 max-w-[80%] ${isUser ? "flex justify-end" : ""}`}>
          {message.messageType === "text" && (
            <div
              className={`rounded-lg px-4 py-3 ${
                isUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          )}

          {message.messageType === "content_plan" && message.metadata?.plan && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{message.content}</p>
              <ContentPlanCard
                plan={{
                  id: message.metadata.planId,
                  contentType: message.metadata.plan.contentType || "unknown",
                  status: "draft",
                  planData: message.metadata.plan,
                }}
                onApprove={() => approvePlanMutation.mutate(message.metadata.planId)}
                onEdit={() => toast.info("Edit functionality coming soon!")}
              />
            </div>
          )}

          {message.messageType === "progress" && message.metadata && (
            <ProgressCard
              stage={message.metadata.stage || "Processing"}
              progress={message.metadata.progress || 0}
              message={message.metadata.message}
            />
          )}

          {message.messageType === "preview" && message.metadata && (
            <PreviewCard
              contentType={message.metadata.contentType}
              previewUrl={message.metadata.previewUrl}
              previewData={message.metadata.previewData}
              onOpenEditor={() => toast.info("Editor integration coming soon!")}
            />
          )}

          {message.messageType === "schedule" && (
            <ScheduleCard
              onSchedule={(date, time) => {
                toast.success(`Scheduled for ${date.toLocaleDateString()} at ${time}`);
              }}
              onAddToQueue={() => {
                toast.success("Added to content queue!");
              }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-6 max-w-5xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Hi! I'm Ava</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                I'm here to help you create amazing content from scratch. Tell me what you'd like to create, 
                and I'll guide you through the entire process!
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setInput("Create a 30-second reel about fitness tips")}>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">Create a Reel</p>
                    <p className="text-xs text-muted-foreground">Generate short-form video content</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setInput("Make a carousel post with 5 slides about healthy eating")}>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">Create a Carousel</p>
                    <p className="text-xs text-muted-foreground">Multi-slide Instagram post</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setInput("Write a blog post about remote work productivity")}>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">Write a Blog Post</p>
                    <p className="text-xs text-muted-foreground">Long-form content article</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setInput("Generate a caption for my product launch")}>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">Generate a Caption</p>
                    <p className="text-xs text-muted-foreground">Engaging social media captions</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {messages.map(renderMessage)}

          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-purple-500 text-white">
                  <Sparkles className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="max-w-5xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell Ava what you want to create..."
            disabled={isTyping}
            className="flex-1"
          />
          <Button 
            onClick={handleSend} 
            disabled={isTyping || !input.trim()}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
