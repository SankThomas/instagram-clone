import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const getConversations = query({
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

    const conversations = await ctx.db
      .query("conversations")
      .filter((q) => q.gte(q.field("participants"), [user._id]))
      .order("desc")
      .paginate(args.paginationOpts);

    const conversationsWithData = await Promise.all(
      conversations.page.map(async (conversation) => {
        const otherParticipantId = conversation.participants.find(
          (id) => id !== user._id,
        );
        const otherParticipant = otherParticipantId
          ? await ctx.db.get(otherParticipantId)
          : null;

        const lastMessage = conversation.lastMessageId
          ? await ctx.db.get(conversation.lastMessageId)
          : null;

        const unreadCount = await ctx.db
          .query("messages")
          .filter((q) =>
            q.and(
              q.eq(q.field("receiverId"), user._id),
              q.eq(q.field("senderId"), otherParticipantId),
              q.eq(q.field("isRead"), false),
            ),
          )
          .collect()
          .then((messages) => messages.length);

        return {
          ...conversation,
          otherParticipant,
          lastMessage,
          unreadCount,
        };
      }),
    );

    return {
      ...conversations,
      page: conversationsWithData,
    };
  },
});

export const getMessages = query({
  args: {
    clerkId: v.string(),
    otherUserId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return { page: [], isDone: true, continueCursor: null };

    const messages = await ctx.db
      .query("messages")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("senderId"), user._id),
            q.eq(q.field("receiverId"), args.otherUserId),
          ),
          q.and(
            q.eq(q.field("senderId"), args.otherUserId),
            q.eq(q.field("receiverId"), user._id),
          ),
        ),
      )
      .order("asc")
      .paginate(args.paginationOpts);

    const messagesWithData = await Promise.all(
      messages.page.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        const post = message.postId ? await ctx.db.get(message.postId) : null;

        return {
          ...message,
          sender,
          post,
        };
      }),
    );

    return {
      ...messages,
      page: messagesWithData,
    };
  },
});

export const sendMessage = mutation({
  args: {
    clerkId: v.string(),
    receiverId: v.id("users"),
    content: v.string(),
    messageType: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video"),
      v.literal("post"),
    ),
    imageId: v.optional(v.id("_storage")),
    videoId: v.optional(v.id("_storage")),
    postId: v.optional(v.id("posts")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    let imageUrl, videoUrl;
    if (args.imageId) {
      imageUrl = await ctx.storage.getUrl(args.imageId);
    }
    if (args.videoId) {
      videoUrl = await ctx.storage.getUrl(args.videoId);
    }

    const messageId = await ctx.db.insert("messages", {
      senderId: user._id,
      receiverId: args.receiverId,
      content: args.content,
      messageType: args.messageType,
      imageUrl,
      imageId: args.imageId,
      videoUrl,
      videoId: args.videoId,
      postId: args.postId,
      isRead: false,
      createdAt: Date.now(),
    });

    // Create or update conversation
    const existingConversation = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.or(
          q.eq(q.field("participants"), [user._id, args.receiverId]),
          q.eq(q.field("participants"), [args.receiverId, user._id]),
        ),
      )
      .first();

    if (existingConversation) {
      await ctx.db.patch(existingConversation._id, {
        lastMessageId: messageId,
        lastMessageAt: Date.now(),
      });
    } else {
      await ctx.db.insert("conversations", {
        participants: [user._id, args.receiverId],
        lastMessageId: messageId,
        lastMessageAt: Date.now(),
        createdAt: Date.now(),
      });
    }

    return messageId;
  },
});

export const markMessagesAsRead = mutation({
  args: {
    clerkId: v.string(),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const unreadMessages = await ctx.db
      .query("messages")
      .filter((q) =>
        q.and(
          q.eq(q.field("senderId"), args.otherUserId),
          q.eq(q.field("receiverId"), user._id),
          q.eq(q.field("isRead"), false),
        ),
      )
      .collect();

    await Promise.all(
      unreadMessages.map((message) =>
        ctx.db.patch(message._id, { isRead: true }),
      ),
    );

    return unreadMessages.length;
  },
});
