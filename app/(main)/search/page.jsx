"use client";

import UserSearchResult from "@/components/search/UserSearchResult";
import { Input } from "@/components/ui/input";
import { UserSearchSkeleton } from "@/components/ui/LoadingSkeleton";
import { api } from "@/convex/_generated/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useQuery } from "convex/react";
import { Search, Users } from "lucide-react";
import { useState } from "react";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 500);

  const searchResults = useQuery(
    api.users.searchUsers,
    debouncedQuery.length > 0 ? { query: debouncedQuery, limit: 20 } : "skip",
  );

  return (
    <div className="space-y-6">
      <div className="sticky top-0 bg-background pb-4 border-b border-border">
        <h1 className="text-2xl font-bold mb-4">Search</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-text-secondary" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {searchQuery.length === 0 ? (
          <div className="text-center py-12">
            <div className="size-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
              <Users className="size-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Search for people</h3>
            <p className="text-text-secondary">
              Find friends and discover new accounts
            </p>
          </div>
        ) : searchResults && searchResults.length === 0 ? (
          <div className="text-center py-12">
            <div className="size-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
              <Users className="size-12 text-muted-foreground" />
            </div>
            <p className="text-text-secondary">
              No users found for &apos;{searchQuery}&apos;
            </p>
          </div>
        ) : !searchResults ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <UserSearchSkeleton key={i} />
            ))}
          </div>
        ) : (
          searchResults?.map((user) => (
            <UserSearchResult key={user._id} user={user} />
          ))
        )}
      </div>
    </div>
  );
}
