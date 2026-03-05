"use client";

import { useState } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
<<<<<<< HEAD
import { MessageCircle, Send, Search, ImageIcon } from "lucide-react";
=======
import { MessageCircle, Send, Search } from "lucide-react";
>>>>>>> 697e599776ea0d6408068b79986ceac5159cabba
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
<<<<<<< HEAD
            <div
              key={i}
              className="flex items-center gap-4 p-4 border rounded-lg animate-pulse"
            >
=======
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
>>>>>>> 697e599776ea0d6408068b79986ceac5159cabba
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
<<<<<<< HEAD
          <div className="size-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
            <div className="size-12 bg-text-muted rounded-full flex items-center justify-center">
              <MessageCircle className="size-12 text-muted-foreground" />
            </div>
          </div>
=======
          <MessageCircle className="size-12 mx-auto mb-4 text-text-muted" />
>>>>>>> 697e599776ea0d6408068b79986ceac5159cabba
          <h3 className="text-xl font-semibold mb-2">Your messages</h3>
          <p className="text-text-secondary mb-6">
            Send private photos and messages to a friend or group.
          </p>
<<<<<<< HEAD
          <Link href="/messages/new">
=======
          <Link href="/search">
>>>>>>> 697e599776ea0d6408068b79986ceac5159cabba
            <Button>Send message</Button>
          </Link>
        </div>
      </div>
    );
  }

<<<<<<< HEAD
  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.otherParticipant?.username
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      conversation.otherParticipant?.displayName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()),
=======
  const filteredConversations = conversations.filter(conversation =>
    conversation.otherParticipant?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.otherParticipant?.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
>>>>>>> 697e599776ea0d6408068b79986ceac5159cabba
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messages</h1>
<<<<<<< HEAD

        <Link href="/messages/new">
=======
        <Link href="/search">
>>>>>>> 697e599776ea0d6408068b79986ceac5159cabba
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
<<<<<<< HEAD
            href={`/messages/${conversation?.otherParticipant?.username}`}
=======
            href={`/messages/${conversation.otherParticipant?.username}`}
>>>>>>> 697e599776ea0d6408068b79986ceac5159cabba
          >
            <div className="flex items-center gap-4 p-4 hover:bg-secondary rounded-lg transition-colors">
              <div className="relative">
                <Avatar className="size-12">
<<<<<<< HEAD
                  <AvatarImage
                    src={conversation.otherParticipant?.profilePictureUrl}
                    className="object-cover"
                  />
=======
                  <AvatarImage src={conversation.otherParticipant?.profilePictureUrl} />
>>>>>>> 697e599776ea0d6408068b79986ceac5159cabba
                  <AvatarFallback>
                    {conversation.otherParticipant?.displayName?.[0]?.toUpperCase() ||
                      conversation.otherParticipant?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
<<<<<<< HEAD

=======
>>>>>>> 697e599776ea0d6408068b79986ceac5159cabba
                {conversation.unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center text-xs"
                  >
<<<<<<< HEAD
                    {conversation.unreadCount > 99
                      ? "99+"
                      : conversation.unreadCount}
=======
                    {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
>>>>>>> 697e599776ea0d6408068b79986ceac5159cabba
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
<<<<<<< HEAD
                    {conversation.lastMessage.messageType === "image" ? (
                      <div className="flex items-center gap-1">
                        <ImageIcon className="size-4" />
                        Photo
                      </div>
                    ) : conversation.lastMessage.messageType === "post" ? (
                      "📝 Shared a post"
                    ) : (
                      conversation.lastMessage.content
                    )}
=======
                    {conversation.lastMessage.messageType === "image"
                      ? "📷 Photo"
                      : conversation.lastMessage.messageType === "post"
                      ? "📝 Shared a post"
                      : conversation.lastMessage.content}
>>>>>>> 697e599776ea0d6408068b79986ceac5159cabba
                  </div>
                )}
              </div>

              {conversation.lastMessage && (
                <div className="text-xs text-text-secondary">
<<<<<<< HEAD
                  {formatDistanceToNow(
                    new Date(conversation.lastMessage.createdAt),
                    {
                      addSuffix: true,
                    },
                  )}
=======
                  {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                    addSuffix: true,
                  })}
>>>>>>> 697e599776ea0d6408068b79986ceac5159cabba
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
<<<<<<< HEAD
}
=======
}
>>>>>>> 697e599776ea0d6408068b79986ceac5159cabba
