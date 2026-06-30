import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadToMedia, removeMedia, signedUrl, HERO_BUCKET } from "@/lib/storage";
import { adminApi } from "@/lib/admin-api";
import { Upload, Trash2, Loader2 } from "lucide-react";

const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_BYTES = 500 * 1024 * 1024; // matches the hero-media bucket's file_size_limit

function formatBytes(bytes?: number | null) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

interface HeroVideoState {
  hero_video_url: string | null;
  hero_video_filename: string | null;
  hero_video_size: number | null;
  hero_video_updated_at: string | null;
}

export function HeroVideoUploader({
  current,
  onPublished,
}: {
  current: HeroVideoState;
  onPublished: (next: HeroVideoState) => void;
}) {
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let live = true;
    if (!current.hero_video_url) { setCurrentPreviewUrl(null); return; }
    signedUrl(current.hero_video_url, 60 * 60 * 24 * 7, HERO_BUCKET).then((u) => {
      if (live) setCurrentPreviewUrl(u);
    });
    return () => { live = false; };
  }, [current.hero_video_url]);

  async function onSelect(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("UNSUPPORTED FORMAT — USE MP4, WEBM, OR MOV");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(`FILE TOO LARGE — MAX ${formatBytes(MAX_BYTES)}`);
      return;
    }
    setUploading(true);
    try {
      const path = await uploadToMedia(file, "hero", file.name, HERO_BUCKET);
      const url = await signedUrl(path, 60 * 60, HERO_BUCKET);
      setPendingPath(path);
      setPendingFile(file);
      setPreviewUrl(url);
      toast.success("UPLOADED — PREVIEW BELOW, THEN PUBLISH");
    } catch (e: any) {
      console.error("[HeroVideo] upload failed", e);
      toast.error("UPLOAD FAILED: " + (e?.message ?? "UNKNOWN ERROR"));
    } finally {
      setUploading(false);
    }
  }

  async function discard() {
    if (pendingPath) {
      try { await removeMedia(pendingPath, HERO_BUCKET); } catch (e) { console.warn("discard cleanup failed", e); }
    }
    setPendingPath(null);
    setPendingFile(null);
    setPreviewUrl(null);
  }

  async function publish() {
    if (!pendingPath || !pendingFile) return;
    setPublishing(true);
    try {
      const oldPath = current.hero_video_url;
      const next: HeroVideoState = {
        hero_video_url: pendingPath,
        hero_video_filename: pendingFile.name,
        hero_video_size: pendingFile.size,
        hero_video_updated_at: new Date().toISOString(),
      };
      const res = await adminApi("update_site_config", { patch: next });
      if (res.error) throw new Error(res.error);

      // Replacing an existing video — clean up the old file now that the
      // new one is live, rather than leaving it orphaned in storage.
      if (oldPath && oldPath !== pendingPath && !/^https?:\/\//.test(oldPath)) {
        try { await removeMedia(oldPath, HERO_BUCKET); } catch (e) { console.warn("old hero video cleanup failed", e); }
      }

      onPublished(next);
      setPendingPath(null);
      setPendingFile(null);
      setPreviewUrl(null);
      toast.success("HERO VIDEO PUBLISHED — LIVE ON HOMEPAGE");
    } catch (e: any) {
      console.error("[HeroVideo] publish failed", e);
      toast.error("PUBLISH FAILED: " + (e?.message ?? "UNKNOWN ERROR"));
    } finally {
      setPublishing(false);
    }
  }

  async function deleteCurrent() {
    if (!current.hero_video_url || !confirm("Remove the hero video? The homepage will fall back to the particle background.")) return;
    try {
      if (!/^https?:\/\//.test(current.hero_video_url)) {
        await removeMedia(current.hero_video_url, HERO_BUCKET);
      }
      const next: HeroVideoState = {
        hero_video_url: null,
        hero_video_filename: null,
        hero_video_size: null,
        hero_video_updated_at: null,
      };
      const res = await adminApi("update_site_config", { patch: next });
      if (res.error) throw new Error(res.error);
      onPublished(next);
      toast.success("HERO VIDEO REMOVED");
    } catch (e: any) {
      console.error("[HeroVideo] delete failed", e);
      toast.error("DELETE FAILED: " + (e?.message ?? "UNKNOWN ERROR"));
    }
  }

  return (
    <div>
      <label className="text-xs tracking-[0.3em] text-muted-foreground">HERO VIDEO</label>

      {/* Pending (uploaded, not yet published) preview */}
      {previewUrl ? (
        <div className="mt-2 border border-primary p-3 space-y-3">
          <video src={previewUrl} controls className="w-full max-h-64 bg-black" />
          <div className="text-[10px] tracking-[0.3em] text-muted-foreground">
            {pendingFile?.name} · {formatBytes(pendingFile?.size)} · NOT YET LIVE
          </div>
          <div className="flex gap-2">
            <button
              onClick={publish}
              disabled={publishing}
              className="flex-1 bg-primary text-primary-foreground py-2 text-xs font-display tracking-[0.25em] hover:bg-foreground hover:text-background disabled:opacity-50"
            >
              {publishing ? "PUBLISHING..." : "PUBLISH TO HOMEPAGE"}
            </button>
            <button onClick={discard} disabled={publishing} className="px-4 border border-border text-xs tracking-[0.3em] hover:border-foreground">
              DISCARD
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 border border-border p-3 space-y-3">
          {current.hero_video_url ? (
            <>
              {currentPreviewUrl && <video src={currentPreviewUrl} controls className="w-full max-h-64 bg-black" />}
              <div className="text-[10px] tracking-[0.3em] text-muted-foreground">
                {current.hero_video_filename ?? "video"} · {formatBytes(current.hero_video_size)} · LIVE
                {current.hero_video_updated_at && ` · UPDATED ${new Date(current.hero_video_updated_at).toLocaleDateString("en-IN")}`}
              </div>
            </>
          ) : (
            <div className="text-[10px] tracking-[0.3em] text-muted-foreground">
              // NO HERO VIDEO — HOMEPAGE SHOWS THE PARTICLE BACKGROUND
            </div>
          )}
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={(e) => e.target.files?.[0] && onSelect(e.target.files[0])} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 border border-foreground px-4 py-2 text-xs font-display tracking-[0.25em] hover:bg-primary hover:border-primary hover:text-primary-foreground disabled:opacity-50"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "UPLOADING..." : current.hero_video_url ? "REPLACE VIDEO" : "UPLOAD VIDEO"}
            </button>
            {current.hero_video_url && (
              <button onClick={deleteCurrent} className="flex items-center gap-2 text-xs tracking-[0.3em] text-muted-foreground hover:text-primary">
                <Trash2 size={12} /> DELETE
              </button>
            )}
          </div>
        </div>
      )}
      <p className="text-[9px] tracking-[0.3em] text-muted-foreground/60 mt-2">
        // MP4 · WEBM · MOV — MAX {formatBytes(MAX_BYTES)}
      </p>
    </div>
  );
}
