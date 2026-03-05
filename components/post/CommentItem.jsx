import { formatDistanceToNow } from "date-fns";
import { Heart, Reply, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import CommentReplies from "./CommentReplies";

export default function CommentItem({
  comment,
  currentUser,
  onLike,
  onReply,
  onDelete,
  isReply = false,
}) {
  const [showReplies, setShowReplies] = useState(false);
  const isOwner = currentUser && comment.user._id === currentUser._id;

  return (
    <div className="flex gap-3 group">
      <Link href={`/profile/${comment.user.username}`}>
        <Avatar className="size-8">
          <AvatarImage src={comment.user.profilePictureUrl} />
          <AvatarFallback className="text-xs">
            {comment.user.displayName?.[0]?.toUpperCase() ||
              comment.user.username?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="bg-secondary rounded-2xl px-3 py-2">
          <Link
            href={`/profile/${comment.user.username}`}
            className="font-semibold text-sm hover:opacity-80 transition-opacity"
          >
            {comment.user.displayName || comment.user.username}
          </Link>
          <div className="text-sm mt-1 wrap-break-word">{comment.content}</div>
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
          <span>
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
            })}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            className={`h-auto p-0 text-xs ${comment.isLiked ? "text-error" : "text-text-secondary"} hover:text-text`}
          >
            <Heart
              className={`size-3 mr-1 ${comment.isLiked ? "fill-current" : ""}`}
            />
            {comment.likeCount > 0 && comment.likeCount}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReply}
            className={`h-auto p-0 text-xs text-text-secondary hover:text-text ${isReply ? "hidden" : ""}`}
          >
            <Reply className="size-3 mr-1" />
            Reply
          </Button>

          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-auto p-0 text-xs text-error hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>

        {comment.repliesCount > 0 && !isReply && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplies(!showReplies)}
            className="h-auto p-0 text-xs text-text-secondary hover:text-text mt-2"
          >
            {showReplies ? "Hide" : "View"} {comment.repliesCount}{" "}
            {comment.repliesCount === 1 ? "reply" : "replies"}
          </Button>
        )}

        {showReplies && !isReply && (
          <CommentReplies
            commentId={comment._id}
            onClose={() => setShowReplies(false)}
          />
        )}
      </div>
    </div>
  );
}
