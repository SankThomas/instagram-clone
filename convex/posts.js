import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const getFeed = query({
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

    // Get posts from followed users + own posts
    let followingIds = [];
    if (currentUser) {
      const following = await ctx.db
        .query("follows")
        .withIndex("by_followerId", (q) => q.eq("followerId", currentUser._id))
        .collect();
      followingIds = following.map((f) => f.followingId);
      followingIds.push(currentUser._id); // Include own posts
    }

    const allPosts = await ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    // Filter posts to only show from followed users (or all if not logged in)
    const filteredPosts = currentUser
      ? allPosts.filter((post) => followingIds.includes(post.userId))
      : allPosts;

    // Paginate the filtered results
    const startIndex = args.paginationOpts.cursor
      ? parseInt(args.paginationOpts.cursor)
      : 0;
    const endIndex = startIndex + args.paginationOpts.numItems;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    const postsWithUserData = await Promise.all(
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
      page: postsWithUserData,
      isDone: endIndex >= filteredPosts.length,
      continueCursor:
        endIndex >= filteredPosts.length ? null : endIndex.toString(),
    };
  },
});

export const getPostById = query({
  args: {
    postId: v.id("posts"),
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

    const post = await ctx.db.get(args.postId);
    if (!post) return null;

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
  },
});

export const getUserPosts = query({
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

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .paginate(args.paginationOpts);

    const postsWithData = await Promise.all(
      posts.page.map(async (post) => {
        const isLiked = currentUser
          ? (await ctx.db
              .query("likes")
              .withIndex("by_userId_postId", (q) =>
                q.eq("userId", currentUser._id).eq("postId", post._id),
              )
              .first()) !== null
          : false;

        return {
          ...post,
          isLiked,
          likeCount: post.likeCount || 0,
          commentCount: post.commentCount || 0,
        };
      }),
    );

    return {
      ...posts,
      page: postsWithData,
    };
  },
});

export const getExplorePosts = query({
  args: {
    clerkId: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    let currentUser = null;
    let followingIds = [];

    if (args.clerkId) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
        .first();

      if (currentUser) {
        const following = await ctx.db
          .query("follows")
          .withIndex("by_followerId", (q) =>
            q.eq("followerId", currentUser._id),
          )
          .collect();
        followingIds = following.map((f) => f.followingId);
        followingIds.push(currentUser._id); // Include own posts to exclude
      }
    }

    // Get posts from users not followed
    const allPosts = await ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    const explorePosts = allPosts.filter(
      (post) => !followingIds.includes(post.userId),
    );

    // Paginate the filtered results
    const startIndex = args.paginationOpts.cursor
      ? parseInt(args.paginationOpts.cursor)
      : 0;
    const endIndex = startIndex + args.paginationOpts.numItems;
    const paginatedPosts = explorePosts.slice(startIndex, endIndex);

    const postsWithUserData = await Promise.all(
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
      page: postsWithUserData,
      isDone: endIndex >= explorePosts.length,
      continueCursor:
        endIndex >= explorePosts.length ? null : endIndex.toString(),
    };
  },
});

export const getPostsByHashtag = query({
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

    const allPosts = await ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    // Filter posts that contain the hashtag
    const filteredPosts = allPosts.filter(post => 
      post.hashtags && post.hashtags.includes(args.hashtag)
    );

    // Paginate the filtered results
    const startIndex = args.paginationOpts.cursor
      ? parseInt(args.paginationOpts.cursor)
      : 0;
    const endIndex = startIndex + args.paginationOpts.numItems;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    const postsWithUserData = await Promise.all(
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
      page: postsWithUserData,
      isDone: endIndex >= filteredPosts.length,
      continueCursor:
        endIndex >= filteredPosts.length ? null : endIndex.toString(),
    };
  },
});

export const getSavedPosts = query({
  args: {
    clerkId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return { page: [], isDone: true, continueCursor: null };

    const savedPosts = await ctx.db
      .query("savedPosts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    const postsWithData = await Promise.all(
      savedPosts.page.map(async (savedPost) => {
        const post = await ctx.db.get(savedPost.postId);
        if (!post) return null;

        const postUser = await ctx.db.get(post.userId);
        const isLiked =
          (await ctx.db
            .query("likes")
            .withIndex("by_userId_postId", (q) =>
              q.eq("userId", user._id).eq("postId", post._id),
            )
            .first()) !== null;

        return {
          ...post,
          user: postUser,
          isLiked,
          isSaved: true,
          likeCount: post.likeCount || 0,
          commentCount: post.commentCount || 0,
        };
      }),
    );

    return {
      ...savedPosts,
      page: postsWithData.filter(Boolean),
    };
  },
});

export const createPost = mutation({
  args: {
    clerkId: v.string(),
    imageId: v.optional(v.id("_storage")),
    imageIds: v.optional(v.array(v.id("_storage"))),
    videoId: v.optional(v.id("_storage")),
    mediaType: v.union(v.literal("image"), v.literal("video"), v.literal("carousel")),
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

    let imageUrl, imageUrls, videoUrl;

    if (args.mediaType === "image" && args.imageId) {
      imageUrl = await ctx.storage.getUrl(args.imageId);
      if (!imageUrl) throw new Error("Failed to get image URL");
    } else if (args.mediaType === "carousel" && args.imageIds) {
      imageUrls = await Promise.all(
        args.imageIds.map(async (id) => {
          const url = await ctx.storage.getUrl(id);
          if (!url) throw new Error("Failed to get image URL");
          return url;
        })
      );
    } else if (args.mediaType === "video" && args.videoId) {
      videoUrl = await ctx.storage.getUrl(args.videoId);
      if (!videoUrl) throw new Error("Failed to get video URL");
    }

    const postId = await ctx.db.insert("posts", {
      userId: user._id,
      imageUrl,
      imageId: args.imageId,
      imageUrls,
      imageIds: args.imageIds,
      videoUrl,
      videoId: args.videoId,
      mediaType: args.mediaType,
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

    return postId;
  },
});

export const toggleLike = mutation({
  args: {
    clerkId: v.string(),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_userId_postId", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId),
      )
      .first();

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.postId, {
        likeCount: Math.max(0, (post.likeCount || 0) - 1),
      });
      return false;
    } else {
      // Like
      await ctx.db.insert("likes", {
        userId: user._id,
        postId: args.postId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.postId, {
        likeCount: (post.likeCount || 0) + 1,
      });

      // Create notification for post owner
      if (post.userId !== user._id) {
        await ctx.db.insert("notifications", {
          userId: post.userId,
          fromUserId: user._id,
          type: "like",
          postId: args.postId,
          isRead: false,
          createdAt: Date.now(),
        });
      }

      return true;
    }
  },
});

export const toggleSavePost = mutation({
  args: {
    clerkId: v.string(),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const existingSave = await ctx.db
      .query("savedPosts")
      .withIndex("by_userId_postId", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId),
      )
      .first();

    if (existingSave) {
      await ctx.db.delete(existingSave._id);
      return false;
    } else {
      await ctx.db.insert("savedPosts", {
        userId: user._id,
        postId: args.postId,
        createdAt: Date.now(),
      });
      return true;
    }
  },
});

export const deletePost = mutation({
  args: {
    clerkId: v.string(),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    if (post.userId !== user._id) throw new Error("Not authorized");

    // Delete related data
    const [likes, comments, savedPosts] = await Promise.all([
      ctx.db
        .query("likes")
        .withIndex("by_postId", (q) => q.eq("postId", args.postId))
        .collect(),
      ctx.db
        .query("comments")
        .withIndex("by_postId", (q) => q.eq("postId", args.postId))
        .collect(),
      ctx.db
        .query("savedPosts")
        .withIndex("by_postId", (q) => q.eq("postId", args.postId))
        .collect(),
    ]);

    await Promise.all([
      ...likes.map((like) => ctx.db.delete(like._id)),
      ...comments.map((comment) => ctx.db.delete(comment._id)),
      ...savedPosts.map((saved) => ctx.db.delete(saved._id)),
    ]);

    // Delete the post
    await ctx.db.delete(args.postId);

    // Update user post count
    await ctx.db.patch(user._id, {
      postCount: Math.max(0, (user.postCount || 0) - 1),
    });

    return true;
  },
});
