import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getCurrentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    // Check if username is taken
    const existingUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existingUsername) {
      throw new Error("Username already taken");
    }

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      username: args.username,
      displayName: args.displayName,
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
      createdAt: Date.now(),
      lastActive: Date.now(),
    });

    return userId;
  },
});

export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
  },
});

export const searchUsers = query({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const searchQuery = args.query.toLowerCase();

    const users = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(
          q.gte(q.field("username"), searchQuery),
          q.gte(q.field("displayName"), searchQuery),
        ),
      )
      .take(limit);

    return users.filter(
      (user) =>
        user.username?.toLowerCase().includes(searchQuery) ||
        user.displayName?.toLowerCase().includes(searchQuery),
    );
  },
});

export const getSuggestedUsers = query({
  args: { clerkId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!currentUser) return [];

    // Get users the current user is already following
    const following = await ctx.db
      .query("follows")
      .withIndex("by_followerId", (q) => q.eq("followerId", currentUser._id))
      .collect();
    const followingIds = following.map((f) => f.followingId);
    followingIds.push(currentUser._id); // Exclude self

    // Get all users not being followed
    const allUsers = await ctx.db.query("users").collect();
    const suggestedUsers = allUsers
      .filter((user) => !followingIds.includes(user._id))
      .sort((a, b) => (b.followerCount || 0) - (a.followerCount || 0))
      .slice(0, limit);

    return suggestedUsers;
  },
});

export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    // Check if username is taken (if provided)
    if (args.username) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .first();

      if (existingUser && existingUser._id !== user._id) {
        throw new Error("Username already taken");
      }
    }

    const { clerkId, ...updateData } = args;
    await ctx.db.patch(user._id, updateData);
    return await ctx.db.get(user._id);
  },
});

export const uploadProfilePicture = mutation({
  args: {
    clerkId: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const imageUrl = await ctx.storage.getUrl(args.storageId);

    await ctx.db.patch(user._id, {
      profilePictureId: args.storageId,
      profilePictureUrl: imageUrl,
    });

    return imageUrl;
  },
});

export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const [followerCount, followingCount, postCount] = await Promise.all([
      ctx.db
        .query("follows")
        .withIndex("by_followingId", (q) => q.eq("followingId", args.userId))
        .collect()
        .then((follows) => follows.length),
      ctx.db
        .query("follows")
        .withIndex("by_followerId", (q) => q.eq("followerId", args.userId))
        .collect()
        .then((follows) => follows.length),
      ctx.db
        .query("posts")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect()
        .then((posts) => posts.length),
    ]);

    return {
      followerCount,
      followingCount,
      postCount,
    };
  },
});
