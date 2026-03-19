"use client";

import CreatePostModal from "@/components/post/CreatePostModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Bell, Instagram, Menu, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export default function Navigation() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user } = useUser();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip",
  );
  const unreadCount = useQuery(
    api.notifications.getUnreadNotificationCount,
    user ? { clerkId: user.id } : "skip",
  );

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50 lg:hidden">
        <div className="px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <Instagram className="size-7 text-primary" />
              <span className="text-xl font-bold hidden sm:inline">
                Instagram
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="size-5" />
            </Button>

            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {currentUser && (
              <Link href={`/profile/${currentUser.username}`}>
                <Avatar className="size-10">
                  <AvatarImage
                    src={currentUser.profilePictureUrl}
                    className="object-cover"
                  />
                  <AvatarFallback>
                    {currentUser.displayName?.[0]?.toUpperCase() ||
                      currentUser.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
          </div>
        </div>

        {isSearchOpen && (
          <div className="border-t border-border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-primary" />
              <Input
                placeholder="Search users..."
                className="pl-10 pr-10"
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-background z-40 lg:hidden pt-16">
          <div className="p-4 space-y-4">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              Home
            </Link>
            <Link
              href="/search"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              Search
            </Link>
            <Link
              href="/explore"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/reels"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              Reels
            </Link>
            <Link
              href="/notifications"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              Notifications
            </Link>
            <Link
              href="/messages"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              Messages
            </Link>
            {currentUser && (
              <Link
                href={`/profile/${currentUser.username}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block p-3 rounded-lg hover:bg-secondary transition-colors"
              >
                Profile
              </Link>
            )}
            <Link
              href="/settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      )}

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
