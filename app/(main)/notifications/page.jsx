"use client";

import NotificationItem from "@/components/notifications/NotificationItem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { Bell } from "lucide-react";
import { NotificationSkeleton } from "@/components/ui/LoadingSkeleton";
import { toast } from "sonner";

export default function NotificationsPage() {
  const { user } = useUser();
  const {
    results: notifications,
    status,
    // loadMore,
  } = usePaginatedQuery(
    api.notifications.getNotifications,
    user ? { clerkId: user.id } : "skip",
    { initialNumItems: 20 },
  );

  const unreadCount = useQuery(
    api.notifications.getUnreadNotificationCount,
    user ? { clerkId: user.id } : "skip",
  );
  const markAsRead = useMutation(api.notifications.markNotificationAsRead);
  const markAllAsRead = useMutation(
    api.notifications.markAllNotificationsAsRead,
  );
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const handleDeleteNotification = async (id) => {
    try {
      if (!user || !id) return;

      await deleteNotification({
        clerkId: user.id,
        notificationId: id,
      });

      toast.success("Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error(
        "An error occurred when trying to delete this notification. Please try again later.",
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await markAllAsRead({ clerkId: user.id });
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="size-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
          <Bell className="size-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No notifications yet</h3>
        <p className="text-primary">
          When someone likes your posts or follows you, you will see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Notifications{" "}
          <Badge variant="destructive" className="size-5 p-0 text-xs">
            {unreadCount}
          </Badge>
        </h1>
        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
          Mark all as read
        </Button>
      </div>

      <div className="space-y-1">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification._id}
            notification={notification}
            onMarkAsRead={markAsRead}
            onDelete={handleDeleteNotification}
          />
        ))}
      </div>
    </div>
  );
}
