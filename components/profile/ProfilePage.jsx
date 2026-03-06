"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid2x2, Bookmark, Settings } from "lucide-react";
import ProfilePosts from "./ProfilePosts";
import FollowButton from "./FollowButton";
import EditProfileModal from "./EditProfileModal";
import { ProfileSkeleton } from "../ui/LoadingSkeleton";
import SavedPosts from "./SavedPosts";
import FollowersModal from "./FollowersModal";
import FollowingModal from "./FollowingModal";

export default function ProfilePage({ username }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const { user: clerkUser } = useUser();
  const user = useQuery(api.users.getUserByUsername, { username });
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: clerkUser.id } : "skip",
  );
  const userStats = useQuery(
    api.users.getUserStats,
    user ? { userId: user._id } : "skip",
  );

  if (!user && username) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">User not found</h2>
        <p className="text-text-secondary">
          The profile you are looking for does not exist.
        </p>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser._id === user._id;

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row gap-8 items-start">
        <div className="shrink-0 mx-auto sm:mx-0">
          <Avatar className="size-32 sm:w-40 sm:h-40">
            <AvatarImage
              src={user.profilePictureUrl}
              className="object-cover"
            />
            <AvatarFallback className="text-4xl">
              {user.displayName?.[0]?.toUpperCase() ||
                user.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 space-y-6 text-center sm:text-left">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-normal">{user.username}</h1>
                {user.isVerified && <Badge variant="secondary">Verified</Badge>}
              </div>

              <div className="flex gap-2 justify-center sm:justify-start">
                {isOwnProfile ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      <Settings className="size-4 mr-2" />
                      Edit profile
                    </Button>
                  </>
                ) : (
                  <FollowButton userId={user._id} />
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center sm:justify-start gap-8 text-sm">
              <div className="text-center">
                <div className="font-semibold text-lg">
                  {userStats?.postCount || 0}
                </div>
                <div className="text-text-secondary">posts</div>
              </div>
              <div 
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowFollowers(true)}
              >
                <div className="font-semibold text-lg">
                  {userStats?.followerCount || 0}
                </div>
                <div className="text-text-secondary">followers</div>
              </div>
              <div 
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowFollowing(true)}
              >
                <div className="font-semibold text-lg">
                  {userStats?.followingCount || 0}
                </div>
                <div className="text-text-secondary">following</div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            {user.displayName && (
              <div className="font-semibold">{user.displayName}</div>
            )}
            {user.bio && (
              <div className="text-sm whitespace-pre-wrap">
                {user.bio.split(" ").map((word, index) => {
                  if (
                    word.startsWith("http://") ||
                    word.startsWith("https://") ||
                    word.includes(".com") ||
                    word.includes(".org") ||
                    word.includes(".net")
                  ) {
                    return (
                      <a
                        key={index}
                        href={
                          word.startsWith("http") ? word : `https://${word}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {word}{" "}
                      </a>
                    );
                  }
                  return word + " ";
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      {isOwnProfile && (
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Grid2x2 className="size-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="size-4" />
              Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-8">
            <ProfilePosts userId={user._id} />
          </TabsContent>

          <TabsContent value="saved" className="mt-8">
            <SavedPosts />
          </TabsContent>
        </Tabs>
      )}

      {!isOwnProfile && (
        <ProfilePosts userId={user._id} isOwnProfile={isOwnProfile} />
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
      />

      {/* Followers Modal */}
      <FollowersModal
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        userId={user?._id}
        title="Followers"
      />

      {/* Following Modal */}
      <FollowingModal
        isOpen={showFollowing}
        onClose={() => setShowFollowing(false)}
        userId={user?._id}
        title="Following"
      />
    </div>
  );
}
