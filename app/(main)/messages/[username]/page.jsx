"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Image as ImageIcon, Smile } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";

export default function ChatPage() {
  const { username } = useParams();
  const [messageText, setMessageText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { user } = useUser();

  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip",
  );
  const otherUser = useQuery(api.users.getUserByUsername, { username });
  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markMessagesAsRead);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const {
    results: messages,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.messages.getMessages,
    otherUser && user
      ? { clerkId: user.id, otherUserId: otherUser._id }
      : "skip",
    { initialNumItems: 50 },
  );

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (otherUser && user) {
      markAsRead({ clerkId: user.id, otherUserId: otherUser._id });
    }
  }, [otherUser, user, markAsRead]);

  const uploadFile = async (file) => {
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.status}`);
      }

      const { storageId } = await result.json();
      return storageId;
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error("Failed to upload image");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !otherUser || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await sendMessage({
        clerkId: user.id,
        receiverId: otherUser._id,
        content: messageText.trim(),
        messageType: "text",
      });
      setMessageText("");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !otherUser || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    try {
      const imageId = await uploadFile(file);
      await sendMessage({
        clerkId: user.id,
        receiverId: otherUser._id,
        content: "📷 Photo",
        messageType: "image",
        imageId,
      });
      toast.success("Image sent!");
    } catch (error) {
      toast.error("Failed to send image");
    }
  };

  if (!otherUser) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">User not found</h2>
        <p className="text-text-secondary">
          The user you are trying to message does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-1rem)]">
      <div className="flex items-center gap-4 p-4 border-b">
        <Link href="/messages">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>

        <Link
          href={`/profile/${otherUser.username}`}
          className="flex items-center gap-2"
        >
          <Avatar className="size-10">
            <AvatarImage src={otherUser.profilePictureUrl} />
            <AvatarFallback>
              {otherUser.displayName?.[0]?.toUpperCase() ||
                otherUser.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="font-semibold">
              {otherUser.displayName || otherUser.username}
            </div>
            <div className="text-sm text-text-secondary">
              @{otherUser.username}
            </div>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {status === "LoadingFirstPage" ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="size-8 bg-secondary rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="w-48 h-4 bg-secondary rounded"></div>
                  <div className="w-32 h-3 bg-secondary rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {status === "CanLoadMore" && (
              <div className="text-center">
                <Button
                  onClick={() => loadMore(50)}
                  variant="outline"
                  size="sm"
                >
                  Load older messages
                </Button>
              </div>
            )}

            {messages?.map((message) => {
              const isOwn = message.sender._id === currentUser?._id;

              return (
                <div
                  key={message._id}
                  className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="size-8">
                    <AvatarImage src={message.sender.profilePictureUrl} />
                    <AvatarFallback>
                      {message.sender.displayName?.[0]?.toUpperCase() ||
                        message.sender.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`flex-1 max-w-xs ${isOwn ? "ml-auto text-right" : ""}`}
                  >
                    <div
                      className={`inline-block p-3 rounded-2xl ${isOwn ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                    >
                      {message.messageType === "image" ? (
                        <div className="relative size-48">
                          <Image
                            src={message.imageUrl}
                            alt="Shared image"
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Messages input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="size-5" />
          </Button>

          <Input
            placeholder="Your message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-1"
          />

          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !messageText.trim()}
          >
            <Send className="size-4" />
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </form>
    </div>
  );
}
