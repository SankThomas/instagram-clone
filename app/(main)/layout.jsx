"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navigation from "@/components/layout/Navigation";
import Sidebar from "@/components/layout/Sidebar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useUser } from "@clerk/nextjs";

export default function MainLayout({ children }) {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const createUser = useMutation(api.users.createUser);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login");
    }
  }, [isSignedIn, isLoaded, router]);

  useEffect(() => {
    if (isSignedIn && user) {
      // Create or update user in Convex
      const username =
        user.username ||
        user.emailAddresses[0]?.emailAddress.split("@")[0] ||
        "user";
      createUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        username: username.toLowerCase().replace(/[^a-z0-9._]/g, ""),
        displayName: user.fullName || username,
      }).catch(console.error);
    }
  }, [isSignedIn, user, createUser]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-screen pt-16 lg:pt-0 lg:pl-64">
          <div className="max-w-5xl p-8 mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
