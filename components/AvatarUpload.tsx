"use client";

import { useRef, useState } from "react";

export default function AvatarUpload({
  initialUrl,
  onChange,
}: {
  // playerId is no longer needed but kept for prop compatibility
  playerId?: string;
  initialUrl: string | null;
  onChange: (url: string | null) => void;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    setErr(null);
    if (!f.type.startsWith("image/")) {
      setErr("Pick an image file.");
      return;
    }
    setBusy(true);
    try {
      // Downscale + re-encode as a data URL. Photo lives only in the
      // players row for this room — gone when the room is reset.
      const dataUrl = await downscaleToDataUrl(f, 256);
      setUrl(dataUrl);
      onChange(dataUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        className="relative w-24 h-24 rounded-full overflow-hidden border-2 transition-colors"
        style={{ borderColor: url ? "#22D3EE" : "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)" }}
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl">📷</span>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs">Loading…</span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className="text-xs text-slate-400 hover:text-slate-200"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {url ? "Change picture" : "Add picture (optional)"}
      </button>
      {err && <p className="text-pink-400 text-xs">{err}</p>}
    </div>
  );
}

async function downscaleToDataUrl(file: File, maxDim: number): Promise<string> {
  // imageOrientation: "from-image" applies EXIF rotation so iPhone photos
  // don't end up sideways.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  let dataUrl = canvas.toDataURL("image/webp", 0.82);
  if (!dataUrl.startsWith("data:image/webp")) {
    // Older Safari falls back to PNG — explicitly try JPEG which is smaller.
    dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  }
  return dataUrl;
}
