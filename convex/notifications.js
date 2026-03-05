import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const getNotifications = query({
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

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    const notificationsWithData = await Promise.all(
      notifications.page.map(async (notification) => {
        const fromUser = notification.fromUserId
          ? await ctx.db.get(notification.fromUserId)
          : null;
        const post = notification.postId
          ? await ctx.db.get(notification.postId)
          : null;
        const comment = notification.commentId
          ? await ctx.db.get(notification.commentId)
          : null;

        return {
          ...notification,
          fromUser,
          post,
          comment,
        };
      }),
    );

    return {
      ...notifications,
      page: notificationsWithData,
    };
  },
});

export const getUnreadNotificationCount = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return 0;

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    return unreadNotifications.length;
  },
});

export const markNotificationAsRead = mutation({
  args: {
    clerkId: v.string(),
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.notificationId, { isRead: true });
    return true;
  },
});

export const markAllNotificationsAsRead = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, { isRead: true }),
      ),
    );

    return unreadNotifications.length;
  },
});
