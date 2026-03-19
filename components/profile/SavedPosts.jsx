"use client";

import { usePaginatedQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { Heart, MessageCircle, Bookmark } from "lucide-react";
import { useState } from "react";
import PostModal from "./PostModal";

export default function SavedPosts() {
  const [selectedPost, setSelectedPost] = useState(null);
  const { user } = useUser();

  const {
    results: posts,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.posts.getSavedPosts,
    user ? { clerkId: user.id } : "skip",
    { initialNumItems: 12 },
  );

  if (status === "LoadingFirstPage") {
    return (
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-secondary animate-pulse rounded"
          />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="size-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
          <div className="size-12 bg-text-muted rounded-full flex items-center justify-center">
            <Bookmark className="size-12 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-2">No saved posts yet</h3>
        <p className="text-primary">
          When you save posts, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {posts.map((post) => (
          <div
            key={post._id}
            className="relative aspect-square cursor-pointer group"
            onClick={() => setSelectedPost(post)}
          >
            {post.mediaType === "video" && post.videoUrl ? (
              <video
                src={post?.videoUrl}
                controls={false}
                poster={post.thumbnailUrl}
                className="w-full h-full object-contain"
                preload="metadata"
              />
            ) : (
              <Image
                src={post.imageUrls ? post.imageUrls[0] : post.imageUrl}
                alt={post.caption || "Post image"}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 100vw, 640px"
                priority
              />
            )}

            <div className="absolute inset-0 group-hover:bg-black/50 group-hover:bg-opacity-30 transition-all duration-200 rounded flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-4 text-white">
                <div className="flex items-center gap-1">
                  <Heart className="size-6 fill-current" />
                  <span className="font-semibold">{post.likeCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="size-6 fill-current" />
                  <span className="font-semibold">
                    {post.commentCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {status === "CanLoadMore" && (
        <div className="text-center mt-8">
          <button
            onClick={() => loadMore(12)}
            className="text-primary hover:underline"
          >
            Load more posts
          </button>
        </div>
      )}

      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </>
  );
}
