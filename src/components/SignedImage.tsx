import { useEffect, useState } from "react";
import { signedUrl } from "@/lib/storage";

export function SignedImage({
  path,
  className,
  alt = "",
  fallback,
  debugLabel,
}: {
  path?: string | null;
  className?: string;
  alt?: string;
  fallback?: React.ReactNode;
  debugLabel?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    setFailed(false);
    if (!path) { setUrl(null); return; }
    signedUrl(path)
      .then((u) => {
        if (!live) return;
        if (!u) {
          console.error("[SignedImage] No signed URL", { debugLabel, path, bucket: "ghost-media" });
          setFailed(true);
        }
        setUrl(u);
      })
      .catch((err) => {
        if (!live) return;
        console.error("[SignedImage] sign error", { debugLabel, path, bucket: "ghost-media", err });
        setFailed(true);
      });
    return () => { live = false; };
  }, [path, debugLabel]);
  if (failed) return <>{fallback ?? <div className={className} />}</>;
  if (!path) return <>{fallback ?? <div className={className} />}</>;
  if (!url) return <div className={className} />;
  return (
    <img
      src={url!}
      alt={alt}
      className={className}
      onError={() => {
        console.error("[SignedImage] render failed", { debugLabel, path, url, bucket: "ghost-media" });
        setFailed(true);
      }}
    />
  );
}
