import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ArrowRight, Check, Send, Loader } from "lucide-react";
import { deleteNotification, markNotificationAsRead, sendChatHistoryNotifications } from "@/lib/notificationService";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

function Notifications() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [sendingHistory, setSendingHistory] = useState(false);

  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const handleSendChatHistory = async () => {
    setSendingHistory(true);
    try {
      const result = await sendChatHistoryNotifications();
      toast({
        title: "Sent!",
        description: `${result.count} notifications sent to your device!`,
      });
      refetch();
    } catch (error) {
      toast({ title: "Error", description: "Failed to send notifications", variant: "destructive" });
    } finally {
      setSendingHistory(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Notifications</h1>
          <Button
            onClick={handleSendChatHistory}
            disabled={sendingHistory}
            className="gap-2"
            data-testid="button-send-chat-history"
          >
            {sendingHistory ? (
              <> <Loader className="w-4 h-4 animate-spin" /> Sending... </>
            ) : (
              <> <Send className="w-4 h-4" /> Send Chat History </>
            )}
          </Button>
        </div>

        <p className="text-gray-400 mb-6">
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
        </p>

        {isLoading ? (
          <Card className="p-8 bg-slate-800/50 border-slate-700">
            <p className="text-gray-400 text-center">Loading...</p>
          </Card>
        ) : notifications.length === 0 ? (
          <Card className="p-12 bg-slate-800/50 border-slate-700 text-center">
            <p className="text-gray-400">No notifications yet. Click "Send Chat History" to get started!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <Card key={n.id} className="p-4 bg-slate-800/50 border-slate-700 hover:border-slate-600">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{n.title}</h3>
                    <p className="text-gray-300 text-sm">{n.message}</p>
                    <Badge className="mt-2 capitalize">{n.type.replace("_", " ")}</Badge>
                  </div>
                  <div className="flex gap-2">
                    {!n.read && (
                      <Button size="icon" variant="ghost" onClick={() => readMutation.mutate(n.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    {n.actionUrl && (
                      <Button size="icon" variant="ghost" onClick={() => navigate(n.actionUrl!)}>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(n.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
