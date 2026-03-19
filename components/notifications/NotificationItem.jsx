import { useUser } from "@clerk/nextjs";
import { Bell, Heart, MessageCircle, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { Button } from "../ui/button";

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}) {
  const { user } = useUser();

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return <Heart className="size-4 text-error fill-current" />;
      case "comment":
        return <MessageCircle className="size-4 text-primary" />;
      case "follow":
        return <UserPlus className="size-4 text-success" />;
      default:
        return <Bell className="size-4 text-primary" />;
    }
  };

  const getNotificationText = (notification) => {
    const username =
      notification.fromUser?.displayName ||
      notification.fromUser?.username ||
      "Someone";

    switch (notification.type) {
      case "like":
        return `${username} liked your post`;
      case "comment":
        return `${username} commented on your post`;
      case "follow":
        return `${username} started following you`;
      default:
        return "New notification";
    }
  };

  const getNotificationLink = (notification) => {
    if (notification.type === "follow") {
      return `/profile/${notification.fromUser?.username}`;
    }
    if (notification.postId) {
      return `/post/${notification.postId}`;
    }
    return "#";
  };

  return (
    <div
      className="mb-2 block border rounded-lg cursor-pointer"
      onClick={() => {
        if (!notification.isRead && user) {
          onMarkAsRead({
            clerkId: user.id,
            notificationId: notification._id,
          });
        }
      }}
    >
      <div
        className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${!notification.isRead ? "bg-primary/10" : ""}`}
      >
        <div className="relative">
          {notification.fromUser ? (
            <Link href={`/profile/${notification.fromUser.username}`}>
              <Avatar className="size-12">
                <AvatarImage src={notification.fromUser.profilePictureUrl} />
                <AvatarFallback>
                  {notification.fromUser.displayName?.[0]?.toUpperCase() ||
                    notification.fromUser.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <div className="size-12 rounded-full flex items-center justify-center">
              {getNotificationIcon(notification.type)}
            </div>
          )}

          <div className="absolute -bottom-1 -right-1">
            {getNotificationIcon(notification.type)}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <Link href={getNotificationLink(notification)}>
            <div className="text-sm hover:underline">
              {getNotificationText(notification)}
            </div>
          </Link>

          {notification.content && (
            <div className="text-sm truncate mt-1">
              &quot;{notification.content}&quot;
            </div>
          )}

          <div className="text-xs mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </div>
        </div>

        {notification.post && (
          <Link href={`/post/${notification.postId}`}>
            <div className="size-12 shrink-0">
              <Image
                src={notification.post.imageUrl}
                alt="Post"
                width={100}
                height={100}
                className="w-full h-full object-cover rounded"
              />
            </div>
          </Link>
        )}

        <Button
          size="sm"
          variant="primary"
          className="bg-transparent! hover:text-red-500"
          onClick={() => onDelete(notification._id)}
        >
          <Trash2 className="size-4" />
        </Button>

        {!notification.isRead && (
          <div className="size-2 bg-primary rounded-full shrink-0"></div>
        )}
      </div>
    </div>
  );
}
