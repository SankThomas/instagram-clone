"use client";

import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import CommentSection from "../post/CommentSection";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";

export default function PostModal({ post, onClose }) {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useUser();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip",
  );

  const toggleLike = useMutation(api.posts.toggleLike);
  const toggleSave = useMutation(api.posts.toggleSavePost);
  const addComment = useMutation(api.comments.addComment);

  const handleLike = async () => {
    if (!currentUser || !user) return;
    try {
      await toggleLike({ clerkId: user.id, postId: post._id });
    } catch (error) {
      toast.error("Failed to update like");
    }
  };

  const handleSave = async () => {
    if (!currentUser || !user) return;
    try {
      await toggleSave({ clerkId: user.id, postId: post._id });
    } catch (error) {
      toast.error("Failed to update save status");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser || !user) return;

    setIsSubmitting(true);
    try {
      await addComment({
        clerkId: user.id,
        postId: post._id,
        content: commentText.trim(),
      });
      setCommentText("");
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={!!post} onOpenChange={onClose}>
      <DialogTitle></DialogTitle>
      <DialogContent className="max-w-6xl! max-h-[90vh]! h-full p-0 overflow-auto">
        <div className="grid md:grid-cols-2 h-full">
          {/* Image */}
          <div className="relative w-full aspect-square bg-black">
            {post.mediaType === "video" && post.videoUrl ? (
              <video
                src={post?.videoUrl}
                controls
                autoPlay
                loop
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
          </div>

          {/* Post Details */}
          <div className="flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <Link
                href={`/profile/${post.user?.username}`}
                className="flex items-center gap-3"
              >
                <Avatar className="size-8">
                  <AvatarImage src={post.user?.profilePictureUrl} />
                  <AvatarFallback>
                    {post.user?.displayName?.[0]?.toUpperCase() ||
                      post.user?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {post.user?.displayName || post.user?.username}
                    </span>
                    {post.user?.isVerified && (
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="size-4" />
              </Button>
            </div>

            {/* Caption */}
            {post.caption && (
              <div className="p-4 border-b">
                <div className="flex gap-3">
                  <Avatar className="size-8">
                    <AvatarImage src={post.user?.profilePictureUrl} />
                    <AvatarFallback>
                      {post.user?.displayName?.[0]?.toUpperCase() ||
                        post.user?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <span className="font-semibold text-sm mr-2">
                      {post.user?.username}
                    </span>
                    <span className="text-sm">{post.caption}</span>
                    {post.hashtags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.hashtags.map((hashtag, index) => (
                          <Link key={index} href={`/hashtag/${hashtag}`}>
                            <span className="text-primary text-xs hover:underline cursor-pointer">
                              #{hashtag}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-text-secondary mt-2">
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="flex-1 overflow-hidden">
              <CommentSection postId={post._id} />
            </div>

            {/* Actions */}
            <div className="border-t p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className={
                      post.isLiked ? "text-error hover:text-error" : ""
                    }
                  >
                    <Heart
                      className={`size-6 ${post.isLiked ? "fill-current" : ""}`}
                    />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="size-6" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share className="size-6" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  className={post.isSaved ? "text-primary" : ""}
                >
                  <Bookmark
                    className={`size-6 ${post.isSaved ? "fill-current" : ""}`}
                  />
                </Button>
              </div>

              {post.likeCount > 0 && (
                <div className="font-semibold text-sm">
                  {post.likeCount} {post.likeCount === 1 ? "like" : "likes"}
                </div>
              )}

              {/* Add Comment */}
              <form
                onSubmit={handleComment}
                className="flex items-center gap-3"
              >
                <Input
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="border-0 shadow-none focus-visible:ring-0"
                />
                {commentText.trim() && (
                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? "..." : "Post"}
                  </Button>
                )}
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
