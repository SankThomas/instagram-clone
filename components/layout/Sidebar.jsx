"use client";

import CreatePostModal from "@/components/post/CreatePostModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
  Bookmark,
  Compass,
  Heart,
  Home,
  Instagram,
  LogOut,
  MessageCircle,
  Moon,
  Play,
  Plus,
  Search,
  Settings,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip",
  );
  const unreadCount = useQuery(
    api.notifications.getUnreadNotificationCount,
    user ? { clerkId: user.id } : "skip",
  );

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/reels", icon: Play, label: "Reels" },
    {
      href: "#",
      icon: Plus,
      label: "Create",
      onClick: () => setIsCreateModalOpen(true),
    },
    {
      href: "/notifications",
      icon: Heart,
      label: "Notifications",
      badge: unreadCount,
    },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    {
      href: `/profile/${currentUser?.username}`,
      icon: User,
      label: "Profile",
    },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <>
      <aside className="fixed hidden left-0 top-0 h-full w-64 bg-background border border-border z-30 lg:block">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <Instagram className="size-8" />
            <span className="text-2xl font-bold">Instagram</span>
          </Link>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <div key={item.label}>
                {item.onClick ? (
                  <Button
                    variant="ghost"
                    onClick={item.onClick}
                    className={cn(
                      "w-full justify-start gap-3 h-12 text-base font-normal",
                      "transition-colors",
                    )}
                  >
                    <item.icon className="size-6" />
                    {item.label}
                  </Button>
                ) : (
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-12 text-base font-normal relative",
                        pathname === item.href
                          ? "bg-secondary text-primary"
                          : "",
                        "transition-colors",
                      )}
                    >
                      <item.icon className="size-6" />
                      {item.label}
                      {item.badge > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-auto size-5 p-0 flex items-cener justify-center text-xs"
                        >
                          {item.badge > 99 ? "99+" : item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {currentUser && (
            <div className="absolute bottom-6 left-6 right-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    <div className="flex items-center gap-3 rounded-lg transition-colors">
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

                      <div className="flex-1 text-left truncate">
                        <div className="font-medium truncate">
                          {currentUser.displayName || currentUser.username}
                        </div>
                        <div className="text-sm text-muted-foreground font-light truncate">
                          @{currentUser.username}
                        </div>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/profile/${currentUser.username}`)
                      }
                    >
                      <Button variant="ghost">
                        <User className="size-4 mr-2" /> Profile
                      </Button>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/profile/${currentUser.username}`)
                      }
                    >
                      <Button variant="ghost">
                        <Bookmark className="size-4 mr-2" /> Saved
                      </Button>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </DropdownMenuGroup>
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (theme === "dark") {
                            setTheme("light");
                          } else if (theme === "light") {
                            setTheme("dark");
                          }
                        }}
                      >
                        {theme === "dark" ? (
                          <Moon className="size-4 mr-2" />
                        ) : (
                          <Sun className="size-4 mr-2" />
                        )}{" "}
                        {theme === "dark" ? "Light theme" : "Dark theme"}
                      </Button>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <SignOutButton>
                      <Button variant="ghost">
                        <LogOut className="size-4 mr-2" /> Log out
                      </Button>
                    </SignOutButton>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </aside>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
