import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, Zap, Send } from "lucide-react";

interface DebugMessage {
  type: "user" | "ai";
  content: string;
}

export default function WebsiteDebug() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [debugPrompt, setDebugPrompt] = useState("");
  const [debugHistory, setDebugHistory] = useState<DebugMessage[]>([]);
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null);

  // Fetch website
  const { data: website, isLoading } = useQuery({
    queryKey: ["/api/websites", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/websites/${id}`);
      return res.json();
    },
    enabled: !!id,
  });

  // Debug mutation
  const debugMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest("POST", `/api/websites/${id}/debug`, { debugPrompt: prompt });
      return res.json();
    },
    onSuccess: (data) => {
      setDebugHistory((prev) => [...prev, { type: "ai", content: data.suggestion }]);
      setDebugPrompt("");
      // Auto-scroll
      setTimeout(() => {
        if (scrollRef) {
          scrollRef.scrollTop = scrollRef.scrollHeight;
        }
      }, 100);
    },
    onError: (error: any) => {
      const message = error?.message || error?.error || "Failed to get suggestion";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!debugPrompt.trim()) return;

    setDebugHistory((prev) => [...prev, { type: "user", content: debugPrompt }]);
    debugMutation.mutate(debugPrompt);
  };

  const handleClearHistory = () => {
    setDebugHistory([]);
    setDebugPrompt("");
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center text-muted-foreground">
            <p>Website not found</p>
            <Button variant="outline" className="mt-4" onClick={() => setLocation("/website-generator")}>
              Back to Generator
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/website-generator")}
              data-testid="button-back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-center flex-1">Debug Mode</h1>
            <div className="w-10" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {isLoading ? (
          <Card className="p-12 text-center flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          </Card>
        ) : (
          <div className="flex flex-col gap-4 flex-1">
            {/* Website Info */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-1">{website?.title}</h2>
              <p className="text-sm text-muted-foreground">{website?.description}</p>
            </Card>

            {/* Debug Chat Area */}
            <Card className="flex-1 flex flex-col overflow-hidden">
              {/* Chat Messages */}
              <div
                ref={setScrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
                data-testid="debug-messages-container"
              >
                {debugHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                    <div>
                      <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Ask LEARNORY AI to help debug or improve your code</p>
                      <p className="text-xs mt-2">Examples: "Add a button click handler", "Make the text responsive", "Fix the layout issue"</p>
                    </div>
                  </div>
                ) : (
                  debugHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                      data-testid={`debug-message-${idx}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {debugMutation.isPending && (
                  <div className="flex gap-3 justify-start">
                    <div className="bg-muted p-3 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t p-4 space-y-3">
                <Textarea
                  placeholder="Ask LEARNORY to help debug, fix issues, or improve your code..."
                  value={debugPrompt}
                  onChange={(e) => setDebugPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) {
                      handleSubmit();
                    }
                  }}
                  className="resize-none min-h-[80px]"
                  data-testid="input-debug-prompt"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={!debugPrompt.trim() || debugMutation.isPending}
                    className="flex-1 hover-elevate active-elevate-2"
                    data-testid="button-submit-debug"
                  >
                    {debugMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Getting Suggestion...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Ask LEARNORY
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClearHistory}
                    disabled={debugHistory.length === 0}
                    className="hover-elevate active-elevate-2"
                    data-testid="button-clear-history"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
