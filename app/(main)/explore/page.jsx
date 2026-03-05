"use client";

import { useState } from "react";
import { usePaginatedQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import PostModal from "@/components/profile/PostModal";

export default function ExplorePage() {
  const [selectedPost, setSelectedPost] = useState(null);
  const { user } = useUser();

  const {
    results: posts,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.posts.getExplorePosts,
    { clerkId: user?.id },
    { initialNumItems: 21 },
  );

  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Explore</h1>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 21 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-secondary animate-pulse rounded"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Explore</h1>
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No posts to explore</h3>
          <p className="text-text-secondary">
            Check back later for new content to discover.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Explore</h1>

        <div className="grid grid-cols-3 gap-1">
          {posts.map((post, index) => (
            <div
              key={post._id}
              className={`relative cursor-pointer group ${
                index % 7 === 1 ? "col-span-2 row-span-2" : "aspect-square"
              }`}
              onClick={() => setSelectedPost(post)}
            >
              <Image
                src={post.imageUrl}
                alt={post.caption || "Post"}
                fill
                className="object-cover rounded"
                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded flex items-center justify-center">
                <div className="flex items-center gap-4 text-white">
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
              onClick={() => loadMore(21)}
              className="text-primary hover:underline"
            >
              Load more posts
            </button>
          </div>
        )}
      </div>

      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </>
  );
}
