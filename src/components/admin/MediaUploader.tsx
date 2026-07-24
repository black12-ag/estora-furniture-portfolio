import { useMemo, useRef, useState } from "react";
import { Upload, Loader2, X, Copy, Crop as CropIcon, Eye, EyeOff, GripVertical, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia, deleteMediaByUrl, isPublished, stripFlag, withPublished } from "@/lib/media-upload";
import { CropDialog } from "./CropDialog";
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors,
  closestCenter, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, rectSortingStrategy,
  arrayMove, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  value: string;
  onChange: (url: string) => void;
  folder?: "products" | "blog" | "misc";
  accept?: string;
  label?: string;
  allowVideo?: boolean;
  className?: string;
  /** Default crop aspect. Pass null to open freeform. Pass false to disable cropping entirely. */
  defaultAspect?: number | null | false;
  /** Show the published/hidden toggle. */
  showPublished?: boolean;
};

const FOLDER_DEFAULT_ASPECT: Record<string, number> = {
  products: 1,
  blog: 16 / 9,
  misc: 1,
};

export function MediaUploader({ value, onChange, folder = "misc", accept, label = "Image", allowVideo, className = "", defaultAspect, showPublished }: Props) {
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<File | null>(null);
  const [enlarged, setEnlarged] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const acceptStr = accept ?? (allowVideo ? "image/*,video/*" : "image/*");
  const cleanUrl = stripFlag(value);
  const published = !value || isPublished(value);
  const isVideo = /\.(mp4|webm|mov|m4v|ogv)(\?|$|#)/i.test(cleanUrl);
  const cropEnabled = defaultAspect !== false;
  const initialAspect = defaultAspect === false || defaultAspect === undefined ? FOLDER_DEFAULT_ASPECT[folder] ?? 1 : defaultAspect;

  function pickFile(file: File) {
    if (cropEnabled && file.type.startsWith("image/")) setPending(file);
    else void doUpload(file);
  }

  async function doUpload(file: File) {
    setBusy(true);
    try {
      const url = await uploadMedia(file, folder);
      onChange(published ? url : withPublished(url, false));
      toast.success("Uploaded");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally { setBusy(false); }
  }

  async function clear() {
    if (!value) return;
    if (cleanUrl.includes("/object/sign/media/") && confirm("Remove this file from storage too?")) {
      try { await deleteMediaByUrl(cleanUrl); } catch {}
    }
    onChange("");
  }

  return (
    <div className={className}>
      <label className="text-xs font-semibold">{label}</label>
      <div
        className="mt-1 flex items-start gap-3 rounded-xl border border-dashed border-border bg-background/60 p-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) pickFile(f); }}
      >
        <button
          type="button"
          onClick={() => value && setEnlarged(true)}
          className={`group relative grid h-20 w-20 flex-shrink-0 place-items-center overflow-hidden rounded-lg bg-muted ${!published ? "opacity-50" : ""}`}
          aria-label={value ? "Preview" : "No file yet"}
        >
          {value ? (
            isVideo ? <video src={cleanUrl} className="h-full w-full object-cover" muted />
                    : <img src={cleanUrl} alt="" className="h-full w-full object-cover" />
          ) : <Upload className="h-5 w-5 text-muted-foreground" />}
          {value && <Maximize2 className="absolute right-1 top-1 hidden h-3 w-3 text-white drop-shadow group-hover:block" />}
        </button>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 disabled:opacity-60">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {value ? "Replace" : "Upload"}
            </button>
            {cropEnabled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                <CropIcon className="h-3 w-3" /> Crop on upload
              </span>
            )}
            {showPublished && value && (
              <button type="button" onClick={() => onChange(withPublished(cleanUrl, !published))}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${published ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-border text-muted-foreground hover:bg-accent"}`}
                title="Toggle whether customers see this">
                {published ? <><Eye className="h-3.5 w-3.5" /> Published</> : <><EyeOff className="h-3.5 w-3.5" /> Hidden</>}
              </button>
            )}
            {value && (
              <>
                <button type="button" onClick={() => { navigator.clipboard.writeText(cleanUrl); toast.success("URL copied"); }} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent">
                  <Copy className="h-3.5 w-3.5" /> Copy URL
                </button>
                <button type="button" onClick={clear} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10">
                  <X className="h-3.5 w-3.5" /> Remove
                </button>
              </>
            )}
          </div>
          <input type="text" placeholder="Or paste an image / video URL" value={cleanUrl}
            onChange={(e) => onChange(published ? e.target.value : withPublished(e.target.value, false))}
            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary" />
        </div>
        <input ref={inputRef} type="file" accept={acceptStr} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ""; }} />
      </div>

      {pending && (
        <CropDialog file={pending} defaultAspect={initialAspect}
          onCancel={() => setPending(null)}
          onConfirm={(cropped) => { setPending(null); void doUpload(cropped); }} />
      )}
      {enlarged && value && (
        <PreviewModal url={cleanUrl} isVideo={isVideo} onClose={() => setEnlarged(false)} />
      )}
    </div>
  );
}

type GalleryProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: "products" | "blog" | "misc";
  label?: string;
  defaultAspect?: number | null | false;
};

export function MediaGalleryUploader({ value, onChange, folder = "products", label = "Gallery images", defaultAspect }: GalleryProps) {
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cropEnabled = defaultAspect !== false;
  const initialAspect = defaultAspect === false || defaultAspect === undefined ? FOLDER_DEFAULT_ASPECT[folder] ?? 1 : defaultAspect;

  const items = useMemo(() => (value || []).map((u, i) => ({ id: `${i}::${u}`, url: u })), [value]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(value, oldIndex, newIndex));
  }

  function togglePublish(i: number) {
    const next = [...value];
    next[i] = withPublished(next[i], !isPublished(next[i]));
    onChange(next);
  }

  async function pushUpload(file: File) {
    setBusy(true);
    try {
      const url = await uploadMedia(file, folder);
      onChange([...(value || []), url]);
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally { setBusy(false); }
  }

  async function handleFiles(files: FileList) {
    const list = Array.from(files);
    if (cropEnabled) {
      setQueue(list.filter((f) => f.type.startsWith("image/")));
      for (const f of list.filter((f) => !f.type.startsWith("image/"))) await pushUpload(f);
    } else {
      for (const f of list) await pushUpload(f);
    }
  }

  async function removeAt(i: number) {
    const url = stripFlag(value[i]);
    if (url?.includes("/object/sign/media/") && confirm("Remove from storage too?")) {
      try { await deleteMediaByUrl(url); } catch {}
    }
    onChange(value.filter((_, idx) => idx !== i));
  }

  const current = queue[0];
  const publishedCount = value.filter(isPublished).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold">
          {label}
          <span className="ml-2 text-[10px] font-normal text-muted-foreground">
            · drag to reorder · {publishedCount}/{value.length} shown to customers
            {cropEnabled && " · crop each on upload"}
          </span>
        </label>
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background hover:bg-foreground/90 disabled:opacity-60">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Add photos
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {items.map((it, idx) => (
              <SortableTile
                key={it.id}
                id={it.id}
                url={stripFlag(it.url)}
                published={isPublished(it.url)}
                index={idx}
                onRemove={() => removeAt(idx)}
                onTogglePublish={() => togglePublish(idx)}
                onPreview={() => setPreview(stripFlag(it.url))}
              />
            ))}
            {(!value || value.length === 0) && (
              <div className="col-span-full rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                No extra photos yet. Add up to a dozen — they show on the product detail page.
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} />

      {current && (
        <CropDialog key={current.name + queue.length} file={current} defaultAspect={initialAspect}
          onCancel={() => setQueue((q) => q.slice(1))}
          onConfirm={async (cropped) => { await pushUpload(cropped); setQueue((q) => q.slice(1)); }} />
      )}
      {preview && <PreviewModal url={preview} isVideo={false} onClose={() => setPreview(null)} />}
    </div>
  );
}

function SortableTile({ id, url, published, index, onRemove, onTogglePublish, onPreview }: {
  id: string; url: string; published: boolean; index: number;
  onRemove: () => void; onTogglePublish: () => void; onPreview: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  };
  return (
    <div ref={setNodeRef} style={style}
      className={`group relative aspect-square overflow-hidden rounded-lg border ${published ? "border-border" : "border-dashed border-muted-foreground/40"}`}>
      <img src={url} alt="" className={`h-full w-full object-cover ${!published ? "opacity-40 grayscale" : ""}`} />
      <span className="absolute left-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">#{index + 1}</span>
      <button type="button" {...attributes} {...listeners}
        className="absolute left-1 bottom-1 cursor-grab rounded-full bg-black/70 p-1 text-white opacity-0 group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Drag to reorder">
        <GripVertical className="h-3 w-3" />
      </button>
      <div className="absolute right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100">
        <button type="button" onClick={onPreview} className="rounded-full bg-black/70 p-1 text-white" aria-label="Preview">
          <Maximize2 className="h-3 w-3" />
        </button>
        <button type="button" onClick={onTogglePublish}
          className={`rounded-full p-1 text-white ${published ? "bg-emerald-600/90" : "bg-zinc-700/90"}`}
          aria-label={published ? "Hide from customers" : "Show to customers"}>
          {published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        </button>
        <button type="button" onClick={onRemove} className="rounded-full bg-black/70 p-1 text-white" aria-label="Remove">
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function PreviewModal({ url, isVideo, onClose }: { url: string; isVideo: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6" onClick={onClose}>
      <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close">
        <X className="h-5 w-5" />
      </button>
      {isVideo
        ? <video src={url} controls className="max-h-[90vh] max-w-[90vw] rounded-xl" />
        : <img src={url} alt="Preview" className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />}
    </div>
  );
}
