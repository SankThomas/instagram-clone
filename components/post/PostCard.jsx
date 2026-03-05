"use client";

import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  Bookmark,
  Copy,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share,
  Share as ShareIcon,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import CommentSection from "./CommentSection";

export default function PostCard({ post }) {
  const [showComments, setShowComments] = useState(false);
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
  const deletePost = useMutation(api.posts.deletePost);

  const handleLike = async () => {
    if (!currentUser || !user) return;

    try {
      const liked = await toggleLike({ clerkId: user.id, postId: post._id });
      toast.success(liked ? "Post liked" : "Post unliked");
    } catch (error) {
      toast.error("Failed to update like");
    }
  };

  const handleSave = async () => {
    if (!currentUser || !user) return;

    try {
      const saved = await toggleSave({
        clerkId: user.id,
        postId: post._id,
      });

      toast.success(saved ? "Post saved" : "Post unsaved");
    } catch (error) {
      toast.error("Failed to update save status");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim() || !currentUser || !user) {
      toast.error("Failed to add comment");
      return;
    }

    setIsSubmitting(true);

    try {
      await addComment({
        clerkId: user.id,
        postId: post._id,
        content: commentText.trim(),
      });

      setCommentText("");
      setShowComments(true);
      toast.success("Comment added");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !user || post.user._id !== currentUser._id) return;

    try {
      await deletePost({ clerkId: user.id, postId: post._id });
      toast.success("Post deleted");
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
    }
  };

  const isOwner = currentUser && post.user._id === currentUser._id;

  return (
    <article className="group overflow-hidden border rounded-lg">
      <div className="flex items-center justify-between p-4">
        <Link
          href={`/profile/${post.user.username}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="size-10">
            <AvatarImage
              src={post.user.profilePictureUrl}
              className="object-cover"
            />
            <AvatarFallback>
              {post.user.displayName?.[0]?.toUpperCase() ||
                post.user.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {post.user.displayName || post.user.username}
              </span>

              {post.user.isVerified && (
                <Badge variant="secondary" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>

            <div className="text-sm">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
              })}
            </div>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {isOwner && (
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-error hover:text-error"
              >
                <Trash2 className="size-4 mr-1" />
                Delete post
              </DropdownMenuItem>
            )}

            <DropdownMenuItem>
              <ShareIcon className="size-4 mr-1" />
              Share
            </DropdownMenuItem>

            <DropdownMenuItem>
              <Copy className="size-4 mr-1" />
              Copy link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative w-full aspect-square">
        <div className="absolute inset-0" style={{ aspectRatio: "auto" }}>
          <Image
            src={post.imageUrl}
            alt={post.caption || "Post image"}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, 640px"
            priority
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={post.isLiked ? "text-error hover:text-error" : ""}
            >
              <Heart
                className={`size-6 ${post.isLiked ? "fill-current" : ""}`}
              />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="size-6" />
            </Button>

            <Button variant="ghost" size="sm" onClick={handleShare}>
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
          <div className="font-semibold">
            {post.likeCount} {post.likeCount === 1 ? "like" : "likes"}
          </div>
        )}

        {post.caption && (
          <div className="space-y-1">
            <div>
              <Link
                href={`/profile/${post.user.username}`}
                className="font-semibold hover:opacity-80 transition-opacity"
              >
                {post.user.username}
              </Link>

              <span className="ml-2">{post.caption}</span>
            </div>

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
          </div>
        )}

        {post.commentCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(true)}
            className="text-text-secondary hover:text-text p-0 h-auto font-normal"
          >
            View all {post.commentCount} comments
          </Button>
        )}

        <form onSubmit={handleComment} className="flex items-center gap-3">
          <Input
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="shadow-none border bg-transparent p-1 focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          {commentText.trim() && (
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          )}
        </form>
      </div>

      {showComments && (
        <CommentSection
          postId={post._id}
          onClose={() => setShowComments(false)}
        />
      )}
    </article>
  );
}
