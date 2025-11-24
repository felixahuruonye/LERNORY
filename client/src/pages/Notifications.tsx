import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ArrowRight, Check } from "lucide-react";
import { deleteNotification, markNotificationAsRead } from "@/lib/notificationService";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

export default function Notifications() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Mark as read mutation
  const readMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string): string => {
    const icons: Record<string, string> = {
      chat: "💬",
      motivation: "💪",
      achievement: "🏆",
      reminder: "⏰",
      exam: "📝",
      study_plan: "📅",
      system: "⚙️",
    };
    return icons[type] || "🔔";
  };

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      chat: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      motivation: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      achievement: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      reminder: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      exam: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      study_plan: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      system: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    return colors[type] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await readMutation.mutateAsync(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🔔</span>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Notifications</h1>
          </div>
          <p className="text-gray-400">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>

        {isLoading ? (
          <Card className="p-8 text-center bg-slate-800/50 border-slate-700">
            <p className="text-gray-400">Loading notifications...</p>
          </Card>
        ) : notifications.length === 0 ? (
          <Card className="p-12 text-center bg-slate-800/50 border-slate-700">
            <p className="text-gray-400 text-lg mb-4">No notifications yet</p>
            <p className="text-gray-500">Check back later for updates on your learning progress!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 cursor-pointer transition-all border ${
                  notification.read
                    ? "bg-slate-800/30 border-slate-700 hover:border-slate-600"
                    : "bg-slate-700/50 border-slate-600 hover:border-slate-500 ring-1 ring-slate-600"
                }`}
                onClick={() => handleNotificationClick(notification)}
                data-testid={`notification-card-${notification.id}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon and Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <h3 className="text-lg font-semibold text-white truncate">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{notification.message}</p>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getTypeColor(notification.type)} capitalize text-xs`}>
                        {notification.type.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString()} at{" "}
                        {new Date(notification.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    {!notification.read && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          readMutation.mutate(notification.id);
                        }}
                        data-testid={`button-mark-read-${notification.id}`}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    {notification.actionUrl && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(notification.actionUrl!);
                        }}
                        data-testid={`button-navigate-${notification.id}`}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(notification.id);
                      }}
                      data-testid={`button-delete-${notification.id}`}
                    >
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
