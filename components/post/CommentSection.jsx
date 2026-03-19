"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import CommentItem from "./CommentItem";

export default function CommentSection({
  postId,
  onClose,
  showAddComment = true,
}) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useUser();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip",
  );
  const {
    results: comments,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.comments.getPostComments,
    { postId, clerkId: user?.id },
    { initialNumItems: 10 },
  );

  const toggleCommentLike = useMutation(api.comments.toggleCommentLike);
  const addComment = useMutation(api.comments.addComment);
  const deleteComment = useMutation(api.comments.deleteComment);
  const editComment = useMutation(api.comments.editComment);

  const handleLike = async (commentId) => {
    if (!user) return;
    try {
      await toggleCommentLike({ clerkId: user.id, commentId });
    } catch (error) {
      toast.error("Failed to update like");
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser || !user || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await addComment({
        clerkId: user.id,
        postId,
        content: replyText.trim(),
        parentCommentId: replyingTo,
      });
      setReplyText("");
      setReplyingTo(null);
      toast.success("Reply added");
    } catch (error) {
      toast.error("Failed to add reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!user) return;
    try {
      await deleteComment({ clerkId: user.id, commentId });
      toast.success("Comment deleted");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const handleEdit = async (commentId, content) => {
    if (!user) return;
    try {
      await editComment({ clerkId: user.id, commentId, content });
      toast.success("Comment updated");
    } catch (error) {
      toast.error("Failed to update comment");
    }
  };

  if (status === "LoadingFirstPage") {
    return (
      <div className="border-t border-border p-4">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="size-8 bg-secondary rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="w-24 h-4 bg-secondary rounded"></div>
                <div className="w-full h-4 bg-secondary rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={showAddComment ? "border-t border-border" : ""}>
      <div className="max-h-96 overflow-y-auto">
        <div className="p-4 space-y-4">
          {comments?.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              currentUser={currentUser}
              onLike={() => handleLike(comment._id)}
              onReply={() => setReplyingTo(comment._id)}
              onDelete={() => handleDelete(comment._id)}
              onEdit={handleEdit}
            />
          ))}

          {status === "CanLoadMore" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadMore(10)}
              className="w-full"
            >
              Load more comments
            </Button>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {replyingTo && showAddComment && (
        <div className="border-t border-border p-4">
          <div className="text-sm text-primary mb-3">
            Replying to{" "}
            {comments?.find((c) => c._id === replyingTo)?.user.username}
          </div>
          <form onSubmit={handleReply} className="flex items-center gap-3">
            <Input
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !replyText.trim()}
            >
              {isSubmitting ? "Posting..." : "Reply"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              Cancel
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
