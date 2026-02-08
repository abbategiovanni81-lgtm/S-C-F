import { Layout } from "@/components/layout/Layout";
import { AvaChat } from "@/components/AvaChat";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const DEMO_USER_ID = "demo-user";

interface Session {
  id: string;
  userId: string;
  title: string;
  status: string;
  updatedAt: string;
  createdAt: string;
}

export default function Ava() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Fetch all sessions
  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: [`/api/ava/sessions?userId=${DEMO_USER_ID}`],
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ava/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: DEMO_USER_ID, title: "New Conversation" }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create session");
      return response.json();
    },
    onSuccess: (newSession) => {
      setActiveSessionId(newSession.id);
      toast.success("New conversation started!");
    },
    onError: (error) => {
      console.error("Error creating session:", error);
      toast.error("Failed to create new conversation");
    },
  });

  // Auto-select first session or create new one if none exist
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    } else if (!activeSessionId && sessions.length === 0 && !createSessionMutation.isPending) {
      createSessionMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, activeSessionId]);

  const handleNewChat = () => {
    createSessionMutation.mutate();
  };

  return (
    <Layout title="Ava - AI Content Assistant">
      <div className="flex h-[calc(100vh-4rem)] gap-4">
        {/* Sidebar - Sessions List */}
        <div className="w-64 border-r bg-card rounded-lg p-4 space-y-3">
          <Button 
            onClick={handleNewChat}
            className="w-full gap-2"
            disabled={createSessionMutation.isPending}
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>

          <div className="space-y-2">
            {sessions.map((session: Session) => (
              <Card
                key={session.id}
                className={`cursor-pointer transition-colors ${
                  activeSessionId === session.id
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setActiveSessionId(session.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {session.title || "Untitled"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 bg-card rounded-lg overflow-hidden">
          {activeSessionId ? (
            <AvaChat sessionId={activeSessionId} userId={DEMO_USER_ID} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Creating your chat session...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
