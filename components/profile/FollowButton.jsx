"use client";

import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";

export default function FollowButton({ userId }) {
  const { user } = useUser();
  const isFollowing = useQuery(
    api.follows.isFollowing,
    user ? { clerkId: user.id, userId } : "skip",
  );
  const toggleFollow = useMutation(api.follows.toggleFollow);

  const handleToggleFollow = async () => {
    if (!user) return;
    try {
      const nowFollowing = await toggleFollow({ clerkId: user.id, userId });
      toast.success(nowFollowing ? "Following user" : "Unfollowed user");
    } catch (error) {
      toast.error("Failed to update follow status");
    }
  };

  return (
    <>
      <Button
        onClick={handleToggleFollow}
        variant={isFollowing ? "outline" : "default"}
        className="flex items-center gap-2"
      >
        {isFollowing ? (
          <>
            <UserMinus className="size-4" />
            Unfollow
          </>
        ) : (
          <>
            <UserPlus className="size-4" />
            Follow
          </>
        )}
      </Button>
    </>
  );
}
