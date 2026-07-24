import { useCallback, useEffect, useMemo, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2, X } from "lucide-react";

export type AspectPreset = { label: string; value: number | null };

const DEFAULT_PRESETS: AspectPreset[] = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:2", value: 3 / 2 },
  { label: "2:3", value: 2 / 3 },
];

type Props = {
  file: File;
  defaultAspect?: number | null;
  presets?: AspectPreset[];
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void;
};

export function CropDialog({ file, defaultAspect = 1, presets = DEFAULT_PRESETS, onCancel, onConfirm }: Props) {
  const src = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(src), [src]);

  const [aspect, setAspect] = useState<number | null>(defaultAspect);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  async function confirm() {
    if (!area) return;
    setBusy(true);
    try {
      const blob = await cropToBlob(src, area, file.type || "image/jpeg");
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const name = file.name.replace(/\.[^.]+$/, "") + "-cropped." + ext;
      onConfirm(new File([blob], name, { type: blob.type }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-black">Crop image</h3>
          <button type="button" onClick={onCancel} className="rounded-full p-2 hover:bg-accent" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative h-[420px] bg-black">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect ?? undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
            restrictPosition={false}
            objectFit={aspect ? "contain" : "contain"}
          />
        </div>
        <div className="space-y-3 border-t border-border px-5 py-4">
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setAspect(p.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  aspect === p.value ? "border-foreground bg-foreground text-background" : "border-border hover:bg-accent"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-muted-foreground">Zoom</label>
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-accent">Cancel</button>
            <button type="button" disabled={busy || !area} onClick={confirm} className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background hover:bg-foreground/90 disabled:opacity-60">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Apply crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function cropToBlob(src: string, area: Area, mime: string): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  const outMime = mime === "image/png" ? "image/png" : "image/jpeg";
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Crop failed"))), outMime, 0.92);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
