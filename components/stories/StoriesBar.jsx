"use client";

import { useState } from "react";
import { usePaginatedQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CreateStoryModal from "./CreateStoryModal";
import StoryViewer from "./StoryViewer";

export default function StoriesBar() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserStories, setSelectedUserStories] = useState(null);
  const { user } = useUser();

  const {
    results: stories,
    status,
  } = usePaginatedQuery(
    api.stories.getActiveStories,
    { clerkId: user?.id },
    { initialNumItems: 20 },
  );

  if (status === "LoadingFirstPage") {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 min-w-0">
            <div className="size-16 bg-secondary rounded-full animate-pulse" />
            <div className="w-12 h-3 bg-secondary rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!stories || stories.length === 0) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto">
        <div className="flex flex-col items-center gap-2 min-w-0">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="size-16 rounded-full p-0 bg-secondary hover:bg-secondary/80 border-2 border-dashed border-border"
          >
            <Plus className="size-6 text-primary" />
          </Button>
          <span className="text-xs text-center truncate w-16">Your story</span>
        </div>

        <CreateStoryModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 p-4 overflow-x-auto border-b">
        {/* Add story button */}
        <div className="flex flex-col items-center gap-2 min-w-0">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="size-16 rounded-full p-0 bg-secondary hover:bg-secondary/80 border-2 border-dashed border-border"
          >
            <Plus className="size-6 text-primary" />
          </Button>
          <span className="text-xs text-center truncate w-16">Your story</span>
        </div>

        {/* Stories from followed users */}
        {stories.map((userStory) => (
          <div
            key={userStory.user._id}
            className="flex flex-col items-center gap-2 min-w-0 cursor-pointer"
            onClick={() => setSelectedUserStories(userStory)}
          >
            <div
              className={`p-0.5 rounded-full ${
                userStory.hasUnviewed
                  ? "bg-linear-to-tr from-yellow-400 to-pink-600"
                  : "bg-secondary"
              }`}
            >
              <div className="p-0.5 bg-background rounded-full">
                <Avatar className="size-14">
                  <AvatarImage
                    src={userStory.user.profilePictureUrl}
                    className="object-cover"
                  />
                  <AvatarFallback>
                    {userStory.user.displayName?.[0]?.toUpperCase() ||
                      userStory.user.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-xs text-center truncate w-16">
              {userStory.user.username}
            </span>
          </div>
        ))}
      </div>

      <CreateStoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {selectedUserStories && (
        <StoryViewer
          userStories={selectedUserStories}
          onClose={() => setSelectedUserStories(null)}
        />
      )}
    </>
  );
}