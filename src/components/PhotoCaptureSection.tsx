"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

async function fileToDataUrl(file: File): Promise<string> {
  if (file.size <= 900_000 && file.type.startsWith("image/")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const bitmap = await createImageBitmap(file);
  const maxWidth = 1280;
  const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not process image");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
  const dataUrl = canvas.toDataURL(mime, mime === "image/jpeg" ? 0.82 : undefined);
  return dataUrl;
}

type PhotoItem = { id: string; url: string; tag: string };

export function PhotoCaptureSection({
  disabled,
  inspectionId,
  photoTag,
  onPhotoTagChange,
  photos,
  onPhotoAdded,
}: {
  disabled?: boolean;
  inspectionId?: string;
  photoTag: "BEFORE" | "AFTER" | "GENERAL";
  onPhotoTagChange: (tag: "BEFORE" | "AFTER" | "GENERAL") => void;
  photos: PhotoItem[];
  onPhotoAdded: (photo: PhotoItem) => void;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadFile(file: File) {
    if (!inspectionId) {
      setError("Save draft first, then you can add photos.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const dataUrl = await fileToDataUrl(file);
      const fd = new FormData();
      fd.append("file", dataUrl);
      fd.append("tag", photoTag);

      const res = await fetch(`/api/inspections/${inspectionId}/photos`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      onPhotoAdded(data.photo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    await uploadFile(file);
  }

  return (
    <div className="space-y-4">
      {!disabled && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-gray-700">
            Tag
            <select
              className="ml-2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              value={photoTag}
              onChange={(e) =>
                onPhotoTagChange(e.target.value as typeof photoTag)
              }
              disabled={disabled || uploading}
            >
              <option value="BEFORE">Before</option>
              <option value="AFTER">After</option>
              <option value="GENERAL">General</option>
            </select>
          </label>
        </div>
      )}

      {!inspectionId && !disabled && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Save draft first, then you can take or upload photos.
        </p>
      )}

      {!disabled && inspectionId && (
        <div className="flex flex-wrap gap-3">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={uploading}
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center gap-2"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            Take Photo
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={uploading}
            onClick={() => galleryInputRef.current?.click()}
            className="inline-flex items-center gap-2"
          >
            <ImagePlus className="h-4 w-4" />
            Choose from Gallery
          </Button>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-lg border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={`Photo ${p.tag}`}
                className="h-28 w-full object-cover"
              />
              <p className="bg-gray-50 px-2 py-1.5 text-center text-xs font-medium text-gray-600">
                {p.tag}
              </p>
            </div>
          ))}
        </div>
      ) : (
        !disabled &&
        inspectionId && (
          <p className="text-sm text-gray-500">No photos yet. Use camera or gallery above.</p>
        )
      )}
    </div>
  );
}
