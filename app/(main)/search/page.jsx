"use client";

import UserSearchResult from "@/components/search/UserSearchResult";
import { Input } from "@/components/ui/input";
import { UserSearchSkeleton } from "@/components/ui/LoadingSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useQuery, usePaginatedQuery } from "convex/react";
import { Search, Users } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import PostModal from "@/components/profile/PostModal";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const debouncedQuery = useDebounce(searchQuery, 500);

  const searchResults = useQuery(
    api.users.searchUsers,
    debouncedQuery.length > 0 ? { query: debouncedQuery, limit: 20 } : "skip",
  );

  const {
    results: postResults,
    status: postStatus,
    loadMore,
  } = usePaginatedQuery(
    api.posts.searchPosts,
    debouncedQuery.length > 0 ? { query: debouncedQuery } : "skip",
    { initialNumItems: 21 },
  );

  return (
    <div className="space-y-6">
      <div className="sticky top-0 bg-background pb-4 border-b border-border">
        <h1 className="text-2xl font-bold mb-4">Search</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-primary" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {searchQuery.length === 0 ? (
        <div className="text-center py-12">
          <div className="size-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
            <Users className="size-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            Search for people and posts
          </h3>
          <p className="text-primary">
            Find friends, discover new accounts, and search posts by hashtags
          </p>
        </div>
      ) : (
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <div className="space-y-4">
              {!searchResults ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <UserSearchSkeleton key={i} />
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <div className="size-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
                    <Users className="size-12 text-muted-foreground" />
                  </div>
                  <p className="text-primary">
                    No users found for &apos;{searchQuery}&apos;
                  </p>
                </div>
              ) : (
                searchResults.map((user) => (
                  <UserSearchResult key={user._id} user={user} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="posts" className="mt-6">
            {postStatus === "LoadingFirstPage" ? (
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 21 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-secondary animate-pulse rounded"
                  />
                ))}
              </div>
            ) : !postResults || postResults.length === 0 ? (
              <div className="text-center py-12">
                <div className="size-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
                  <Search className="size-12 text-muted-foreground" />
                </div>
                <p className="text-primary">
                  No posts found for &apos;{searchQuery}&apos;
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-1">
                  {postResults.map((post) => (
                    <div
                      key={post._id}
                      className="relative aspect-square cursor-pointer group border rounded"
                      onClick={() => setSelectedPost(post)}
                    >
                      {post.mediaType === "video" && post.videoUrl ? (
                        <video
                          src={post.videoUrl}
                          controls={false}
                          poster={post.thumbnailUrl}
                          className="w-full h-full object-contain"
                          preload="metadata"
                        />
                      ) : (
                        <Image
                          src={
                            post.imageUrls ? post.imageUrls[0] : post.imageUrl
                          }
                          alt={post.caption || "Post image"}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, 640px"
                          priority
                        />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded flex items-center justify-center">
                        <div className="flex items-center gap-4 text-white">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">
                              {post.likeCount || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">
                              {post.commentCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {postStatus === "CanLoadMore" && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => loadMore(21)}
                      className="text-primary hover:underline"
                    >
                      Load more posts
                    </button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}
