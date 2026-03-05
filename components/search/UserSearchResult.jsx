import Link from "next/link";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export default function UserSearchResult({ user }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-primary/10 rounded-lg transition-colors border">
      <Link
        href={`/profile/${user.username}`}
        className="flex items-center gap-4 flex-1"
      >
        <Avatar className="size-12">
          <AvatarImage src={user.profilePictureUrl} className="object-cover" />
          <AvatarFallback>
            {user.displayName?.[0]?.toUpperCase() ||
              user.username?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">
            {user.displayName || user.username}
          </div>
          <div className="text-sm text-text-secondary truncate">
            @{user.username}
          </div>
          {user.bio && (
            <div className="text-sm text-text-secondary truncate mt-1">
              {user.bio}
            </div>
          )}
        </div>
      </Link>
      <div className="text-sm text-text-secondary">
        {user.followerCount || 0}{" "}
        {user.followerCount === 1 ? "follower" : "followers"}
      </div>
    </div>
  );
}
