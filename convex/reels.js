import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const getReelsPosts = query({
  args: {
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

    // Get all video posts (reels)
    const allPosts = await ctx.db
      .query("posts")
      .withIndex("by_mediaType", (q) => q.eq("mediaType", "video"))
      .order("desc")
      .collect();

    // Paginate the results
    const startIndex = args.paginationOpts.cursor
      ? parseInt(args.paginationOpts.cursor)
      : 0;
    const endIndex = startIndex + args.paginationOpts.numItems;
    const paginatedPosts = allPosts.slice(startIndex, endIndex);

    const reelsWithUserData = await Promise.all(
      paginatedPosts.map(async (post) => {
        const user = await ctx.db.get(post.userId);
        const isLiked = currentUser
          ? (await ctx.db
              .query("likes")
              .withIndex("by_userId_postId", (q) =>
                q.eq("userId", currentUser._id).eq("postId", post._id),
              )
              .first()) !== null
          : false;
        const isSaved = currentUser
          ? (await ctx.db
              .query("savedPosts")
              .withIndex("by_userId_postId", (q) =>
                q.eq("userId", currentUser._id).eq("postId", post._id),
              )
              .first()) !== null
          : false;

        return {
          ...post,
          user,
          isLiked,
          isSaved,
          likeCount: post.likeCount || 0,
          commentCount: post.commentCount || 0,
        };
      }),
    );

    return {
      page: reelsWithUserData,
      isDone: endIndex >= allPosts.length,
      continueCursor: endIndex >= allPosts.length ? null : endIndex.toString(),
    };
  },
});

export const getReelsByUser = query({
  args: {
    userId: v.id("users"),
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

    // Get video posts by specific user
    const userPosts = await ctx.db
      .query("posts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("mediaType"), "video"))
      .order("desc")
      .paginate(args.paginationOpts);

    const reelsWithData = await Promise.all(
      userPosts.page.map(async (post) => {
        const user = await ctx.db.get(post.userId);
        const isLiked = currentUser
          ? (await ctx.db
              .query("likes")
              .withIndex("by_userId_postId", (q) =>
                q.eq("userId", currentUser._id).eq("postId", post._id),
              )
              .first()) !== null
          : false;
        const isSaved = currentUser
          ? (await ctx.db
              .query("savedPosts")
              .withIndex("by_userId_postId", (q) =>
                q.eq("userId", currentUser._id).eq("postId", post._id),
              )
              .first()) !== null
          : false;

        return {
          ...post,
          user,
          isLiked,
          isSaved,
          likeCount: post.likeCount || 0,
          commentCount: post.commentCount || 0,
        };
      }),
    );

    return {
      ...userPosts,
      page: reelsWithData,
    };
  },
});

export const getReelById = query({
  args: {
    reelId: v.id("posts"),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser = null;
    if (args.clerkId) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
        .first();
    }

    const reel = await ctx.db.get(args.reelId);
    if (!reel || reel.mediaType !== "video") return null;

    const user = await ctx.db.get(reel.userId);
    const isLiked = currentUser
      ? (await ctx.db
          .query("likes")
          .withIndex("by_userId_postId", (q) =>
            q.eq("userId", currentUser._id).eq("postId", reel._id),
          )
          .first()) !== null
      : false;
    const isSaved = currentUser
      ? (await ctx.db
          .query("savedPosts")
          .withIndex("by_userId_postId", (q) =>
            q.eq("userId", currentUser._id).eq("postId", reel._id),
          )
          .first()) !== null
      : false;

    return {
      ...reel,
      user,
      isLiked,
      isSaved,
      likeCount: reel.likeCount || 0,
      commentCount: reel.commentCount || 0,
    };
  },
});

export const getReelsByHashtag = query({
  args: {
    hashtag: v.string(),
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

    // Get all video posts and filter by hashtag
    const allReels = await ctx.db
      .query("posts")
      .withIndex("by_mediaType", (q) => q.eq("mediaType", "video"))
      .order("desc")
      .collect();

    const filteredReels = allReels.filter(
      (reel) => reel.hashtags && reel.hashtags.includes(args.hashtag),
    );

    // Paginate the filtered results
    const startIndex = args.paginationOpts.cursor
      ? parseInt(args.paginationOpts.cursor)
      : 0;
    const endIndex = startIndex + args.paginationOpts.numItems;
    const paginatedReels = filteredReels.slice(startIndex, endIndex);

    const reelsWithUserData = await Promise.all(
      paginatedReels.map(async (reel) => {
        const user = await ctx.db.get(reel.userId);
        const isLiked = currentUser
          ? (await ctx.db
              .query("likes")
              .withIndex("by_userId_postId", (q) =>
                q.eq("userId", currentUser._id).eq("postId", reel._id),
              )
              .first()) !== null
          : false;
        const isSaved = currentUser
          ? (await ctx.db
              .query("savedPosts")
              .withIndex("by_userId_postId", (q) =>
                q.eq("userId", currentUser._id).eq("postId", reel._id),
              )
              .first()) !== null
          : false;

        return {
          ...reel,
          user,
          isLiked,
          isSaved,
          likeCount: reel.likeCount || 0,
          commentCount: reel.commentCount || 0,
        };
      }),
    );

    return {
      page: reelsWithUserData,
      isDone: endIndex >= filteredReels.length,
      continueCursor:
        endIndex >= filteredReels.length ? null : endIndex.toString(),
    };
  },
});

export const getTrendingReels = query({
  args: {
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

    // Get all video posts and sort by engagement (likes + comments)
    const allReels = await ctx.db
      .query("posts")
      .withIndex("by_mediaType", (q) => q.eq("mediaType", "video"))
      .collect();

    // Sort by engagement score (likes + comments * 2)
    const sortedReels = allReels.sort((a, b) => {
      const scoreA = (a.likeCount || 0) + (a.commentCount || 0) * 2;
      const scoreB = (b.likeCount || 0) + (b.commentCount || 0) * 2;
      return scoreB - scoreA;
    });

    // Paginate the results
    const startIndex = args.paginationOpts.cursor
      ? parseInt(args.paginationOpts.cursor)
      : 0;
    const endIndex = startIndex + args.paginationOpts.numItems;
    const paginatedReels = sortedReels.slice(startIndex, endIndex);

    const reelsWithUserData = await Promise.all(
      paginatedReels.map(async (reel) => {
        const user = await ctx.db.get(reel.userId);
        const isLiked = currentUser
          ? (await ctx.db
              .query("likes")
              .withIndex("by_userId_postId", (q) =>
                q.eq("userId", currentUser._id).eq("postId", reel._id),
              )
              .first()) !== null
          : false;
        const isSaved = currentUser
          ? (await ctx.db
              .query("savedPosts")
              .withIndex("by_userId_postId", (q) =>
                q.eq("userId", currentUser._id).eq("postId", reel._id),
              )
              .first()) !== null
          : false;

        return {
          ...reel,
          user,
          isLiked,
          isSaved,
          likeCount: reel.likeCount || 0,
          commentCount: reel.commentCount || 0,
        };
      }),
    );

    return {
      page: reelsWithUserData,
      isDone: endIndex >= sortedReels.length,
      continueCursor:
        endIndex >= sortedReels.length ? null : endIndex.toString(),
    };
  },
});

export const createReel = mutation({
  args: {
    clerkId: v.string(),
    videoId: v.id("_storage"),
    caption: v.optional(v.string()),
    hashtags: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const videoUrl = await ctx.storage.getUrl(args.videoId);
    if (!videoUrl) throw new Error("Failed to get video URL");

    const reelId = await ctx.db.insert("posts", {
      userId: user._id,
      videoUrl,
      videoId: args.videoId,
      mediaType: "video",
      caption: args.caption,
      hashtags: args.hashtags,
      location: args.location,
      likeCount: 0,
      commentCount: 0,
      createdAt: Date.now(),
    });

    // Update user post count
    await ctx.db.patch(user._id, {
      postCount: (user.postCount || 0) + 1,
    });

    return reelId;
  },
});

export const deleteReel = mutation({
  args: {
    clerkId: v.string(),
    reelId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const reel = await ctx.db.get(args.reelId);
    if (!reel) throw new Error("Reel not found");
    if (reel.userId !== user._id) throw new Error("Not authorized");
    if (reel.mediaType !== "video") throw new Error("Not a reel");

    // Delete related data
    const [likes, comments, savedPosts] = await Promise.all([
      ctx.db
        .query("likes")
        .withIndex("by_postId", (q) => q.eq("postId", args.reelId))
        .collect(),
      ctx.db
        .query("comments")
        .withIndex("by_postId", (q) => q.eq("postId", args.reelId))
        .collect(),
      ctx.db
        .query("savedPosts")
        .withIndex("by_postId", (q) => q.eq("postId", args.reelId))
        .collect(),
    ]);

    await Promise.all([
      ...likes.map((like) => ctx.db.delete(like._id)),
      ...comments.map((comment) => ctx.db.delete(comment._id)),
      ...savedPosts.map((saved) => ctx.db.delete(saved._id)),
    ]);

    // Delete the reel
    await ctx.db.delete(args.reelId);

    // Update user post count
    await ctx.db.patch(user._id, {
      postCount: Math.max(0, (user.postCount || 0) - 1),
    });

    return true;
  },
});
