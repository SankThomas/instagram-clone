"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Instagram } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-full mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="mx-auto size-16 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Instagram className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-text-secondary">
            Sign in to your account to continue
          </p>
        </div>

        <SignIn />

        <div className="text-center text-sm">
          <span className="text-text-secondary">
            Don&apos;t have an account?{" "}
          </span>
          <Link href="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
