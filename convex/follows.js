import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const isFollowing = query({
  args: {
    clerkId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!currentUser) return false;

    const follow = await ctx.db
      .query("follows")
      .withIndex("by_followerId_followingId", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", args.userId),
      )
      .first();

    return !!follow;
  },
});

export const getFollowers = query({
  args: {
    userId: v.id("users"),
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_followingId", (q) => q.eq("followingId", args.userId))
      .order("desc")
      .paginate(args.paginationOpts || { numItems: 20 });

    const followersWithUserData = await Promise.all(
      follows.page.map(async (follow) => {
        const user = await ctx.db.get(follow.followerId);
        return {
          ...follow,
          user,
        };
      }),
    );

    return {
      ...follows,
      page: followersWithUserData,
    };
  },
});

export const getFollowing = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_followerId", (q) => q.eq("followerId", args.userId))
      .order("desc")
      .paginate(args.paginationOpts);

    const followingWithUserData = await Promise.all(
      follows.page.map(async (follow) => {
        const user = await ctx.db.get(follow.followingId);
        return {
          ...follow,
          user,
        };
      }),
    );

    return {
      ...follows,
      page: followingWithUserData,
    };
  },
});

export const toggleFollow = mutation({
  args: {
    clerkId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!currentUser) throw new Error("User not found");
    if (currentUser._id === args.userId)
      throw new Error("Cannot follow yourself");

    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_followerId_followingId", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", args.userId),
      )
      .first();

    const [_, targetUser] = await Promise.all([
      Promise.resolve(currentUser),
      ctx.db.get(args.userId),
    ]);

    if (!targetUser) throw new Error("User not found");

    if (existingFollow) {
      // Unfollow
      await ctx.db.delete(existingFollow._id);

      // Update counts
      await ctx.db.patch(currentUser._id, {
        followingCount: Math.max(0, (currentUser.followingCount || 0) - 1),
      });

      await ctx.db.patch(args.userId, {
        followerCount: Math.max(0, (targetUser.followerCount || 0) - 1),
      });

      return false;
    } else {
      // Follow
      await ctx.db.insert("follows", {
        followerId: currentUser._id,
        followingId: args.userId,
        createdAt: Date.now(),
      });

      // Update counts
      await ctx.db.patch(currentUser._id, {
        followingCount: (currentUser.followingCount || 0) + 1,
      });

      await ctx.db.patch(args.userId, {
        followerCount: (targetUser.followerCount || 0) + 1,
      });

      // Create notification
      await ctx.db.insert("notifications", {
        userId: args.userId,
        fromUserId: currentUser._id,
        type: "follow",
        isRead: false,
        createdAt: Date.now(),
      });

      return true;
    }
  },
});
