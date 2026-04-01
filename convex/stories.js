import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const getActiveStories = query({
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
        followingIds.push(currentUser._id); // Include own stories
      }
    }

    const now = Date.now();
    const allStories = await ctx.db
      .query("stories")
      .withIndex("by_expiresAt")
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    // Filter stories to only show from followed users (or all if not logged in)
    const filteredStories = currentUser
      ? allStories.filter((story) => followingIds.includes(story.userId))
      : allStories;

    // Group stories by user
    const storiesByUser = new Map();
    for (const story of filteredStories) {
      if (!storiesByUser.has(story.userId)) {
        storiesByUser.set(story.userId, []);
      }
      storiesByUser.get(story.userId).push(story);
    }

    // Get user data and check if current user has viewed stories
    const userStories = await Promise.all(
      Array.from(storiesByUser.entries()).map(async ([userId, stories]) => {
        const user = await ctx.db.get(userId);
        const hasUnviewed = currentUser
          ? stories.some(async (story) => {
              const view = await ctx.db
                .query("storyViews")
                .withIndex("by_storyId_userId", (q) =>
                  q.eq("storyId", story._id).eq("userId", currentUser._id),
                )
                .first();
              return !view;
            })
          : true;

        return {
          user,
          stories: stories.sort((a, b) => a.createdAt - b.createdAt),
          hasUnviewed,
        };
      }),
    );

    // Paginate the results
    const startIndex = args.paginationOpts.cursor
      ? parseInt(args.paginationOpts.cursor)
      : 0;
    const endIndex = startIndex + args.paginationOpts.numItems;
    const paginatedStories = userStories.slice(startIndex, endIndex);

    return {
      page: paginatedStories,
      isDone: endIndex >= userStories.length,
      continueCursor:
        endIndex >= userStories.length ? null : endIndex.toString(),
    };
  },
});

export const getUserStories = query({
  args: {
    userId: v.id("users"),
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

    const now = Date.now();
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .order("asc")
      .collect();

    const user = await ctx.db.get(args.userId);

    const storiesWithViews = await Promise.all(
      stories.map(async (story) => {
        const hasViewed = currentUser
          ? (await ctx.db
              .query("storyViews")
              .withIndex("by_storyId_userId", (q) =>
                q.eq("storyId", story._id).eq("userId", currentUser._id),
              )
              .first()) !== null
          : false;

        return {
          ...story,
          hasViewed,
        };
      }),
    );

    return {
      user,
      stories: storiesWithViews,
    };
  },
});

export const getStoryViewers = query({
  args: {
    storyId: v.id("stories"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!currentUser) throw new Error("User not found");

    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("Story not found");
    if (story.userId !== currentUser._id) throw new Error("Not authorized");

    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
      .order("desc")
      .collect();

    const viewsWithUsers = await Promise.all(
      views.map(async (view) => {
        const user = await ctx.db.get(view.userId);
        return {
          ...view,
          user,
        };
      }),
    );

    return viewsWithUsers;
  },
});

export const getStoryReactions = query({
  args: {
    storyId: v.id("stories"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!currentUser) throw new Error("User not found");

    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("Story not found");
    if (story.userId !== currentUser._id) throw new Error("Not authorized");

    const reactions = await ctx.db
      .query("storyReactions")
      .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
      .order("desc")
      .collect();

    const reactionsWithUsers = await Promise.all(
      reactions.map(async (reaction) => {
        const user = await ctx.db.get(reaction.userId);
        return {
          ...reaction,
          user,
        };
      }),
    );

    return reactionsWithUsers;
  },
});

export const createStory = mutation({
  args: {
    clerkId: v.string(),
    imageId: v.optional(v.id("_storage")),
    videoId: v.optional(v.id("_storage")),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    let imageUrl, videoUrl;

    if (args.mediaType === "image" && args.imageId) {
      imageUrl = await ctx.storage.getUrl(args.imageId);
      if (!imageUrl) throw new Error("Failed to get image URL");
    } else if (args.mediaType === "video" && args.videoId) {
      videoUrl = await ctx.storage.getUrl(args.videoId);
      if (!videoUrl) throw new Error("Failed to get video URL");
    }

    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours from now

    const storyId = await ctx.db.insert("stories", {
      userId: user._id,
      imageUrl,
      imageId: args.imageId,
      videoUrl,
      videoId: args.videoId,
      mediaType: args.mediaType,
      caption: args.caption,
      viewCount: 0,
      createdAt: now,
      expiresAt,
    });

    return storyId;
  },
});

export const viewStory = mutation({
  args: {
    clerkId: v.string(),
    storyId: v.id("stories"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("Story not found");

    // Check if already viewed
    const existingView = await ctx.db
      .query("storyViews")
      .withIndex("by_storyId_userId", (q) =>
        q.eq("storyId", args.storyId).eq("userId", user._id),
      )
      .first();

    if (!existingView) {
      // Add view
      await ctx.db.insert("storyViews", {
        storyId: args.storyId,
        userId: user._id,
        createdAt: Date.now(),
      });

      // Update view count
      await ctx.db.patch(args.storyId, {
        viewCount: (story.viewCount || 0) + 1,
      });
    }

    return true;
  },
});

export const reactToStory = mutation({
  args: {
    clerkId: v.string(),
    storyId: v.id("stories"),
    reaction: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("Story not found");

    // Remove existing reaction if any
    const existingReaction = await ctx.db
      .query("storyReactions")
      .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (existingReaction) {
      await ctx.db.delete(existingReaction._id);
    }

    // Add new reaction
    await ctx.db.insert("storyReactions", {
      storyId: args.storyId,
      userId: user._id,
      reaction: args.reaction,
      createdAt: Date.now(),
    });

    // Create notification for story owner
    if (story.userId !== user._id) {
      await ctx.db.insert("notifications", {
        userId: story.userId,
        fromUserId: user._id,
        type: "like", // Using like type for story reactions
        content: `Reacted ${args.reaction} to your story`,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return true;
  },
});

export const deleteStory = mutation({
  args: {
    clerkId: v.string(),
    storyId: v.id("stories"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const story = await ctx.db.get(args.storyId);
    if (!story) throw new Error("Story not found");
    if (story.userId !== user._id) throw new Error("Not authorized");

    // Delete related data
    const [views, reactions] = await Promise.all([
      ctx.db
        .query("storyViews")
        .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
        .collect(),
      ctx.db
        .query("storyReactions")
        .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
        .collect(),
    ]);

    await Promise.all([
      ...views.map((view) => ctx.db.delete(view._id)),
      ...reactions.map((reaction) => ctx.db.delete(reaction._id)),
    ]);

    // Delete the story
    await ctx.db.delete(args.storyId);

    return true;
  },
});

// Cleanup expired stories (this would typically be run as a scheduled function)
export const cleanupExpiredStories = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredStories = await ctx.db
      .query("stories")
      .withIndex("by_expiresAt")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const story of expiredStories) {
      // Delete related data
      const [views, reactions] = await Promise.all([
        ctx.db
          .query("storyViews")
          .withIndex("by_storyId", (q) => q.eq("storyId", story._id))
          .collect(),
        ctx.db
          .query("storyReactions")
          .withIndex("by_storyId", (q) => q.eq("storyId", story._id))
          .collect(),
      ]);

      await Promise.all([
        ...views.map((view) => ctx.db.delete(view._id)),
        ...reactions.map((reaction) => ctx.db.delete(reaction._id)),
      ]);

      // Delete the story
      await ctx.db.delete(story._id);
    }

    return expiredStories.length;
  },
});