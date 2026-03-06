"use client";

import { useState } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Search, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function MessagesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useUser();

  const {
    results: conversations,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.messages.getConversations,
    user ? { clerkId: user.id } : "skip",
    { initialNumItems: 20 },
  );

  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 border rounded-lg animate-pulse"
            >
              <div className="size-12 bg-secondary rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="w-32 h-4 bg-secondary rounded"></div>
                <div className="w-48 h-3 bg-secondary rounded"></div>
              </div>
              <div className="w-16 h-3 bg-secondary rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <div className="text-center py-12">
          <div className="size-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
            <div className="size-12 bg-text-muted rounded-full flex items-center justify-center">
              <MessageCircle className="size-12 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Your messages</h3>
          <p className="text-text-secondary mb-6">
            Send private photos and messages to a friend or group.
          </p>
          <Link href="/messages/new">
            <Button>Send message</Button>
          </Link>
        </div>
      </div>
    );
  }

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.otherParticipant?.username
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      conversation.otherParticipant?.displayName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messages</h1>

        <Link href="/messages/new">
          <Button size="sm">
            <Send className="size-4 mr-2" />
            New message
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-text-secondary" />
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Conversations */}
      <div className="space-y-2">
        {filteredConversations.map((conversation) => (
          <Link
            key={conversation._id}
            href={`/messages/${conversation?.otherParticipant?.username}`}
          >
            <div className="flex items-center gap-4 p-4 hover:bg-secondary rounded-lg transition-colors">
              <div className="relative">
                <Avatar className="size-12">
                  <AvatarImage
                    src={conversation.otherParticipant?.profilePictureUrl}
                    className="object-cover"
                  />
                  <AvatarFallback>
                    {conversation.otherParticipant?.displayName?.[0]?.toUpperCase() ||
                      conversation.otherParticipant?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {conversation.unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center text-xs"
                  >
                    {conversation.unreadCount > 99
                      ? "99+"
                      : conversation.unreadCount}
                  </Badge>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">
                  {conversation.otherParticipant?.displayName ||
                    conversation.otherParticipant?.username}
                </div>
                {conversation.lastMessage && (
                  <div className="text-sm text-text-secondary truncate">
                    {conversation.lastMessage.messageType === "image" ? (
                      <div className="flex items-center gap-1">
                        <ImageIcon className="size-4" />
                        Photo
                      </div>
                    ) : conversation.lastMessage.messageType === "post" ? (
                      "📝 Shared a post"
                    ) : message.messageType === "video" ? (
                      <div className="flex items-center gap-1">
                        <div>🎥</div>
                        Video
                      </div>
                    ) : (
                      conversation.lastMessage.content
                    )}
                  </div>
                )}
              </div>

              {conversation.lastMessage && (
                <div className="text-xs text-text-secondary">
                  {formatDistanceToNow(
                    new Date(conversation.lastMessage.createdAt),
                    {
                      addSuffix: true,
                    },
                  )}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {status === "CanLoadMore" && (
        <div className="text-center mt-8">
          <Button onClick={() => loadMore(20)} variant="outline">
            Load more conversations
          </Button>
        </div>
      )}
    </div>
  );
}
