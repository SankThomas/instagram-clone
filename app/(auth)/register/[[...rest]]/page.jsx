"use client";

import { SignUp } from "@clerk/nextjs";
import { Instagram } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
<<<<<<< HEAD
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
=======
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
            <p className="text-gray-500 text-sm font-semibold mb-4">
              Sign up to see photos and videos from your friends.
            </p>
          </div>
          
          <SignUp 
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

        {/* Sign in link */}
        <div className="bg-white border border-gray-300 rounded-sm p-4 text-center">
          <span className="text-sm">Have an account? </span>
          <Link href="/login" className="text-blue-500 font-semibold text-sm hover:text-blue-600">
>>>>>>> 568193d72aa7f05329d94044cd6c4264a351afe8
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
