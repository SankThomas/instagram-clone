"use client";

import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Bookmark, ChevronLeft, ChevronRight, Copy, Heart, MessageCircle, MoveHorizontal as MoreHorizontal, Share, Share as ShareIcon, Trash2 } from "lucide-react";
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
  const [currentSlide, setCurrentSlide] = useState(0);

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

  const handleShare = () => {};

  const handleCopyLink = () => {};

  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev === post.imageUrls.length - 1 ? 0 : prev + 1,
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? post.imageUrls.length - 1 : prev - 1,
    );
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

            <DropdownMenuItem onClick={handleShare}>
              <ShareIcon className="size-4 mr-1" />
              Share
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className="size-4 mr-1" />
              Copy link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative w-full aspect-square bg-black">
        {post.mediaType === "carousel" ? (
          <div className="relative w-full h-full">
            {post.imageUrls.map((url, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-300 ${
                  index === currentSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={url}
                  alt={`Post image ${index + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 100vw, 640px"
                  priority={index === 0}
                />
              </div>
            ))}

            {/* Buttons */}
            {post.imageUrls.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-2 py-1 rounded"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-2 py-1 rounded"
                >
                  <ChevronRight className="size-4" />
                </button>
              </>
            )}

            {/* Dots */}
            {post.imageUrls.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {post.imageUrls.map((_, index) => (
                  <div
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`size-2 cursor-pointer rounded-full ${
                      index === currentSlide ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : post.mediaType === "video" && post.videoUrl ? (
          <video
            src={post?.videoUrl}
            controls
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
            className="text-primary hover:text-text p-0 h-auto font-normal"
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

        {showComments && <CommentSection postId={post._id} />}
      </div>
    </article>
  );
}
