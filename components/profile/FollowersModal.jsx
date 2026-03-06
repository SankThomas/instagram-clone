import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import Link from "next/link";
import FollowButton from "./FollowButton";

export default function FollowersModal({ isOpen, onClose, userId, title }) {
  const followers = useQuery(
    api.follows.getFollowers,
    userId ? { userId } : "skip"
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {followers?.page?.map((follow) => (
            <div
              key={follow._id}
              className="flex items-center justify-between"
            >
              <Link
                href={`/profile/${follow.user.username}`}
                className="flex items-center gap-3 flex-1"
                onClick={onClose}
              >
                <Avatar className="size-10">
                  <AvatarImage src={follow.user.profilePictureUrl} />
                  <AvatarFallback>
                    {follow.user.displayName?.[0]?.toUpperCase() ||
                      follow.user.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">
                    {follow.user.displayName || follow.user.username}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    @{follow.user.username}
                  </div>
                </div>
              </Link>

              <FollowButton userId={follow.user._id} />
            </div>
          ))}

          {followers?.page?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No {title.toLowerCase()} yet
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}