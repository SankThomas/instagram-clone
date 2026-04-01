"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import PostCard from "@/components/post/PostCard";
import { useEffect } from "react";

export default function PostPage() {
  const { postId } = useParams();
  const router = useRouter();
  const { user } = useUser();

  const post = useQuery(
    api.posts.getPostById,
    postId ? { postId, clerkId: user?.id } : "skip",
  );

  // Update URL when post modal is opened
  useEffect(() => {
    if (post) {
      // This ensures the URL reflects the current post
      window.history.replaceState(null, "", `/post/${postId}`);
    }
  }, [post, postId]);

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Post not found</h2>
        <p className="text-primary">
          The post you are looking for does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PostCard post={post} />
    </div>
  );
}