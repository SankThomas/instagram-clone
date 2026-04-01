"use client";

import { SignIn } from "@clerk/nextjs";
import { Instagram } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div>
        <div className="border rounded-md mb-4 p-4">
          <div className="text-center mb-8">
            <div className="mx-auto mb-6">
              <Instagram className="size-12 mx-auto" />
              <h1 className="text-3xl font-bold mt-2">Instagram</h1>
            </div>
          </div>

          <SignIn />
        </div>

        <div className="border rounded-md p-4 text-center">
          <span className="text-sm">Don&apos;t have an account? </span>
          <Link
            href="/register"
            className="text-blue-500 font-semibold text-sm hover:text-blue-600"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
