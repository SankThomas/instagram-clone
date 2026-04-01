"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Instagram } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Instagram-style container */}
        <div className="bg-white border border-gray-300 rounded-sm p-10 mb-4">
          <div className="text-center mb-8">
            <div className="mx-auto mb-6">
              <Instagram className="size-12 mx-auto text-black" />
              <h1 className="text-3xl font-light mt-2" style={{ fontFamily: 'Billabong, cursive' }}>
                Instagram
              </h1>
            </div>
          </div>
          
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-blue-500 hover:bg-blue-600 text-sm font-semibold",
                card: "shadow-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: 
                  "border border-gray-300 text-gray-700 hover:bg-gray-50",
                formFieldInput: 
                  "border border-gray-300 rounded-sm bg-gray-50 text-sm",
                footerActionLink: "text-blue-500 hover:text-blue-600",
              },
            }}
          />
        </div>

        {/* Sign up link */}
        <div className="bg-white border border-gray-300 rounded-sm p-4 text-center">
          <span className="text-sm">Don&apos;t have an account? </span>
          <Link href="/register" className="text-blue-500 font-semibold text-sm hover:text-blue-600">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
