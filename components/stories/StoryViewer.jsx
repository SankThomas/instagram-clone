"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Send,
  Eye,
  Smile,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function StoryViewer({ userStories, onClose }) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [messageText, setMessageText] = useState("");

  const { user } = useUser();
  const viewStory = useMutation(api.stories.viewStory);
  const reactToStory = useMutation(api.stories.reactToStory);
  const sendMessage = useMutation(api.messages.sendMessage);

  const currentStory = userStories.stories[currentStoryIndex];
  const isOwnStory = user && userStories.user._id === user.id;

  const storyViewers = useQuery(
    api.stories.getStoryViewers,
    isOwnStory && currentStory
      ? { storyId: currentStory._id, clerkId: user.id }
      : "skip",
  );

  const storyReactions = useQuery(
    api.stories.getStoryReactions,
    isOwnStory && currentStory
      ? { storyId: currentStory._id, clerkId: user.id }
      : "skip",
  );

  useEffect(() => {
    if (!currentStory || isPaused) return;

    // Mark story as viewed
    if (user && !currentStory.hasViewed) {
      viewStory({ clerkId: user.id, storyId: currentStory._id });
    }

    const duration = currentStory.mediaType === "video" ? 15000 : 5000; // 15s for video, 5s for image
    const interval = 50; // Update every 50ms
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          // Move to next story
          if (currentStoryIndex < userStories.stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
            return 0;
          } else {
            // Close viewer when all stories are done
            onClose();
            return 100;
          }
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentStory, currentStoryIndex, userStories.stories.length, isPaused, user, viewStory, onClose]);

  const nextStory = () => {
    if (currentStoryIndex < userStories.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    }
  };

  const handleReaction = async (reaction) => {
    if (!user || !currentStory) return;
    try {
      await reactToStory({
        clerkId: user.id,
        storyId: currentStory._id,
        reaction,
      });
      toast.success("Reaction sent!");
      setShowReactions(false);
    } catch (error) {
      toast.error("Failed to send reaction");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !user) return;

    try {
      await sendMessage({
        clerkId: user.id,
        receiverId: userStories.user._id,
        content: messageText.trim(),
        messageType: "text",
      });
      setMessageText("");
      toast.success("Message sent!");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  if (!currentStory) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[90vh] p-0 bg-black">
        <div className="relative w-full h-full">
          {/* Progress bars */}
          <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
            {userStories.stories.map((_, index) => (
              <div
                key={index}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-100"
                  style={{
                    width:
                      index < currentStoryIndex
                        ? "100%"
                        : index === currentStoryIndex
                          ? `${progress}%`
                          : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-6 left-4 right-4 z-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarImage src={userStories.user.profilePictureUrl} />
                <AvatarFallback>
                  {userStories.user.displayName?.[0]?.toUpperCase() ||
                    userStories.user.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-white font-semibold text-sm">
                  {userStories.user.username}
                </div>
                <div className="text-white/80 text-xs">
                  {formatDistanceToNow(new Date(currentStory.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwnStory && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={() => setShowReactions(!showReactions)}
                >
                  <Eye className="size-4" />
                  {storyViewers?.length || 0}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Story content */}
          <div
            className="w-full h-full cursor-pointer"
            onClick={() => setIsPaused(!isPaused)}
          >
            {currentStory.mediaType === "video" ? (
              <video
                src={currentStory.videoUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
              />
            ) : (
              <Image
                src={currentStory.imageUrl}
                alt="Story"
                fill
                className="object-cover"
              />
            )}
          </div>

          {/* Navigation areas */}
          <div
            className="absolute left-0 top-0 w-1/3 h-full z-10 cursor-pointer"
            onClick={prevStory}
          />
          <div
            className="absolute right-0 top-0 w-1/3 h-full z-10 cursor-pointer"
            onClick={nextStory}
          />

          {/* Caption */}
          {currentStory.caption && (
            <div className="absolute bottom-20 left-4 right-4 z-20">
              <div className="bg-black/50 rounded-lg p-3">
                <p className="text-white text-sm">{currentStory.caption}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          {!isOwnStory && (
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setShowReactions(!showReactions)}
              >
                <Smile className="size-5" />
              </Button>

              <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
                <Input
                  placeholder="Send message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  disabled={!messageText.trim()}
                >
                  <Send className="size-4" />
                </Button>
              </form>
            </div>
          )}

          {/* Reactions panel */}
          {showReactions && (
            <div className="absolute bottom-16 left-4 right-4 z-30">
              {isOwnStory ? (
                <div className="bg-black/80 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <h3 className="text-white font-semibold mb-3">
                    Views ({storyViewers?.length || 0})
                  </h3>
                  {storyViewers?.map((view) => (
                    <div key={view._id} className="flex items-center gap-3 mb-2">
                      <Avatar className="size-6">
                        <AvatarImage src={view.user.profilePictureUrl} />
                        <AvatarFallback className="text-xs">
                          {view.user.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white text-sm">
                        {view.user.username}
                      </span>
                    </div>
                  ))}
                  {storyReactions?.length > 0 && (
                    <>
                      <h3 className="text-white font-semibold mb-3 mt-4">
                        Reactions
                      </h3>
                      {storyReactions.map((reaction) => (
                        <div key={reaction._id} className="flex items-center gap-3 mb-2">
                          <Avatar className="size-6">
                            <AvatarImage src={reaction.user.profilePictureUrl} />
                            <AvatarFallback className="text-xs">
                              {reaction.user.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white text-sm">
                            {reaction.user.username}
                          </span>
                          <span className="text-lg">{reaction.reaction}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-black/80 rounded-lg p-4">
                  <div className="flex gap-3 justify-center">
                    {["❤️", "😂", "😮", "😢", "😡", "👍"].map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="text-2xl hover:bg-white/20"
                        onClick={() => handleReaction(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation arrows */}
          {currentStoryIndex > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20"
              onClick={prevStory}
            >
              <ChevronLeft className="size-6" />
            </Button>
          )}

          {currentStoryIndex < userStories.stories.length - 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20"
              onClick={nextStory}
            >
              <ChevronRight className="size-6" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}