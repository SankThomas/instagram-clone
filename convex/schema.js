import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    username: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
    profilePictureId: v.optional(v.id("_storage")),
    isVerified: v.optional(v.boolean()),
    followerCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
    postCount: v.optional(v.number()),
    createdAt: v.number(),
    lastActive: v.optional(v.number()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_username", ["username"])
    .index("by_email", ["email"])
    .index("by_lastActive", ["lastActive"]),

  posts: defineTable({
    userId: v.id("users"),
    imageUrl: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    imageUrls: v.optional(v.array(v.string())),
    imageIds: v.optional(v.array(v.id("_storage"))),
    videoUrl: v.optional(v.string()),
    videoId: v.optional(v.id("_storage")),
    mediaType: v.union(v.literal("image"), v.literal("video"), v.literal("carousel")),
    caption: v.optional(v.string()),
    hashtags: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    likeCount: v.optional(v.number()),
    commentCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_hashtags", ["hashtags"])
    .index("by_mediaType", ["mediaType"]),

  messages: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
    messageType: v.union(v.literal("text"), v.literal("image"), v.literal("post")),
    imageUrl: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    postId: v.optional(v.id("posts")),
    isRead: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_senderId", ["senderId"])
    .index("by_receiverId", ["receiverId"])
    .index("by_senderId_receiverId", ["senderId", "receiverId"])
    .index("by_createdAt", ["createdAt"]),

  conversations: defineTable({
    participants: v.array(v.id("users")),
    lastMessageId: v.optional(v.id("messages")),
    lastMessageAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_participants", ["participants"])
    .index("by_lastMessageAt", ["lastMessageAt"]),

  likes: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_postId", ["postId"])
    .index("by_userId_postId", ["userId", "postId"]),

  comments: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    content: v.string(),
    likeCount: v.optional(v.number()),
    parentCommentId: v.optional(v.id("comments")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_postId", ["postId"])
    .index("by_userId", ["userId"])
    .index("by_parentCommentId", ["parentCommentId"])
    .index("by_createdAt", ["createdAt"]),

  commentLikes: defineTable({
    userId: v.id("users"),
    commentId: v.id("comments"),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_commentId", ["commentId"])
    .index("by_userId_commentId", ["userId", "commentId"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_followerId", ["followerId"])
    .index("by_followingId", ["followingId"])
    .index("by_followerId_followingId", ["followerId", "followingId"]),

  notifications: defineTable({
    userId: v.id("users"),
    fromUserId: v.optional(v.id("users")),
    type: v.union(
      v.literal("like"),
      v.literal("comment"),
      v.literal("follow"),
      v.literal("mention"),
    ),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    content: v.optional(v.string()),
    isRead: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_isRead", ["isRead"]),

  savedPosts: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_postId", ["postId"])
    .index("by_userId_postId", ["userId", "postId"]),
});
