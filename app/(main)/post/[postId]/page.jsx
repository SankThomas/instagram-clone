"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import PostModal from "@/components/profile/PostModal";
import { useRouter } from "next/navigation";

export default function PostPage() {
  const { postId } = useParams();
  const router = useRouter();
  const { user } = useUser();

  const post = useQuery(
    api.posts.getPostById,
    postId ? { postId, clerkId: user?.id } : "skip",
  );

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Post not found</h2>
        <p className="text-text-secondary">
          The post you are looking for does not exist.
        </p>
      </div>
    );
  }

  return <PostModal post={post} onClose={() => router.back()} />;
}
