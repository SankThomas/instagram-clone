"use client";

import { useParams } from "next/navigation";
import { usePaginatedQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { Heart, MessageCircle, Hash } from "lucide-react";
import { useState } from "react";
import PostModal from "@/components/profile/PostModal";

export default function HashtagPage() {
  const { tag } = useParams();
  const [selectedPost, setSelectedPost] = useState(null);
  const { user } = useUser();

  const {
    results: posts,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.posts.getPostsByHashtag,
    { hashtag: decodeURIComponent(tag), clerkId: user?.id },
    { initialNumItems: 21 },
  );

  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="size-24 mx-auto mb-4 bg-secondary rounded-full flex items-center justify-center animate-pulse">
            <Hash className="size-12 text-text-muted" />
          </div>
          <div className="w-48 h-8 bg-secondary rounded mx-auto mb-2 animate-pulse"></div>
          <div className="w-32 h-4 bg-secondary rounded mx-auto animate-pulse"></div>
        </div>
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
        <div className="text-center py-8">
          <div className="size-24 mx-auto mb-4 bg-secondary rounded-full flex items-center justify-center">
            <Hash className="size-12 text-text-muted" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            #{decodeURIComponent(tag)}
          </h1>
          <p className="text-text-secondary">
            No posts found with this hashtag
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="size-24 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <Hash className="size-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            #{decodeURIComponent(tag)}
          </h1>
          <p className="text-text-secondary">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {posts.map((post) => (
            <div
              key={post._id}
              className="relative aspect-square cursor-pointer group"
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
