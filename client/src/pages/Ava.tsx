import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, Send, Paperclip, FileText } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ChatBubble } from "@/components/ava/ChatBubble";
import { QuickActions } from "@/components/ava/QuickActions";
import { FormatCards } from "@/components/ava/FormatCards";
import { ScriptCard } from "@/components/ava/ScriptCard";
import { CaptionCards } from "@/components/ava/CaptionCards";
import { HookCards } from "@/components/ava/HookCards";
import { HashtagCloud } from "@/components/ava/HashtagCloud";
import { IdeaCards } from "@/components/ava/IdeaCards";
import { AnalysisCard } from "@/components/ava/AnalysisCard";

interface Message {
  role: "user" | "assistant";
  content: string;
  cardType?: string;
  cardData?: any;
}

export default function Ava() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<string>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock active brand brief and format for context display
  const activeBrief = "Fitness Brand 2024";

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/ava/message", {
        message,
        context: {
          brandBrief: activeBrief,
          format: selectedFormat,
        },
      });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          cardType: data.cardType,
          cardData: data.cardData,
        },
      ]);
    },
  });

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMessageMutation.isPending) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    sendMessageMutation.mutate(trimmed);
  };

  const handleQuickAction = (action: string) => {
    setMessages((prev) => [...prev, { role: "user", content: action }]);
    sendMessageMutation.mutate(action);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const renderCard = (cardType: string, cardData: any) => {
    switch (cardType) {
      case "formats":
        return (
          <FormatCards
            selectedFormat={selectedFormat}
            onFormatSelect={(format) => {
              setSelectedFormat(format);
              setMessages((prev) => [
                ...prev,
                { role: "user", content: `Selected format: ${format}` },
              ]);
            }}
          />
        );
      case "script":
        return <ScriptCard sections={cardData.sections} />;
      case "captions":
        return <CaptionCards captions={cardData.captions} />;
      case "hooks":
        return <HookCards hooks={cardData.hooks} />;
      case "hashtags":
        return <HashtagCloud hashtags={cardData.hashtags} />;
      case "ideas":
        return <IdeaCards ideas={cardData.ideas} onCreateIdea={(idea) => {
          setMessages((prev) => [
            ...prev,
            { role: "user", content: `Create content: ${idea.title}` },
          ]);
          sendMessageMutation.mutate(`Create content about: ${idea.title}`);
        }} />;
      case "analysis":
        return <AnalysisCard metrics={cardData.metrics} insights={cardData.insights} />;
      default:
        return null;
    }
  };

  return (
    <Layout title="Ava - AI Content Assistant">
      <div className="h-[calc(100vh-8rem)] flex flex-col bg-[#0a0a0a] rounded-lg border border-purple-500/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                <Sparkles className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-bold text-lg text-gray-100" data-testid="ava-title">Ava</h2>
              <p className="text-xs text-gray-400">AI Content Assistant</p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <ScrollArea className="flex-1 p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-8" data-testid="empty-state">
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                    <Sparkles className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <p className="text-gray-300 text-lg font-medium mb-2">
                  Hey! I'm Ava, your AI content assistant.
                </p>
                <p className="text-gray-500 text-sm">
                  Choose a quick action below or ask me anything
                </p>
              </div>
              <QuickActions onActionClick={handleQuickAction} />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index}>
                  <ChatBubble role={msg.role} content={msg.content} />
                  {msg.cardType && msg.cardData && (
                    <div className="ml-11 mt-3">
                      {renderCard(msg.cardType, msg.cardData)}
                    </div>
                  )}
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-purple-500/20 bg-[#0a0a0a] p-4">
          {/* Context Pills */}
          {(activeBrief || selectedFormat) && (
            <div className="flex gap-2 mb-3">
              {activeBrief && (
                <Badge
                  variant="outline"
                  className="bg-purple-600/10 border-purple-500/30 text-purple-300"
                  data-testid="context-brief"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  {activeBrief}
                </Badge>
              )}
              {selectedFormat && (
                <Badge
                  variant="outline"
                  className="bg-blue-600/10 border-blue-500/30 text-blue-300"
                  data-testid="context-format"
                >
                  {selectedFormat}
                </Badge>
              )}
            </div>
          )}

          {/* Input Bar */}
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              className="shrink-0 border-purple-500/30 hover:bg-purple-600/20"
              data-testid="button-attach"
            >
              <Paperclip className="h-4 w-4 text-gray-400" />
            </Button>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Ava anything..."
              className="flex-1 bg-[#1a1a1a] border-purple-500/20 text-gray-100 placeholder:text-gray-500 focus-visible:ring-purple-500"
              disabled={sendMessageMutation.isPending}
              data-testid="input-message"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendMessageMutation.isPending}
              className="shrink-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              data-testid="button-send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
