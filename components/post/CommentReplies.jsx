"use client";

import { useState } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import CommentItem from "./CommentItem";
import { toast } from "sonner";

export default function CommentReplies({ commentId, onClose }) {
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useUser();
  const {
    results: replies,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.comments.getCommentReplies,
    { commentId, clerkId: user?.id },
    { initialNumItems: 5 },
  );

  const addComment = useMutation(api.comments.addComment);

  const handleReply = async (e) => {
    e.preventDefault();

    if (!replyText.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await addComment({
        clerkId: user.id,
        postId: replies?.[0]?.postId,
        content: replyText.trim(),
        parentCommentId: commentId,
      });
      setReplyText("");
      toast.success("Reply added");
    } catch (error) {
      toast.error("Failed to add reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "LoadingFirstPage") {
    return (
      <div className="ml-8 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="size-6 bg-secondary rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="w-20 h-3 bg-secondary rounded"></div>
              <div className="w-full h-3 bg-secondary rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="ml-8 space-y-3">
      {replies?.map((reply) => (
        <CommentItem
          key={reply._id}
          comment={reply}
          currentUser={user}
          onLike={() => {}}
          onReply={() => {}}
          onDelete={() => {}}
          isReply={true}
        />
      ))}

      {status === "CanLoadMore" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => loadMore(5)}
          className="text-xs"
        >
          Load more replies
        </Button>
      )}

      <form onSubmit={handleReply} className="flex items-center gap-2">
        <Input
          placeholder="Write a reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          className="text-sm"
        />
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !replyText.trim()}
        >
          {isSubmitting ? "..." : "Reply"}
        </Button>
      </form>
    </div>
  );
}
