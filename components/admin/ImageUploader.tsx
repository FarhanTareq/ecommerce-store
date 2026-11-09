"use client";

import Image from "next/image";
import { useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing-react";
import type { ProductImage } from "@/lib/types";

type ImageUploaderProps = {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  enabled: boolean;
  maxImages?: number;
  showAlt?: boolean;
  label?: string;
};

export default function ImageUploader({
  images,
  onChange,
  enabled,
  maxImages = 8,
  showAlt = true,
  label = "Click to upload product images",
}: ImageUploaderProps) {
  const [manualUrl, setManualUrl] = useState("");
  const { startUpload, isUploading } = useUploadThing("productImage", {
    onClientUploadComplete: (files) => {
      const next = files.map((file) => ({
        key: file.serverData?.key ?? file.key,
        url: file.serverData?.url ?? file.ufsUrl,
        alt: "",
      }));
      onChange([...images, ...next].slice(-maxImages));
      toast.success(`${next.length} image${next.length > 1 ? "s" : ""} uploaded`);
    },
    onUploadError: (error) => {
      toast.error(error.message || "Image upload failed");
    },
  });

  function addUrl() {
    if (!manualUrl.trim()) return;
    try {
      new URL(manualUrl);
    } catch {
      toast.error("Enter a valid image URL");
      return;
    }
    onChange([...images, { key: "", url: manualUrl.trim(), alt: "" }].slice(-maxImages));
    setManualUrl("");
  }

  return (
    <div className="space-y-3">
      {enabled ? (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 bg-paper px-4 py-8 text-center transition hover:border-ink">
          <input
            type="file"
            accept="image/*"
            multiple={maxImages > 1}
            className="sr-only"
            disabled={isUploading}
            onChange={async (event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length) await startUpload(files);
              event.target.value = "";
            }}
          />
          {isUploading ? (
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading images…
            </span>
          ) : (
            <span className="flex flex-col items-center gap-1">
              <UploadCloud className="h-6 w-6 text-ink/40" />
              <span className="text-sm font-bold">{label}</span>
              <span className="text-xs text-ink/40">
                JPG, PNG or WebP · up to 8MB each{maxImages > 1 ? ` · ${maxImages} files max` : ""}
              </span>
            </span>
          )}
        </label>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          UploadThing is not configured yet. Add <code>UPLOADTHING_TOKEN</code> to enable uploads,
          or add an image URL below.
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <ImagePlus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <input
            value={manualUrl}
            onChange={(event) => setManualUrl(event.target.value)}
            placeholder="Or paste an image URL"
            className="input pl-9"
          />
        </div>
        <button type="button" onClick={addUrl} className="btn-outline shrink-0 px-4">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {images.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <div key={`${image.url}-${index}`} className="overflow-hidden rounded-xl border border-ink/10 bg-white">
              <div className="relative aspect-square bg-paper">
                <Image src={image.url} alt={image.alt || "Product image"} fill sizes="160px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))}
                  className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-coral shadow"
                  aria-label="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {showAlt ? (
                <input
                  value={image.alt}
                  onChange={(event) =>
                    onChange(
                      images.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, alt: event.target.value } : item,
                      ),
                    )
                  }
                  placeholder="Alt text (SEO)"
                  className="w-full border-t border-ink/10 px-2 py-1.5 text-xs outline-none"
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
