"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function CreatePostModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Edit
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [location, setLocation] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fileInputRef = useRef(null);
  const { user } = useUser();
  const createPost = useMutation(api.posts.createPost);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const resetForm = () => {
    setStep(1);
    setSelectedFile(null);
    setPreview("");
    setCaption("");
    setHashtags([]);
    setHashtagInput("");
    setLocation("");
    setIsUploading(false);
    setIsCreating(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast.error("Image size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result);
      setStep(2);
    };
    reader.readAsDataURL(file);
  };

  const handleAddHashtag = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const tag = hashtagInput.trim().replace(/^#/, "");
      if (tag && !hashtags.includes(tag) && hashtags.length < 10) {
        setHashtags([...hashtags, tag]);
        setHashtagInput("");
      }
    }
  };

  const removeHashtag = (tagToRemove) => {
    setHashtags(hashtags.filter((tag) => tag !== tagToRemove));
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

  const handleSubmit = async () => {
    if (!selectedFile || !user) return;

    setIsCreating(true);

    try {
      setIsUploading(true);
      const imageId = await uploadFile(selectedFile);
      setIsUploading(false);

      await createPost({
        clerkId: user.id,
        imageId,
        caption: caption.trim() || undefined,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        location: location.trim() || undefined,
      });

      toast.success("Post created successfully!");
      resetForm();
      onClose();
    } catch (error) {
      toast.error("Failed to create post");
      console.error("Create post error:", error);
    } finally {
      setIsCreating(false);
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create new post</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <ImageIcon className="size-16 mx-auto mb-4 text-text-secondary" />
              <h3 className="text-lg font-semibold mb-2">
                Select photo to share
              </h3>
              <p className="text-text-secondary mb-4">
                Choose a photo from your computer
              </p>
              <Button>
                <Upload className="size-4 mr-2" />
                Select from computer
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Image Preview */}
              <div className="relative aspect-square bg-secondary rounded-lg overflow-hidden">
                <Image
                  src={preview}
                  alt="Post preview"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Post Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    placeholder="Write a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                  <div className="text-xs text-text-secondary text-right">
                    {caption.length}/500
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hashtags">Hashtags</Label>
                  <Input
                    id="hashtags"
                    placeholder="Add hashtags (press Enter or Space)"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={handleAddHashtag}
                  />
                  {hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {hashtags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeHashtag(tag)}
                        >
                          #{tag}
                          <X className="size-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Add location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isCreating || isUploading}
              >
                {isUploading
                  ? "Uploading..."
                  : isCreating
                    ? "Creating..."
                    : "Share"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
