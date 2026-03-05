"use client";

import { useState } from "react";
import { usePaginatedQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import {
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  Play,
  Pause,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useMutation } from "convex/react";
import { toast } from "sonner";

export default function ReelsPage() {
  const [playingVideo, setPlayingVideo] = useState(null);
  const { user } = useUser();

  const {
    results: reels,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.reels.getReelsPosts,
    { clerkId: user?.id },
    { initialNumItems: 10 },
  );

  const toggleLike = useMutation(api.posts.toggleLike);
  const toggleSave = useMutation(api.posts.toggleSavePost);

  const handleLike = async (postId) => {
    if (!user) return;
    try {
      await toggleLike({ clerkId: user.id, postId });
    } catch (error) {
      toast.error("Failed to update like");
    }
  };

  const handleSave = async (postId) => {
    if (!user) return;
    try {
      await toggleSave({ clerkId: user.id, postId });
    } catch (error) {
      toast.error("Failed to update save status");
    }
  };

  const togglePlay = (videoId) => {
    const video = document.getElementById(`video-${videoId}`);
    if (video) {
      if (video.paused) {
        video.play();
        setPlayingVideo(videoId);
      } else {
        video.pause();
        setPlayingVideo(null);
      }
    }
  };

  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reels</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="aspect-9/16 max-w-sm mx-auto bg-secondary animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!reels || reels.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reels</h1>
        <div className="text-center py-12">
          <div className="size-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
            <div className="size-12 bg-text-muted rounded-full flex items-center justify-center">
              <Play className="size-12 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">No reels yet</h3>
          <p className="text-text-secondary">
            Video posts will appear here as reels.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reels</h1>

      <div className="space-y-8">
        {reels.map((reel) => (
          <div key={reel._id} className="max-w-sm mx-auto">
            <div className="relative aspect-9/16 bg-black rounded-lg overflow-hidden group">
              <video
                id={`video-${reel._id}`}
                src={reel.videoUrl}
                className="size-full object-cover"
                loop
                muted
                playsInline
                onClick={() => togglePlay(reel._id)}
              />

              {/* Play/Pause overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={() => togglePlay(reel._id)}
              >
                {playingVideo !== reel._id && (
                  <div className="bg-black/50 rounded-full p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="size-8 text-white fill-current" />
                  </div>
                )}
              </div>

              {/* User info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-4">
                <Link
                  href={`/profile/${reel.user.username}`}
                  className="flex items-center gap-3 mb-3"
                >
                  <Avatar className="size-10">
                    <AvatarImage src={reel.user.profilePictureUrl} />
                    <AvatarFallback>
                      {reel.user.displayName?.[0]?.toUpperCase() ||
                        reel.user.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-white">
                      {reel.user.displayName || reel.user.username}
                    </div>
                    <div className="text-xs text-white/80">
                      {formatDistanceToNow(new Date(reel.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </Link>

                {reel.caption && (
                  <p className="text-white text-sm mb-2">{reel.caption}</p>
                )}

                {reel.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {reel.hashtags.map((hashtag, index) => (
                      <Link key={index} href={`/hashtag/${hashtag}`}>
                        <span className="text-primary text-xs hover:underline">
                          #{hashtag}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="absolute right-4 bottom-20 flex flex-col gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(reel._id)}
                  className={`hover:bg-black/70 ${reel.isLiked ? "text-red-500" : "text-white"}`}
                >
                  <Heart
                    className={`size-6 ${reel.isLiked ? "fill-current" : ""}`}
                  />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-black/70 text-white"
                >
                  <MessageCircle className="size-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-black/70 text-white"
                >
                  <Share className="size-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSave(reel._id)}
                  className={`hover:bg-black/70 ${
                    reel.isSaved ? "text-primary" : "text-white"
                  }`}
                >
                  <Bookmark
                    className={`size-6 ${reel.isSaved ? "fill-current" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {/* Like count */}
            {reel.likeCount > 0 && (
              <div className="mt-2 text-sm">
                {reel.likeCount} {reel.likeCount === 1 ? "like" : "likes"}
              </div>
            )}
          </div>
        ))}
      </div>

      {status === "CanLoadMore" && (
        <div className="text-center mt-8">
          <Button onClick={() => loadMore(10)} variant="outline">
            Load more reels
          </Button>
        </div>
      )}
    </div>
  );
}
