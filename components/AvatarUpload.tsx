"use client";

import { useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";

const BUCKET = "spacebar-avatars";
const MAX_BYTES = 1024 * 1024;

export default function AvatarUpload({
  playerId,
  initialUrl,
  onChange,
}: {
  playerId: string;
  initialUrl: string | null;
  onChange: (url: string | null) => void;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    setErr(null);
    if (f.size > MAX_BYTES) {
      setErr("Image must be under 1 MB.");
      return;
    }
    if (!f.type.startsWith("image/")) {
      setErr("Pick an image file.");
      return;
    }
    setBusy(true);
    try {
      const downscaled = await downscale(f, 256);
      const ext = downscaled.type === "image/webp" ? "webp" : "jpg";
      const path = `${playerId}-${Date.now()}.${ext}`;
      const supabase = getSupabase();
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, downscaled, { upsert: true, contentType: downscaled.type });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setUrl(data.publicUrl);
      onChange(data.publicUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
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
          <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs">Uploading…</span>
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

async function downscale(file: File, maxDim: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/webp",
      0.85
    )
  );
}
