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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [mediaType, setMediaType] = useState("image");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [location, setLocation] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const fileInputRef = useRef(null);
  const { user } = useUser();
  const createPost = useMutation(api.posts.createPost);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const resetForm = () => {
    setStep(1);
    setSelectedFiles([]);
    setPreviews([]);
    setMediaType("image");
    setCaption("");
    setHashtags([]);
    setHashtagInput("");
    setLocation("");
    setIsUploading(false);
    setIsCreating(false);
    setCurrentPreviewIndex(0);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check file types and sizes
    const validFiles = [];
    const newPreviews = [];
    let detectedMediaType = "image";

    for (const file of files) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast.error("Please select only image or video files");
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        toast.error("File size must be less than 50MB");
        continue;
      }

      if (file.type.startsWith("video/")) {
        detectedMediaType = "video";
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // If multiple files, it's a carousel (images only)
    if (validFiles.length > 1) {
      const hasVideo = validFiles.some((file) =>
        file.type.startsWith("video/"),
      );
      if (hasVideo) {
        toast.error("Cannot mix videos with other files");
        return;
      }
      detectedMediaType = "carousel";
    }

    setMediaType(detectedMediaType);
    setSelectedFiles(validFiles);

    // Generate previews
    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews[index] = e.target?.result;
        if (newPreviews.length === validFiles.length) {
          setPreviews([...newPreviews]);
          setStep(2);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const nextPreview = () => {
    setCurrentPreviewIndex((prev) =>
      prev === previews.length - 1 ? 0 : prev + 1,
    );
  };

  const prevPreview = () => {
    setCurrentPreviewIndex((prev) =>
      prev === 0 ? previews.length - 1 : prev - 1,
    );
  };

  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const removeFile = (indexToRemove) => {
    const newFiles = selectedFiles.filter(
      (_, index) => index !== indexToRemove,
    );
    const newPreviews = previews.filter((_, index) => index !== indexToRemove);

    setSelectedFiles(newFiles);
    setPreviews(newPreviews);

    if (newFiles.length === 0) {
      setStep(1);
      return;
    }

    // Update media type
    if (newFiles.length === 1) {
      setMediaType(newFiles[0].type.startsWith("video/") ? "video" : "image");
    } else {
      setMediaType("carousel");
    }

    // Adjust current preview index
    if (currentPreviewIndex >= newPreviews.length) {
      setCurrentPreviewIndex(Math.max(0, newPreviews.length - 1));
    }
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
    if (selectedFiles.length === 0 || !user) return;

    setIsCreating(true);

    try {
      setIsUploading(true);

      let imageId, imageIds, videoId;

      if (mediaType === "image") {
        imageId = await uploadFile(selectedFiles[0]);
      } else if (mediaType === "carousel") {
        imageIds = await Promise.all(
          selectedFiles.map((file) => uploadFile(file)),
        );
      } else if (mediaType === "video") {
        videoId = await uploadFile(selectedFiles[0]);
      }
      setIsUploading(false);

      await createPost({
        clerkId: user.id,
        imageId,
        imageIds,
        videoId,
        mediaType,
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
      <DialogContent className="max-w-4xl! max-h-[70vh]! h-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create new post</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <div
              onClick={handleFileInputClick}
              className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <ImageIcon className="size-16 mx-auto mb-4 text-text-secondary" />
              <h3 className="text-lg font-semibold mb-2">
                Select photos or videos to share
              </h3>
              <p className="text-text-secondary mb-4">
                Choose photos or videos from your computer
              </p>
              <Button>
                <Upload className="size-4 mr-2" />
                Select from computer
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
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
                {mediaType === "video" ? (
                  <video
                    src={previews[0]}
                    className="w-full h-full object-cover"
                    controls
                    muted
                  />
                ) : (
                  <Image
                    src={previews[currentPreviewIndex]}
                    alt="Post preview"
                    fill
                    className="object-cover"
                  />
                )}
                {/* Navigation for multiple images */}
                {previews.length > 1 && (
                  <>
                    <button
                      onClick={prevPreview}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
                    >
                      ←
                    </button>
                    <button
                      onClick={nextPreview}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
                    >
                      →
                    </button>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                      {previews.map((_, index) => (
                        <div
                          key={index}
                          className={`size-2 rounded-full ${
                            index === currentPreviewIndex
                              ? "bg-white"
                              : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
                {/* Remove file button */}
                {selectedFiles.length > 1 && (
                  <button
                    onClick={() => removeFile(currentPreviewIndex)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="size-4" />
                  </button>
                )}
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
