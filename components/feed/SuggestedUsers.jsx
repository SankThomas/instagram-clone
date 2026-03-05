"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import Link from "next/link";
import FollowButton from "../profile/FollowButton";

export default function SuggestedUsers() {
  const { user } = useUser();
  const suggestedUsers = useQuery(
    api.users.getSuggestedUsers,
    user ? { clerkId: user.id } : "skip",
  );

  if (!suggestedUsers || suggestedUsers.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg p-4 border w-80">
      <h3 className="font-semibold mb-4">Suggested for you</h3>

      <div className="space-y-3">
        {suggestedUsers.slice(0, 5).map((suggestedUser) => (
          <div
            key={suggestedUser._id}
            className="flex items-center justify-between"
          >
            <Link
              href={`/profile/${suggestedUser.username}`}
              className="flex items-center gap-3 flex-1"
            >
              <Avatar className="size-10">
                <AvatarImage
                  src={suggestedUser.profilePictureUrl}
                  className="object-cover"
                />
                <AvatarFallback>
                  {suggestedUser.displayName?.[0]?.toUpperCase() ||
                    suggestedUser.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">
                  {suggestedUser.displayName || suggestedUser.username}
                </div>

                <div className="text-xs text-muted-foreground truncate">
                  @{suggestedUser.username}
                </div>
              </div>
            </Link>

            <FollowButton userId={suggestedUser._id} />
          </div>
        ))}
      </div>

      <Link href="/explore">
        <Button variant="ghost" className="w-full mt-3 text-sm">
          See all suggestions
        </Button>
      </Link>
    </div>
  );
}
