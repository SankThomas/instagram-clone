"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X, Image as ImageIcon, Video } from "lucide-react";
import { toast } from "sonner";

export default function CreateStoryModal({ isOpen, onClose }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fileInputRef = useRef(null);
  const { user } = useUser();
  const createStory = useMutation(api.stories.createStory);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const resetForm = () => {
    setSelectedFile(null);
    setPreview("");
    setMediaType("image");
    setCaption("");
    setIsUploading(false);
    setIsCreating(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Please select only image or video files");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    const detectedMediaType = file.type.startsWith("video/") ? "video" : "image";
    setMediaType(detectedMediaType);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file) => {
    try {
      const uploadUrl = await generateUploadUrl();
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
      throw new Error("Failed to upload file");
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !user) return;

    setIsCreating(true);

    try {
      setIsUploading(true);
      const fileId = await uploadFile(selectedFile);
      setIsUploading(false);

      await createStory({
        clerkId: user.id,
        imageId: mediaType === "image" ? fileId : undefined,
        videoId: mediaType === "video" ? fileId : undefined,
        mediaType,
        caption: caption.trim() || undefined,
      });

      toast.success("Story created successfully!");
      resetForm();
      onClose();
    } catch (error) {
      toast.error("Failed to create story");
      console.error("Create story error:", error);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
        </DialogHeader>

        {!selectedFile ? (
          <div className="space-y-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <div className="flex justify-center gap-4 mb-4">
                <ImageIcon className="size-8 text-primary" />
                <Video className="size-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Share a moment
              </h3>
              <p className="text-primary mb-4">
                Choose a photo or video for your story
              </p>
              <Button>
                <Upload className="size-4 mr-2" />
                Select file
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative aspect-9/16 bg-black rounded-lg overflow-hidden">
              {mediaType === "video" ? (
                <video
                  src={preview}
                  className="w-full h-full object-cover"
                  controls
                  muted
                />
              ) : (
                <Image
                  src={preview}
                  alt="Story preview"
                  fill
                  className="object-cover"
                />
              )}
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview("");
                }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="caption">Caption (optional)</Label>
                <Textarea
                  id="caption"
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  maxLength={200}
                />
                <div className="text-xs text-primary text-right">
                  {caption.length}/200
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => {
                setSelectedFile(null);
                setPreview("");
              }}>
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
                    : "Share Story"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}