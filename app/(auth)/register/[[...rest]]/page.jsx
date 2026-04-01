"use client";

import { SignUp } from "@clerk/nextjs";
import { Instagram } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div>
        <div className="border rounded-md p-4 mb-4">
          <div className="text-center mb-8">
            <div className="mb-6">
              <Instagram className="size-12 mx-auto" />
              <h1 className="text-3xl font-bold mt-2">Instagram</h1>
            </div>
            <p className="text-neutral-400 text-sm mb-4">
              Sign up to see photos and videos from your friends.
            </p>
          </div>

          <SignUp />
        </div>

        {/* Sign in link */}
        <div className="border rounded-md p-4 text-center">
          <span className="text-sm">Have an account? </span>
          <Link
            href="/login"
            className="text-blue-500 font-semibold text-sm hover:text-blue-600"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
