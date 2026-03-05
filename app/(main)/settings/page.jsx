"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useClerk, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
  Bell,
  Computer,
  ExternalLink,
  HelpCircle,
  LogOut,
  Moon,
  Palette,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { toast } from "sonner";

export default function SettingsPage() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();

  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip",
  );
  const userStats = useQuery(
    api.users.getUserStats,
    currentUser ? { userId: currentUser._id } : "skip",
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Account Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent>
          {currentUser && (
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarImage src={currentUser.profilePictureUrl} />
                <AvatarFallback className="text-xl">
                  {currentUser.displayName?.[0]?.toUpperCase() ||
                    currentUser.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">
                    {currentUser.displayName || currentUser.username}
                  </h3>
                  {currentUser.isVerified && (
                    <Badge variant="secondary">Verified</Badge>
                  )}
                </div>
                <div className="text-text-secondary text-sm mb-2">
                  @{currentUser.username}
                </div>
                <div className="flex gap-4 text-sm">
                  <span>{userStats?.postCount || 0} posts</span>
                  <span>{userStats?.followerCount || 0} followers</span>
                  <span>{userStats?.followingCount || 0} following</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Options */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Profile
            </CardTitle>
            <CardDescription>Edit your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/profile/${currentUser?.username}`}>
              <Button variant="outline" className="w-full">
                View Profile <ExternalLink className="size-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Manage your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/notifications">
              <Button variant="outline" className="w-full">
                View Notifications <ExternalLink className="size-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5" />
              Privacy
            </CardTitle>
            <CardDescription>Control who can see your content</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Privacy Settings{" "}
              <Badge variant="secondary" className="ml-2">
                Coming Soon
              </Badge>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how Instagram looks</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
            >
              <Sun className="size-4" /> Light
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
            >
              <Moon className="size-4" /> Dark
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              onClick={() => setTheme("system")}
            >
              <Computer className="size-4" /> System
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sign Out */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Sign out of your account on this device
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
