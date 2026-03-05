"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { Camera, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function EditProfileModal({ isOpen, onClose, user }) {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isLoading, setIsLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profilePictureUrl || "");

  const router = useRouter();

  const fileInputRef = useRef(null);
  const { user: clerkUser } = useUser();
  const updateProfile = useMutation(api.users.updateProfile);
  const uploadProfilePicture = useMutation(api.users.uploadProfilePicture);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      // 20MB limit
      toast.error("Image size must be less than 20MB");
      return;
    }

    setProfilePicture(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result);
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file) => {
    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.status}`);
      }

      const { storageId } = await result.json();
      return storageId;
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error("Failed to upload image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clerkUser) return;
    setIsLoading(true);

    try {
      // Upload profile picture if changed
      if (profilePicture) {
        const storageId = await uploadFile(profilePicture);
        await uploadProfilePicture({ clerkId: clerkUser.id, storageId });
      }

      // Update profile info
      await updateProfile({
        clerkId: clerkUser.id,
        displayName: displayName.trim() || undefined,
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
      });

      // Show the new profile page if username is updated
      if (username) {
        router.push(`/profile/${username}`);
      } else {
        return null;
      }

      toast.success("Profile updated successfully");
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // Reset form
      setDisplayName(user?.displayName || "");
      setUsername(user?.username || "");
      setBio(user?.bio || "");
      setProfilePicture(null);
      setPreviewUrl(user?.profilePictureUrl || "");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div className="text-center">
            <div className="relative inline-block">
              <Avatar className="size-24">
                <AvatarImage src={previewUrl} className="object-cover" />
                <AvatarFallback className="text-2xl">
                  {displayName?.[0]?.toUpperCase() ||
                    username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute -bottom-2 -right-2 rounded-full size-8 p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Camera className="size-4" />
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-sm text-text-secondary mt-2">
              Click the camera icon to change your profile picture
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                maxLength={50}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""),
                  )
                }
                placeholder="your_username"
                maxLength={30}
                disabled={isLoading}
              />
              <p className="text-xs text-text-secondary">
                Username can only contain letters, numbers, dots, and
                underscores
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={150}
                disabled={isLoading}
              />
              <div className="text-xs text-text-secondary text-right">
                {bio.length}/150
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
