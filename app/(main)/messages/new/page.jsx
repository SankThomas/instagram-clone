"use client";

import { useUser } from "@clerk/nextjs";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function NewMessagePage() {
  const { user } = useUser();

  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip",
  );
  const { results: following, status } = usePaginatedQuery(
    api.follows.getFollowing,
    user ? { userId: currentUser?._id } : "skip",
    { initialNumItems: 20 },
  );

  if (!following) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">New Message</h1>

      {following.map((follow) => (
        <Link
          key={follow._id}
          href={`/messages/${follow.user.username}`}
          className="flex items-center gap-3 p-3 hover:bg-secondary rounded-lg"
        >
          <Avatar>
            <AvatarImage src={follow.user.profilePictureUrl} />
            <AvatarFallback>
              {follow.user.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="font-semibold">{follow.user.displayName}</div>
            <div className="text-sm text-muted-foreground">
              @{follow.user.username}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
