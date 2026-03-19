"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Instagram } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-8">
          <div className="mx-auto size-16 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Instagram className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Create account</h1>
          <p className="text-primary">Sign up to start sharing your moments</p>
        </div>

        <SignUp />

        <div className="text-center text-sm">
          <span className="text-primary">Already have an account? </span>
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
