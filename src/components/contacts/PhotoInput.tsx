"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Trash2, User } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";

/** Longest edge of the stored image. Keeps the base64 payload a few tens of KB. */
const TARGET_SIZE = 256;
/** Refuse to even decode absurdly large source files. */
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

/**
 * Center-crop the image to a square and downscale it to TARGET_SIZE, returning
 * a JPEG data URI. Resizing happens in the browser so the API only ever sees
 * avatar-sized payloads, no matter what the user picks.
 */
async function fileToAvatarDataUri(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = TARGET_SIZE;
    canvas.height = TARGET_SIZE;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas 2d context unavailable");

    context.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      TARGET_SIZE,
      TARGET_SIZE,
    );
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    bitmap.close();
  }
}

/**
 * Photo picker for the contact form. The chosen image lives in a hidden
 * `photo` input as a data URI, so the plain-POST server action receives it
 * like any other field — and an edit submit carries the existing photo
 * through the full-replace PUT instead of wiping it.
 */
export default function PhotoInput({
  defaultValue = "",
  error,
}: {
  defaultValue?: string;
  error?: string;
}) {
  const [photo, setPhoto] = useState(defaultValue);
  const [pickError, setPickError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  // Monotonic token: bumped by every pick and by Remove, so a slow conversion
  // that lost the race (or was cancelled) can never overwrite the newer state.
  const conversionSeqRef = useRef(0);
  // Mirrors `converting` for the native submit listener below.
  const convertingRef = useRef(false);

  // A submit mid-conversion would snapshot the previous photo, so hold the
  // form until the conversion settles. Native listener via the input's form:
  // React's action forms respect defaultPrevented.
  useEffect(() => {
    const form = hiddenInputRef.current?.form;
    if (!form) return;
    const blockWhileConverting = (event: SubmitEvent) => {
      if (convertingRef.current) event.preventDefault();
    };
    form.addEventListener("submit", blockWhileConverting);
    return () => form.removeEventListener("submit", blockWhileConverting);
  }, []);

  function setConvertingState(value: boolean) {
    convertingRef.current = value;
    setConverting(value);
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Allow re-picking the same file after a Remove.
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPickError("That file is not an image.");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setPickError("Image is larger than 10 MB — pick a smaller one.");
      return;
    }

    const seq = ++conversionSeqRef.current;
    setConvertingState(true);
    try {
      const dataUri = await fileToAvatarDataUri(file);
      if (seq !== conversionSeqRef.current) return;
      setPhoto(dataUri);
      setPickError(null);
    } catch {
      if (seq !== conversionSeqRef.current) return;
      setPickError("That image could not be read.");
    } finally {
      if (seq === conversionSeqRef.current) setConvertingState(false);
    }
  }

  function handleRemove() {
    conversionSeqRef.current += 1;
    setPhoto("");
    setPickError(null);
    setConvertingState(false);
  }

  const message = error ?? pickError;

  return (
    <div>
      <input ref={hiddenInputRef} type="hidden" name="photo" value={photo} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="sr-only"
        aria-label="Choose a profile photo"
      />

      <div className="flex items-center gap-4">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URI at a fixed avatar size; next/image adds nothing here
          <img
            src={photo}
            alt="Profile photo preview"
            className="h-16 w-16 shrink-0 select-none rounded-full aspect-square object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="inline-flex h-16 w-16 shrink-0 select-none items-center justify-center rounded-full bg-secondary text-muted-foreground"
          >
            <User className="h-7 w-7" strokeWidth={1.5} />
          </span>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={converting}
            className={buttonClasses("secondary")}
          >
            <ImagePlus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {converting ? "Processing…" : photo ? "Change photo" : "Upload photo"}
          </button>
          {photo && !converting ? (
            <button
              type="button"
              onClick={handleRemove}
              className={buttonClasses("ghost")}
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Remove
            </button>
          ) : null}
        </div>
      </div>

      {message ? (
        <p role="alert" className="mt-1.5 text-[13px] text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}
