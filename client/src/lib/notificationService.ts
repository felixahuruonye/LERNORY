// Notification Service
// Handles browser push notifications and local storage

export interface PushNotification {
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  badge?: string;
  tag?: string;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Send a push notification to user device
 */
export function sendPushNotification(notification: PushNotification): void {
  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted");
    return;
  }

  const n = new Notification(notification.title, {
    body: notification.message,
    icon: notification.icon || "🔔",
    badge: notification.badge || "🔔",
    tag: notification.tag || "learnory-notification",
    requireInteraction: false,
  });

  // Handle notification click
  n.onclick = () => {
    window.focus();
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    n.close();
  };
}

/**
 * Get all notifications from backend
 */
export async function getNotifications(): Promise<any[]> {
  try {
    const response = await fetch("/api/notifications", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to fetch notifications");
    return await response.json();
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to mark notification as read");
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to delete notification");
  } catch (error) {
    console.error("Error deleting notification:", error);
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const notifications = await getNotifications();
    return notifications.filter((n: any) => !n.read).length;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
}

/**
 * Create a notification through backend and send push
 */
export async function createAndSendNotification(data: {
  type: string;
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
}): Promise<void> {
  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Failed to create notification");

    // Send push notification to device
    if (Notification.permission === "granted") {
      sendPushNotification({
        title: data.title,
        message: data.message,
        icon: data.icon || "🔔",
        actionUrl: data.actionUrl,
      });
    }
  } catch (error) {
    console.error("Error creating and sending notification:", error);
  }
}

/**
 * Send device notifications for all previous chat history
 */
export async function sendChatHistoryNotifications(): Promise<{ count: number; message: string }> {
  try {
    // First request notification permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn("Notification permission not granted");
      return { count: 0, message: "Notification permission denied" };
    }

    // Call backend to create notifications for all chats
    const response = await fetch("/api/notifications/send-chat-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to send chat history notifications");
    
    const data = await response.json();
    
    // Send push notifications for each chat (with delay to not overwhelm)
    if (data.count > 0) {
      for (let i = 0; i < data.sessions.length; i++) {
        setTimeout(() => {
          const session = data.sessions[i];
          if (Notification.permission === "granted") {
            new Notification(session.title || "Previous Chat", {
              body: `From ${new Date(session.createdAt).toLocaleDateString()} - Click to view`,
              icon: "💬",
              tag: `chat-history-${session.id}`,
              requireInteraction: true,
            }).onclick = () => {
              window.location.href = `/chat?sessionId=${session.id}`;
            };
          }
        }, i * 500); // 500ms delay between notifications
      }
    }

    return { count: data.count, message: data.message };
  } catch (error) {
    console.error("Error sending chat history notifications:", error);
    return { count: 0, message: "Failed to send notifications" };
  }
}
