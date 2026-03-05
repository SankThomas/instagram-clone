"use client";

import PostCard from "@/components/post/PostCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { usePaginatedQuery } from "convex/react";
import { User } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { PostSkeleton } from "../ui/LoadingSkeleton";
import SuggestedUsers from "./SuggestedUsers";

export default function Feed() {
  const { user } = useUser();
  const {
    results: posts,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.posts.getFeed,
    { clerkId: user?.id },
    { initialNumItems: 10 },
  );

  const { ref, inView } = useInView({ threshold: 0, triggerOnce: false });

  useEffect(() => {
    if (inView && status === "CanLoadMore") {
      loadMore(5);
    }
  }, [inView, status, loadMore]);

  if (status === "LoadingFirstPage") {
    return (
      <div className="flex gap-8">
        <div className="flex-1 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
        <div className="hidden lg:block w-80 shrink-0">
          <div className="bg-card rounded-lg p-4 border animate-pulse">
            <div className="w-32 h-5 bg-secondary rounded mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="size-10 bg-secondary rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-24 h-3 bg-secondary rounded"></div>
                    <div className="w-16 h-3 bg-secondary rounded"></div>
                  </div>
                  <div className="w-16 h-8 bg-secondary rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="flex items-start justify-between gap-8">
        <div className="text-center py-12">
          <div className="size-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
            <div className="size-12 bg-text-muted rounded-full flex items-center justify-center">
              <User className="size-12 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-text-secondary mb-6">
            Start following people to see their posts in your feed.
          </p>

          <Button asChild>
            <Link href="/search">Find people to follow</Link>
          </Button>
        </div>

        <SuggestedUsers />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex gap-8">
        <div className="flex-1 space-y-8">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>

        <div className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-8 space-y-6">
            <SuggestedUsers />
          </div>
        </div>
      </div>
      <div ref={ref} className="flex justify-center py-8">
        {status === "LoadingMore" && <LoadingSpinner />}
        {status === "CanLoadMore" && (
          <Button variant="ghost" onClick={() => loadMore(5)}>
            Load more posts
          </Button>
        )}
      </div>
    </div>
  );
}
