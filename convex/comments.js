import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const getPostComments = query({
  args: {
    postId: v.id("posts"),
    clerkId: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    let currentUser = null;
    if (args.clerkId) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
        .first();
    }

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .filter((q) => q.eq(q.field("parentCommentId"), undefined))
      .order("desc")
      .paginate(args.paginationOpts);

    const commentsWithUserData = await Promise.all(
      comments.page.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        const isLiked = currentUser
          ? (await ctx.db
              .query("commentLikes")
              .withIndex("by_userId_commentId", (q) =>
                q.eq("userId", currentUser._id).eq("commentId", comment._id),
              )
              .first()) !== null
          : false;

        // Get replies count
        const repliesCount = await ctx.db
          .query("comments")
          .withIndex("by_parentCommentId", (q) =>
            q.eq("parentCommentId", comment._id),
          )
          .collect()
          .then((replies) => replies.length);

        return {
          ...comment,
          user,
          isLiked,
          repliesCount,
          likeCount: comment.likeCount || 0,
        };
      }),
    );

    return {
      ...comments,
      page: commentsWithUserData,
    };
  },
});

export const getCommentReplies = query({
  args: {
    commentId: v.id("comments"),
    clerkId: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    let currentUser = null;
    if (args.clerkId) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
        .first();
    }

    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parentCommentId", (q) =>
        q.eq("parentCommentId", args.commentId),
      )
      .order("asc")
      .paginate(args.paginationOpts);

    const repliesWithUserData = await Promise.all(
      replies.page.map(async (reply) => {
        const user = await ctx.db.get(reply.userId);
        const isLiked = currentUser
          ? (await ctx.db
              .query("commentLikes")
              .withIndex("by_userId_commentId", (q) =>
                q.eq("userId", currentUser._id).eq("commentId", reply._id),
              )
              .first()) !== null
          : false;

        return {
          ...reply,
          user,
          isLiked,
          likeCount: reply.likeCount || 0,
        };
      }),
    );

    return {
      ...replies,
      page: repliesWithUserData,
    };
  },
});

export const addComment = mutation({
  args: {
    clerkId: v.string(),
    postId: v.id("posts"),
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const commentId = await ctx.db.insert("comments", {
      userId: user._id,
      postId: args.postId,
      content: args.content,
      parentCommentId: args.parentCommentId,
      likeCount: 0,
      createdAt: Date.now(),
    });

    // Update post comment count
    await ctx.db.patch(args.postId, {
      commentCount: (post.commentCount || 0) + 1,
    });

    // Create notification for post owner
    if (post.userId !== user._id) {
      await ctx.db.insert("notifications", {
        userId: post.userId,
        fromUserId: user._id,
        type: "comment",
        postId: args.postId,
        commentId,
        content: args.content.substring(0, 100),
        isRead: false,
        createdAt: Date.now(),
      });
    }

    // If it's a reply, create notification for parent comment owner
    if (args.parentCommentId) {
      const parentComment = await ctx.db.get(args.parentCommentId);
      if (parentComment && parentComment.userId !== user._id) {
        await ctx.db.insert("notifications", {
          userId: parentComment.userId,
          fromUserId: user._id,
          type: "comment",
          postId: args.postId,
          commentId,
          content: args.content.substring(0, 100),
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    return commentId;
  },
});

export const toggleCommentLike = mutation({
  args: {
    clerkId: v.string(),
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const existingLike = await ctx.db
      .query("commentLikes")
      .withIndex("by_userId_commentId", (q) =>
        q.eq("userId", user._id).eq("commentId", args.commentId),
      )
      .first();

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.commentId, {
        likeCount: Math.max(0, (comment.likeCount || 0) - 1),
      });
      return false;
    } else {
      // Like
      await ctx.db.insert("commentLikes", {
        userId: user._id,
        commentId: args.commentId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.commentId, {
        likeCount: (comment.likeCount || 0) + 1,
      });
      return true;
    }
  },
});

export const editComment = mutation({
  args: {
    clerkId: v.string(),
    commentId: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.userId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.commentId, {
      content: args.content,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const deleteComment = mutation({
  args: {
    clerkId: v.string(),
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.userId !== user._id) throw new Error("Not authorized");

    // If this is a parent comment, delete all replies first
    if (!comment.parentCommentId) {
      const replies = await ctx.db
        .query("comments")
        .withIndex("by_parentCommentId", (q) =>
          q.eq("parentCommentId", args.commentId),
        )
        .collect();

      const allCommentIds = [args.commentId, ...replies.map((r) => r._id)];

      // Delete all comment likes for this comment and its replies
      const commentLikes = await Promise.all(
        allCommentIds.map((id) =>
          ctx.db
            .query("commentLikes")
            .withIndex("by_commentId", (q) => q.eq("commentId", id))
            .collect(),
        ),
      );

      const allLikes = commentLikes.flat();

      await Promise.all([
        ...allLikes.map((like) => ctx.db.delete(like._id)),
        ...replies.map((reply) => ctx.db.delete(reply._id)),
      ]);

      // Update post comment count
      const post = await ctx.db.get(comment.postId);
      if (post) {
        const deletedCount = 1 + replies.length;
        await ctx.db.patch(comment.postId, {
          commentCount: Math.max(0, (post.commentCount || 0) - deletedCount),
        });
      }
    } else {
      // This is a reply, just delete its likes
      const commentLikes = await ctx.db
        .query("commentLikes")
        .withIndex("by_commentId", (q) => q.eq("commentId", args.commentId))
        .collect();

      await Promise.all(commentLikes.map((like) => ctx.db.delete(like._id)));

      // Update post comment count
      const post = await ctx.db.get(comment.postId);
      if (post) {
        await ctx.db.patch(comment.postId, {
          commentCount: Math.max(0, (post.commentCount || 0) - 1),
        });
      }
    }

    // Delete the main comment
    await ctx.db.delete(args.commentId);

    return true;
  },
});
